# Features

## Core Task Management

### Smart Task Creation
- Create tasks with title, description, notes, and rich metadata
- **Natural language input** — Type `Standup tomorrow at 9am #work p2` and the parser automatically extracts the due date, time, tag, and priority
- Subtasks and checklists within each task
- Estimated and actual duration tracking
- Location and link attachments
- Task dependencies

### Task Organization
- **Statuses:** Inbox, Planned, Next, In Progress, Waiting, Blocked, Completed, Archived
- **Priority levels:** 1 (urgent) through 4 (low), color-coded
- **Tags:** Add multiple tags to tasks; tags are auto-created and usage counts are maintained
- **Projects:** Assign tasks to projects for higher-level organization
- **Categories:** Free-form category field for additional grouping
- Pin, favorite, and mark as important

### Task Views
- **Inbox** — Default task list
- **My Day** — Daily planner with suggested tasks, overdue items, and drag-to-reorder
- **Important** — All important tasks across projects
- **Upcoming** — Timeline of tasks sorted by due date
- **Completed** — Historical view of completed tasks
- **Calendar** — Month/week calendar visualization
- **Kanban** — Drag-and-drop board by status or project sections
- **Trash** — Recover soft-deleted tasks

### Task Operations
- Duplicate tasks
- Archive completed tasks
- Snooze tasks to a future date
- Bulk update and bulk delete
- Restore from trash or permanently delete
- Empty trash

## Projects

- Create projects with custom name, icon, color, and description
- **Sections** — Add, rename, and reorder sections (default: To Do, In Progress, Done)
- Project status: Active, On Hold, Completed, Archived
- Start and target date tracking
- **Progress tracking** — Automatic calculation of completed vs. total tasks
- Deleting a project moves its tasks back to inbox

## Habits

- Track daily, weekly, or custom frequency habits
- Custom icons and colors for each habit
- **Toggle-based logging** — Tap to mark complete for today; tap again to undo
- **Streak tracking** — Current streak and all-time longest streak
- **30-day stats** — Completion rate, daily completion chart, streak data
- Target days configuration for custom frequency habits
- Archive habits without deleting history

## Goals

- Set long-term goals with title, description, target date, and color
- **Milestones** — Break goals into steps with individual completion tracking
- **Progress percentage** — Manual progress tracking (0-100)
- Goal statuses: Active, Completed, Paused, Abandoned
- Category tagging
- Link related tasks to goals

## Notes

- Quick notes with title and content
- Link notes to specific projects or tasks
- Pin important notes to the top
- Archive notes without deleting
- Color coding
- Full-text search across title and content

## Templates

- Create reusable task templates with items, subtasks, and checklists
- Pre-define tags, category, priority, and estimated duration
- **Generate tasks from template** — Create a batch of tasks from a template, optionally linked to a project
- Speeds up repetitive workflows (e.g., meeting prep, onboarding checklists)

## Tags

- Global tag management with color customization
- Tags auto-create when added to tasks via natural language input
- Usage count tracking per tag
- Renaming a tag updates all associated tasks
- Deleting a tag removes it from all tasks

## Search & Filtering

- **Full-text search** across task titles, descriptions, and notes
- **Search operators:**
  - `priority:urgent` or `priority:1` — Filter by priority
  - `status:inbox` — Filter by status
  - `due:today`, `due:overdue`, `due:week` — Filter by due date
  - `tag:work` — Filter by tag
  - `project:website` — Filter by project
- Combine free text with operators: `deploy #devops due:week priority:urgent`
- Filter by date range, project, tag, status, and priority

## Data Portability

- **JSON Export** — Full backup of all data (todos, projects, tags, habits, goals, templates, notes)
- **CSV Export** — Spreadsheet-friendly export of all tasks
- **JSON Import** — Restore from backup or import data

## Analytics & Stats

### Dashboard
- Total active tasks, tasks due today, overdue tasks
- Completed today / this week / this month
- Completion rate
- Habit completion for today
- Upcoming tasks, important tasks, active projects, and goals

### Analytics
- Tasks completed by day (30-day chart)
- Task distribution by priority and status
- Average completion time
- Tasks by project breakdown

## Focus Mode

- Distraction-free mode for deep work
- Minimized UI with only the current task visible

## Command Palette

- Keyboard shortcut (Ctrl+K) to open quick actions
- Search and navigate to any page, create tasks, and perform common actions

## User Settings

- **Theme:** Light, Dark, or System
- **Accent color:** Customizable primary color
- **Timezone:** Configure for correct due date handling
- **Date format:** Customizable display format
- **Default view:** List, Compact, Kanban, Calendar, or Timeline
- **Week start:** Monday or Sunday
- **Notification preferences:** Reminders, overdue alerts, daily planning, habit reminders

## Activity Log

- Automatic audit trail for all mutations (creates, updates, completions, deletions)
- Filter by entity type (todo, project, habit, goal, note)
- Paginated history

## Notifications

- Types: Reminder, Overdue, Suggestion, System, Habit, Daily Planning
- Mark individual or all as read
- Unread count badge

## Authentication & Security

- JWT-based authentication with secure token storage
- bcrypt password hashing (12 salt rounds)
- Rate limiting (1000 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- Soft deletes for data recovery
- Environment-based error message suppression in production
