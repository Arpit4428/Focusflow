# FocusFlow — Complete Viva Preparation Notes

This guide provides direct, technically sound answers to the 15 most common questions asked during academic project vivas for **FocusFlow**.

---

## 1. System Architecture & MVC Layer Breakdown

FocusFlow follows a decoupled, 4-tier layered architecture:

```
[React 18 + Vite]  <--- HTTP/JSON (REST) --->  [Spring Boot 3 Backend]
                                                         │
       ┌─────────────────────────────────────────────────┼────────────────────────┐
       ▼                                                 ▼                        ▼
[Controller Layer]                              [Service Layer]          [Repository Layer]
- Endpoints routing                             - Business rules         - Spring Data Mongo
- HTTP status codes                             - Multithreading (Async) - Query execution
- DTO validation                                - Metrics & formulas     - Entity mapping
                                                         │
                                                         ▼
                                                [MongoDB Database]
                                          (users, tasks, focus_sessions)
```

- **Controller Layer (`@RestController`):** Handles HTTP requests, delegates to services, and returns uniform HTTP responses. Contains **zero business logic**.
- **Service Layer (`@Service`):** Contains business logic, calculations (productivity score, recommendations), and thread orchestration.
- **Repository Layer (`@Repository`):** Extends `MongoRepository<T, ID>`, providing built-in CRUD operations and custom query derivations (`findByUserId`, `findByIdAndUserId`).
- **Persistence Layer:** MongoDB stores schemaless BSON documents natively.

---

## 2. Stateless Authentication & JWT Flow

### How Does the Token Lifecycle Work?
1. The client sends credentials via `POST /api/auth/login`.
2. `AuthService` verifies credentials using Spring Security's `AuthenticationManager`.
3. `JwtService` signs a compact JSON Web Token (HMAC-SHA256) containing:
   - Header: Algorithm (`HS256`) and token type (`JWT`).
   - Payload: Subject (`userId`), `email`, `issuedAt`, and `expiration` (24 hours).
   - Signature: Hash of (Header + Payload + Secret Key).
4. The client saves the token in browser `localStorage`.
5. On subsequent requests, the client attaches the header: `Authorization: Bearer <token>`.
6. `JwtAuthenticationFilter` intercepts the request, verifies the signature using the secret key, extracts user identity, and populates Spring's `SecurityContextHolder`.

### Why Stateless?
The server does not store user sessions in memory or database (`SessionCreationPolicy.STATELESS`). Any server instance can authenticate any request simply by validating the cryptographic signature.

---

## 3. BCrypt Password Hashing vs MD5 / Plain SHA-256

### Why Not Plain SHA-256 or MD5?
- **Speed is a Vulnerability:** Plain SHA-256 and MD5 are designed to be fast. Modern GPUs can calculate billions of SHA-256 hashes per second, making dictionary and brute-force attacks trivial.
- **Rainbow Tables:** Without a unique salt, identical passwords produce identical hashes. Attackers can precompute tables of common password hashes.

### Why BCrypt?
- **Automatic Unique Salting:** BCrypt generates a random 16-byte salt for every password before hashing. Even if two students choose the identical password `password123`, their stored hashes are completely different.
- **Adaptive Work Factor (Cost Factor):** BCrypt uses a configurable cost parameter (default: 10 rounds = $2^{10}$ iterations). As hardware speeds up, the cost factor can be increased without changing the algorithm.
- **One-Way Function:** Passwords cannot be decrypted or reversed—only verified via `BCrypt.checkpw()`.

---

## 4. Multi-Tenancy & Data Isolation

### How is Data Kept Secure Between Users?
1. **Never Trust Client Identifiers:** The backend **never** accepts `userId` from the request body or URL path.
2. **Identity from SecurityContext:** The current user's ID is retrieved securely on the server via `@AuthenticationPrincipal User currentUser`.
3. **Compound Scoped Queries:**
   ```java
   // User A cannot read or delete User B's task, even if they guess the Task ID
   taskRepository.findByIdAndUserId(taskId, currentUser.getId())
       .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
   ```

---

## 5. MongoDB vs Relational Databases (NoSQL Justification)

### Why Choose MongoDB for FocusFlow?
- **JSON / Document Affinity:** The application inherently models nested, document-centric student activity (tasks with metadata, timestamps, and focus sessions).
- **Zero Object-Relational Impedance Mismatch:** Spring Data MongoDB maps Java POJOs directly to BSON documents without heavy ORM layers (no Hibernate session cache, lazy-loading pitfalls, or N+1 query surprises).
- **Flexible Schema Evolution:** Adding fields (such as `completedAt` or `subject`) does not require table locking or SQL migration scripts.

---

## 6. MongoDB Collections and Indexing

### Collections:
1. `users`: `{ _id, email, password, name, createdAt }`
2. `tasks`: `{ _id, userId, title, description, subject, priority, status, dueDate, createdAt, completedAt }`
3. `focus_sessions`: `{ _id, userId, subject, duration, startedAt, endedAt, completed }`

### Indexing Strategy:
- **`users.email` (Unique Index):** Enforces single-account registration per email and ensures $O(1)$ lookup during login.
- **`tasks.userId` & `focus_sessions.userId` (Indexed):** Prevents full collection scans when querying student data, ensuring fast response times as data grows.

---

## 7. Multithreading in Unit 3 (ThreadPoolTaskExecutor & CompletableFuture)

### Where is Multithreading Used?
Multithreading is implemented in `DashboardService.java` using Spring's `ThreadPoolTaskExecutor` and Java 17 `CompletableFuture`.

