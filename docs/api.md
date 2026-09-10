# API Documentation

Base URL: `http://localhost:5000/api` (development) or `https://your-app.onrender.com/api` (production)

All authenticated endpoints require the `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "Jane Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "name": "Jane Doe",
    "theme": "system",
    "accentColor": "#6366f1"
  }
}
```

**Errors:**
- `400` — Missing required fields
- `409` — Email already registered

---

### POST /api/auth/login

Log in with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "name": "Jane Doe",
    "theme": "system",
    "accentColor": "#6366f1"
  }
}
```

**Errors:**
- `400` — Missing email or password
- `401` — Invalid credentials

---

### GET /api/auth/profile

Get the current authenticated user's profile.

**Response (200):**
```json
{
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "email": "user@example.com",
    "name": "Jane Doe",
    "theme": "system",
    "accentColor": "#6366f1",
    "timezone": "UTC",
    "dateFormat": "MMM dd, yyyy",
    "defaultView": "list",
    "weekStartsOn": 1,
    "notifications": {
      "reminders": true,
      "overdue": true,
      "dailyPlanning": false,
      "habitReminder": true
    },
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### PUT /api/auth/profile

Update user profile fields.

**Request Body:**
```json
{
  "name": "New Name",
  "theme": "dark",
  "accentColor": "#10b981"
}
```

**Response (200):** Returns updated user object.

---

## Todos

### POST /api/todos

Create a new todo.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": 2,
  "status": "inbox",
  "dueDate": "2026-01-20T00:00:00.000Z",
  "dueTime": "14:00",
  "tags": ["errands", "personal"],
  "projectId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "isMyDay": true,
  "isImportant": false,
  "subtasks": [
    { "title": "Check pantry" }
  ],
  "checklist": [
    { "text": "Milk", "order": 0 },
    { "text": "Eggs", "order": 1 }
  ],
  "recurrence": {
    "type": "weekly",
    "interval": 1
  },
  "estimatedDuration": 30,
  "parseNaturalLanguage": true
}
```

**Natural Language Example:**
```json
{
  "title": "Team standup tomorrow at 9am #work p2",
  "parseNaturalLanguage": true
}
```
This creates a todo with title "Team standup", due date tomorrow, due time 09:00, tag "work", priority 2.

**Response (201):** Returns the created todo with `_id`, `createdAt`, computed `order`.

**Errors:**
- `400` — Title is required

---

### GET /api/todos

List todos with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `inbox`, `planned`, `next`, `in-progress`, `waiting`, `blocked`, `completed`, `archived` |
| `projectId` | string | Filter by project ID |
| `tag` | string | Filter by tag name (comma-separated for multiple) |
| `priority` | number | Filter by priority (1-4) |
| `category` | string | Filter by category |
| `search` | string | Text search across title, description, notes |
| `sort` | string | Sort by: `dueDate`, `priority`, `title`, `created`, `completed` (default: pinned first, then order, then created) |
| `dueBefore` | ISO date | Only todos due before this date |
| `dueAfter` | ISO date | Only todos due after this date |
| `isMyDay` | boolean | Filter My Day todos |
| `isImportant` | boolean | Filter important todos |
| `isFavorite` | boolean | Filter favorite todos |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 100) |

**Response (200):**
```json
{
  "todos": [{ ... }],
  "total": 42,
  "page": 1,
  "pages": 1
}
```

---

### GET /api/todos/:id

Get a single todo by ID.

**Response (200):**
```json
{
  "todo": {
    "_id": "...",
    "title": "Buy groceries",
    "subtaskProgress": { "completed": 1, "total": 3 },
    "checklistProgress": { "checked": 2, "total": 5 },
    ...
  }
}
```

---

### PUT /api/todos/:id

Update a todo. Changing status to `completed` sets `completedAt`. Reopening clears it. Tag changes update tag counts.

**Request Body:** Partial update with any fields to change.

**Response (200):** Returns updated todo.

---

### DELETE /api/todos/:id

Soft-delete a todo (moves to trash by setting `deletedAt`).

**Response (200):**
```json
{ "message": "Todo moved to trash", "todoId": "..." }
```

---

### POST /api/todos/:id/restore

Restore a soft-deleted todo.

**Response (200):** Returns restored todo with `deletedAt: null`.

---

### POST /api/todos/:id/permanent-delete

Permanently remove a todo from the database.

**Response (200):**
```json
{ "message": "Todo permanently deleted" }
```

---

### POST /api/todos/:id/duplicate

Create a copy of a todo with title " (copy)" suffix, status reset to `inbox`.

**Response (201):** Returns the duplicated todo.

---

### POST /api/todos/:id/archive

Set todo status to `archived`.

**Response (200):**
```json
{ "message": "Todo archived" }
```

---

### POST /api/todos/:id/snooze

Postpone a todo by updating its due date.

**Request Body:**
```json
{ "until": "2026-01-22T00:00:00.000Z" }
```

**Response (200):**
```json
{ "message": "Todo snoozed", "until": "2026-01-22T00:00:00.000Z" }
```

---

### POST /api/todos/bulk-update

Update multiple todos at once.

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3"],
  "updates": { "priority": 1, "status": "in-progress" }
}
```

