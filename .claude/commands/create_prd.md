---
description: Create detailed product requirement documents through interactive research and iteration
model: opus
---

# Product Requirement Document

You are tasked with creating detailed product requirement document (prd) through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality product requirements that answer the business questions of why we are building this and what needs to be done. DO NOT create a technical implementation plan.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed product requirement document. Let me start by understanding what we're building.

Please provide:
1. An overview of the feature
2. Any relevant context, constraints, or specific requirements
3. Links to related research

I'll analyze this information and work with you to create a comprehensive prd.

Tip: You can also invoke this command with a file directly:  `/create_prd thoughts/research/1234-new-document-management-system.md`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY**:
   - Feature research files (e.g., `thoughts/research/{name}.md`)
   - Research documents
   - Related prds
   - Any files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially - if a file is mentioned, read it completely

2. **Spawn initial research tasks to gather context**:
   Before asking the user any questions, use specialized agents to research in parallel:

   - Use the **web-search-researcher** agent to do a deep dive into how compititors (thoughts/research/competitor_list.md) implement the feature including researching public API documentation.
   - If relevant, use the **thoughts-locator** agent to find any existing thoughts documents, especially research about this feature

   These agents will:
   - Find relevant websites that have details on how competitors implement the feature
   - Find API documentation for how competitors implement the features with specific interest in data captures and flows

3. **Read all files identified by research tasks**:
   - After research tasks complete, read ALL information they identified as relevant
   - Read them FULLY into the main context
   - This ensures you have complete understanding before proceeding

4. **Analyze and verify understanding**:
   - Cross-reference the the functionality in different competitors
   - Identify what must be in the feature and unique elements that would differentiate our product
   - Note assumptions that need verification
   - Determine true scope based on thorough analysis of all the information provided

5. **Present informed understanding and focused questions**:
   ```
   Based on my research of the competitive landscape, I understand we need to define [accurate summary].

   I've found that:
   - [All competitors have have these capabilities for the feature]
   - [These are unique capabilities (capability 1 implement by competitor 1) for the feature]
   - [These are capabilities to add to the feature not offered in the marketplace that benefit our customers]

   Questions that my research couldn't answer:
   - [Specific product question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects the requirements]
   ```

   Only ask questions that you genuinely cannot answer through investing the competitors and the market though **web-search-researcher**.

### Step 2: Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Create a research todo list** using TodoWrite to track exploration tasks

3. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent for each type of research:

   **For deeper investigation:**
   - **web-search-researcher** - To find more specific files (e.g., "find all files that handle [specific component]")
   - **codebase-analyzer** - To understand what functionality exists today (e.g., "analyze what the [system] already does")

   **For historical context:**
   - **thoughts-locator** - To find any research, plans, or decisions about this area
   - **thoughts-analyzer** - To extract key insights from the most relevant documents

   Each agent knows how to:
   - Research the market and analyze competitors
   - Search for customer feedback with likes and dislikes
   - Identify critical features that are core and must be included
   - Identify features that would be nice to have but are not critical
   - Identify features that are gaps in the marketplace that could add value to customers not otherwise available

3. **Wait for ALL sub-tasks to complete** before proceeding

4. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing features in the market place]
   - [Pattern or convention to follow]

   **Requirement Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   **Open Questions:**
   - [Business uncertainty]
   - [Design decision needed]

   Which approach aligns best with your vision?
   ```

### Step 3: PRD Structure Development

Once aligned on approach:

1. **Create initial prd outline**:
   ```
   Here's my proposed prd structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Features Oranized By Priority:
   1. [Feature name] - [why we need id][what it accomplishes]
   2. [Feature name] - [why we need id][what it accomplishes]
   3. [Feature name] - [why we need id][what it accomplishes]

   Does this priority make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback on structure** before writing details

### Step 4: Detailed PRD Writing

After structure approval:

1. **Write the prd** to `thoughts/plans/YYYY-MM-DD-description-PRD.md`
   - Format: `houghts/plans/YYYY-MM-DD-description-PRD.md` where:
     - YYYY-MM-DD is today's date
     - description is a brief kebab-case description
   - Examples:
     - With ticket: `2025-01-08-parent-child-tracking-PRD.md`
     - Without ticket: `2025-01-08-document-management-system-PRD.md`
2. **Use this template structure**:

````markdown
## 1. Executive Summary

Brief overview of what you're building and why it matters. One paragraph max.

---

## 2. Jobs to Be Done

### Primary Job

> When [situation], I want to [motivation], so I can [expected outcome].

### Related Jobs

Secondary jobs the user is trying to accomplish in the same context.

### Job Map

Break down the primary job into stages:

1. **Define** — what needs to be done
2. **Locate** — necessary inputs
3. **Prepare** — the environment/inputs
4. **Confirm** — readiness
5. **Execute** — the core task
6. **Monitor** — progress
7. **Modify** — as needed
8. **Conclude** — the job

For each stage, identify:
- Current pain points
- Time spent
- Emotional friction
- Workarounds users employ

