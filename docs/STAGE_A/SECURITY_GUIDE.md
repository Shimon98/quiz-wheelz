# QuizWheelz Security Guide

This document explains how the server security layer works in QuizWheelz and how to protect future controllers.

The main rule:

> Controllers should not manually extract cookies, validate JWT tokens, load users from tokens, or check roles with `if` statements.

Authentication is handled by `JwtAuthenticationFilter`.
Authorization is handled by Spring Security and `@PreAuthorize`.
Current user information is accessed through `CurrentUserService`.

---

## 1. Request Flow

Every request goes through this flow:

```text
Client Request
  ↓
SecurityFilterChain
  ↓
JwtAuthenticationFilter
  ↓
Read JWT from auth cookie
  ↓
Validate JWT
  ↓
Load active User from DB
  ↓
Create Authentication
  ↓
Store user in SecurityContext
  ↓
Controller
  ↓
@PreAuthorize role check, if needed
```

---

## 2. Responsibilities

### `SecurityFilterChain`

The central security gate of the server.

It decides:

```text
Which endpoints are public
Which endpoints require login
Which security filter runs before controllers
Whether the server uses sessions
Whether CORS is enabled
Whether CSRF is disabled
```

### `JwtAuthenticationFilter`

Authenticates requests before they reach controllers.

It does:

```text
Read auth cookie
Validate JWT
Extract userId
Load active User from DB
Create AuthUserPrincipal
Put Authentication in SecurityContext
```

### `AuthUserPrincipal`

Represents the logged-in user inside Spring Security.

It should contain:

```text
userId
username
displayName
role
authorities
```

It should not contain the password hash.

### `CurrentUserService`

Used by services or controllers when they need details about the logged-in user.

Examples:

```java
Long userId = currentUserService.getCurrentUserId();
UserRole role = currentUserService.getCurrentUserRole();
AuthUserResponse user = currentUserService.getCurrentUserResponse();
```

### `AuthService`

Should focus mainly on authentication actions:

```text
login
password validation
JWT creation
```

### `UserService`

Should focus on user lookup and validation:

```text
find user by id
find user by username
validate active user
return active user or throw error
```

---

## 3. SecurityFilterChain Rules