**Response (200):**
```json
{ "updated": 3 }
```

---

### POST /api/todos/bulk-delete

Soft-delete multiple todos.

**Request Body:**
```json
{ "ids": ["id1", "id2"] }
```

**Response (200):**
```json
{ "deleted": 2 }
```

---

### GET /api/todos/my-day

Get the My Day view with categorized tasks.

**Response (200):**
```json
{
  "myDay": [{ ... }],
  "overdue": [{ ... }],
  "today": [{ ... }],
  "suggested": [{ ... }],
  "unfinishedYesterday": [{ ... }]
}
```

---

### POST /api/todos/my-day/reorder

Reorder My Day tasks.

**Request Body:**
```json
{ "orderedIds": ["id3", "id1", "id2"] }
```

---

### GET /api/todos/trash

List all soft-deleted todos, sorted by deletion date.

**Response (200):**
```json
{ "todos": [{ ... }] }
```

---

### POST /api/todos/trash/empty

Permanently delete all trashed todos.

**Response (200):**
```json
{ "deleted": 5 }
```

---

## Projects

### POST /api/projects

Create a project with optional sections (defaults: To Do, In Progress, Done).

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Modernize the company website",
  "icon": "🌐",
  "color": "#3b82f6",
  "status": "active",
  "startDate": "2026-01-15",
  "targetDate": "2026-06-01",
  "sections": [
    { "name": "Backlog", "order": 0 },
    { "name": "In Progress", "order": 1 },
    { "name": "Review", "order": 2 },
    { "name": "Done", "order": 3 }
  ]
}
```

---

### GET /api/projects

List projects. Use `?includeStats=true` to include `totalTodos`, `completedTodos`, and `progress` fields.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `active`, `on-hold`, `completed`, `archived` |
| `includeStats` | boolean | Include todo counts and progress percentage |

---

### GET /api/projects/:id

Get a single project with stats (totalTodos, completedTodos, progress).

---

### PUT /api/projects/:id

Update project fields.

---

### DELETE /api/projects/:id

Soft-delete project. All associated todos are moved to inbox.

---

### POST /api/projects/:id/archive

Archive a project (sets status to `archived`).

---

### POST /api/projects/:id/sections

Add a section to a project.

**Request Body:** `{ "name": "New Section" }`

---

### PUT /api/projects/:id/sections/:sectionId

Update a section's name, order, or color.

---

### DELETE /api/projects/:id/sections/:sectionId

Remove a section from a project.

---

## Tags

### POST /api/tags

Create or get an existing tag (upsert by name).

**Request Body:**
```json
{ "name": "work", "color": "#ef4444" }
```

---

### GET /api/tags

List all tags sorted by name, with usage count.

---

### PUT /api/tags/:id

Update tag color or name. Renaming a tag updates it across all todos.

---

### DELETE /api/tags/:id

Delete a tag and remove it from all associated todos.

---

## Habits

### POST /api/habits

Create a habit.

**Request Body:**
```json
{
  "name": "Meditate",
  "icon": "🧘",
  "color": "#10b981",
  "frequency": "daily",
  "targetDays": [1, 2, 3, 4, 5],
  "targetCount": 1
}
```

---

### GET /api/habits

List habits. Use `?includeArchived=true` to include archived habits.

---

### PUT /api/habits/:id

Update habit fields.

---

### DELETE /api/habits/:id

Permanently delete a habit.

---

### POST /api/habits/:id/log

Toggle today's completion. If already logged today, removes the log and decrements streak. Otherwise, adds a log and increments streak.

**Request Body:**
```json
{ "notes": "Felt great today" }
```

**Response (200):**
```json
{
  "habit": {
    "_id": "...",
    "currentStreak": 5,
    "longestStreak": 12,
    "logs": [...]
  }
}
```

---

### GET /api/habits/:id/stats

Get 30-day statistics for a habit.

**Response (200):**
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "completionRate": 73,
  "completedDays": 22,
  "monthlyData": [
    { "date": "2026-01-01", "completed": true },
    { "date": "2026-01-02", "completed": false },
    ...
  ]
}
```

