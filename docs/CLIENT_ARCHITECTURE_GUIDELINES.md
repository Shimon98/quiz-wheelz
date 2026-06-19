# Client Architecture Guidelines

## Purpose

This document defines the frontend architecture rules for the QuizWheelz React client.

The goal is to keep the client code clean, predictable, and ready for future features such as real race creation, race lists, teacher race rooms, student screens, SSE, and game rendering.

## Core Principles

1. The server is the source of truth.
2. UI components display data; they do not calculate game rules.
3. No hardcoded API paths inside components or API functions.
4. User-facing text should live in content files.
5. Internal configuration should live in constants files.
6. Assets should be imported through asset registry files.
7. Pages connect data, routing, and layout.
8. Small components receive props and render UI.
9. Zustand stores are only for global state.
10. Do not add game rendering, SSE, or PixiJS before Stage A is stable.

## Folder Responsibilities

### api/

Contains API functions only.

Allowed:
- Calling `httpClient`
- Returning response data
- Using endpoint constants

Not allowed:
- React state
- JSX
- UI messages
- Business logic
- Hardcoded endpoint strings

### pages/

Pages connect routing, auth, data loading, and layout regions.

Allowed:
- Reading route params
- Navigation
- Calling hooks
- Passing props to layout/components

Not allowed:
- Large JSX sections
- Mapping complex UI lists directly
- Repeated styling blocks
- API calls directly when a hook/API layer exists

### components/

Components render UI.

Allowed:
- Receiving props
- Displaying content
- Calling local event handlers

Not allowed:
- Calling backend API directly
- Knowing endpoint paths
- Owning global app logic
- Calculating race/game rules

### constants/

Contains stable configuration and values.

Examples:
- route paths
- API endpoint paths
- dashboard nav items
- status values
- UI config

### content files

Contains user-facing text.

Examples:
- Hebrew labels
- English labels
- button text
- empty states
- validation messages

### assets files

Contains image/icon imports and lookup helpers.

Components should not import many image files directly if a registry already exists.

### utils/

Contains pure helper functions only.

Allowed:
- formatDate
- mapRaceStatusLabel
- buildClassName
- normalizeApiResponse

Not allowed:
- React hooks
- API calls
- Zustand state
- DOM logic

### hooks/

Hooks connect API/data behavior to React components.

Allowed:
- loading state
- error state
- calling API functions
- preparing data for components

Not allowed:
- JSX
- large UI logic
- duplicated API endpoint strings

### stores/

Stores are for global app state only.

Use Zustand for:
- auth user
- auth status
- global app-level state

Do not use Zustand for:
- temporary modal open/close state
- one form state
- one component loading state

## API Endpoint Rules

All API endpoint strings must live in:

```text
client/src/constants/apiEndpointConstants.js


Example:

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  SUBJECTS: {
    LIST: "/subjects",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    RACES: "/teacher/races",
    RACE_ROOM: (raceId) => `/teacher/races/${raceId}/room`,
  },
};

API files should use these constants.

Content Rules

User-facing text should not be written directly inside components unless it is a tiny temporary placeholder.

Use files like:

teacherDashboardContent.js
loginContent.js
raceContent.js
Dashboard Rules

Teacher dashboard should behave like an application screen, not a long webpage.

The structure should stay:

TeacherDashboardLayout
├── TeacherSidebar
└── TeacherDashboardMain
    ├── TeacherHeroBanner
    ├── TeacherStatsSection
    └── TeacherDashboardPanels
        └── TeacherRacePanel

Panel content may scroll internally.

The whole page should not grow endlessly.

What Not To Do

Do not:

Put API paths directly in components.
Put large arrays of config inside JSX components.
Mix API loading logic with small visual components.
Put race/game logic in the client.
Add PixiJS/SSE before Stage A is complete.
Store JWT in localStorage.
Create one huge dashboard page component.
