# Architecture Overview

## System Architecture

TaskFlow follows a classic monorepo structure with a separated client and server:

```
┌─────────────────────────────────────────────────┐
│                   Client (React)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Pages   │  │Components│  │  Zustand      │ │
│  │          │  │          │  │  Stores       │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       └──────────────┼────────────────┘         │
│                ┌─────┴─────┐                    │
│                │  API      │                    │
│                │  Client   │                    │
│                └─────┬─────┘                    │
└──────────────────────┼──────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────┼──────────────────────────┐
│                ┌─────┴─────┐                    │
│                │  Express  │                    │
│                │  Server   │                    │
│                └─────┬─────┘                    │
│         ┌────────────┼────────────┐             │
│    ┌────┴────┐  ┌────┴────┐  ┌───┴────┐       │
│    │ Routes  │  │Middleware│  │Controllers│      │
│    └────┬────┘  └─────────┘  └────┬────┘       │
│         └────────────┬────────────┘             │
│                ┌─────┴─────┐                    │
│                │  Models   │                    │
│                │ (Mongoose)│                    │
│                └─────┬─────┘                    │
└──────────────────────┼──────────────────────────┘
                       │
                ┌──────┴──────┐
                │   MongoDB   │
                └─────────────┘
```

## Server Architecture

### Entry Point (`server/src/index.js`)

The Express application initializes middleware in this order:

1. **Security** — Helmet (HTTP headers), compression, morgan (logging)
2. **Rate Limiting** — 1000 req/15min on `/api/*`
3. **CORS** — Configurable origin
4. **Body Parsing** — JSON (10MB limit), URL-encoded
5. **Routes** — 13 route modules mounted at `/api/*`
6. **Health Check** — `GET /api/health`
7. **Static Serving** — In production, serves the built React client
8. **Error Handler** — Catches unhandled errors

### Request Flow

```
Request → Middleware (auth) → Route → Controller → Model → MongoDB → Response
```

### Middleware

- **`auth.js`** — JWT verification. Extracts token from `Authorization: Bearer <token>`, verifies with `jsonwebtoken`, loads user from MongoDB, attaches `req.user` and `req.userId`.

### Controllers

Each resource has a dedicated controller:

| Controller | Responsibility |
|-----------|----------------|
| `authController` | Registration, login, profile management |
| `todoController` | Full CRUD, My Day, trash, bulk ops, NL parsing |
| `projectController` | CRUD, sections, archive, stats |
| `tagController` | CRUD with cascading updates to todos |
| `habitController` | CRUD, daily log toggle, 30-day stats |
| `goalController` | CRUD, milestones with completion tracking |
| `noteController` | CRUD with project/task linking |
| `templateController` | CRUD, generate todos from template |
| `settingsController` | User preferences read/write |
| `searchController` | Full-text search with operators, import/export |
| `statsController` | Dashboard overview, analytics aggregation |
| `activityController` | Activity log with pagination |
| `notificationController` | Notifications, read management |

### Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | email, password (select:false), theme, accentColor, timezone, notifications | Password never returned by default |
| `Todo` | title, priority (1-4), status, projectId, tags[], dueDate, subtasks[], checklist[], isMyDay, isImportant | Compound indexes for performance |
| `Project` | name, status, sections[], color, icon | Virtual `progress` field |
| `Tag` | name, color, count | Auto-managed count via todo operations |
| `Habit` | name, frequency, logs[], currentStreak, longestStreak | Toggle-based logging |
| `Goal` | title, progress, milestones[], linkedTasks[] | Soft delete |
| `Note` | title, content, projectId, todoId, tags[] | Pinnable, archivable |
| `Template` | name, items[], tags[], category | Items contain subtasks and checklists |
| `Activity` | action, entityType, entityId, details | Audit trail for all mutations |
| `Notification` | type, title, message, isRead | Types: reminder, overdue, suggestion, system, habit, daily-planning |

### Natural Language Parser (`utils/helpers.js`)

The `parseNaturalLanguage` function extracts structured data from free-text input:

- **Priority:** `p1`-`p4`, `urgent`, `high/medium/low priority`
- **Tags:** `#tag` or `@tag`
- **Dates:** `today`, `tomorrow`, `next monday`, `in 3 days`, `on the 15th`, `MM/DD`
- **Times:** `at 5pm`, `3:30pm`, `17:00`
- **Recurrence:** `daily`, `every week`, `weekly`, `monthly`

