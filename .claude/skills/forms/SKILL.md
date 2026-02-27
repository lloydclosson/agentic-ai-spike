---
description: How to build forms in this codebase. Apply whenever creating or modifying form components.
---

# Building Forms

## Stack

- **Form library**: TanStack Form (`@tanstack/react-form`)
- **Validation messages**: `getMessage()` from `@clossonlabs/ui/validations`
- **Components**: `@clossonlabs/ui` — Label, Input, PasswordField, Checkbox, FieldError, Select, etc.
- **Translations**: react-i18next (`useTranslation`) for UI text, `getMessage()` for validation errors

## Guiding Principles

- **Always use design system components** — never raw `<input>`, `<label>`, or `<p>` for errors
- **Always add `required` prop** to `<Label>` for required fields (renders red asterisk)
- **Never use placeholders** — labels and validation messages are sufficient
- **All validation messages through `getMessage()`** — fully i18n-capable via `setMessageResolver`
- **All UI text through `t()`** — with English fallback as second argument
- **Synchronous `onChange` validators** for simple checks — never `onChangeAsync` with debounce for required/format/length checks

## Form Setup

Use `useForm` with inline field-level validators. Do NOT use form-level Valibot schemas with `valibotValidator()` — field validators give per-field error control and work with `getMessage()` i18n.

```tsx
import { useForm } from "@tanstack/react-form";
import { getMessage } from "@clossonlabs/ui/validations";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuthErrorCode } from "../errors";

// Extract validation functions OUTSIDE the component
function validateEmail(value: string) {
	if (!value) return getMessage("email.required");
	if (!value.includes("@")) return getMessage("email.invalid");
	return undefined;
}

function validateFirstName(value: string) {
	if (!value) return getMessage("firstName.required");
	if (value.length > 50) return getMessage("firstName.maxLength", { maxLength: 50 });
	return undefined;
}

export function MyFormPage({ onSuccess }: Props) {
	const { t } = useTranslation();
	const [formError, setFormError] = useState<AuthErrorCode | null>(null);

	const clearFormError = () => {
		if (formError) setFormError(null);
	};

	const form = useForm({
		defaultValues: {
			email: "",
			firstName: "",
		},
		onSubmit: async ({ value }) => {
			setFormError(null);

			const { error } = await submitData(value);
			if (error) {
				setFormError(error);
				return;
			}

			onSuccess();
		},
	});

	// ...render
}
```

Key points:
- Extract validation functions outside the component for reuse and testability
- Use `useState` for server-side form errors (separate from field validation)
- `clearFormError` dismisses server errors when user resumes typing
- `onSubmit` clears previous errors, calls API, and handles error/success

## Field Validators

Always use synchronous `onChange` + `onSubmit` on each field. The `onChange` validates on every keystroke; `onSubmit` is a safety net that catches anything missed.

```tsx
<form.Field
	name="email"
	validators={{
		onChange: ({ value }) => validateEmail(value),
		onSubmit: ({ value }) => validateEmail(value),
	}}
>
```

### Why NOT `onChangeAsync` with debounce

`onChangeAsync` with `onChangeAsyncDebounceMs` sets TanStack Form's `isValidating = true` while the debounce timer runs. This blocks `handleSubmit()` because `canSubmit` requires `!isValidating`. The submit silently does nothing — no error, no feedback. This is also untestable with standard React Testing Library patterns (fake timers hang userEvent, `act()` can't flush TanStack's internal store).

**Reserve `onChangeAsync` only for truly async operations** like API calls (e.g., checking email uniqueness). For required/format/length checks, always use synchronous `onChange`.

### Cross-Field Validation

Use `onChangeListenTo` to react to changes in other fields:

```tsx
<form.Field
	name="confirmPassword"
	validators={{
		onChangeListenTo: ["password"],
		onChange: ({ value, fieldApi }) => {
			if (!value) return getMessage("confirmPassword.required");
			const password = fieldApi.form.getFieldValue("password");
			if (value !== password) return getMessage("confirm.mismatch");
			return undefined;
		},
		onSubmit: ({ value, fieldApi }) => {
			if (!value) return getMessage("confirmPassword.required");
			const password = fieldApi.form.getFieldValue("password");
			if (value !== password) return getMessage("confirm.mismatch");
			return undefined;
		},
	}}
>
```

## Field Rendering

### Text Input

