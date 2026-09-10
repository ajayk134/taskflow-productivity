# Donezo

A premium personal productivity platform built with React and Express. Manage tasks, projects, habits, goals, and notes in one beautifully designed application.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-8+-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Smart Task Management** — Create, organize, and track tasks with priorities, due dates, subtasks, checklists, and natural language input
- **Projects & Kanban** — Organize work into projects with custom sections and kanban board views
- **My Day** — Daily planning with AI-suggested tasks, overdue items, and drag-to-reorder
- **Habits & Streaks** — Track daily habits with completion logging, streak tracking, and 30-day stats
- **Goals & Milestones** — Set long-term goals with milestones and progress tracking
- **Notes** — Quick notes linked to projects or tasks, with pinning and archiving
- **Templates** — Reusable task templates to speed up repetitive workflows
- **Tags & Search** — Full-text search with operator syntax (`priority:urgent`, `status:inbox`, `due:today`)
- **Analytics Dashboard** — Visualize productivity with completion charts, priority breakdowns, and streak data
- **Focus Mode** — Distraction-free mode for deep work sessions
- **Command Palette** — Keyboard-driven quick actions (Ctrl+K)
- **Import & Export** — JSON backup and CSV export for data portability
- **Dark Mode** — Light, dark, and system theme support with customizable accent colors

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router, Recharts, Lucide Icons |
| Backend | Express 4, Node.js 18+, Mongoose 8 |
| Database | MongoDB (Atlas or local) |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Security | Helmet, CORS, Rate Limiting, compression |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
git clone <your-repo-url>
cd productivity-app
npm run setup
```

This installs dependencies for both server and client.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NODE_ENV` | `development` or `production` | No (default: `development`) |
| `PORT` | Server port | No (default: `5000`) |
| `CORS_ORIGIN` | Allowed CORS origin | No (default: `*`) |

### Development

```bash
npm run dev
```

Runs both the Express server (`:5000`) and Vite dev server (`:5173`) concurrently. The Vite dev server proxies `/api` requests to the Express backend.

### Running Tests

```bash
# Server tests (Jest + Supertest, requires MongoDB)
cd server && npm test

# Client tests (Vitest)
cd client && npm test

# Root-level shorthand
npm test          # server tests
npm run test:client  # client tests
```

### Production Build

```bash
npm run build     # builds the React client
npm start         # starts the Express server (serves built client)
```

## Architecture

```
productivity-app/
├── server/
│   └── src/
│       ├── controllers/    # Route handlers (business logic)
│       ├── middleware/      # Auth middleware, error handling
│       ├── models/         # Mongoose schemas & models
│       ├── routes/         # Express route definitions
│       ├── utils/          # Helpers (parseNaturalLanguage, date utils)
│       └── index.js        # App entry point
├── client/
│   └── src/
│       ├── components/     # React components (todo, layout, common, search, focus)
│       ├── pages/          # Route page components
│       ├── stores/         # Zustand state stores
│       ├── utils/          # API client
│       ├── App.jsx         # Root component with routing
│       └── main.jsx        # Entry point
├── docs/                   # Documentation
└── .github/                # CI/CD and Copilot instructions
```

See [docs/architecture.md](docs/architecture.md) for the full architecture overview.

## API Documentation

