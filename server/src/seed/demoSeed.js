/**
 * Donezo demo/seed script.
 *
 * Creates a dedicated demo account and populates it with realistic data so the
 * application can be inspected with populated screens.
 *
 *  - Safe & repeatable: it only ever touches the account with the demo email
 *    below. Re-running the script resets and re-seeds that account, so it never
 *    duplicates records and never modifies any other user's data.
 *  - Configure MONGODB_URI (via .env or environment) before running.
 *
 * Usage:
 *   cd server && npm run seed:demo
 *   (root shorthand: npm run seed:demo)
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Project from '../models/Project.js';
import Todo from '../models/Todo.js';
import Tag from '../models/Tag.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import Note from '../models/Note.js';
import Template from '../models/Template.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export const DEMO_EMAIL = 'hello@donezo.app';
export const DEMO_PASSWORD = 'DonezoDemo123!';
const DEMO_NAME = 'Alex Demo';

const seedId = 'donezo-demo';

const DAY_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (offset, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const iso = (offset, hour = 10, minute = 0) => daysFromNow(offset, hour, minute).toISOString();

async function save(model, docs) {
  if (!docs.length) return [];
  return model.insertMany(docs, { ordered: false });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Configure .env or environment before running the seed.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to MongoDB…`);

  // --- 1. Deterministic demo account ---------------------------------------
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      email: DEMO_EMAIL,
      password: await bcrypt.hash(DEMO_PASSWORD, 12),
      name: DEMO_NAME,
      theme: 'system',
      accentColor: '#6366f1',
      timezone: 'UTC',
      defaultView: 'list',
      weekStartsOn: 1,
      notifications: { reminders: true, overdue: true, dailyPlanning: false, habitReminder: true },
    });
    console.log(`Created demo account: ${DEMO_EMAIL}`);
  } else {
    console.log(`Demo account already exists: ${DEMO_EMAIL}`);
  }
  const userId = user._id;

  // --- 2. Reset this demo account's data (idempotency) ----------------------
  const models = [Todo, Project, Tag, Habit, Goal, Note, Template, Activity, Notification];
  for (const model of models) {
    await model.deleteMany({ userId });
  }
  console.log('Cleared previous demo data for', DEMO_EMAIL);

  // --- 3. Projects ----------------------------------------------------------
  const projectDefs = [
    {
      name: 'Website Redesign',
      description: 'Redesign and rebuild the company marketing site with a fresh design system and improved conversions.',
      icon: '🎨',
      color: '#6366f1',
      status: 'active',
      startDate: iso(-30),
      targetDate: iso(45),
      isFavorite: true,
      sections: [
        { name: 'Research & Discovery', order: 0 },
        { name: 'Design', order: 1 },
        { name: 'Development', order: 2 },
        { name: 'Launch & QA', order: 3 },
      ],
    },
    {
      name: 'Personal Finance',
      description: 'Get on top of budgeting, savings, and investments for the year.',
      icon: '💰',
      color: '#10b981',
      status: 'active',
      startDate: iso(-60),
      targetDate: iso(90),
      sections: [
        { name: 'Budgeting', order: 0 },
        { name: 'Savings', order: 1 },
        { name: 'Investing', order: 2 },
      ],
    },
    {
      name: 'Fitness Plan',
      description: 'Strength training and cardio program to hit goals by summer.',
      icon: '💪',
      color: '#f59e0b',
      status: 'active',
      startDate: iso(-45),
      targetDate: iso(75),
      sections: [{ name: 'Training Blocks', order: 0 }],
    },
    {
      name: 'Learning & Development',
      description: 'Courses, books, and certifications to level up professionally.',
      icon: '📚',
      color: '#8b5cf6',
      status: 'active',
      startDate: iso(-20),
      targetDate: iso(120),
      sections: [{ name: 'Courses', order: 0 }, { name: 'Books', order: 1 }],
    },
    {
      name: 'Home Projects',
      description: 'Small home improvement projects and repairs.',
      icon: '🏠',
      color: '#ec4899',
      status: 'active',
      startDate: iso(-15),
      targetDate: iso(30),
      sections: [],
    },
    {
      name: 'Mobile App MVP',
      description: 'Completed pre-seed mobile prototype.',
      icon: '📱',
      color: '#06b6d4',
      status: 'completed',
      startDate: iso(-120),
      targetDate: iso(-30),
      sections: [{ name: 'Build', order: 0 }, { name: 'Test', order: 1 }],
    },
    {
      name: 'Spring Cleaning',
      description: 'Archived seasonal project from last quarter.',
      icon: '🧹',
      color: '#64748b',
      status: 'archived',
      archivedAt: daysFromNow(-14),
      startDate: iso(-90),
    },
  ];

  const projects = await save(Project, projectDefs.map((p) => ({ ...p, userId })));
  const projectMap = {};
  projects.forEach((p) => { projectMap[p.name] = p._id; });
  console.log(`Created ${projects.length} projects`);

  // --- 4. Tags --------------------------------------------------------------
  const tagDefs = [
    { name: 'work', color: '#6366f1' },
    { name: 'personal', color: '#ec4899' },
    { name: 'urgent', color: '#ef4444' },
    { name: 'health', color: '#10b981' },
    { name: 'money', color: '#f59e0b' },
    { name: 'learning', color: '#8b5cf6' },
    { name: 'home', color: '#06b6d4' },
    { name: 'design', color: '#a855f7' },
  ];
  await save(Tag, tagDefs.map((t) => ({ ...t, userId })));
  console.log(`Created ${tagDefs.length} tags`);

  // Helper to build a todo row
  const todo = (t) => ({ userId, priority: 3, status: 'inbox', tags: [], dueDate: null, subtasks: [], checklist: [], ...t });

  // --- 5. Todos -------------------------------------------------------------
  const openTodos = [
    // Inbox (no project)
    todo({
      title: 'Review and respond to emails in the inbox',
      description: 'Work through the backlog of unread messages and flag anything important.',
      priority: 2,
      tags: ['work', 'urgent'],
      isImportant: true,
    }),
    todo({
      title: 'Book dentist appointment for next month',
      description: 'Regular six-month checkup. Ask about the new insurance plan.',
      priority: 3,
      dueDate: iso(5),
      tags: ['personal', 'health'],
    }),
    todo({
      title: 'Renew car registration',
      priority: 1,
      dueDate: iso(-3),
      dueTime: '17:00',
      description: 'Registration expires at the end of the month – avoid late fees.',
      tags: ['personal'],
      isImportant: true,
    }),
    todo({
      title: 'Backup laptop photos to the cloud',
      description: 'Sort the camera roll and upload to Google Photos before phone storage fills up.',
      priority: 4,
      tags: ['personal'],
      status: 'planned',
      dueDate: iso(9),
    }),
    todo({ title: 'Call mom for her birthday', priority: 1, dueDate: iso(2), tags: ['personal'] }),
    todo({ title: 'Order replacement phone charger', priority: 3, status: 'next' }),

    // Website Redesign
    todo({
      title: 'Collect stakeholder feedback on the new homepage',
      description: 'Gather comments from marketing and sales about the proposed direction.',
      projectId: projectMap['Website Redesign'],
      priority: 2,
      status: 'in-progress',
      dueDate: iso(0),
      isMyDay: true,
      tags: ['work', 'design'],
      isImportant: true,
      subtasks: [
        { title: 'Send the feedback form', completed: true, completedAt: daysFromNow(-1) },
        { title: 'Book review meeting', completed: true, completedAt: daysFromNow(-1) },
        { title: 'Summarize the feedback', completed: false },
      ],
    }),
    todo({
      title: 'Audit current site analytics for conversion bottlenecks',
      description: 'Look at the funnel report and identify the biggest drop-off points.',
      projectId: projectMap['Website Redesign'],
      priority: 2,
      status: 'next',
      dueDate: iso(1),
      tags: ['work'],
      estimatedDuration: 90,
    }),
    todo({
      title: 'Write new copy for the pricing page',
      projectId: projectMap['Website Redesign'],
      status: 'in-progress',
      priority: 3,
      dueDate: iso(3),
      dueTime: '12:00',
      tags: ['work'],
      checklist: [
        { text: 'Draft headline options', checked: true, order: 0 },
        { text: 'Write feature list', checked: false, order: 1 },
        { text: 'Review with team', checked: false, order: 2 },
      ],
    }),
    todo({
      title: 'Finalize the hero image selection',
      projectId: projectMap['Website Redesign'],
      status: 'review',
      priority: 2,
      dueDate: iso(-2),
      isImportant: true,
      tags: ['design', 'work'],
    }),
    todo({
      title: 'Set up A/B test for the sign-up button color',
      projectId: projectMap['Website Redesign'],
      status: 'next',
      priority: 4,
      dueDate: iso(6),
    }),

    // Personal Finance
    todo({
      title: 'Reconcile last month’s budget vs actuals',
      projectId: projectMap['Personal Finance'],
      status: 'in-progress',
      priority: 2,
      dueDate: iso(0),
      isMyDay: true,
      tags: ['money'],
      subtasks: [
        { title: 'Export the transactions', completed: true, completedAt: daysFromNow(-2) },
        { title: 'Categorize spending', completed: false },
        { title: 'Adjust next month targets', completed: false },
      ],
    }),
    todo({
      title: 'Transfer savings to the emergency fund',
      description: 'Move the bi-weekly $250 allotment.',
      projectId: projectMap['Personal Finance'],
      status: 'next',
      priority: 1,
      dueDate: iso(-1),
      tags: ['money', 'urgent'],
      isImportant: true,
    }),
    todo({
      title: 'Research index fund options for the new brokerage',
      projectId: projectMap['Personal Finance'],
      status: 'review',
      priority: 3,
      dueDate: iso(8),
      tags: ['money', 'learning'],
      estimatedDuration: 60,
    }),
    todo({
      title: 'Renegotiate internet plan',
      projectId: projectMap['Personal Finance'],
      status: 'inbox',
      priority: 3,
      dueDate: iso(12),
    }),

    // Fitness Plan
    todo({
      title: 'Strength training: Push day (workout A)',
      projectId: projectMap['Fitness Plan'],
      status: 'in-progress',
      priority: 3,
      dueDate: iso(0),
      dueTime: '18:30',
      isMyDay: true,
      tags: ['health'],
      location: 'City Gym',
      estimatedDuration: 60,
    }),
    todo({
      title: 'Plan next week’s meal prep menu',
      projectId: projectMap['Fitness Plan'],
      status: 'next',
      priority: 2,
      dueDate: iso(2),
      tags: ['health'],
    }),
    todo({
      title: 'Book a physio session for the knee',
      projectId: projectMap['Fitness Plan'],
      status: 'review',
      priority: 2,
      dueDate: iso(-4),
      tags: ['health'],
    }),

    // Learning & Development
    todo({
      title: 'Complete module 4 of the React course',
      projectId: projectMap['Learning & Development'],
      status: 'in-progress',
      priority: 3,
      dueDate: iso(1),
      isMyDay: true,
      tags: ['learning'],
      recurrence: { type: 'weekly', interval: 1 },
      subtasks: [
        { title: 'Watch the video lectures', completed: true, completedAt: daysFromNow(-1) },
        { title: 'Do the coding exercises', completed: false },
      ],
    }),
    todo({
      title: 'Read two chapters of “Atomic Habits”',
      projectId: projectMap['Learning & Development'],
      status: 'next',
      priority: 4,
      dueDate: iso(3),
      tags: ['learning', 'health'],
      checklist: [
        { text: 'Chapter 4: make it obvious', checked: true, order: 0 },
        { text: 'Chapter 5: implementation intentions', checked: false, order: 1 },
      ],
    }),
    todo({
      title: 'Summarize the quarterly conference notes',
      projectId: projectMap['Learning & Development'],
      status: 'inbox',
      priority: 3,
      dueDate: iso(6),
    }),

    // Home Projects
    todo({
      title: 'Replace the leaking kitchen faucet',
      projectId: projectMap['Home Projects'],
      status: 'next',
      priority: 1,
      dueDate: iso(-1),
      tags: ['home', 'urgent'],
      isImportant: true,
      subtasks: [
        { title: 'Buy the replacement fitting', completed: true, completedAt: daysFromNow(-2) },
        { title: 'Turn off the water supply', completed: false },
      ],
    }),
    todo({
      title: 'Paint the spare bedroom accent wall',
      projectId: projectMap['Home Projects'],
      status: 'in-progress',
      priority: 3,
      dueDate: iso(7),
      tags: ['home'],
      estimatedDuration: 180,
    }),
    todo({
      title: 'Sort the hallway closet',
      projectId: projectMap['Home Projects'],
      status: 'inbox',
      priority: 4,
    }),

    // Recurring / habits-style tasks
    todo({
      title: 'Water the indoor plants',
      status: 'in-progress',
      priority: 4,
      isMyDay: true,
      recurrence: { type: 'daily', interval: 1 },
      tags: ['home'],
    }),
    todo({
      title: 'Write in the gratitude journal',
      status: 'inbox',
      priority: 4,
      isMyDay: true,
      recurrence: { type: 'daily', interval: 1 },
      tags: ['personal'],
    }),
  ];

  // Completed todos spread over the last ~60 days for analytics
  const completedDefs = [
    { title: 'Send the Q3 report draft to the team', priority: 2, daysAgo: 1 },
    { title: 'Finish the wireframes for the mobile flow', priority: 2, daysAgo: 30, project: 'Website Redesign' },
    { title: 'Interview 2 users for usability testing', priority: 3, daysAgo: 26, project: 'Website Redesign' },
    { title: 'Migrate the legacy CMS content', priority: 2, daysAgo: 48, project: 'Website Redesign' },
    { title: 'Update the promo page copy', priority: 3, daysAgo: 47, project: 'Website Redesign' },
    { title: 'Cut monthly subscriptions down to the essentials', priority: 3, daysAgo: 12, project: 'Personal Finance' },
    { title: 'File the expense receipts for the month', priority: 2, daysAgo: 18, project: 'Personal Finance' },
    { title: 'Review the car insurance renewal quote', priority: 3, daysAgo: 22, project: 'Personal Finance' },
    { title: 'Run 5k easy pace', priority: 3, daysAgo: 2, tags: ['health'] },
    { title: 'Leg day: workout B', priority: 3, daysAgo: 6, project: 'Fitness Plan' },
    { title: 'Attend the morning standup meeting', priority: 4, daysAgo: 33 },
    { title: 'Prepare the monthly newsletter draft', priority: 3, daysAgo: 24, project: 'Website Redesign' },
    { title: 'Submit the expense reimbursement claim', priority: 3, daysAgo: 16 },
    { title: 'Watch ES6+ crash course', priority: 4, daysAgo: 10, project: 'Learning & Development' },
    { title: 'Finish “Deep Work” book notes', priority: 4, daysAgo: 40, project: 'Learning & Development' },
    { title: 'Resume rewrite', priority: 2, daysAgo: 5, project: 'Learning & Development' },
    { title: 'Fix the leaky garden hose', priority: 3, daysAgo: 28, project: 'Home Projects' },
    { title: 'Deep clean the fridge', priority: 4, daysAgo: 20, project: 'Home Projects' },
    { title: 'Test the iOS beta build', priority: 2, daysAgo: 46, project: 'Mobile App MVP' },
    { title: 'Present the MVP demo to the team', priority: 2, daysAgo: 31, project: 'Mobile App MVP' },
  ];

  const completedTodos = completedDefs.map((def, i) => {
    const doneAt = daysFromNow(0 - def.daysAgo, 17, 15 + (i % 30));
    return todo({
      title: def.title,
      priority: def.priority,
      tags: def.tags || [],
      projectId: def.project ? projectMap[def.project] : null,
      status: 'completed',
      completedAt: doneAt,
      description: '',
    });
  });

  // A couple completed today so "Completed" / My Day feel alive
  completedTodos.push(
    todo({ title: 'Morning workout: mobility + stretch', priority: 3, status: 'completed', completedAt: daysFromNow(0, 7, 45), isMyDay: true, tags: ['health'] }),
    todo({ title: 'Plan the week ahead', priority: 3, status: 'completed', completedAt: daysFromNow(0, 8, 30), tags: ['work'] }),
  );

  // Archived examples
  const archivedTodos = [
    todo({
      title: 'Old onboarding flow redesign (superseded)',
      status: 'archived',
      archivedAt: daysFromNow(-12),
      priority: 4,
      projectId: projectMap['Website Redesign'],
    }),
    todo({
      title: 'Legacy spreadsheet task tracker (migrated)',
      status: 'archived',
      archivedAt: daysFromNow(-20),
      priority: 4,
      tags: ['work'],
    }),
  ];

  // Trashed examples
  const trashedTodos = [
    todo({ title: 'Swap broken lightbulbs in the hallway', status: 'inbox', deletedAt: daysFromNow(-3), priority: 4, tags: ['home'] }),
    todo({ title: 'Quote for new sofa (research)', status: 'inbox', deletedAt: daysFromNow(-6), priority: 3 }),
    todo({ title: 'Password manager cleanup duplicate entries', status: 'inbox', deletedAt: daysFromNow(-9), priority: 4 }),
  ];

  const allTodos = [...openTodos, ...completedTodos, ...archivedTodos, ...trashedTodos];
  await save(Todo, allTodos);
  console.log(`Created ${allTodos.length} todos`);

  // --- 6. Habits ------------------------------------------------------------
  // Deterministic completion generation over the last 30 days.
  const buildHabit = (name, icon, color, frequency, targetDays, isDoneFn, order) => {
    const logs = [];
    let streak = 0;
    let longest = 0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(8, 0, 0, 0);
      const done = isDoneFn(date, i);
      logs.push({ date: new Date(date), completed: done, notes: '' });
      if (done) {
        streak += 1;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
    }
    return {
      userId,
      name,
      icon,
      color,
      frequency,
      targetDays,
      targetCount: 1,
      logs,
      currentStreak: logs[0]?.completed ? streak : 0,
      longestStreak: longest,
      order,
      isArchived: false,
    };
  };

  const habitDefs = [
    { name: 'Morning run', icon: '🏃', color: '#10b981', frequency: 'daily', targetDays: [0, 1, 2, 3, 4, 5, 6], fn: (d) => d.getDay() !== 0 && d.getDate() % 2 === 0 },
    { name: 'Read 20 minutes', icon: '📖', color: '#6366f1', frequency: 'daily', targetDays: [0, 1, 2, 3, 4, 5, 6], fn: (d) => d.getDate() % 5 !== 3 },
    { name: 'Drink 8 glasses of water', icon: '💧', color: '#06b6d4', frequency: 'daily', targetDays: [0, 1, 2, 3, 4, 5, 6], fn: () => true },
    { name: 'Meditation', icon: '🧘', color: '#8b5cf6', frequency: 'daily', targetDays: [0, 1, 2, 3, 4, 5, 6], fn: (d) => d.getDay() % 7 !== 5 },
    { name: 'Meal prep for the week', icon: '🍳', color: '#f59e0b', frequency: 'weekly', targetDays: [0], fn: (d) => d.getDay() === 0 && d.getDate() % 3 !== 2 },
    { name: 'Stretch before bed', icon: '🧊', color: '#ec4899', frequency: 'daily', targetDays: [0, 1, 2, 3, 4, 5, 6], fn: () => false },
  ];

  const habits = [];
  habitDefs.forEach((h, i) => {
    habits.push(buildHabit(h.name, h.icon, h.color, h.frequency, h.targetDays, h.fn, i));
  });
  await save(Habit, habits);
  console.log(`Created ${habits.length} habits`);

  // --- 7. Goals -------------------------------------------------------------
  const goalDefs = [
    {
      title: 'Ship the new marketing website',
      description: 'Redesign and relaunch the site with improved messaging and a modern design system.',
      color: '#6366f1',
      icon: '🚀',
      category: 'Work',
      targetDate: iso(45),
      progress: 60,
      status: 'active',
      milestones: [
        { name: 'Discovery & research complete', targetDate: iso(-14), completed: true, completedAt: daysFromNow(-14), order: 0 },
        { name: 'Design approved', targetDate: iso(7), completed: false, order: 1 },
        { name: 'Development complete', targetDate: iso(30), completed: false, order: 2 },
        { name: 'Site live in production', targetDate: iso(45), completed: false, order: 3 },
      ],
      linkedTasks: [],
    },
    {
      title: 'Run a half marathon',
      description: 'Train consistently for the autumn half marathon and finish under 2:15.',
      color: '#f59e0b',
      icon: '🏅',
      category: 'Health',
      targetDate: iso(90),
      progress: 35,
      status: 'active',
      milestones: [
        { name: 'Run 10k without stopping', targetDate: iso(20), completed: false, order: 0 },
        { name: 'Complete a 15k long run', targetDate: iso(50), completed: false, order: 1 },
        { name: 'Race day', targetDate: iso(90), completed: false, order: 2 },
      ],
      linkedTasks: [],
    },
    {
      title: 'Build a $10,000 emergency fund',
      description: 'Save three months of expenses to feel financially secure.',
      color: '#10b981',
      icon: '💰',
      category: 'Finance',
      targetDate: iso(180),
      progress: 55,
      status: 'active',
      milestones: [
        { name: 'First $2,500 saved', targetDate: iso(-60), completed: true, completedAt: daysFromNow(-60), order: 0 },
        { name: 'First $5,000 saved', targetDate: iso(30), completed: false, order: 1 },
        { name: 'Full $10,000 saved', targetDate: iso(180), completed: false, order: 2 },
      ],
      linkedTasks: [],
    },
    {
      title: 'Complete the React certification',
      description: 'Finish the professional-level React developer certification.',
      color: '#8b5cf6',
      icon: '🎓',
      category: 'Learning',
      targetDate: iso(-7),
      progress: 100,
      status: 'completed',
      milestones: [
        { name: 'Core concepts exam passed', targetDate: iso(-40), completed: true, completedAt: daysFromNow(-40), order: 0 },
        { name: 'Advanced topics exam passed', targetDate: iso(-20), completed: true, completedAt: daysFromNow(-20), order: 1 },
        { name: 'Final project submitted', targetDate: iso(-7), completed: true, completedAt: daysFromNow(-7), order: 2 },
      ],
      linkedTasks: [],
    },
  ];

  const goals = await save(Goal, goalDefs.map((g) => ({ ...g, userId })));
  console.log(`Created ${goals.length} goals`);

  // --- 8. Notes -------------------------------------------------------------
  const todoForRef = await Todo.findOne({ userId, status: { $ne: 'completed' } }).sort({ createdAt: 1 });

  const noteDefs = [
    {
      title: 'Homepage hero copy ideas',
      content: 'A few strong headline directions:\n\n1. "Do the important stuff first."\n2. "A calmer way to plan your day."\n3. "Your tasks, done in record time."\n\nTest these against the current page in the next A/B round.',
      projectId: projectMap['Website Redesign'],
      tags: ['design', 'work'],
      isPinned: true,
    },
    {
      title: 'Budget meeting takeaways',
      content: '- Rent is 28% of income — below the 30% guideline.\n- Groceries trending 12% over budget.\n- Move $250 to emergency fund every payday.',
      projectId: projectMap['Personal Finance'],
      tags: ['money'],
    },
    {
      title: 'Gym plan – week 4',
      content: 'Push / Pull / Legs split.\n\n* Monday: Push (A)\n* Wednesday: Pull (B)\n* Friday: Legs (C)\n\nAdd 2.5 lb to main lifts this week.',
      projectId: projectMap['Fitness Plan'],
      tags: ['health'],
      color: '#fef3c7',
    },
    {
      title: 'Reading list',
      content: '- Atomic Habits (in progress)\n- Deep Work (finished)\n- The Psychology of Money (up next)\n- Thinking, Fast and Slow (queue)',
      projectId: projectMap['Learning & Development'],
      tags: ['learning'],
    },
    {
      title: 'Todo detail demo note',
      content: 'Example note linked to a task so the todo detail panel shows related notes from seed data.',
      todoId: todoForRef ? todoForRef._id : null,
    },
    {
      title: 'Archive this later',
      content: 'Old recipe ideas from spring.',
      isArchived: true,
    },
    {
      title: 'Quick capture',
      content: 'Gift ideas for the holidays: new running shoes, ceramic pour-over kettle, board game night kit.',
      tags: ['personal'],
      isPinned: false,
    },
  ];

  await save(Note, noteDefs.map((n) => ({ ...n, userId })));
  console.log(`Created ${noteDefs.length} notes`);

  // --- 9. Templates ---------------------------------------------------------
  const templateDefs = [
    {
      name: 'Weekly Review',
      description: 'A short routine to close out the week and plan the next one.',
      icon: '🔁',
      category: 'Planning',
      tags: ['planning'],
      items: [
        { title: 'Review completed tasks from this week', priority: 3 },
        { title: 'Clear out the inbox', priority: 3 },
        { title: 'Plan the top 3 priorities for next week', priority: 2, subtasks: [{ title: 'Pick the big wins' }, { title: 'Schedule time blocks' }] },
      ],
    },
    {
      name: 'Meeting Agenda',
      description: 'Standard agenda skeleton for team syncs.',
      icon: '📋',
      category: 'Work',
      tags: ['work'],
      items: [
        { title: 'Set the goal of the meeting', priority: 3 },
        { title: 'Review action items from last time', priority: 3, checklist: [{ text: 'Check status' }, { text: 'Unblock' }] },
        { title: 'Decide next steps and owners', priority: 2 },
      ],
    },
    {
      name: 'Travel Packing List',
      description: 'Never forget the essentials again.',
      icon: '🧳',
      category: 'Personal',
      tags: ['personal'],
      items: [
        { title: 'Pack documents and IDs', priority: 1, checklist: [{ text: 'Passport' }, { text: 'Boarding pass' }, { text: 'Insurance card' }] },
        { title: 'Pack chargers and adapters', priority: 2 },
        { title: 'Pack toiletries', priority: 3, subtasks: [{ title: 'Travel-size bottles' }, { title: 'Medications' }] },
      ],
    },
  ];

  await save(Template, templateDefs.map((t) => ({ ...t, userId })));
  console.log(`Created ${templateDefs.length} templates`);

  // --- 10. Notifications ----------------------------------------------------
  const notifDefs = [
    { type: 'reminder', title: 'Website Redesign feedback is due today', message: 'Collect stakeholder feedback on the new homepage.', entityType: 'todo', actionUrl: '/kanban', createdAt: daysFromNow(0, 8, 30) },
    { type: 'habit', title: 'Habit streak: 14 days!', message: 'You read every day for two weeks — keep it up.', entityType: 'habit', actionUrl: '/habits', createdAt: daysFromNow(0, 7, 15) },
    { type: 'suggestion', title: 'Plan your day', message: 'You have 5 tasks due today. Add a couple to My Day to get started.', entityType: 'system', actionUrl: '/my-day', createdAt: daysFromNow(0, 6, 0) },
    { type: 'overdue', title: 'Transfer savings is overdue', message: 'Mark it done or snooze it.', entityType: 'todo', actionUrl: '/my-day', createdAt: daysFromNow(-1, 9, 0) },
    { type: 'overdue', title: 'Replace the leaking kitchen faucet is overdue', message: 'Mark it done or snooze it.', entityType: 'todo', actionUrl: '/my-day', createdAt: daysFromNow(-2, 12, 45) },
    { type: 'daily-planning', title: 'Review your daily plan', message: 'A quick weekly review keeps your plan on track.', entityType: 'system', actionUrl: '/inbox', createdAt: daysFromNow(-3, 17, 20) },
    { type: 'system', title: 'Welcome to Donezo', message: 'Explore Kanban, Habits, Goals, and Analytics to get the most out of your plan.', entityType: 'system', actionUrl: '/inbox', isRead: true, createdAt: daysFromNow(-5, 10, 0) },
    { type: 'habit', title: 'Reading streak: 7 days', message: 'Nice momentum — keep the streak alive.', entityType: 'habit', actionUrl: '/habits', isRead: true, createdAt: daysFromNow(-7, 8, 0) },
    { type: 'reminder', title: 'Monthly budget check-in complete', message: 'You reconciled last month’s budget vs actuals.', entityType: 'todo', actionUrl: '/projects', isRead: true, createdAt: daysFromNow(-10, 14, 0) },
  ];
  await save(Notification, notifDefs.map((n) => ({ ...n, userId })));
  console.log(`Created ${notifDefs.length} notifications`);

  // --- 11. Activity ---------------------------------------------------------
  const today = daysFromNow(0);
  const activityDefs = [
    { action: 'created', entityType: 'todo', entityTitle: 'Review and respond to emails in the inbox', createdAt: daysFromNow(0, 9, 2) },
    { action: 'completed', entityType: 'todo', entityTitle: 'Morning workout: mobility + stretch', createdAt: daysFromNow(0, 7, 46) },
    { action: 'status-changed', entityType: 'todo', entityTitle: 'Collect stakeholder feedback on the new homepage', createdAt: daysFromNow(0, 9, 30) },
    { action: 'project-created', entityType: 'project', entityTitle: 'Website Redesign', createdAt: daysFromNow(-30) },
    { action: 'habit-completed', entityType: 'habit', entityTitle: 'Morning run', createdAt: daysFromNow(0, 8, 5) },
    { action: 'completed', entityType: 'todo', entityTitle: 'Send the Q3 report draft to the team', createdAt: daysFromNow(-1, 16, 40) },
    { action: 'goal-created', entityType: 'goal', entityTitle: 'Ship the new marketing website', createdAt: daysFromNow(-25) },
    { action: 'note-created', entityType: 'note', entityTitle: 'Homepage hero copy ideas', createdAt: daysFromNow(-2, 11, 20) },
  ];
  await save(Activity, activityDefs.map((a) => ({
    ...a,
    userId,
    entityId: new mongoose.Types.ObjectId(),
    details: {},
    createdAt: a.createdAt,
  })));
  console.log(`Created ${activityDefs.length} activity entries`);

  await mongoose.disconnect();

  console.log('\n✔ Demo data seeded successfully.');
  console.log('--------------------------------------------------');
  console.log(`  Seed marker : ${seedId}`);
  console.log(`  Account     : ${DEMO_EMAIL}`);
  console.log(`  Password    : ${DEMO_PASSWORD}`);
  console.log('  Re-run this script anytime to reset the demo account.');
  console.log('--------------------------------------------------');
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});