```tsx
<form.Field
	name="firstName"
	validators={{
		onChange: ({ value }) => validateFirstName(value),
		onSubmit: ({ value }) => validateFirstName(value),
	}}
>
	{(field) => (
		<div className="space-y-2">
			<Label htmlFor="firstName" required>
				{t("user.auth.fields.firstName", "First Name")}
			</Label>
			<Input
				id="firstName"
				value={field.state.value}
				onChange={(e) => {
					clearFormError();
					field.handleChange(e.target.value);
				}}
				onBlur={field.handleBlur}
				autoComplete="given-name"
				required
			/>
			<FieldError error={field.state.meta.errors?.[0]} />
		</div>
	)}
</form.Field>
```

Rules:
- `<Label required>` on every required field — renders red asterisk
- No `placeholder` prop — ever
- `clearFormError()` in `onChange` before `field.handleChange()`
- `<FieldError>` component for errors — provides animated enter/exit transitions (0.2s fade+slide via AnimatePresence)
- `autoComplete` on every input — see table below
- HTML `required` attribute on the `<Input>` for browser-level semantics

### PasswordField

Use the design system's `PasswordField` instead of raw `<Input type="password">`. It handles the eye toggle, strength indicator, and requirements checklist.

**Primary password (new password with strength):**

```tsx
import { PasswordField } from "@clossonlabs/ui";
import { strongPassword } from "@clossonlabs/ui/validations";

<form.Field
	name="password"
	validators={{
		onChange: ({ value }) => validatePassword(value),
		onSubmit: ({ value }) => validatePassword(value),
	}}
>
	{(field) => (
		<PasswordField
			id="password"
			label={t("user.auth.fields.password", "Password")}
			value={field.state.value}
			onChange={(e) => {
				clearFormError();
				field.handleChange(e.target.value);
			}}
			onBlur={field.handleBlur}
			autoComplete="new-password"
			required
			schema={strongPassword}
			showStrength
			showRequirements
			error={field.state.meta.errors?.[0]}
		/>
	)}
</form.Field>
```

**Confirm password (no strength, no schema):**

```tsx
<form.Field
	name="confirmPassword"
	validators={{
		onChangeListenTo: ["password"],
		onChange: ({ value, fieldApi }) => { /* cross-field check */ },
		onSubmit: ({ value, fieldApi }) => { /* cross-field check */ },
	}}
>
	{(field) => (
		<PasswordField
			id="confirmPassword"
			label={t("user.auth.fields.confirmPassword", "Confirm Password")}
			value={field.state.value}
			onChange={(e) => {
				clearFormError();
				field.handleChange(e.target.value);
			}}
			onBlur={field.handleBlur}
			autoComplete="new-password"
			required
			schema={null}
			showStrength={false}
			error={field.state.meta.errors?.[0]}
		/>
	)}
</form.Field>
```

Key props:
- `schema={strongPassword}` — enables built-in validation + auto-enables strength indicator
- `schema={null}` — disables all built-in validation (for confirm password)
- `showStrength` / `showRequirements` — controls strength UI
- `error` — pass field error for animated display via built-in FieldError
- PasswordField renders its own Label internally — pass text via `label` prop, not a separate `<Label>`

### Checkbox

Use the design system `Checkbox` component with its built-in `label` and `error` props:

```tsx
<form.Field
	name="agreeToTerms"
	validators={{
		onChange: ({ value }) => {
			if (!value) return getMessage("termsRequired");
			return undefined;
		},
	}}
>
	{(field) => (
		<Checkbox
			id="agreeToTerms"
			checked={field.state.value}
			onCheckedChange={(checked) => {
				clearFormError();
				field.handleChange(checked === true);
			}}
			label={
				<span className="inline leading-tight">
					<Trans
						i18nKey="user.auth.signUp.termsLabel"
						defaults="I agree to the <termsLink>Terms</termsLink> and <privacyLink>Privacy Policy</privacyLink>"
						components={{ termsLink: <a href="/terms" />, privacyLink: <a href="/privacy" /> }}
					/>
				</span>
			}
			error={field.state.meta.isTouched ? field.state.meta.errors?.[0] : undefined}
		/>
	)}
</form.Field>
```

Key points:
- Use `checked === true` (not `!!checked`) because `onCheckedChange` can return `"indeterminate"`
- Wrap `Trans` output in `<span className="inline leading-tight">` to fix checkbox/text vertical alignment
- Only show error after touch: `field.state.meta.isTouched ? ... : undefined`
- Checkbox renders its own label and FieldError — pass via props, not separate components

**Simple checkbox (no validation):**

```tsx
<form.Field name="rememberMe">
	{(field) => (
		<Checkbox
			id="rememberMe"
			checked={field.state.value}
			onCheckedChange={(checked) => field.handleChange(checked === true)}
			label={t("user.auth.fields.rememberMe", "Remember me")}
		/>
	)}
</form.Field>
```