### Success Metrics (from user's perspective)

How does the user measure whether they've successfully completed the job? Speed, accuracy, cost, emotional satisfaction?

---

## 3. Domain Model

### Ubiquitous Language

Define key terms precisely. This becomes the shared vocabulary across product, engineering, design, and users.

| Term | Definition | Examples | Not to be confused with |
|------|------------|----------|-------------------------|
| [Term] | [Precise definition] | [Concrete examples] | [Common misunderstandings] |

### Bounded Contexts

Identify the distinct subdomains and their boundaries:

**[Context Name]**
- Responsible for: [what it owns]
- Does not handle: [what it doesn't touch]
- Relationships: [how it communicates with other contexts]

Relationship types to consider:
- Shared Kernel
- Customer-Supplier
- Conformist
- Anticorruption Layer
- Open Host Service
- Published Language

### Core Domain

What's the differentiating business logic that provides competitive advantage? This is where you invest the most design effort.

### Supporting Subdomains

Necessary but not differentiating. Build or buy pragmatically.

### Generic Subdomains

Solved problems—use off-the-shelf solutions (auth, payments, notifications).

---

## 4. Aggregates & Entities

For each bounded context, define:

### Aggregate: [Name]

**Root Entity:** [Name]

**Invariants** (business rules that must always be true):
- [Rule 1]
- [Rule 2]

**Entities contained within:**
- [Entity 1]
- [Entity 2]

**Value Objects:**
- [Value Object 1]
- [Value Object 2]

**Lifecycle States:**
```
[State 1] → [State 2] → [State 3]
```

### Domain Events

What meaningful events occur? These often become integration points.

| Event | Trigger | Data | Consumers |
|-------|---------|------|-----------|
| [OrderPlaced] | [User completes checkout] | [order ID, items, customer] | [Fulfillment, Notifications] |
| [PaymentReceived] | [Payment processor callback] | [order ID, amount, method] | [Orders, Accounting] |

---

## 5. User Personas & Context

### Persona: [Name]

**Role/Title:** [e.g., Operations Manager at mid-size e-commerce company]

**Goals and Motivations:**
- [Goal 1]
- [Goal 2]

**Constraints:**
- [Time, budget, authority, technical skill, etc.]

**Current Tools and Workflows:**
- [What they use today]
- [Pain points with current approach]

**Hiring Criteria** (what would make them "hire" this product):
- [Criteria 1]
- [Criteria 2]

**Firing Criteria** (what would make them "fire" it):
- [Criteria 1]
- [Criteria 2]

### Situational Context

- **When** does this job arise?
- **Where** is the user when doing this?
- **Emotional state:** [stressed, relaxed, urgent, exploratory]
- **Time pressure:** [immediate, same-day, flexible]
- **What happens before:** [preceding activity]
- **What happens after:** [subsequent activity]

---

## 6. Solution Overview

### How the Product Enables the Job

Map solution capabilities back to job stages:

| Job Stage | Pain Point | Solution |
|-----------|------------|----------|
| [Define] | [User struggles to...] | [Feature that addresses it] |
| [Execute] | [Current process takes...] | [How product improves it] |

### Domain Services

Operations that don't belong to a single entity but represent meaningful business capabilities.

| Service | Responsibility | Inputs | Outputs |
|---------|---------------|--------|---------|
| [PricingService] | [Calculate final price with discounts] | [items, customer, promotions] | [price breakdown] |

### Application Services / Use Cases

The specific workflows the system supports:

#### Commands

**[CreateOrder]**
- Inputs: [customer ID, items, shipping address]
- Preconditions: [customer exists, items in stock]
- Postconditions: [order created, inventory reserved]
- Failure modes: [item unavailable, invalid address]

**[CancelOrder]**
- Inputs: [order ID, reason]
- Preconditions: [order exists, not yet shipped]
- Postconditions: [order cancelled, inventory released]
- Failure modes: [already shipped, not found]

#### Queries

**[GetOrderHistory]**
- Inputs: [customer ID]
- Filters: [date range, status]
- Returns: [list of orders with summary data]

---

## 7. Interfaces & Integration

### User Interfaces

Key screens/flows mapped to jobs and use cases. Not pixel-perfect designs, but what information and actions are available at each step.

**[Screen/Flow Name]**
- Job stage: [which part of the job this supports]
- Information displayed: [what the user sees]
- Actions available: [what the user can do]
- Navigation: [where they came from, where they can go]

### API Contracts

For each bounded context, define the interface it exposes:

**[Context Name] API**

Commands:
- `POST /orders` — Create new order
- `PUT /orders/{id}/cancel` — Cancel order

Queries:
- `GET /orders/{id}` — Get order details
- `GET /orders?customer={id}` — List customer orders

Events Published:
- `order.created`
- `order.cancelled`

### Context Mapping

How do bounded contexts integrate?

| Source Context | Target Context | Integration Pattern | Notes |
|----------------|----------------|---------------------|-------|
| [Orders] | [Fulfillment] | [Async via events] | [OrderPlaced triggers fulfillment] |
| [Orders] | [Payments] | [Sync API call] | [Payment required before order confirmed] |

Error handling at boundaries:
- [How failures propagate]
- [Retry strategies]
- [Compensation/rollback approaches]

---

## 8. Constraints & Assumptions

### Technical Constraints

- Platform: [web, mobile, both]
- Performance: [response time requirements]
- Scale: [expected users, transactions, data volume]
- Compliance: [GDPR, SOC2, HIPAA, etc.]
- Integration: [must work with existing systems X, Y, Z]

### Business Constraints

- Timeline: [key dates, dependencies]
- Budget: [resource limitations]
- Team: [available skills, headcount]
- Dependencies: [other teams, vendors, decisions]

### Assumptions

What are we assuming to be true that, if wrong, would change the approach?

| Assumption | Impact if Wrong | How We'll Validate |
|------------|-----------------|-------------------|
| [Users prefer self-service] | [Would need support team] | [User interviews] |
| [Volume stays under 10k/day] | [Architecture changes needed] | [Monitor early usage] |

---

## 9. Success Criteria

### Outcome Metrics (tied back to JTBD)

| Metric | Current State | Target | Measurement Method |
|--------|---------------|--------|-------------------|
| Job completion rate | [X%] | [Y%] | [Analytics event] |
| Time to complete job | [X min] | [Y min] | [Session tracking] |
| Error/abandonment rate | [X%] | [Y%] | [Funnel analysis] |
| User satisfaction | [X NPS] | [Y NPS] | [Survey] |

### Leading Indicators

Signals you'll see early that suggest you're on track or off track:

- [Daily active users completing core job]
- [Support ticket volume related to this feature]
- [Feature adoption rate]

### Definition of Done

**Minimum for initial release:**
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

**Full vision:**
- [ ] [Future capability 1]
- [ ] [Future capability 2]

---

## 10. Open Questions & Risks

### Open Questions

| Question | Owner | Due Date | Status |
|----------|-------|----------|--------|
| [How do we handle X edge case?] | [Name] | [Date] | [Open/Resolved] |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Users don't adopt new workflow] | [Medium] | [High] | [Gradual rollout, training] |
| [Integration with X fails] | [Low] | [High] | [Fallback manual process] |

---

## 11. Appendix

### Research & Interview Notes

[Link to research repository or include summaries]

### Competitive Analysis

[How competitors address the same job]

### Wireframes / Prototypes

[Links to design artifacts]
````

### Step 5: Sync and Review

1. **Present the draft plan location**:
   ```
   I've created the initial prd at:
   `thoughts/plans/YYYY-MM-DD-ENG-XXXX-description.md`

   Please review it and let me know:
   - Are the features properly scoped?
   - Are the success criteria specific enough?
   - Any details that need adjustment?
   - Missing edge cases or considerations?
   ```

2. **Iterate based on feedback** - be ready to:
   - Add missing features
   - Adjust technical approach
   - Clarify success criteria
   - Add/remove features items

3. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume - verify with code

2. **Be Interactive**:
   - Don't write the full prd in one shot
   - Get buy-in at each major step
   - Allow course corrections
   - Work collaboratively

3. **Be Thorough**:
   - Read all context files COMPLETELY before planning
   - Research actual feature implementations working in the market
   - Think hard about gaps in the features in the market and capabilities that could benefit our users
   - Write measurable acceptance criteria

4. **Be Practical**:
   - Think about edge cases
   - Include "what we're NOT doing"

5. **Track Progress**:
   - Use TodoWrite to track prd creation tasks
   - Update todos as you complete research
   - Mark prd tasks complete when done

6. **No Open Questions in Final Plan**:
   - If you encounter open questions during prd creation, STOP
   - Research or ask for clarification immediately
   - Do NOT write the prd with unresolved questions
   - The prd must be complete and actionable
   - Every decision must be made before finalizing the prd

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Provide detailed instructions** including:
   - Exactly what to search for
   - What information to extract
   - Expected output format
4. **Be EXTREMELY specific**:
   - Never use generic terms like "UI" when you mean "web app user interface"
5. **Specify read-only tools** to use
6. **Wait for all tasks to complete** before synthesizing
7. **Verify sub-task results**:
   - If a sub-task returns unexpected results, spawn follow-up tasks
   - Cross-check findings against the actual codebase
   - Don't accept results that seem incorrect

Example of spawning multiple tasks:
```python
# Spawn these tasks concurrently:
tasks = [
    Task("Research database schema", db_research_prompt),
    Task("Find API patterns", api_research_prompt),
    Task("Investigate UI components", ui_research_prompt),
    Task("Check test patterns", test_research_prompt)
]
```

## Example Interaction Flow

```
User: /create_prd
Assistant: I'll help you create a detailed product requirements document...

User: We need to  See thoughts/research/feature_a.md
Assistant: Let me read that ticket file completely first...

[Reads file fully]

Based on the research, I understand we need to create prd for COI parsing. Before I start planning, I have some questions...

[Interactive process continues...]
```
