# Task Management System

A full-stack task manager built with **React (Vite)** on the frontend and a **plain Node.js `http` server** on the backend. Tasks are saved in a local `tasks.json` file, so there is no database, no API key, and no account to set up.

---

## Features

- Dashboard with total, pending, in-progress, and completed counts, plus a progress bar
- Add tasks with a title, description, priority (Low / Medium / High), and optional due date
- Edit tasks and delete them (with a confirmation dialog)
- Change status between **Pending**, **In Progress**, and **Completed** straight from the task card
- Search by title (case-insensitive)
- Filter by status and priority (filters combine with search)
- Sort by creation date or due date (tasks without a due date always appear last)
- Overdue tasks are highlighted
- Form validation with clear error messages (in the browser *and* on the server)
- Loading spinner, empty state, "no matches" state, and a friendly error if the backend is offline
- Responsive light theme for desktop and mobile

## Technology stack

| Part | Technology |
| --- | --- |
| Frontend | React 18, Vite, JavaScript, plain CSS, Fetch API |
| Backend | Node.js built-in modules only: `http`, `fs`, `path`, `crypto` |
| Storage | A local JSON file: `backend/tasks.json` |

Not used: Express, any database, TypeScript, Redux, Tailwind, Bootstrap, authentication, or external APIs.

## Folder structure

```
task-management-system/
├── backend/
│   ├── server.js        <- the whole backend (routes, validation, file storage)
│   ├── tasks.json       <- your saved tasks (starts as an empty list: [])
│   └── package.json     <- scripts only, no dependencies
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx     <- starts React
│       ├── App.jsx      <- main component: state, API calls, filters, sorting
│       ├── api.js       <- all fetch() calls to the backend
│       ├── utils.js     <- small helpers (dates, constants)
│       ├── styles.css   <- all styling
│       └── components/
│           ├── Header.jsx
│           ├── Dashboard.jsx
│           ├── Toolbar.jsx        <- search, filters, sort
│           ├── TaskCard.jsx
│           ├── TaskForm.jsx       <- add / edit form with validation
│           ├── ConfirmDialog.jsx  <- delete confirmation
│           ├── Spinner.jsx
│           └── EmptyState.jsx
├── README.md
└── .gitignore
```

## Installation and running (Windows + VS Code)

**Prerequisite:** install Node.js 18 or newer (the LTS version) from <https://nodejs.org>. Check it with `node -v`.

1. Unzip `task-management-system.zip`.
2. Open the `task-management-system` folder in VS Code (**File > Open Folder**).
3. Open a terminal with **Terminal > New Terminal**. You need **two** terminals: the backend and the frontend run at the same time.

### Terminal 1: backend

The backend has no dependencies, so there is nothing to install.

```bash
cd backend
npm start
```

You should see `Task API running at http://localhost:5000`. Leave this terminal running.

### Terminal 2: frontend

Click the **+** (or the split icon) in the VS Code terminal panel to open a second terminal, then:

```bash
cd frontend
npm install
npm run dev
```

`npm install` is only needed the first time. After `npm run dev`, Vite prints a link such as `http://localhost:5173/` and opens it in your browser. If it doesn't, open **http://localhost:5173** yourself.

To stop either server, click its terminal and press `Ctrl + C`.

### Quick check that the backend works

Open <http://localhost:5000/api/health> in a browser. You should see `{"status":"ok","message":"Backend is running."}`.

## API endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | What it does | Success code |
| --- | --- | --- | --- |
| GET | `/api/health` | Check that the backend is running | 200 |
| GET | `/api/tasks` | Get all tasks | 200 |
| GET | `/api/tasks/:id` | Get one task | 200 |
| POST | `/api/tasks` | Create a task | 201 |
| PUT | `/api/tasks/:id` | Update a task (send only the fields to change) | 200 |
| DELETE | `/api/tasks/:id` | Delete a task | 200 |

**A task looks like this:**

```json
{
  "id": "f8e65326-dab0-412f-8de2-bfb9ae95c2e6",
  "title": "Finish DBMS assignment",
  "description": "Chapters 4 and 5",
  "priority": "High",
  "status": "Pending",
  "dueDate": "2026-10-20",
  "createdAt": "2026-10-12T18:29:05.843Z",
  "updatedAt": "2026-10-12T18:29:05.843Z"
}
```

**Rules checked by the server:**

- `title`: required, 1 to 100 characters
- `description`: optional, up to 500 characters
- `priority`: `Low`, `Medium`, or `High` (default `Medium`)
- `status`: `Pending`, `In Progress`, or `Completed` (default `Pending`)
- `dueDate`: optional, a real date written as `YYYY-MM-DD`, or `null`

**Error responses** are always JSON, for example `{"error": "Validation failed.", "details": {"title": "Title is required."}}`.

| Code | Meaning |
| --- | --- |
| 400 | Invalid data, invalid ID, or malformed JSON |
| 404 | Task or route not found |
| 405 | HTTP method not allowed for that route |
| 413 | Request body too large (over 100 KB) |
| 500 | Server problem, such as a damaged `tasks.json` |