Example:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
        .requestMatchers("/swagger-ui/**").permitAll()
        .requestMatchers("/v3/api-docs/**").permitAll()
        .requestMatchers("/api/auth/me").authenticated()
        .requestMatchers("/api/**").authenticated()
        .anyRequest().permitAll()
)
```

---

## 4. What `permitAll()` Means

Example:

```java
.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
```

Meaning:

```text
This endpoint can be called without being logged in.
```

Important:

The request still passes through the security filter chain. However, if there is no cookie, the request is still allowed to continue.

Use `permitAll()` for:

```text
Login
Logout
Health check
Swagger docs
Public endpoints
```

---

## 5. What `authenticated()` Means

Example:

```java
.requestMatchers("/api/**").authenticated()
```

Meaning:

```text
The user must be logged in.
The request must include a valid auth cookie.
The JWT must be valid.
The user must exist in the database.
The user must be active.
```

If the user is not logged in, the server should return:

```text
401 Unauthorized
```

---

## 6. What `@PreAuthorize` Means

`@PreAuthorize` checks permissions before the controller method runs.

Use it when an endpoint requires a specific role.

Examples:

```java
@PreAuthorize("hasRole('TEACHER')")
```

```java
@PreAuthorize("hasRole('ADMIN')")
```

```java
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
```

If the user is logged in but does not have permission, the server should return:

```text
403 Forbidden
```

---

## 7. Common Authorization Patterns

### Public endpoint

No annotation is needed if the endpoint is defined as `permitAll()` in `SecurityConfig`.

Example:

```java
@PostMapping("/login")
public ResponseEntity<?> login(...) {
    ...
}
```

---

### Logged-in user only

Usually no annotation is needed because `/api/**` is already protected by:

```java
.requestMatchers("/api/**").authenticated()
```

Optional explicit annotation:

```java
@PreAuthorize("isAuthenticated()")
```

Example:

```java
@GetMapping("/me")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> me() {
    ...
}
```

---

### Teacher only

```java
@PreAuthorize("hasRole('TEACHER')")
```

Example:

```java
@GetMapping("/teacher/dashboard")
@PreAuthorize("hasRole('TEACHER')")
public ResponseEntity<?> getTeacherDashboard() {
    ...
}
```

---

### Admin only

```java
@PreAuthorize("hasRole('ADMIN')")
```

Example:

```java
@GetMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getUsers() {
    ...
}
```

---

### Teacher or Admin

```java
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
```

Example:

```java
@GetMapping("/subjects")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public ResponseEntity<?> getActiveSubjects() {
    ...
}
```

---

### Student only

```java
@PreAuthorize("hasRole('STUDENT')")
```

Example:

```java
@GetMapping("/student/race")
@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity<?> getStudentRace() {
    ...
}
```

---

## 8. Where to Put `@PreAuthorize`

### Option A — On a method

Use this when different methods in the same controller have different permissions.

```java
@GetMapping
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public ResponseEntity<?> getAll() {
    ...
}

@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> create() {
    ...
}
```

---

### Option B — On the controller class

Use this when all methods in the controller require the same permission.

```java
@RestController
@RequestMapping("/api/teacher/races")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherRaceController {

    @GetMapping
    public ResponseEntity<?> getRaces() {
        ...
    }

    @PostMapping
    public ResponseEntity<?> createRace() {
        ...
    }
}
```

---

## 9. Important Role Rule

In the database and enum we use:

```java
TEACHER
ADMIN
STUDENT
```

In Spring Security authorities we store:

```text
ROLE_TEACHER
ROLE_ADMIN
ROLE_STUDENT
```

But inside `@PreAuthorize`, write only:

```java
hasRole('TEACHER')
```

Do not write:

```java
hasRole('ROLE_TEACHER')
```

Spring automatically adds `ROLE_`.

Wrong:

```java
@PreAuthorize("hasRole('ROLE_TEACHER')")
```

Correct:

```java
@PreAuthorize("hasRole('TEACHER')")
```

---

## 10. How to Get the Current User

If a service needs to know who the logged-in user is, use `CurrentUserService`.

Examples:

```java
Long userId = currentUserService.getCurrentUserId();
```

```java
UserRole role = currentUserService.getCurrentUserRole();
```

```java
AuthUserResponse user = currentUserService.getCurrentUserResponse();
```

Do not extract the user from the JWT manually.

---

## 11. Example — SubjectController

```java
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getActiveSubjects() {
        List<SubjectResponse> subjects = subjectService.getActiveSubjects();

        return ResponseEntity.ok(
                ApiResponse.ok("Active subjects loaded", subjects)
        );
    }
}
```

What this controller does not do:

```text
No cookie extraction
No JWT validation
No manual user lookup
No manual role check
```

---

## 12. Example — Teacher Race Creation

Controller:

```java
@RestController
@RequestMapping("/api/teacher/races")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherRaceController {

    private final RaceService raceService;

    public TeacherRaceController(RaceService raceService) {
        this.raceService = raceService;
    }

    @PostMapping
    public ResponseEntity<?> createRace(@RequestBody CreateRaceRequest request) {
        return ResponseEntity.ok(raceService.createRace(request));
    }
}
```

Service:

```java
@Service
public class RaceService {

    private final CurrentUserService currentUserService;

    public RaceService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public RaceResponse createRace(CreateRaceRequest request) {
        Long teacherId = currentUserService.getCurrentUserId();

        // Use teacherId to create the race
        return null;
    }
}
```

---

## 13. 401 vs 403

### 401 Unauthorized

The user is not logged in.

Examples:

```text
Missing cookie
Invalid token
Expired token
No authenticated user
```

### 403 Forbidden

The user is logged in, but does not have permission.

Examples:

```text
TEACHER tries to access ADMIN endpoint
STUDENT tries to access TEACHER endpoint
```

---

## 14. Quick Decision Table

| Endpoint type | What to do |
|---|---|
| Login | Add `permitAll()` in `SecurityConfig` |
| Logout | Add `permitAll()` or keep authenticated, project decision |
| Health / Swagger | Add `permitAll()` |
| Any regular `/api/**` endpoint | Already requires login |
| Teacher endpoint | Add `@PreAuthorize("hasRole('TEACHER')")` |
| Admin endpoint | Add `@PreAuthorize("hasRole('ADMIN')")` |
| Teacher or Admin endpoint | Add `@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")` |
| Need current user id | Use `CurrentUserService.getCurrentUserId()` |

---

## 15. Project Golden Rules

```text
1. Controllers do not authenticate manually.
2. Controllers do not extract cookies.
3. Controllers do not validate JWT tokens.
4. Controllers do not manually check roles with if statements.
5. Authentication is handled by JwtAuthenticationFilter.
6. Authorization is handled by @PreAuthorize.
7. Current user data is accessed through CurrentUserService.
8. AuthService is mainly for login/auth operations.
9. UserService is for user lookup and active user validation.
10. Business services should receive the current user through CurrentUserService when needed.
```

---

## 16. Most Used Snippets

### Teacher or Admin

```java
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
```

### Teacher only

```java
@PreAuthorize("hasRole('TEACHER')")
```

### Admin only

```java
@PreAuthorize("hasRole('ADMIN')")
```

### Student only

```java
@PreAuthorize("hasRole('STUDENT')")
```

### Logged-in user only

```java
@PreAuthorize("isAuthenticated()")
```

### Get current user id

```java
Long userId = currentUserService.getCurrentUserId();
```

### Get current user role

```java
UserRole role = currentUserService.getCurrentUserRole();
```

---

## 17. Recommended Project Location

Save this file in the repository at:

```text
docs/SECURITY_GUIDE.md
```