### Select

```tsx
<form.Field name="timezone">
	{(field) => (
		<div className="space-y-2">
			<Label htmlFor="timezone" required>
				{t("user.auth.fields.timezone", "Timezone")}
			</Label>
			<Select value={field.state.value} onValueChange={field.handleChange}>
				<SelectTrigger id="timezone">
					<SelectValue placeholder={t("user.auth.fields.selectTimezone", "Select timezone")} />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)}
</form.Field>
```

Note: Select placeholder is the only acceptable "placeholder" — it appears in the trigger when no value is selected, not in a text input.

## Form Element

```tsx
<form
	onSubmit={(e) => {
		e.preventDefault();
		form.handleSubmit();
	}}
	className="space-y-4"
>
	{/* fields */}
</form>
```

## Submit Button

```tsx
<Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
	{form.state.isSubmitting
		? t("domain.form.submitting", "Submitting...")
		: t("domain.form.submit", "Submit")}
</Button>
```

Do NOT use `form.Subscribe` with `canSubmit` for the disabled prop — `canSubmit` becomes false during any async validation, which would disable the button unpredictably. Use `form.state.isSubmitting` only.

## Server Error Display

Use `Alert` + `AlertDescription` for server-side errors (auth failures, API errors):

```tsx
const [formError, setFormError] = useState<AuthErrorCode | null>(null);

const clearFormError = () => {
	if (formError) setFormError(null);
};

// In render:
{formError && (
	<Alert variant="destructive" className="mb-4">
		<AlertDescription>
			{t(`user.errors.${formError}`, t("user.errors.auth.error.unknown"))}
		</AlertDescription>
	</Alert>
)}
```