---

## Goals

### POST /api/goals

**Request Body:**
```json
{
  "title": "Run a marathon",
  "description": "Complete a full marathon by December",
  "color": "#f59e0b",
  "icon": "🎯",
  "targetDate": "2026-12-31",
  "category": "fitness"
}
```

---

### GET /api/goals

List goals. Filter with `?status=active|completed|paused|abandoned`.

---

### PUT /api/goals/:id

Update goal fields including `progress` (0-100) and `status`.

---

### DELETE /api/goals/:id

Soft-delete a goal.

---

### POST /api/goals/:id/milestones

Add a milestone to a goal.

**Request Body:**
```json
{
  "name": "Run a 5K",
  "targetDate": "2026-03-01"
}
```

---

### PUT /api/goals/:id/milestones/:milestoneId

Update a milestone. Setting `completed: true` auto-sets `completedAt`.

---

## Notes

### POST /api/notes

**Request Body:**
```json
{
  "title": "Meeting Notes",
  "content": "Discussed Q2 roadmap...",
  "projectId": "...",
  "todoId": "...",
  "tags": ["meetings"],
  "isPinned": true,
  "color": "#dbeafe"
}
```

---

### GET /api/notes

List notes. Query parameters: `projectId`, `todoId`, `search`, `isArchived`. Pinned notes sort first.

---

### PUT /api/notes/:id

Update note fields.

---

### DELETE /api/notes/:id

Soft-delete a note.

---

## Templates

### POST /api/templates

**Request Body:**
```json
{
  "name": "Morning Routine",
  "description": "Daily morning checklist",
  "icon": "☀️",
  "items": [
    {
      "title": "Meditate",
      "priority": 3,
      "estimatedDuration": 15,
      "subtasks": [{ "title": "Find quiet spot" }],
      "checklist": [{ "text": "10 minutes" }]
    },
    {
      "title": "Exercise",
      "priority": 2,
      "estimatedDuration": 30
    }
  ],
  "tags": ["routine", "health"],
  "category": "daily"
}
```

---

### GET /api/templates

List all templates.

---

### PUT /api/templates/:id

Update template fields.

---

### DELETE /api/templates/:id

Delete a template.

---

### POST /api/templates/:id/create-todos

Generate todos from a template.

**Request Body:**
```json
{ "projectId": "optional-project-id" }
```

**Response (201):**
```json
{
  "todos": [
    { "_id": "...", "title": "Meditate", "templateId": "...", ... },
    { "_id": "...", "title": "Exercise", "templateId": "...", ... }
  ]
}
```

---

## Settings

### GET /api/settings