All endpoints are prefixed with `/api`. Authenticated endpoints require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new account |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/auth/profile` | Get current user profile |
| `PUT` | `/api/auth/profile` | Update profile |

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/todos` | Create a todo |
| `GET` | `/api/todos` | List todos (filterable) |
| `GET` | `/api/todos/:id` | Get a single todo |
| `PUT` | `/api/todos/:id` | Update a todo |
| `DELETE` | `/api/todos/:id` | Soft-delete (trash) |
| `POST` | `/api/todos/:id/restore` | Restore from trash |
| `POST` | `/api/todos/:id/permanent-delete` | Permanently delete |
| `POST` | `/api/todos/:id/duplicate` | Duplicate a todo |
| `POST` | `/api/todos/:id/archive` | Archive a todo |
| `POST` | `/api/todos/:id/snooze` | Snooze a todo |
| `POST` | `/api/todos/bulk-update` | Bulk update todos |
| `POST` | `/api/todos/bulk-delete` | Bulk soft-delete todos |
| `GET` | `/api/todos/my-day` | Get My Day view |
| `POST` | `/api/todos/my-day/reorder` | Reorder My Day |
| `GET` | `/api/todos/trash` | List trashed todos |
| `POST` | `/api/todos/trash/empty` | Empty trash |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/projects/:id` | Get a project with stats |
| `PUT` | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Soft-delete a project |
| `POST` | `/api/projects/:id/archive` | Archive a project |
| `POST` | `/api/projects/:id/sections` | Add a section |
| `PUT` | `/api/projects/:id/sections/:sectionId` | Update a section |
| `DELETE` | `/api/projects/:id/sections/:sectionId` | Delete a section |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tags` | Create a tag |
| `GET` | `/api/tags` | List all tags |
| `PUT` | `/api/tags/:id` | Update a tag |
| `DELETE` | `/api/tags/:id` | Delete a tag (removes from todos) |

### Habits

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/habits` | Create a habit |
| `GET` | `/api/habits` | List habits |
| `PUT` | `/api/habits/:id` | Update a habit |
| `DELETE` | `/api/habits/:id` | Delete a habit |
| `POST` | `/api/habits/:id/log` | Log/toggle completion for today |
| `GET` | `/api/habits/:id/stats` | Get habit stats (30-day) |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/goals` | Create a goal |
| `GET` | `/api/goals` | List goals |
| `PUT` | `/api/goals/:id` | Update a goal |
| `DELETE` | `/api/goals/:id` | Soft-delete a goal |
| `POST` | `/api/goals/:id/milestones` | Add a milestone |
| `PUT` | `/api/goals/:id/milestones/:milestoneId` | Update a milestone |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/notes` | Create a note |
| `GET` | `/api/notes` | List notes (filterable) |
| `PUT` | `/api/notes/:id` | Update a note |
| `DELETE` | `/api/notes/:id` | Soft-delete a note |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/templates` | Create a template |
| `GET` | `/api/templates` | List templates |
| `PUT` | `/api/templates/:id` | Update a template |
| `DELETE` | `/api/templates/:id` | Delete a template |
| `POST` | `/api/templates/:id/create-todos` | Create todos from template |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get user settings |
| `PUT` | `/api/settings` | Update user settings |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity` | Get activity log |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | List notifications |
| `POST` | `/api/notifications/:id/read` | Mark as read |
| `POST` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Delete a notification |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats/dashboard` | Dashboard overview |
| `GET` | `/api/stats/analytics` | Detailed analytics |

### Search & Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=...` | Search todos (supports operators) |
| `GET` | `/api/search/export` | Export all data as JSON |
| `GET` | `/api/search/export/csv` | Export todos as CSV |
| `POST` | `/api/search/import` | Import data from JSON |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (unauthenticated) |

See [docs/api.md](docs/api.md) for detailed request/response schemas.

## Deployment (Render)

1. Push your repo to GitHub
2. Create a **Web Service** on [Render](https://render.com):
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node 18+
3. Add environment variables in Render dashboard:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random secret
   - `NODE_ENV` — `production`
   - `CORS_ORIGIN` — your Render service URL
4. Deploy. The Express server serves the built React client in production.

See [docs/deployment.md](docs/deployment.md) for the complete deployment guide.

## Security

- **Helmet** — Sets secure HTTP headers
- **Rate Limiting** — 1000 requests per 15 minutes per IP on `/api/*`
- **JWT Auth** — Token-based authentication with bcrypt password hashing (12 rounds)
- **CORS** — Configurable origin allowlist
- **Input Validation** — Server-side validation on all endpoints
- **Soft Deletes** — Todos, projects, goals, and notes use soft deletes for data recovery
- **Environment Variables** — Secrets are never committed; `.env` is gitignored

## License

MIT
