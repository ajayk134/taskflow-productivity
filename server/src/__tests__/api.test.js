import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

let mongod;
let app;
let server;

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const mod = await import('../index.js');
  app = mod.default;

  await new Promise((resolve) => setTimeout(resolve, 1000));
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongod) await mongod.stop();
}, 30000);

async function registerUser(overrides = {}) {
  const data = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User',
    ...overrides
  };
  const res = await request(app).post('/api/auth/register').send(data);
  return { res, ...data };
}

function authToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

// ─── Health ──────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeDefined();
    expect(res.body.environment).toBeDefined();
  });
});

// ─── Auth ────────────────────────────────────────────────

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'Password123!', name: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('new@example.com');
      expect(res.body.user.name).toBe('New User');
      expect(res.body.user.id).toBeDefined();
    });

    it('rejects duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'Password123!', name: 'First' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'Password123!', name: 'Second' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'x@x.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: 'Password123!', name: 'Login User' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('Profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const { res, email } = await registerUser({ email: `profile-${Date.now()}@example.com` });
      token = res.body.token;
      userId = res.body.user.id;
    });

    it('GET /api/auth/profile returns user', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBeDefined();
    });

    it('PUT /api/auth/profile updates user', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });
  });
});

// ─── Todos ───────────────────────────────────────────────

