# Production-Ready Issue Template

Use this template for every Stage B issue.

## Issue XX — Title

Owner: TBD  
Status: TODO  
Branch: `feature/issue-XX-short-name`

## Goal

Describe the exact product/backend/frontend outcome.

## Why This Issue Exists

Explain what problem this issue solves and how it fits into Stage B.

## Scope

What is included in this issue.

## Out of Scope

What must not be done in this issue, even if it is related.

## Reuse-First Checklist

Before creating new code, inspect and reuse existing:

- Shared components.
- Feature components.
- API client patterns.
- Stores/hooks.
- Constants.
- Text/style constants.
- Assets.
- Backend API path constants.
- Response/error patterns.
- Service/repository conventions.
- Tests style.

Do not duplicate code, Tailwind classes, constants, DTO patterns or business logic.

## Backend Planning Notes

Describe expected backend behavior without locking the team to exact class names too early.
Mention recommended services/entities/controllers only when useful.

## Frontend Planning Notes

Describe expected UI/UX behavior without forcing exact component names too early.
Mention recommended components/hooks/constants only when useful.

## Validation and Security

List ownership/session/validation rules.

## Testing and QA

List automated tests and manual checks.

## Definition of Done

The issue is done only when these items pass.

## Demo Flow

Describe how the reviewer can manually verify the issue.

## Notes

Use this section for implementation decisions, blockers, and review notes.
