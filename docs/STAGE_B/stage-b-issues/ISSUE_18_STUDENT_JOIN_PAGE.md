# Issue 18 — Student Join Page

Owner: TBD  
Status: TODO  
Branch: `feature/issue-18-student-join-page`

## Goal

Build a production-ready mobile-first page where a student joins a race by room code and display name.

## Why This Issue Exists

The student experience starts on a phone. This page must be clean, responsive, friendly for children, and connected to the real join API from the start.

## Scope

- Add student join route/page.
- Add form for room code and display name.
- Support room code from URL if planned.
- Connect to student join API.
- Handle loading/error/success/disabled states.
- Navigate to the next student race/waiting screen after successful join.
- Reuse existing design constants, assets, logo, background patterns and UI components where possible.

## Out of Scope

- No question screen yet.
- No race animation yet.
- No manual vehicle selection unless approved as part of this issue.

## Reuse-First Checklist

Before creating components, inspect:

- Existing login page layout.
- Existing buttons/inputs.
- Existing background assets.
- Existing logo usage.
- Existing text style constants.
- Existing API client pattern.
- Existing error/loading components.

Do not duplicate Tailwind style strings if constants/components already exist.

## Frontend Planning Notes

The page should be:

- Mobile-first.
- Full-screen on phone.
- RTL-friendly.
- Touch-friendly.
- Clear and playful, but not messy.
- Usable on small screens.

Recommended UI states:

- Initial form.
- Loading while joining.
- Error for invalid room code.
- Error for race full.
- Error for race already started.
- Disabled submit while request is running.

## Testing and QA

Manual checks:

- Works on narrow phone viewport.
- No horizontal scrolling.
- Keyboard does not break layout.
- Errors are readable.
- Duplicate clicks are prevented.
- Successful join navigates correctly.

## Definition of Done

- Student can join from real UI.
- UI uses real API.
- UI handles real backend errors.
- Design is production-ready enough to keep and improve, not throw away.
- Existing components/constants/assets are reused where possible.

## Demo Flow

Open student join page on phone-sized viewport, enter room code and name, join race, verify next screen/state appears.