describe('Todos API', () => {
  let token;
  let todoId;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `todos-${Date.now()}@example.com` });
    token = res.body.token;
  });

  describe('POST /api/todos', () => {
    it('creates a todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Buy groceries' });

      expect(res.status).toBe(201);
      expect(res.body.todo.title).toBe('Buy groceries');
      expect(res.body.todo.status).toBe('inbox');
      todoId = res.body.todo._id;
    });

    it('rejects empty title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('creates todo with natural language parsing', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Meeting tomorrow at 3pm #work', parseNaturalLanguage: true });

      expect(res.status).toBe(201);
      expect(res.body.todo.tags).toContain('work');
      expect(res.body.todo.dueDate).toBeDefined();
    });

    it('creates a completed todo via boolean flag', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Already done', completed: true });

      expect(res.status).toBe(201);
      expect(res.body.todo.status).toBe('completed');
      expect(res.body.todo.completedAt).toBeDefined();
      expect(res.body.todo.completed).toBe(true);
    });

    it('normalizes status alias pending to inbox', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Alias status', status: 'pending' });

      expect(res.status).toBe(201);
      expect(res.body.todo.status).toBe('inbox');
    });

    it('rejects an invalid status', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad status', status: 'not-a-real-status' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/todos/parse', () => {
    it('parses natural language text', async () => {
      const res = await request(app)
        .post('/api/todos/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Plan launch p1 tomorrow #marketing' });

      expect(res.status).toBe(200);
      expect(res.body.parsed.priority).toBe(1);
      expect(res.body.parsed.tags).toContain('marketing');
      expect(res.body.parsed.dueDate).toBeTruthy();
    });

    it('rejects empty text', async () => {
      const res = await request(app)
        .post('/api/todos/parse')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: '   ' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/todos', () => {
    it('lists todos', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1' });

      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.todos)).toBe(true);
      expect(res.body.total).toBeDefined();
    });

    it('filters by status', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Inbox task' });

      const res = await request(app)
        .get('/api/todos?status=inbox')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.todos.forEach(t => expect(t.status).toBe('inbox'));
    });

    it('searches todos', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Unique searchable task' });

      const res = await request(app)
        .get('/api/todos?search=Unique')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.todos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('updates a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Update me' });

      const res = await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated title', priority: 1 });

      expect(res.status).toBe(200);
      expect(res.body.todo.title).toBe('Updated title');
      expect(res.body.todo.priority).toBe(1);
    });

    it('completes a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Complete me' });

      const res = await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.todo.status).toBe('completed');
      expect(res.body.todo.completedAt).toBeDefined();
      expect(res.body.todo.completed).toBe(true);
    });

    it('reopens a todo with completed: false', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Reopen me' });

      await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });

      const res = await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.todo.status).toBe('inbox');
      expect(res.body.todo.completedAt).toBeNull();
      expect(res.body.todo.completed).toBe(false);
    });

    it('accepts status alias in_progress', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Alias update' });

      const res = await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.todo.status).toBe('in-progress');
    });

    it('rejects an invalid status on update', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad update' });

      const res = await request(app)
        .put(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'bogus' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('soft-deletes a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Delete me' });

      const res = await request(app)
        .delete(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/trash/i);
      expect(res.body.todo).toBeDefined();
      expect(res.body.todo.deletedAt).toBeDefined();
    });
  });

  describe('POST /api/todos/:id/restore', () => {
    it('restores a deleted todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Restore me' });

      await request(app)
        .delete(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post(`/api/todos/${create.body.todo._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.todo.deletedAt).toBeNull();
    });
  });

  describe('POST /api/todos/:id/duplicate', () => {
    it('duplicates a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Duplicate me' });

      const res = await request(app)
        .post(`/api/todos/${create.body.todo._id}/duplicate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.todo.title).toContain('copy');
    });
  });

  describe('POST /api/todos/:id/archive', () => {
    it('archives a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Archive me' });

      const res = await request(app)
        .post(`/api/todos/${create.body.todo._id}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.todo).toBeDefined();
      expect(res.body.todo.status).toBe('archived');
    });
  });

  describe('POST /api/todos/:id/snooze', () => {
    it('snoozes a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Snooze me' });

      const until = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post(`/api/todos/${create.body.todo._id}/snooze`)
        .set('Authorization', `Bearer ${token}`)
        .send({ until });

      expect(res.status).toBe(200);
      expect(res.body.until).toBeDefined();
      expect(res.body.todo).toBeDefined();
      expect(res.body.todo.dueDate).toBeDefined();
    });

    it('rejects an invalid date', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad snooze' });

      const res = await request(app)
        .post(`/api/todos/${create.body.todo._id}/snooze`)
        .set('Authorization', `Bearer ${token}`)
        .send({ until: 'not-a-date' });

      expect(res.status).toBe(400);
    });
  });

  describe('Bulk operations', () => {
    let ids;

    beforeEach(async () => {
      const results = await Promise.all(
        ['Bulk 1', 'Bulk 2', 'Bulk 3'].map(title =>
          request(app)
            .post('/api/todos')
            .set('Authorization', `Bearer ${token}`)
            .send({ title })
        )
      );
      ids = results.map(r => r.body.todo._id);
    });

    it('bulk updates todos', async () => {
      const res = await request(app)
        .post('/api/todos/bulk-update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: ids.slice(0, 2), updates: { priority: 1 } });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(2);
    });

    it('bulk deletes todos', async () => {
      const res = await request(app)
        .post('/api/todos/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: ids.slice(0, 2) });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(2);
    });

    it('bulk update normalizes status aliases', async () => {
      const res = await request(app)
        .post('/api/todos/bulk-update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: ids.slice(0, 1), updates: { status: 'pending' } });

      expect(res.status).toBe(200);

      const list = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);

      const updated = list.body.todos.find(t => t._id === ids[0]);
      expect(updated.status).toBe('inbox');
    });

    it('bulk update rejects invalid status', async () => {
      const res = await request(app)
        .post('/api/todos/bulk-update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: ids.slice(0, 1), updates: { status: 'bogus' } });

      expect(res.status).toBe(400);
    });
  });

  describe('My Day', () => {
    it('GET /api/todos/my-day returns structured data', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My Day task', isMyDay: true });

      const res = await request(app)
        .get('/api/todos/my-day')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.myDay)).toBe(true);
      expect(Array.isArray(res.body.overdue)).toBe(true);
      expect(Array.isArray(res.body.today)).toBe(true);
    });

    it('POST /api/todos/my-day/reorder reorders', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Reorder task', isMyDay: true });

      const res = await request(app)
        .post('/api/todos/my-day/reorder')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderedIds: [create.body.todo._id] });

      expect(res.status).toBe(200);
    });
  });

  describe('Trash', () => {
    it('GET /api/todos/trash lists trashed todos', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Trash me' });

      await request(app)
        .delete(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/todos/trash')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.todos)).toBe(true);
    });

    it('POST /api/todos/trash/empty empties trash', async () => {
      const create = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Empty trash' });

      await request(app)
        .delete(`/api/todos/${create.body.todo._id}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/api/todos/trash/empty')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── Projects ────────────────────────────────────────────

describe('Projects API', () => {
  let token;
  let projectId;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `projects-${Date.now()}@example.com` });
    token = res.body.token;
  });

  describe('POST /api/projects', () => {
    it('creates a project with default sections', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Website Redesign' });

      expect(res.status).toBe(201);
      expect(res.body.project.name).toBe('Website Redesign');
      expect(res.body.project.sections.length).toBe(3);
      projectId = res.body.project._id;
    });
  });

  describe('GET /api/projects', () => {
    it('lists projects', async () => {
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Project' });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.projects)).toBe(true);
    });

    it('includes stats when requested', async () => {
      const create = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Stat Project' });

      const res = await request(app)
        .get('/api/projects?includeStats=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.projects[0].totalTodos).toBeDefined();
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('updates a project', async () => {
      const create = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Update me' });

      const res = await request(app)
        .put(`/api/projects/${create.body.project._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Project' });

      expect(res.status).toBe(200);
      expect(res.body.project.name).toBe('Updated Project');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('soft-deletes a project', async () => {
      const create = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Delete me' });

      const res = await request(app)
        .delete(`/api/projects/${create.body.project._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Sections', () => {
    let projId;

    beforeEach(async () => {
      const create = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Section Project' });
      projId = create.body.project._id;
    });

    it('adds a section', async () => {
      const res = await request(app)
        .post(`/api/projects/${projId}/sections`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Section' });

      expect(res.status).toBe(200);
      expect(res.body.project.sections.length).toBe(4);
    });

    it('updates a section', async () => {
      const proj = await request(app)
        .get(`/api/projects/${projId}`)
        .set('Authorization', `Bearer ${token}`);

      const sectionId = proj.body.project.sections[0]._id;

      const res = await request(app)
        .put(`/api/projects/${projId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed Section' });

      expect(res.status).toBe(200);
    });

    it('deletes a section', async () => {
      const proj = await request(app)
        .get(`/api/projects/${projId}`)
        .set('Authorization', `Bearer ${token}`);

      const sectionId = proj.body.project.sections[0]._id;

      const res = await request(app)
        .delete(`/api/projects/${projId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});

// ─── Tags ────────────────────────────────────────────────

describe('Tags API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `tags-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('POST /api/tags creates a tag', async () => {
    const res = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'work', color: '#ff0000' });

    expect(res.status).toBe(201);
    expect(res.body.tag.name).toBe('work');
  });

  it('GET /api/tags lists tags', async () => {
    await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'personal' });

    const res = await request(app)
      .get('/api/tags')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  it('PUT /api/tags/:id updates a tag', async () => {
    const create = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'updateme' });

    const res = await request(app)
      .put(`/api/tags/${create.body.tag._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ color: '#00ff00' });

    expect(res.status).toBe(200);
    expect(res.body.tag.color).toBe('#00ff00');
  });

  it('DELETE /api/tags/:id deletes a tag', async () => {
    const create = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'deleteme' });

    const res = await request(app)
      .delete(`/api/tags/${create.body.tag._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ─── Habits ──────────────────────────────────────────────

describe('Habits API', () => {
  let token;
  let habitId;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `habits-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('POST /api/habits creates a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meditate', frequency: 'daily' });

    expect(res.status).toBe(201);
    expect(res.body.habit.name).toBe('Meditate');
    habitId = res.body.habit._id;
  });

  it('GET /api/habits lists habits', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Exercise' });

    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.habits)).toBe(true);
  });

  it('PUT /api/habits/:id updates a habit', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read' });

    const res = await request(app)
      .put(`/api/habits/${create.body.habit._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Read 30 minutes' });

    expect(res.status).toBe(200);
    expect(res.body.habit.name).toBe('Read 30 minutes');
  });

  it('POST /api/habits/:id/log logs completion', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Log habit' });

    const res = await request(app)
      .post(`/api/habits/${create.body.habit._id}/log`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Done today' });

    expect(res.status).toBe(200);
    expect(res.body.habit.currentStreak).toBe(1);
  });

  it('POST /api/habits/:id/log toggles off', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Toggle habit' });

    await request(app)
      .post(`/api/habits/${create.body.habit._id}/log`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .post(`/api/habits/${create.body.habit._id}/log`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.habit.currentStreak).toBe(0);
  });

  it('GET /api/habits/:id/stats returns stats', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Stats habit' });

    const res = await request(app)
      .get(`/api/habits/${create.body.habit._id}/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.completionRate).toBeDefined();
    expect(Array.isArray(res.body.monthlyData)).toBe(true);
    expect(res.body.monthlyData.length).toBe(30);
  });

  it('higher-streak for future log via completions endpoint', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Completion habit' });

    const res = await request(app)
      .post(`/api/habits/${create.body.habit._id}/completions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.habit.logs.length).toBe(1);
  });

  it('GET /api/habits/completions returns keyed completions', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Completions map' });

    await request(app)
      .post(`/api/habits/${create.body.habit._id}/completions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString() });

    const res = await request(app)
      .get('/api/habits/completions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.completions).toBe('object');
    const keys = Object.keys(res.body.completions);
    expect(keys.some(k => k.startsWith(create.body.habit._id.toString()))).toBe(true);
  });

  it('DELETE /api/habits/:id/completions/:date removes a completion', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Remove completion' });

    await request(app)
      .post(`/api/habits/${create.body.habit._id}/completions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString() });

    const dateStr = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .delete(`/api/habits/${create.body.habit._id}/completions/${dateStr}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.habit.logs.length).toBe(0);
  });

  it('DELETE /api/habits/:id/deletes a habit', async () => {
    const create = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete habit' });

    const res = await request(app)
      .delete(`/api/habits/${create.body.habit._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ─── Goals ───────────────────────────────────────────────

describe('Goals API', () => {
  let token;
  let goalId;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `goals-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('POST /api/goals creates a goal', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Run a marathon', targetDate: new Date('2026-12-31') });

    expect(res.status).toBe(201);
    expect(res.body.goal.title).toBe('Run a marathon');
    goalId = res.body.goal._id;
  });

  it('GET /api/goals lists goals', async () => {
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Learn Spanish' });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.goals)).toBe(true);
  });

  it('PUT /api/goals/:id updates a goal', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Update goal' });

    const res = await request(app)
      .put(`/api/goals/${create.body.goal._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 50 });

    expect(res.status).toBe(200);
    expect(res.body.goal.progress).toBe(50);
  });

  it('POST /api/goals/:id/milestones adds a milestone', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Milestone goal' });

    const res = await request(app)
      .post(`/api/goals/${create.body.goal._id}/milestones`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Run 5K' });

    expect(res.status).toBe(200);
    expect(res.body.goal.milestones.length).toBe(1);
  });

  it('PUT /api/goals/:id/milestones/:milestoneId updates milestone', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'MS goal' });

    const addMs = await request(app)
      .post(`/api/goals/${create.body.goal._id}/milestones`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'First milestone' });

    const msId = addMs.body.goal.milestones[0]._id;

    const res = await request(app)
      .put(`/api/goals/${create.body.goal._id}/milestones/${msId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.goal.milestones[0].completed).toBe(true);
  });

  it('DELETE /api/goals/:id soft-deletes a goal', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete goal' });

    const res = await request(app)
      .delete(`/api/goals/${create.body.goal._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ─── Notes ───────────────────────────────────────────────

describe('Notes API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `notes-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('POST /api/notes creates a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Meeting notes', content: 'Discussed roadmap' });

    expect(res.status).toBe(201);
    expect(res.body.note.title).toBe('Meeting notes');
  });

  it('GET /api/notes lists notes', async () => {
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Quick note' });

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notes)).toBe(true);
  });

  it('PUT /api/notes/:id updates a note', async () => {
    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Update note' });

    const res = await request(app)
      .put(`/api/notes/${create.body.note._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.note.content).toBe('Updated content');
  });

  it('DELETE /api/notes/:id soft-deletes a note', async () => {
    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete note' });

    const res = await request(app)
      .delete(`/api/notes/${create.body.note._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// ─── Settings ────────────────────────────────────────────

describe('Settings API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `settings-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('GET /api/settings returns user settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(res.body.settings.theme).toBeDefined();
  });

  it('PUT /api/settings updates settings', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark', accentColor: '#10b981' });

    expect(res.status).toBe(200);
    expect(res.body.settings.theme).toBe('dark');
  });
});

// ─── Activity ────────────────────────────────────────────

describe('Activity API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `activity-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('GET /api/activity returns activity log', async () => {
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Activity test' });

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.activities)).toBe(true);
    expect(res.body.total).toBeDefined();
  });
});

// ─── Notifications ───────────────────────────────────────

describe('Notifications API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `notif-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('GET /api/notifications returns notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(typeof res.body.unreadCount).toBe('number');
  });
});

// ─── Stats ───────────────────────────────────────────────

describe('Stats API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `stats-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('GET /api/stats/dashboard returns overview', async () => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.overview).toBeDefined();
    expect(res.body.overview.totalActive).toBeDefined();
    expect(res.body.overview.completedToday).toBeDefined();
  });

  it('GET /api/stats/analytics returns analytics', async () => {
    const res = await request(app)
      .get('/api/stats/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasksByPriority)).toBe(true);
    expect(Array.isArray(res.body.tasksByStatus)).toBe(true);
    expect(Array.isArray(res.body.completedByDay)).toBe(true);
    expect(res.body.completedByDay.length).toBe(30);
  });
});

