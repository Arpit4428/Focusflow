# FocusFlow 🎯
> **A Clean, Modular Student Productivity & Study Analytics Web Application**  
> *Built for College Academic Project & Viva Examination (Unit 3 Concepts)*

---

## 📌 1. Project Overview

**FocusFlow** is a full-stack student productivity application engineered to help students organize academic tasks, conduct focused study sessions, and visualize their productivity trends.

The application follows the core data lifecycle:
$$\textbf{Track} \longrightarrow \textbf{Store} \longrightarrow \textbf{Analyze} \longrightarrow \textbf{Visualize}$$

### Key Philosophy
- **Technically Sound, NOT Over-Engineered**: FocusFlow demonstrates strong foundational computer science principles (multithreading, secure stateless authentication, NoSQL schema design, clean MVC separation, and drift-free client-side time math) without unnecessary bloat (no AI/ML, Kafka, Redis, Docker/K8s, or external paid APIs).
- **Viva-Ready**: Every architectural and implementation choice is deliberate, modular, and directly explainable.

---

## 🚀 2. Core Features

| Feature | Description |
|---|---|
| **Stateless Authentication** | Secure user registration & login with **BCrypt** password hashing (salted) and signed **JWT** (JSON Web Tokens). |
| **Strict Data Isolation** | Every user can **only** view and modify their own data. Identity is resolved exclusively via `SecurityContextHolder` / `@AuthenticationPrincipal`. |
| **Task Management** | Full CRUD for tasks with Priority (`HIGH`, `MEDIUM`, `LOW`), Status (`PENDING`, `COMPLETED`), category tags, and due dates. |
| **Focus Timer** | Drift-free stopwatch timer using timestamp differential math (`Date.now() - startTime`). Sessions under 10s are discarded to maintain data hygiene. |
| **Focus History** | Chronological log of completed sessions with subject filtering and deletion capabilities. |
| **Multithreaded Dashboard** | Real-time command center aggregating task and focus metrics concurrently using Java 17 `CompletableFuture` (Scatter-Gather pattern). |
| **Deterministic Insights** | Transparent, rule-based analytics computing subject time distribution, top study days, completion rates, and actionable study advice. |

---

## 🛠️ 3. Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 8 (with fast HMR and optimized production bundling)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Styling:** Vanilla Modern CSS with CSS custom properties (Dark theme, accessible contrast, mobile responsive)

### Backend
- **Language:** Java 17 (LTS)
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6 with custom `JwtAuthenticationFilter` and BCrypt
- **Data Access:** Spring Data MongoDB
- **Validation:** Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, etc.)
- **Multithreading:** Spring `ThreadPoolTaskExecutor` + Java `CompletableFuture`

### Database
- **Engine:** MongoDB (local Community Server or MongoDB Atlas cloud cluster)
- **Collections:** `users`, `tasks`, `focus_sessions`

---

## 🏗️ 4. Architecture & Layered MVC Pattern

```
                       ┌────────────────────────────────┐
                       │   React 18 Frontend (Vite)     │
                       │   TypeScript + Modern Dark CSS │
                       └───────────────┬────────────────┘
                                       │ HTTP / JSON
                                       │ Authorization: Bearer <JWT>
                                       ▼
                       ┌────────────────────────────────┐
                       │   Spring Security Filter Chain │
                       │   (JwtAuthenticationFilter)    │
                       └───────────────┬────────────────┘
                                       │ Sets SecurityContext
                                       ▼
                       ┌────────────────────────────────┐
                       │       Controller Layer         │
                       │ (Auth, Task, Focus, Dashboard) │
                       └───────────────┬────────────────┘
                                       │ DTOs / Authenticated Principal
                                       ▼
                       ┌────────────────────────────────┐
                       │        Service Layer           │
                       │ (Multithreading & Calculations)│
                       └───────────────┬────────────────┘
                                       │ Domain Entities
                                       ▼
                       ┌────────────────────────────────┐
                       │        Repository Layer        │
                       │   (Spring Data MongoRepository)│
                       └───────────────┬────────────────┘
                                       │ Native MongoDB Driver
                                       ▼
                       ┌────────────────────────────────┐
                       │      MongoDB Database          │
                       │ (users, tasks, focus_sessions) │
                       └────────────────────────────────┘
```

---

## ⚡ 5. Multithreading (Unit 3 Core Concept)

FocusFlow implements asynchronous multithreading inside `DashboardService.java` utilizing Java 17 `CompletableFuture` and a custom configured Spring `ThreadPoolTaskExecutor`:

