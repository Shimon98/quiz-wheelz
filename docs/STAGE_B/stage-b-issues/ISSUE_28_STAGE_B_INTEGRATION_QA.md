# Issue 28 — Stage B Integration and QA

Owner: TBD  
Status: TODO  
Branch: `feature/issue-28-stage-b-integration-qa`

## Goal

Connect, test and stabilize the full Stage B race loop.

## Why This Issue Exists

After separate production-ready slices are merged, the full flow must be tested as one product experience.

## Scope

- End-to-end manual QA of Stage B.
- Fix integration bugs.
- Clean duplicate code discovered during integration.
- Update README/run docs if needed.
- Confirm Stage B Definition of Done.
- Prepare notes for Stage C.

## Out of Scope

- No major new feature unless it blocks Stage B DoD.
- No PixiJS/turbo/luck/junction implementation.

## Reuse-First Checklist

Before fixing bugs by creating new utilities/components, check whether the fix belongs in existing shared code.
Do not patch the same behavior in multiple places.

## Integration Flow

```text
Teacher logs in
Teacher creates race
Teacher opens waiting room
Student joins by room code
Teacher sees student
Teacher starts race
Student receives question
Student submits answer
Server validates answer
Score/progress/streak update
Teacher live page updates
Race reaches finish state
```

## Testing and QA

Run:

- Backend service tests.
- Frontend build/lint if available.
- Manual flow on desktop teacher screen.
- Manual flow on phone-size student screen.
- Refresh/reconnect tests.
- Error scenarios.

## Definition of Done

- Full Stage B flow works.
- All critical bugs are fixed.
- No known placeholder implementation remains in the main flow.
- Docs are updated.
- Stage C next steps are documented.

## Demo Flow

Record or manually demonstrate the full flow from teacher login to race finish.
