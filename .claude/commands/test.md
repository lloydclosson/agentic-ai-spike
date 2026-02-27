---
description: Run all code quality tools and iterate to resolve any issues. 
---

# Run Commands

You are tasked with running code quality commands and iterating to resolve all issues. 

## Process:

1. **Lint:**
   - Run `pnpm run format` to format all of the files
   - Run `pnpm run lint` to see any linting errors
   - If errors exist run `pnpm run lint:fix` and capture the output to fix remaining errors
   - Iterate to resolve any remaining errors until `pnpm run lint` returns successfully

2. **Typecheck:**
   - Run `pnpm run typecheck` to see any typecheck errors
   - Capture the output and Iterate to resolve any remaining errors until `pnpm run typecheck` returns successfully
   - Work to have very strict typing. Don't take the easy way out. Be thoughtful about how to maintain type saftey while resolving the errors. 

3. **Unit Test:**
   - Run `pnpm run test` to see any unit test errors
   - Capture the output and Iterate to resolve any remaining errors until `pnpm run test` returns successfully
   - Be thoughtful on how to resolve the errors, think through thoroughly whether the error is the because the test is incorrect, or the code is not working correctly, and resolve the right issue. 

4. **Integration Test:**
   - Run `pnpm run test:integration` to see any unit test errors
   - Capture the output and Iterate to resolve any remaining errors until `pnpm run test:integration` returns successfully
   - Be thoughtful on how to resolve the errors, think through thoroughly whether the error is the because the test is incorrect, or the code is not working correctly, and resolve the right issue. 

5. **E2E Test:**
   - Run `pnpm run teste2e` to see any unit test errors
   - Capture the output and Iterate to resolve any remaining errors until `pnpm run test` returns successfully
   - Be thoughtful on how to resolve the errors, think through thoroughly whether the error is the because the test is incorrect, or the code is not working correctly, and resolve the right issue.  