- Place above the `<form>` element, inside `<CardContent>`
- Error key is interpolated into translation: `user.errors.${errorCode}`
- Falls back to generic unknown error
- Cleared when user types in any field (via `clearFormError()` in each field's onChange)

## i18n Language Change Re-validation

When the language changes, existing error messages are stale (in the old language). Add this effect to re-validate fields that already have errors:

```tsx
const { t, i18n } = useTranslation();
const prevLanguageRef = useRef(i18n.language);

useEffect(() => {
	if (prevLanguageRef.current !== i18n.language) {
		prevLanguageRef.current = i18n.language;
		for (const [name, fieldMeta] of Object.entries(form.state.fieldMeta)) {
			if (fieldMeta?.errors?.length) {
				form.validateField(name as keyof typeof form.state.values, "change");
			}
		}
	}
}, [i18n.language, form]);
```

## Card-Based Form Layout

Auth and standalone forms use Card as the container:

```tsx
<Card>
	<CardHeader className="text-center">
		<CardTitle>{t("domain.form.title", "Title")}</CardTitle>
		<CardDescription>{t("domain.form.description", "Description")}</CardDescription>
	</CardHeader>
	<CardContent>
		{/* formError Alert here */}
		<form className="space-y-4">
			{/* fields + submit button */}
		</form>
	</CardContent>
	<CardFooter className="justify-center">
		{/* alternative action links */}
	</CardFooter>
</Card>
```

## Layout

- `space-y-4` between fields within a form
- `space-y-2` within a single field (label, input, error)
- Multi-column: `<div className="grid grid-cols-2 gap-4">`

## autoComplete Values

| Field type | autoComplete value |
|------------|-------------------|
| Email | `email` |
| Login password | `current-password` |
| New/reset password | `new-password` |
| First name | `given-name` |
| Last name | `family-name` |
| Full name | `name` |
| Phone | `tel` |
| Address | `street-address` |

## Imports

```tsx
// Design system components
import {
	Alert, AlertDescription,
	Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
	Checkbox, FieldError, Input, Label, PasswordField,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
	Separator,
} from "@clossonlabs/ui";

// Validation messages and schemas
import { getMessage, strongPassword } from "@clossonlabs/ui/validations";

// Form library
import { useForm } from "@tanstack/react-form";

// i18n
import { Trans, useTranslation } from "react-i18next";
```

---

# Testing Forms

## Test File Structure

Tests are colocated: `SignUpPage.test.tsx` next to `SignUpPage.tsx`.

## Required Mocks

Every form test needs these mocks. Copy and adapt as needed.

### Design System Components

Mock all `@clossonlabs/ui` components with minimal HTML that preserves testable structure:

```tsx
vi.mock("@clossonlabs/ui", () => ({
	Alert: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<div role="alert" className={className}>{children}</div>
	),
	AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Button: ({
		children, type, disabled, onClick, className, variant,
	}: {
		children: React.ReactNode; type?: string; disabled?: boolean;
		onClick?: () => void; className?: string; variant?: string;
	}) => (
		<button type={type as "submit" | "button"} disabled={disabled} onClick={onClick}
			className={className} data-variant={variant}>
			{children}
		</button>
	),
	Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
	CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
	Input: ({
		id, type, value, onChange, onBlur, placeholder,
	}: {
		id?: string; type?: string; value?: string;
		onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
		onBlur?: () => void; placeholder?: string;
	}) => (
		<input id={id} type={type} value={value} onChange={onChange}
			onBlur={onBlur} placeholder={placeholder} />
	),
	Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
		<label htmlFor={htmlFor}>{children}</label>
	),
	PasswordField: ({
		id, label, value, onChange, onBlur, placeholder, error,
	}: {
		id?: string; label?: React.ReactNode; value?: string;
		onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
		onBlur?: () => void; placeholder?: string; error?: React.ReactNode;
	}) => (
		<div>
			<label htmlFor={id}>{label}</label>
			<input id={id} type="password" value={value} onChange={onChange}
				onBlur={onBlur} placeholder={placeholder} />
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	),
	Checkbox: ({
		id, label, checked, onCheckedChange, error,
	}: {
		id?: string; label?: React.ReactNode; checked?: boolean;
		onCheckedChange?: (checked: boolean) => void; error?: React.ReactNode;
	}) => (
		<div>
			<input id={id} type="checkbox" checked={checked}
				onChange={(e) => onCheckedChange?.(e.target.checked)}
				data-testid="terms-checkbox" />
			<label htmlFor={id}>{label}</label>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	),
	FieldError: ({ error }: { error?: React.ReactNode }) =>
		error ? <p className="text-sm text-destructive">{error}</p> : null,
	Select: ({
		children, value,
	}: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
		<div data-testid="select" data-value={value}>{children}</div>
	),
	SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
		<option value={value}>{children}</option>
	),
	SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => (
		<button type="button" id={id}>{children}</button>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
	Separator: () => <hr />,
}));
```

### Validation Messages

Mock `getMessage` to return predictable English strings:

```tsx
vi.mock("@clossonlabs/ui/validations", () => ({
	getMessage: (key: string, _params?: Record<string, unknown>) => {
		const messages: Record<string, string> = {
			"firstName.required": "First name is required",
			"lastName.required": "Last name is required",
			"email.required": "Email is required",
			"email.invalid": "Please enter a valid email address",
			"password.required": "Password is required",
			"confirmPassword.required": "Please confirm your password",
			"confirm.mismatch": "Passwords do not match",
			termsRequired: "You must agree to the terms and conditions",
		};
		return messages[key] ?? key;
	},
	strongPassword: {},
}));
```

### react-i18next

```tsx
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
		i18n: { language: "en" },
	}),
	Trans: ({ defaults }: { defaults?: string }) => <span>{defaults}</span>,
}));
```

### Auth Provider

```tsx
const mockSignUp = vi.fn();
vi.mock("../providers/AuthProvider", () => ({
	useAuth: () => ({
		signUp: mockSignUp,
		isLoading: false,
	}),
}));
```

### External Libraries

```tsx
// @vvo/tzdb — minimal timezone data
vi.mock("@vvo/tzdb", () => ({
	getTimeZones: () => [
		{ name: "America/New_York", alternativeName: "Eastern Time",
		  rawFormat: "-05:00 Eastern Time", mainCities: ["New York"] },
		{ name: "America/Los_Angeles", alternativeName: "Pacific Time",
		  rawFormat: "-08:00 Pacific Time", mainCities: ["Los Angeles"] },
	],
}));

// Icons / small components
vi.mock("./GoogleIcon", () => ({
	GoogleIcon: () => <span data-testid="google-icon" />,
}));
```

## Form Fill Helper

Extract a `fillForm` helper for tests that submit the form:

```tsx
async function fillForm(
	user: ReturnType<typeof userEvent.setup>,
	overrides?: { email?: string; skipTerms?: boolean },
) {
	await user.type(screen.getByLabelText(/first name/i), "John");
	await user.type(screen.getByLabelText(/last name/i), "Doe");
	await user.type(screen.getByLabelText(/email/i), overrides?.email ?? "john@example.com");
	await user.type(screen.getByLabelText(/^password$/i), "Password123!");
	await user.type(screen.getByLabelText(/confirm password/i), "Password123!");
	if (!overrides?.skipTerms) {
		await user.click(screen.getByTestId("terms-checkbox"));
	}
}
```

- Passwords must meet `strongPassword` requirements: 12+ chars, uppercase, lowercase, number, special char
- Use overrides for test-specific variations
- Use `skipTerms: true` for tests about unchecked terms

## Test Patterns

### Setup

```tsx
describe("MyFormPage", () => {
	const defaultProps = {
		onSuccess: vi.fn(),
		onSignIn: vi.fn(),
		locale: "en",
		theme: "auto",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSignUp.mockResolvedValue({});
	});
```

### Render Test

```tsx
it("renders form fields", () => {
	render(<MyFormPage {...defaultProps} />);
	expect(screen.getByRole("heading", { name: /title/i })).toBeInTheDocument();
	expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
});
```

### Validation Error (type-then-clear pattern)

```tsx
it("shows validation error for empty field", async () => {
	const user = userEvent.setup();
	render(<MyFormPage {...defaultProps} />);

	const input = screen.getByLabelText(/email/i);
	await user.type(input, "a");
	await user.clear(input);

	await waitFor(() => {
		expect(screen.getByText(/email is required/i)).toBeInTheDocument();
	});
});
```

Note: `user.clear()` may not work on mock `type="password"` inputs in jsdom. For password fields, use `{Backspace}` instead:

```tsx
await user.type(passwordInput, "a");
await user.type(passwordInput, "{Backspace}");
```

### Successful Submission

```tsx
it("calls onSubmit with form values", async () => {
	const user = userEvent.setup();
	render(<MyFormPage {...defaultProps} />);

	await fillForm(user);
	await user.click(screen.getByRole("button", { name: /submit/i }));

	await waitFor(() => {
		expect(mockSignUp).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "john@example.com",
				firstName: "John",
			}),
		);
	});
});
```

### Server Error Display

```tsx
it("displays error alert when API returns error", async () => {
	const user = userEvent.setup();
	mockSignUp.mockResolvedValue({ error: "auth.signUp.emailExists" });
	render(<MyFormPage {...defaultProps} />);

	await fillForm(user);
	await user.click(screen.getByRole("button", { name: /submit/i }));

	await waitFor(() => {
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});
});
```

### Error Clearing

```tsx
it("clears error when user types", async () => {
	const user = userEvent.setup();
	mockSignUp.mockResolvedValue({ error: "some.error" });
	render(<MyFormPage {...defaultProps} />);

	await fillForm(user);
	await user.click(screen.getByRole("button", { name: /submit/i }));

	await waitFor(() => {
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	await user.type(screen.getByLabelText(/email/i), "x");

	await waitFor(() => {
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
```

## Testing Pitfalls

### Never use `onChangeAsync` with debounce for simple validation

`onChangeAsync` + `onChangeAsyncDebounceMs` sets `isValidating = true` while the debounce timer runs. This makes `canSubmit = false`, causing `handleSubmit()` to silently do nothing. Tests that fill the form and immediately click submit will fail because the form won't submit.

### Fake timers are incompatible with userEvent

`vi.useFakeTimers()` with `advanceTimers: vi.advanceTimersByTime` in `userEvent.setup()` causes ALL userEvent operations (type, click, tab) to hang until timeout. Do not use this combination.

### `act()` cannot flush TanStack Form store updates

TanStack Form uses its own internal store, not React state. State updates triggered by `setTimeout` callbacks (like debounce resolution) are not flushed by `act()`. This means `isValidating` remains `true` even after `act(() => new Promise(r => setTimeout(r, 600)))`.

### Query patterns

- `screen.getByLabelText(/^password$/i)` — use `^$` anchors to distinguish "Password" from "Confirm Password"
- `screen.getByRole("button", { name: /^sign up$/i })` — anchored regex for exact button text
- `screen.getByTestId("terms-checkbox")` — use data-testid for checkboxes (added in mock)
- `screen.queryByRole("alert")` — use `query*` for assertions about absence

## Anti-Patterns

Do not:
- Use `valibotValidator()` adapter with form-level schemas — use field-level `onChange`/`onSubmit` validators
- Use `onChangeAsync` with debounce for required/format/length checks — use synchronous `onChange`
- Use raw `<p className="text-sm text-destructive">` for errors — use `<FieldError error={...} />`
- Use raw `<input type="password">` — use `<PasswordField>` from the design system
- Use `useState` to manage form field values — use TanStack Form
- Add placeholders to text inputs — labels and validation messages are sufficient
- Omit `required` prop on `<Label>` for required fields
- Omit `autoComplete` on inputs
- Use `form.Subscribe` with `canSubmit` for the submit button disabled state
- Use `vi.useFakeTimers()` in form tests
- Show checkbox errors before touch — guard with `field.state.meta.isTouched`
- Render separate `<Label>` and `<FieldError>` for PasswordField or Checkbox — they render their own