**Response (200):**
```json
{
  "settings": {
    "theme": "dark",
    "accentColor": "#10b981",
    "timezone": "America/New_York",
    "dateFormat": "MMM dd, yyyy",
    "defaultView": "list",
    "weekStartsOn": 1,
    "notifications": {
      "reminders": true,
      "overdue": true,
      "dailyPlanning": false,
      "habitReminder": true
    },
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### PUT /api/settings

Update any user preference field.

---

## Activity

### GET /api/activity

Get the user's activity audit trail.

**Query Parameters:** `entityType`, `entityId`, `page` (default 1), `limit` (default 50)

**Response (200):**
```json
{
  "activities": [
    {
      "action": "created",
      "entityType": "todo",
      "entityId": "...",
      "entityTitle": "Buy groceries",
      "details": {},
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "total": 150,
  "page": 1
}
```

---

## Notifications

### GET /api/notifications

List notifications. Use `?unreadOnly=true` for unread only.

**Response (200):**
```json
{
  "notifications": [{ ... }],
  "unreadCount": 3
}
```

---

### POST /api/notifications/:id/read

Mark a single notification as read.

---

### POST /api/notifications/read-all

Mark all notifications as read.

---

### DELETE /api/notifications/:id

Delete a notification.

---

## Stats

### GET /api/stats/dashboard

Get dashboard overview data.

**Response (200):**
```json
{
  "overview": {
    "totalActive": 12,
    "todayTasks": 3,
    "overdueTasks": 2,
    "completedToday": 5,
    "completedThisWeek": 18,
    "completedThisMonth": 47,
    "completionRate": 29,
    "habitsCompletedToday": 3,
    "totalHabits": 6
  },
  "importantTasks": [...],
  "upcomingTasks": [...],
  "projects": [...],
  "goals": [...]
}
```

---

### GET /api/stats/analytics

Get detailed analytics data (30-day window).

**Response (200):**
```json
{
  "tasksByPriority": [
    { "priority": 1, "count": 10 },
    { "priority": 2, "count": 15 }
  ],
  "tasksByStatus": [
    { "status": "completed", "count": 47 },
    { "status": "inbox", "count": 8 }
  ],
  "completedByDay": [
    { "date": "2026-01-01", "count": 3 },
    ...
  ],
  "avgCompletionTimeHours": 24.5,
  "tasksByProject": [
    { "_id": "...", "count": 20 }
  ]
}
```

---

## Search & Data

### GET /api/search

Search todos with operators.

**Query Parameters:**
| Parameter | Example | Description |
|-----------|---------|-------------|
| `q` | `standup tomorrow #work` | Free text + operators |
| `priority` | `1` | Filter by priority |
| `status` | `in-progress` | Filter by status |
| `tag` | `work` | Filter by tag |
| `project` | `<projectId>` | Filter by project |
| `due` | `today`, `overdue`, `week` | Filter by due date |

**Supported operators in `q`:** `priority:urgent`, `status:inbox`, `due:today`, `due:overdue`, `due:week`, `tag:work`, `project:name`

**Response (200):**
```json
{ "todos": [...], "total": 5 }
```

---

### GET /api/search/export

Export all user data as a JSON backup file.

**Response:** JSON with `Content-Disposition: attachment` header.

```json
{
  "version": "1.0",
  "exportDate": "2026-01-15T10:30:00.000Z",
  "data": {
    "todos": [...],
    "projects": [...],
    "tags": [...],
    "habits": [...],
    "goals": [...],
    "templates": [...],
    "notes": [...]
  }
}
```

---

### GET /api/search/export/csv

Export todos as a CSV file.

**Response:** CSV with headers: Title, Status, Priority, Due Date, Project, Tags, Description, Created, Completed.

---

### POST /api/search/import

Import data from a JSON backup.

**Request Body:**
```json
{
  "data": {
    "todos": [...],
    "projects": [...],
    "tags": [...]
  },
  "overwrite": false
}
```

**Response (200):**
```json
{
  "message": "Import completed",
  "results": {
    "todos": 10,
    "projects": 2,
    "tags": 5,
    "habits": 0,
    "goals": 0
  }
}
```

---

## Health

### GET /api/health

Public health check endpoint (no authentication required).

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "uptime": 12345.678,
  "environment": "production"
}
```