## How JSON file storage works

`backend/tasks.json` holds a single JSON array with one object per task. There is no database, so every request does the following:

1. **Read**: the server reads the whole file and parses it into a JavaScript array.
2. **Change**: it adds, edits, or removes an item in that array.
3. **Write**: it saves the array back to disk.

Safety measures built in:

- If `tasks.json` doesn't exist, the server creates it (as `[]`) when it starts.
- **Safe saving:** the server writes to `tasks.json.tmp` first and then renames it over `tasks.json`. If something crashes mid-save, your real file is not left half-written.
- **Validation before saving:** a request with bad data or broken JSON is rejected *before* any file is touched, so it can never wipe your tasks.
- **Damaged file protection:** if `tasks.json` contains invalid JSON, the server returns an error instead of treating it as "no tasks". Otherwise the next save would silently erase everything.
- Node.js handles one request at a time for this code, because the read-change-write happens in one synchronous step, so simultaneous requests don't overwrite each other.

You can open `tasks.json` in VS Code at any time to see your data. To reset the app, replace the file's contents with `[]` while the backend is stopped.

## Common errors and fixes

| Problem | Fix |
| --- | --- |
| The page says **"Can't reach the backend"** | The backend isn't running. Start it in Terminal 1 with `cd backend` then `npm start`. |
| `Port 5000 is already in use` | Another program uses port 5000. Close it, or start the backend on another port with `$env:PORT=5001; npm start` (PowerShell). If you change the port, also change `API_URL` in `frontend/src/api.js`. |
| `Port 5173 is in use` (Vite) | Vite automatically picks the next free port and prints it. Use the link it shows. |
| `'npm' is not recognized` | Node.js isn't installed or the terminal was opened before installing. Install Node.js, then restart VS Code. |
| PowerShell says **"running scripts is disabled on this system"** | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in PowerShell, then try again. Alternatively, switch the VS Code terminal to **Command Prompt** using the dropdown next to the **+** button. |
| `Cannot find module 'vite'` or `vite is not recognized` | Run `npm install` inside the `frontend` folder first. |
| `tasks.json contains invalid JSON` | The file was edited by hand and broken. Fix the syntax, or replace the contents with `[]` (this deletes all tasks). |
| Changes to `server.js` aren't showing | Stop the backend with `Ctrl + C` and run `npm start` again. Or use `npm run dev` in the backend folder, which restarts automatically. |

---

## How it all works (architecture)

```
┌────────────────────┐   HTTP + JSON (fetch)   ┌────────────────────┐   fs read/write   ┌────────────┐
│  React frontend    │ ──────────────────────▶ │  Node.js backend   │ ────────────────▶ │ tasks.json │
│  localhost:5173    │ ◀────────────────────── │  localhost:5000    │ ◀──────────────── │ (on disk)  │
└────────────────────┘      JSON response      └────────────────────┘                   └────────────┘
```

**1. Two separate programs.** The React app runs in your browser (served by Vite on port 5173). The backend is a separate Node.js program on port 5000. They talk only through HTTP requests.

**2. The frontend never stores data itself.** `App.jsx` keeps a list of tasks in React state (`useState`), but that list is only a *copy* of what the backend returned. The real data lives in `tasks.json`.

**3. Example: adding a task.**
1. You fill in the form and click **Add task**. `TaskForm.jsx` checks the fields first and shows errors if something is wrong.
2. `App.jsx` calls `createTask(data)` from `api.js`, which runs `fetch("http://localhost:5000/api/tasks", { method: "POST", body: JSON.stringify(data) })`.
3. The browser sends this request. Because the frontend and backend use different ports, the browser first asks permission with a "preflight" request. The backend answers with CORS headers saying it's allowed.
4. `server.js` receives the request, parses the JSON body, and validates it again (never trust the browser alone).
5. If valid, the server gives the task a unique ID (`crypto.randomUUID()`), reads `tasks.json`, adds the task, and saves the file.
6. The server replies with status `201` and the new task as JSON.
7. React receives the response, adds the task to its state, and re-renders. The new card and the dashboard counts appear automatically.

If something goes wrong (for example, the server rejects the data), it replies with a `400` and an error message, which the form shows to the user.

**4. Search, filters, and sorting happen in the browser.** The frontend already has all tasks, so it filters and sorts that list in memory (`useMemo` in `App.jsx`) without extra requests. Changing, adding, and deleting tasks always go through the backend.

**5. Why persistence works.** When you restart the backend or refresh the page, the data is still there because it was saved in `tasks.json`. On page load, React calls `GET /api/tasks`, and the backend reads the file and returns every task.

### Ideas for extending the project

- Add a real database such as SQLite or MongoDB in place of the JSON file
- Add user accounts and login
- Add categories or tags and drag-and-drop ordering
- Write automated tests for the API
