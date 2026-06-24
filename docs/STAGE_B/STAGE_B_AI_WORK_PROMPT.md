# Stage B AI Work Prompt

Use this prompt at the start of every Stage B coding task.

```text
Read AGENTS.md first and follow it strictly.
Read docs/STAGE_B_PLAN.md.
Read docs/STAGE_B_ARCHITECTURE_DECISIONS.md.
Read the specific issue file under docs/stage-b-issues/.

Current issue:
feature/issue-XX-short-name

Goal:
[write the exact goal]

Before modifying files:
1. Run git status.
2. Inspect the relevant existing project structure.
3. Search for existing components, constants, API patterns, services and DTOs that can be reused.
4. Explain your implementation plan.
5. List expected changed files.
6. Wait for approval.

Rules:
- Do not create throwaway placeholder implementations.
- Do not touch unrelated files.
- Do not duplicate existing frontend components, constants, styles or API patterns.
- Do not duplicate backend business logic.
- Keep controllers thin.
- Keep business logic in services.
- The server is the source of truth.
- The frontend renders and animates state but does not decide correctness, score, progress, winner or finish state.
- The first supported subject is Math, but central architecture must remain generic.
- Generated questions must be persisted before being sent to the student.
- The student client must not receive the correct answer.
- Add backend tests for business rules where relevant.
```