// ─── Search ──────────────────────────────────────────────

describe('Search API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `search-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('GET /api/search searches todos', async () => {
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Searchable task' });

    const res = await request(app)
      .get('/api/search?q=Searchable')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.todos)).toBe(true);
  });

  it('GET /api/search supports operators', async () => {
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Priority task', priority: 1 });

    const res = await request(app)
      .get('/api/search?q=priority:urgent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/search/export returns JSON backup', async () => {
    const res = await request(app)
      .get('/api/search/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0');
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/search/export/csv returns CSV', async () => {
    const res = await request(app)
      .get('/api/search/export/csv')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('POST /api/search/import imports data', async () => {
    const res = await request(app)
      .post('/api/search/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: {
          todos: [{ title: 'Imported todo', status: 'inbox', priority: 3 }],
          projects: [{ name: 'Imported Project', sections: [{ name: 'To Do' }] }]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.results.todos).toBe(1);
    expect(res.body.results.projects).toBe(1);
  });
});

// ─── Templates ───────────────────────────────────────────

describe('Templates API', () => {
  let token;

  beforeEach(async () => {
    const { res } = await registerUser({ email: `templates-${Date.now()}@example.com` });
    token = res.body.token;
  });

  it('POST /api/templates creates a template', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Morning Routine',
        items: [
          { title: 'Meditate', priority: 3 },
          { title: 'Exercise', priority: 2 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.template.name).toBe('Morning Routine');
  });

  it('GET /api/templates lists templates', async () => {
    await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'List template', items: [{ title: 'Item 1' }] });

    const res = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
  });

  it('POST /api/templates/:id/create-todos creates todos from template', async () => {
    const create = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Project template',
        items: [
          { title: 'Task 1', priority: 1 },
          { title: 'Task 2', priority: 2 }
        ],
        tags: ['work']
      });

    const res = await request(app)
      .post(`/api/templates/${create.body.template._id}/create-todos`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.todos.length).toBe(2);
    expect(res.body.todos[0].tags).toContain('work');
  });
});

// ─── Auth middleware ─────────────────────────────────────

describe('Authentication middleware', () => {
  it('rejects requests without token', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid token', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });
});
