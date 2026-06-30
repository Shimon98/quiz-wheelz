# QuizWheelz — Client Page Roadmap

## 1. Purpose

This document maps every planned client page, what it means, what it contains, and when it should be built.

It is the bridge between design images and actual implementation issues.

## 2. Page Build Order

Recommended order:

```text
1. Landing / user type selection
2. Student room code step
3. Student display name step
4. Student waiting page
5. Teacher login
6. Teacher registration
7. Forgot/reset password
8. Teacher dashboard
9. Create race
10. Teacher waiting room
11. Student race screen
12. Teacher live race screen
13. Result screens
```

## 3. Landing / User Type Selection

### Goal

First clear entry screen.

### Content

- QuizWheelz logo
- Jungle monkey hero illustration
- Short welcome title
- Short explanation text
- Role card: "I am a student"
- Role card: "I am a teacher"
- Settings gear
- Footer: all rights reserved, terms, privacy

### Mobile Layout

Logo top, hero illustration top, role cards below, footer at bottom.

### Desktop Layout

Split layout: illustration side + role selection card side.

### Routes

Suggested: `/` or `/entry`.

## 4. Student Room Code Step

### Goal

Allow student to enter room code quickly.

### Content

- Title: Join race
- Room code input
- Continue button
- QR scan placeholder/future option
- Back link
- Settings gear

### Important Rule

This screen does not create a `RacePlayer`.

### Routes

```text
/join
/join/:roomCode future
```

## 5. Student Display Name Step

### Goal

After room code exists, student chooses display name.

### Content

- Room code badge
- Student display name input
- Monkey/kart preview
- Future avatar/car selector placeholder
- Join race button
- Back link

### Important Rule

This is where `RacePlayer` is created.

Manual vehicle/avatar choice may be added later, but selected vehicle state must be owned by the server as stable keys.

## 6. Student Waiting Page

### Goal

Show that the student joined and is waiting for the teacher to start.

### Content

- Joined successfully
- Student display name
- Room code
- Waiting status
- Connected participants preview
- Light animation/mascot
- Leave room action

## 7. Teacher Login

### Goal

Teacher enters the management area.

### Content

- Email or username input
- Password input
- Login button
- Forgot password link
- Register link
- Settings gear

### Temporary Backend Compatibility

UI should be designed around email, but can submit username for now if the backend still expects username.

Recommended label:

```text
Email or username
```

## 8. Teacher Registration

### Goal

Create a teacher account.

### Content

- Full name
- Email
- Password
- Confirm password
- Terms checkbox
- Create account button
- Link to login

### Email Verification

Recommended future behavior: after signup, send verification email. Not required for the first UI shell if backend is missing.

## 9. Forgot Password Flow

This flow has three screens.

### 9.1 Forgot Password

- Email input
- Send code button
- Back to login link

### 9.2 Code Verification

- Six code boxes
- Continue button
- Resend code timer
- Back link

### 9.3 Reset Password

- New password
- Confirm new password
- Update password button
- Success state

## 10. Teacher Dashboard

### Goal

Main teacher workspace.

### Content

- Sidebar
- Teacher avatar/name
- Main navigation
- Greeting
- Stats cards
- Race list
- Create race button
- Settings inside sidebar/user menu
- Logout

### Initial Navigation

```text
Dashboard
Races
Settings
Logout
```

Future items: templates, question banks, reports, students, class settings, rewards.

Do not build future items until needed.

### Responsive Requirement

Teacher dashboard must work on desktop and mobile.

## 11. Create Race

### Goal

Teacher creates a new race.

### Content

- Race title
- Subject
- Max players
- Race length / question count
- Time per question
- Difficulty
- Advanced options collapsed
- Create race button
- Cancel/back button

### Backend Compatibility

Only show fields supported by backend first. Unsupported fields should be documented as future fields.

## 12. Teacher Waiting Room

### Goal

Teacher waits for students before starting race.

### Content

- Race title
- Room code
- QR code
- Connected participants
- Player count
- Start race button
- Back to dashboard

## 13. Student Race Screen

### Goal

Main gameplay screen for students.

### Content

PixiJS scene: jungle road, monkey kart, opponent karts, dust/effects.

React overlay: score, timer, position, combo, question, four answer buttons.

### Important Rule

Client does not calculate correctness, score, speed, progress, or winner.

## 14. Teacher Live Race Screen

### Goal

Teacher sees race progress live.

### Content

- Sidebar
- Race title
- Room code
- Participant count
- Race timer/status
- End race button
- Progress lanes
- Current ranking
- Live event feed
- Participants modal later
- Reports later

## 15. Student Result Screen

### Goal

Show personal result after race.

### Content

- Final placement
- Score
- Correct answers
- Time
- Rewards
- Leaderboard
- Finish button

## 16. Teacher Result Screen

### Goal

Show race summary to teacher.

### Content

- Winner highlighted
- Final leaderboard
- Class statistics summary
- Button to view report/statistics
- Back to dashboard button

## 17. Future Teacher Statistics

Future page after the race engine is stable: accuracy per student, average response time, missed questions, subject/difficulty breakdown, export/report option.