## Client Architecture

### Technology Choices

- **React 18** — Component-based UI with hooks
- **Vite** — Fast dev server and bundler with HMR
- **Zustand** — Lightweight state management (no boilerplate)
- **React Router v6** — Client-side routing
- **Tailwind CSS** — Utility-first CSS framework
- **Recharts** — Declarative charting for analytics
- **Lucide React** — Consistent icon library
- **date-fns** — Lightweight date manipulation
- **@dnd-kit** — Drag-and-drop for reordering

### State Management (Zustand Stores)

```
stores/
├── authStore.js      # User auth state, token management
├── todoStore.js      # Todo CRUD, filtering, My Day
├── projectStore.js   # Project state, sections
└── uiStore.js        # Theme, sidebar, modals, command palette
```

Each store encapsulates:
- State variables
- Actions (async API calls + state updates)
- Derived selectors

### Component Structure

```
components/
├── todo/
│   ├── TodoItem.jsx      # Single todo row
│   ├── TodoList.jsx      # Filtered/sorted list
│   ├── TodoDetail.jsx    # Detail panel / side view
│   ├── QuickAdd.jsx      # Quick-add input bar
│   └── BulkActions.jsx   # Multi-select actions
├── layout/
│   ├── Layout.jsx        # App shell
│   ├── Sidebar.jsx       # Navigation sidebar
│   └── Header.jsx        # Top bar
├── common/
│   ├── Modal.jsx         # Reusable modal
│   ├── EmptyState.jsx    # Empty state illustrations
│   └── CommandPalette.jsx # Keyboard command palette (Ctrl+K)
├── search/
│   └── SearchModal.jsx   # Search overlay
└── focus/
    └── FocusMode.jsx     # Distraction-free mode
```

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `Inbox` | `/` | Default task list |
| `MyDay` | `/my-day` | Daily planner |
| `Important` | `/important` | High-priority tasks |
| `Upcoming` | `/upcoming` | Due date timeline |
| `Completed` | `/completed` | Completed tasks |
| `Calendar` | `/calendar` | Calendar view |
| `Kanban` | `/kanban` | Kanban board |
| `Projects` | `/projects` | Project list |
| `ProjectDetail` | `/projects/:id` | Single project view |
| `Habits` | `/habits` | Habit tracker |
| `Goals` | `/goals` | Goals & milestones |
| `Notes` | `/notes` | Notes |
| `Analytics` | `/analytics` | Dashboard & charts |
| `Settings` | `/settings` | User preferences |
| `Trash` | `/trash` | Deleted items |
| `Login` | `/login` | Authentication |
| `Register` | `/register` | Registration |

### API Client (`utils/api.js`)

A singleton `ApiClient` class that:
- Automatically attaches the JWT token from localStorage
- Handles 401 responses by clearing the token and redirecting to `/login`
- Supports CSV blob responses for export
- Provides `get()`, `post()`, `put()`, `delete()` convenience methods
- All paths are prefixed with `/api`

## Data Flow

### Todo Creation (end-to-end)

```
1. User types in QuickAdd → parseNaturalLanguage() extracts metadata
2. todoStore.createTodo() → api.post('/todos', data)
3. Server: todoController.createTodo()
   a. Parse natural language if requested
   b. Calculate order (max + 1)
   c. Create Todo document
   d. Upsert Tag documents (increment count)
   e. Log Activity entry
   f. Return 201 with todo
4. Client receives response → updates todoStore state → UI re-renders
```

### Authentication Flow

```
1. User submits login form
2. api.post('/auth/login', { email, password })
3. Server: bcrypt.compare → jwt.sign → return token + user
4. Client: api.setToken(token) → localStorage.setItem('taskflow_token', token)
5. Subsequent requests: api.request() adds Authorization header
6. On 401: token cleared, redirect to /login
```

## Performance Considerations

- **Compound MongoDB indexes** on frequently queried field combinations (userId + status, userId + dueDate, etc.)
- **Text indexes** on Todo for full-text search
- **Pagination** on todo list and activity log (default limit: 100)
- **Compression** via the `compression` middleware
- **Virtuals** for computed fields (subtask progress, project completion)
- **Soft deletes** avoid expensive join operations for trash recovery