### The Scatter-Gather Pattern:
When generating the dashboard, two independent database aggregation tasks are executed concurrently:
```java
// Scatter: Spawn worker thread 1
CompletableFuture<TaskMetrics> taskFuture = CompletableFuture.supplyAsync(
    () -> fetchTaskMetrics(userId), taskExecutor
);

// Scatter: Spawn worker thread 2
CompletableFuture<FocusMetrics> focusFuture = CompletableFuture.supplyAsync(
    () -> fetchFocusMetrics(userId), taskExecutor
);

// Gather: Wait for both threads to finish, then join results
CompletableFuture.allOf(taskFuture, focusFuture).join();
```

### Thread Pool Configuration (`SecurityConfig.java`):
- **Core Pool Size:** 4 threads (always ready).
- **Max Pool Size:** 10 threads (during peak load).
- **Queue Capacity:** 50 tasks.
- **Thread Name Prefix:** `focusflow-async-`.

---

## 8. Why `InsightsService` is Synchronous

### Architectural Honesty:
In `InsightsService`, all analytical rules (distribution, top subject, recommendations) run on data already fetched in memory. Spawning threads for simple arithmetic on 20–50 records adds unnecessary context-switching overhead and thread synchronization complexity. Demonstrating when **not** to use multithreading proves architectural maturity.

---

## 9. Deterministic Productivity Score Formula

FocusFlow uses a documented, transparent mathematical formula (clamped to $[0, 100]$):

$$\text{Score} = (T \times 40) + (C \times 30) + (F \times 30)$$

1. **Task Completion Rate ($T$, 40% Weight):**
   $$T = \frac{\text{Completed Tasks}}{\text{Total Tasks}}$$
2. **Study Consistency ($C$, 30% Weight):**
   $$C = \frac{\text{Unique Days with Focus Sessions in Past 7 Days}}{7}$$
3. **Daily Focus Goal ($F$, 30% Weight):**
   $$F = \min\left(1.0, \frac{\text{Today's Focus Seconds}}{7200\text{ seconds (2-hour target)}}\right)$$

---

## 10. Rule-Based Recommendation Engine

Rather than relying on opaque, unpredictable AI/ML APIs, FocusFlow uses **deterministic heuristic rules**:
- **Consistency Warning:** Triggered if active study days $< 3$ out of 7.
- **Urgent Task Alert:** Triggered if any pending task has `priority == HIGH`.
- **Subject Imbalance:** Triggered if any single subject occupies $> 65\%$ of total focus time.
- **Execution Deficit:** Triggered if task completion rate $< 40\%$ when $\ge 3$ tasks exist.

*Result:* Instant, reproducible, and explainable advice for students.

---

## 11. Drift-Free Timer Implementation (React)

### Why Not `setInterval(() => count + 1, 1000)`?
JavaScript's `setInterval` is not real-time guaranteed. If the browser tab is backgrounded or the CPU is busy, intervals are throttled or delayed, leading to accumulated time drift.

### The FocusFlow Timestamp Solution (`useTimer.ts`):
```ts
elapsedSeconds = Math.floor((Date.now() - startTime - totalPausedDuration) / 1000);
```
The timer calculates the exact millisecond delta between physical clock timestamps (`Date.now()`), guaranteeing zero cumulative drift regardless of backgrounding or tab switching.

---

## 12. CORS & Vite Proxy Architecture

### Development Mode:
In `frontend/vite.config.ts`, requests to `/api` are proxied directly to `http://localhost:8080`. The browser communicates with `localhost:5173`, avoiding cross-origin restrictions during local development.

### Production Mode:
In `SecurityConfig.java`, Spring Security's `CorsConfigurationSource` is explicitly configured to permit headers (`Authorization`, `Content-Type`), methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), and allowed origins.

---

## 13. Global Exception Handling (`@ControllerAdvice`)

All application exceptions are intercepted uniformly in `GlobalExceptionHandler.java`:
- `MethodArgumentNotValidException` $\to$ Returns `400 Bad Request` with structured field-by-field validation error messages.
- `BadCredentialsException` $\to$ Returns `401 Unauthorized` with a clean error message without exposing server internals.
- `ResourceNotFoundException` $\to$ Returns `404 Not Found`.
- `Exception` (catch-all) $\to$ Returns `500 Internal Server Error` with a safe generic message.

Every error returns a consistent JSON envelope:
```json
{
  "timestamp": "2026-09-12T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": { "title": "Title is required" }
}
```

---

## 14. Jakarta Bean Validation & DTO Separation

### Why DTOs (Data Transfer Objects)?
- Decouples database document structure from the public API contract.
- Prevents mass assignment attacks (users cannot inject unintended database fields like `id` or internal flags).

### Validation Annotations Used:
- `@NotBlank(message = "...")`: Prevents empty or whitespace-only inputs.
- `@Size(min = 6, message = "...")`: Enforces minimum password strength.
- `@Email`: Validates syntactically correct email addresses.
- `@Positive`: Guarantees positive session durations.

---

## 15. Testing Strategy (MockMvc & Mockito)

FocusFlow features **49 automated tests** requiring **zero running database instances**:
- **MockMvc:** Tests HTTP routing, JSON deserialization, validation errors, and HTTP status codes in a mock servlet environment.
- **Mockito (`@MockBean`):** Mocks the repository and service layers, enabling deterministic unit testing of business rules and multithreading behavior.
- **Execution:** Runs in $\approx 7$ seconds via `.\mvnw.cmd test` with 100% pass rate.
