# Copilot Instructions for Donezo

## Project Overview

Donezo is a full-stack productivity application with a React 18 frontend (Vite, Tailwind CSS, Zustand) and Express.js backend (Mongoose/MongoDB). It manages tasks, projects, habits, goals, notes, and templates.

## Architecture

- **Monorepo** with `server/` and `client/` directories
- **Server:** Express 4 + Mongoose 8, ES modules (`"type": "module"`)
- **Client:** React 18 + Vite + Tailwind CSS + Zustand + React Router v6
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT tokens with bcrypt password hashing

## Key Files

| File | Purpose |
|------|---------|
| `server/src/index.js` | Express app setup, middleware, route mounting, DB connection |
| `server/src/middleware/auth.js` | JWT verification, `req.userId` attachment |
| `server/src/controllers/*.js` | Business logic for each resource |
| `server/src/models/*.js` | Mongoose schemas and models |
| `server/src/utils/helpers.js` | `parseNaturalLanguage`, date utility functions |
| `client/src/utils/api.js` | Singleton API client with auth token management |
| `client/src/stores/*.js` | Zustand stores (auth, todo, project, ui) |
| `client/src/components/` | Reusable React components |
| `client/src/pages/` | Route-level page components |
| `client/src/App.jsx` | React Router configuration |

## Code Conventions

### Server (Express/Mongoose)
- Use ES module syntax (`import`/`export`)
- All route handlers are `async` functions wrapped in try/catch
- Authentication: use the `auth` middleware from `middleware/auth.js`; access user via `req.userId`
- Respond with `res.status(201).json({ resource })` for creates, `res.json({ resource })` for reads/updates
- Use `res.status(400).json({ error: 'message' })` for validation errors
- Use `res.status(404).json({ error: 'Not found' })` for missing resources
- Soft deletes: set `deletedAt` field instead of removing documents
- Log activity for mutations via `Activity.create()`
- Always scope queries to `userId: req.userId` for data isolation

### Client (React/Zustand/Tailwind)
- Functional components with hooks (no class components)
- Zustand for state management (stores in `stores/` directory)
- Tailwind CSS utility classes for styling (no inline styles, no CSS modules)
- Lucide React for icons (consistent icon set)
- date-fns for date formatting and manipulation
- Import `api` from `../utils/api` for all API calls
- Use React Router v6 for navigation
- Toast notifications via `react-hot-toast`

### Database Patterns
- Compound indexes on `userId + <frequently-queried-field>` for performance
- Virtual fields for computed values (e.g., subtask progress)
- `timestamps: true` on all schemas for `createdAt`/`updatedAt`
- Text indexes on Todo for full-text search
- Schema-level defaults for all optional fields

## Common Tasks

### Adding a new API endpoint
1. Create or update the model in `server/src/models/`
2. Add controller functions in `server/src/controllers/`
3. Define routes in `server/src/routes/`
4. Mount in `server/src/index.js`
5. All endpoints under `/api/` require auth middleware unless explicitly public

### Adding a new page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.jsx`
3. Add sidebar navigation in `client/src/components/layout/Sidebar.jsx`

### Modifying state management
- Edit the relevant Zustand store in `client/src/stores/`
- Stores expose actions (async functions) and state
- Use `useStoreName` hook pattern for components

## Testing

- **Server:** Jest + Supertest with mongodb-memory-server (`npm test` in `server/`)
- **Client:** Vitest with jsdom (`npm test` in `client/`)
- Run tests before committing changes

## Important Notes

- Never log or expose JWT_SECRET or database credentials
- The `auth` middleware must be applied to all protected routes
- All database queries must be scoped to the authenticated user's `userId`
- Use soft deletes (`deletedAt`) for user data; hard delete only for habits, tags, and templates
- The `parseNaturalLanguage` function is shared logic between server and client; keep them in sync
