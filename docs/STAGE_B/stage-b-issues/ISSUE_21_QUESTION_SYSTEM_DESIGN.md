# Issue 21 — Question Generation System

Owner: TBD  
Status: TODO  
Branch: `feature/issue-21-question-generation-system`

## Goal

Build the production-ready math question generation core based on existing templates.

## Why This Issue Exists

The game depends on generated multiple-choice questions. The generator must be reliable, testable, and connected to difficulty/template rules. It must not be a temporary random string generator.

## Scope

- Select active templates for math questions.
- Generate question text and correct answer according to template rules.
- Generate exactly four answer choices.
- Ensure one correct answer and valid distractors.
- Support difficulty concepts.
- Prepare for adaptive selection.
- Add service tests.

## Out of Scope

- No student delivery endpoint yet unless handled by Issue 22.
- No answer submission endpoint yet.
- No frontend question UI yet.
- No full advanced adaptive algorithm yet.

## Reuse-First Checklist

Inspect existing Subject, QuestionTemplate, QuestionType, Difficulty and repository conventions.
Do not create a separate hardcoded math-only domain that bypasses existing templates.

## Backend Planning Notes

The generator should be designed around:

- Subject/template.
- Question type.
- Difficulty.
- Value ranges.
- Time limit.
- Choices count.

The first supported subject is math. However, central architecture should remain generic enough for future subjects.

The generator should return an internal result that includes the correct answer, but API responses must not expose correctness to the client.

## Testing and QA

Automated tests should verify:

- Generated question follows min/max rules.
- Four choices are generated.
- One choice is correct.
- Choices are unique.
- Difficulty is used.
- Division/subtraction edge cases are handled according to chosen rules.

## Definition of Done

- Question generation is deterministic enough to test.
- Four-choice output is reliable.
- No correct answer leakage to frontend DTOs.
- Generator is not tied to UI.
- Generator is ready to be used by PlayerQuestion delivery.

## Demo Flow

Run tests or dev endpoint/service call that generates a valid math question from seeded templates.
