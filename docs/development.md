# Development Guide

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local installation or Atlas account)

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd productivity-app

# Install all dependencies (root + server + client)
npm run setup

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start development servers
npm run dev
```

This runs:
- **Express API** on `http://localhost:5000` (with `--watch` for auto-reload)
- **Vite dev server** on `http://localhost:5173` (with HMR)
- Vite proxies `/api/*` requests to the Express server

## Project Structure

```
productivity-app/
├── server/
│   ├── package.json          # Server dependencies & scripts
│   └── src/
│       ├── controllers/      # Request handlers (business logic)
│       │   ├── authController.js
│       │   ├── todoController.js
│       │   ├── projectController.js
│       │   ├── tagController.js
│       │   ├── habitController.js
│       │   ├── goalController.js
│       │   ├── noteController.js
│       │   ├── templateController.js
│       │   ├── settingsController.js
│       │   ├── searchController.js
│       │   ├── statsController.js
│       │   ├── activityController.js
│       │   └── notificationController.js
│       ├── middleware/
│       │   └── auth.js       # JWT auth middleware
│       ├── models/           # Mongoose schemas
│       │   ├── User.js
│       │   ├── Todo.js
│       │   ├── Project.js
│       │   ├── Tag.js
│       │   ├── Habit.js
│       │   ├── Goal.js
│       │   ├── Note.js
│       │   ├── Template.js
│       │   ├── Activity.js
│       │   └── Notification.js
│       ├── routes/           # Express route definitions
│       ├── utils/
│       │   └── helpers.js    # parseNaturalLanguage, date utils
│       └── index.js          # App entry, middleware, DB connection
├── client/
│   ├── package.json          # Client dependencies & scripts
│   ├── vite.config.js        # Vite configuration
│   ├── vitest.config.js      # Test configuration
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── postcss.config.js     # PostCSS config
│   └── src/
│       ├── components/       # Reusable React components
│       │   ├── todo/         # TodoItem, TodoList, TodoDetail, QuickAdd, BulkActions
│       │   ├── layout/       # Layout, Sidebar, Header
│       │   ├── common/       # Modal, EmptyState, CommandPalette
│       │   ├── search/       # SearchModal
│       │   └── focus/        # FocusMode
│       ├── pages/            # Route-level page components
│       ├── stores/           # Zustand state stores
│       ├── utils/
│       │   └── api.js        # API client singleton
│       ├── App.jsx           # Root component with React Router
│       └── main.jsx          # Entry point
├── docs/                     # Documentation
├── .github/                  # GitHub config
├── package.json              # Root scripts (dev, build, test)
└── .env.example              # Environment variable template
```

## Adding a New API Endpoint

1. **Define the model** (if needed) in `server/src/models/`:
   ```js
   import mongoose from 'mongoose';
   const mySchema = new mongoose.Schema({ ... });
   export default mongoose.model('MyModel', mySchema);
   ```

2. **Create the controller** in `server/src/controllers/`:
   ```js
   export const myEndpoint = async (req, res) => {
     try {
       // Business logic
       res.json({ data: result });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Define routes** in `server/src/routes/`:
   ```js
   import { Router } from 'express';
   import { auth } from '../middleware/auth.js';
   import { myEndpoint } from '../controllers/myController.js';
   const router = Router();
   router.use(auth);
   router.get('/', myEndpoint);
   export default router;
   ```

4. **Mount the route** in `server/src/index.js`:
   ```js
   import myRoutes from './routes/myRoutes.js';
   app.use('/api/myresource', myRoutes);
   ```

## Adding a New Page

1. Create the component in `client/src/pages/`:
   ```jsx
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

2. Add the route in `client/src/App.jsx`:
   ```jsx
   import MyPage from './pages/MyPage';
   // In the Routes component:
   <Route path="/my-page" element={<MyPage />} />
   ```

3. Add navigation in `client/src/components/layout/Sidebar.jsx` if needed.

## State Management

TaskFlow uses Zustand for state management. Each store is in `client/src/stores/`:

```js
import { create } from 'zustand';
import api from '../utils/api';

const useMyStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    const data = await api.get('/myresource');
    set({ items: data.items, loading: false });
  },

  addItem: async (item) => {
    const data = await api.post('/myresource', item);
    set((state) => ({ items: [...state.items, data.item] }));
  }
}));

export default useMyStore;
```

## Testing

### Server Tests

Server tests use Jest and Supertest with an in-memory MongoDB instance:

```bash
cd server
npm test
```

Tests are in `server/src/__tests__/api.test.js`. They:
- Spin up a `mongodb-memory-server` before all tests
- Create isolated test users per test suite
- Test all CRUD operations, auth, and edge cases
- Clean up the database between tests

### Client Tests

Client tests use Vitest with jsdom:

```bash
cd client
npm test           # Run once
npm run test:watch # Watch mode
```

Tests are in `client/src/__tests__/`. They test:
- Utility functions (parseNaturalLanguage, date helpers, formatDuration)
- API client methods (GET, POST, PUT, DELETE, auth handling, CSV responses)

### Running All Tests

```bash
npm test           # Server tests only
npm run test:client # Client tests only
```

## Code Conventions

### Server
- ES modules (`import`/`export`) — `"type": "module"` in package.json
- Async/await for all database operations
- Consistent error handling with try/catch and `res.status(5xx).json({ error })`
- Soft deletes for user data (set `deletedAt` instead of removing)
- Activity logging for all mutations

### Client
- Functional components with hooks
- Zustand for state (no Redux)
- Tailwind CSS for styling (utility classes)
- Lucide React for icons
- date-fns for date formatting
- No inline styles; use Tailwind classes

## Linting

```bash
npm run lint       # ESLint on client code
```

The ESLint config enforces:
- React hooks rules
- No unused imports
- Consistent code style

## Common Patterns

### Adding a Filter to Todo List

1. Add query parameter handling in `todoController.js` `getTodos`
2. Add the filter UI component in the client
3. Pass the filter value through the Zustand store

### Creating a Modal

Use the existing `Modal` component:
```jsx
import Modal from '../components/common/Modal';

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="My Modal">
  <div>Modal content</div>
</Modal>
```

### Using the Command Palette

The CommandPalette component listens for `Ctrl+K` / `Cmd+K` and provides a searchable action list. Actions are defined in the component.