```java
// Thread 1 from Pool: Fetch Task Metrics
CompletableFuture<TaskMetrics> taskFuture = CompletableFuture.supplyAsync(
    () -> fetchTaskMetrics(userId), taskExecutor
);

// Thread 2 from Pool: Fetch Focus Session Metrics
CompletableFuture<FocusMetrics> focusFuture = CompletableFuture.supplyAsync(
    () -> fetchFocusMetrics(userId), taskExecutor
);

// Scatter-Gather: Wait for both threads to finish, then join results
CompletableFuture.allOf(taskFuture, focusFuture).join();
```

### Why Use Multithreading Here?
- The Dashboard requires data from two distinct, independent MongoDB collections (`tasks` and `focus_sessions`).
- Rather than blocking sequentially, both database queries run in parallel worker threads, cutting retrieval latency down.
- **Viva Note:** Multithreading is applied purposefully where concurrent I/O offers real efficiency, while `InsightsService` is kept clean and synchronous to prevent over-engineering.

---

## 📊 6. Deterministic Productivity Score Formula

The productivity score is computed deterministically (clamped between 0 and 100):

$$\text{Productivity Score} = (T \times 40) + (C \times 30) + (F \times 30)$$

Where:
- **$T$ (Task Completion Rate - 40%):** $\frac{\text{Completed Tasks}}{\text{Total Tasks}}$
- **$C$ (Study Consistency - 30%):** $\frac{\text{Active Days with Focus Sessions in Last 7 Days}}{7}$
- **$F$ (Daily Focus Goal - 30%):** $\min\left(1.0, \frac{\text{Today's Focus Seconds}}{7200\text{ seconds (2 hours)}}\right)$

---

## 📡 7. REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Public? |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | Yes |
| `POST` | `/api/auth/login` | Authenticate & receive JWT token | Yes |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Protected? |
|---|---|---|:---:|
| `GET` | `/api/tasks` | Get all tasks for current user | Yes |
| `POST` | `/api/tasks` | Create a new task | Yes |
| `GET` | `/api/tasks/{id}` | Get specific task by ID | Yes |
| `PUT` | `/api/tasks/{id}` | Update existing task | Yes |
| `PATCH`| `/api/tasks/{id}/complete` | Toggle task completion status | Yes |
| `DELETE`| `/api/tasks/{id}` | Delete a task | Yes |

### Focus Sessions (`/api/focus-sessions`)
| Method | Endpoint | Description | Protected? |
|---|---|---|:---:|
| `GET` | `/api/focus-sessions` | Get recent focus sessions | Yes |
| `POST` | `/api/focus-sessions` | Record a completed focus session | Yes |
| `DELETE`| `/api/focus-sessions/{id}` | Delete a focus session record | Yes |

### Dashboard & Analytics
| Method | Endpoint | Description | Protected? |
|---|---|---|:---:|
| `GET` | `/api/dashboard` | Multithreaded aggregated dashboard metrics | Yes |
| `GET` | `/api/insights` | Analytical study patterns & recommendations | Yes |

---

## 💻 8. Installation & Run Guide

### Prerequisites
- **Java:** JDK 17 or higher (`java -version`)
- **Node.js:** v18.0.0 or higher (`node -v`)
- **MongoDB:** Community Server running locally on `localhost:27017` OR a MongoDB Atlas cluster URI

---

### Step 1: Configure Backend
Open `backend/src/main/resources/application.properties` and verify your MongoDB URI:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/focusflow
# Or for MongoDB Atlas:
# spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster0.mongodb.net/focusflow?retryWrites=true&w=majority
```

### Step 2: Run Backend Tests
Run the automated test suite (49 unit and integration tests) using the Maven Wrapper:
```bash
cd backend
.\mvnw.cmd test
```

### Step 3: Start Backend Server
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
*The Spring Boot server will start on port `8080`.*

---

### Step 4: Install & Run Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*The Vite application will start on `http://localhost:5173`. Requests to `/api` are automatically proxied to `http://localhost:8080`.*

To build production assets:
```bash
cd frontend
npm run build
```

---

## 🧪 9. Automated Testing Coverage
- **Total Backend Tests:** **49** (0 failures, 0 errors, 0 skipped).
- **Test Categories:**
  - MockMvc Integration tests for all controllers (`AuthController`, `TaskController`, `FocusSessionController`, `DashboardController`, `InsightsController`).
  - Unit tests for services (`AuthService`, `TaskService`, `FocusSessionService`, `DashboardService`, `InsightsService`).
  - Validation tests verifying bad credentials, invalid passwords, unauthorized access, and cross-user data isolation.

---

## 🎓 10. Viva Quick Reference
For detailed explanations of 15 key academic viva questions, see `PROJECT_NOTES.md`.
