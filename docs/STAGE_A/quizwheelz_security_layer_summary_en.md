# Security Layer in the QuizWheelz Project

Summary of decisions, working principles, and future usage of REST Security Handlers.

---

## Project Decision Going Forward

The **QuizWheelz** project uses a centralized **Spring Security** layer.

This means:

- Controllers do not check Cookies.
- Controllers do not validate JWT manually.
- Controllers do not check roles with `if` statements.
- Every future endpoint should integrate through:
  - `SecurityConfig`
  - `@PreAuthorize`
  - `CurrentUserService`
  - `RestAuthenticationEntryPoint`
  - `RestAccessDeniedHandler`

---

## 1. Why did we add these two classes?

During Postman testing, when trying to create a race after logout, the server returned:

```text
403 Forbidden
```

However, in a professional REST API, when there is no valid authentication, the better response is:

```text
401 Unauthorized
```

The issue was not in the race creation code itself.  
The issue was how **Spring Security** returned errors when a request was blocked inside the security layer, before reaching the Controller or the `GlobalExceptionHandler`.

Therefore, we added two dedicated classes for the Security layer:

```text
RestAuthenticationEntryPoint
RestAccessDeniedHandler
```

---

## 2. The important difference between 401 and 403

| Situation | Correct status | Meaning | Example in the project |
|---|---|---|---|
| No valid authentication | `401 Unauthorized` | The system does not know about a valid logged-in user | Missing Cookie, missing JWT, invalid JWT, or expired JWT |
| User is authenticated but not authorized | `403 Forbidden` | The system knows who the user is, but the user's role is not allowed | A Student tries to access a Teacher endpoint |

---

## 3. What does each class do?

### `RestAuthenticationEntryPoint`

Handles cases where Spring Security needs to return a response because there is no valid `Authentication`.

Suitable for cases such as:

- Missing Cookie.
- Missing Token.
- Invalid Token.
- Expired Token.
- User is not logged in.

Returns:

```text
401 Unauthorized
```

Using the unified JSON structure of `ErrorResponse`.

---

### `RestAccessDeniedHandler`

Handles cases where there is an `Authentication`, but not enough `Authorization`.

Suitable for cases such as:

- The user is logged in.
- The JWT is valid.
- But the user's role is not allowed for the endpoint.

Returns:

```text
403 Forbidden
```

Using the unified JSON structure of `ErrorResponse`.

---

## 4. Why is `GlobalExceptionHandler` not enough?

`GlobalExceptionHandler` is excellent for regular application errors, such as:

- Validation errors.
- Subject not found.
- Race not found.
- User not found.
- Business logic errors.
- General errors.

However, Security errors happen inside the:

```text
Spring Security Filter Chain
```

This means they occur before the request reaches the Controller.

Therefore, we use the following clear separation:

| Error type | Handled by |
|---|---|
| `400 Validation` | `GlobalExceptionHandler` |
| `404 Subject/Race/User not found` | `GlobalExceptionHandler` through `ApiException` |
| `500 Internal error` | `GlobalExceptionHandler` |
| `401 Unauthenticated` | `RestAuthenticationEntryPoint` |
| `403 Forbidden` | `RestAccessDeniedHandler` |

---

## 5. How does this fit into future features?

We do not recreate these two classes in every Issue.

They are a permanent part of the infrastructure.  
For every new endpoint, we only choose the access type.

| Endpoint type | What to do | Example |
|---|---|---|
| Public | Add `permitAll()` in `SecurityConfig` | `POST /api/auth/login`, future `POST /api/student/join` |
| Requires logged-in user only | It is enough for it to be under `/api/**`, because `authenticated()` is configured | `GET /api/auth/me` |
| Teacher only | Add `@PreAuthorize("hasRole('TEACHER')")` | Create race, start race, teacher dashboard |
| Student only | Add `@PreAuthorize("hasRole('STUDENT')")` | Answer question, personal race status |
| Teacher or Admin | Add `@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")` | Manage subjects, view system data |

---

## 6. Workflow template for every new endpoint

For every new endpoint in the project, follow this order:

1. Decide whether the endpoint is public or protected.
2. If it is public, add it to `SecurityConfig` with `permitAll()`.
3. If it is protected, make sure it is under `/api/**`.
4. If a specific role is required, add `@PreAuthorize` on the controller or method.
5. If you need to know who the logged-in user is, use `CurrentUserService`.
6. Do not check Cookie or JWT manually inside the Controller.
7. Do not manually return `401` or `403` from the Controller for authorization logic.
8. Test with Postman:
   - Without login.
   - With the correct role.
   - If possible, also with an incorrect role.

---

## 7. Future code examples

### Teacher endpoint

```java
@RestController
@RequestMapping("/api/teacher/races")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherRaceController {

    // teacher endpoints here
}
```

---

### Student endpoint

```java
@RestController
@RequestMapping("/api/student/races")
@PreAuthorize("hasRole('STUDENT')")
public class StudentRaceController {

    // student endpoints here
}
```

---

### Public endpoint

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/student/join").permitAll()
        .requestMatchers("/api/**").authenticated()
)
```

---

### Using the current user inside a Service

```java
Long teacherId = currentUserService.getCurrentUserId();
User teacher = userService.findActiveByIdOrThrow(teacherId);
```

---

## 8. What not to do going forward

Avoid these patterns:

- Do not extract Cookie manually inside a Controller.
- Do not decode JWT manually inside a Controller.
- Do not check roles with `if` inside a Controller.
- Do not manually return `ResponseEntity.status(401)` for normal security flow.
- Do not manually return `ResponseEntity.status(403)` for normal security flow.
- Do not create a separate handler for every HTTP status.

For Security, two central handlers are enough:

```text
401 → RestAuthenticationEntryPoint
403 → RestAccessDeniedHandler
```

---

## 9. Recommended Postman tests for every protected feature

| Test | Expected result |
|---|---|
| Request without Cookie / without Login | `401 Unauthorized` with structured JSON |
| Request after Login with the correct role | `200 OK` or the correct status for the operation |
| Request with an incorrect role | `403 Forbidden` with structured JSON |
| Request with invalid body | `400 Bad Request` through validation |
| Request for a missing resource | `404 Not Found` through `ApiException` |

---

## 10. Recommended PR documentation text

```md
## Security Notes

- Controllers do not extract cookies or validate JWT manually.
- Protected endpoints use Spring Security and @PreAuthorize.
- Current user data is accessed through CurrentUserService.
- Unauthenticated protected requests return 401 JSON responses.
- Authenticated users without permission return 403 JSON responses.
```

---

## 11. Short summary

The new security layer makes QuizWheelz closer to a real-world application:

- Error responses are consistent.
- Authorization logic is centralized.
- Controllers stay clean from low-level security logic.
- Every new feature integrates through the same mechanism.
- We do not need to rethink how to return `401` or `403` in every Issue.

From now on, every new Issue only needs to define who is allowed to access each endpoint, and the security layer will handle the rest.

---

## Source file

This document was created as the English Markdown version of:

```text
quizwheelz_security_layer_summary_he.md
```

Recommended location in the repository:

```text
docs/
```

Recommended filename:

```text
quizwheelz_security_layer_summary_en.md
```
