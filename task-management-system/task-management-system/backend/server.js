// Task Management System - backend
// Uses ONLY Node.js built-in modules: http, fs, path, crypto.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5000;
const TASKS_FILE = path.join(__dirname, "tasks.json");
const MAX_BODY_BYTES = 100 * 1024; // reject request bodies larger than 100 KB

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Pending", "In Progress", "Completed"];

/* ------------------------------------------------------------------ */
/* File storage helpers                                                */
/* ------------------------------------------------------------------ */

// Create tasks.json (containing an empty list) if it does not exist.
function ensureTasksFile() {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, "[]\n", "utf8");
    console.log("Created new tasks.json");
  }
}

// Read all tasks. If the file is corrupted we throw instead of
// returning [] -- otherwise the next save would wipe the user's data.
function readTasks() {
  const text = fs.readFileSync(TASKS_FILE, "utf8");
  let data;
  try {
    data = JSON.parse(text.trim() === "" ? "[]" : text);
  } catch (err) {
    throw new Error("tasks.json contains invalid JSON. Fix or delete the file, then try again.");
  }
  if (!Array.isArray(data)) {
    throw new Error("tasks.json must contain a JSON array.");
  }
  return data;
}

// Save tasks safely: write to a temporary file first, then rename it over
// the real file. If the program crashes mid-write, tasks.json stays intact.
function writeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error("Refusing to save: tasks must be an array.");
  }
  const tempFile = TASKS_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(tasks, null, 2) + "\n", "utf8");
  fs.renameSync(tempFile, TASKS_FILE);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Checks the fields that are present in `input`.
// When `requireAll` is true (creating a task), title is mandatory.
// Returns { errors: {field: message}, values: {cleaned fields} }.
function validateTask(input, requireAll) {
  const errors = {};
  const values = {};

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { errors: { body: "Request body must be a JSON object." }, values };
  }

  if (requireAll || "title" in input) {
    if (typeof input.title !== "string" || input.title.trim() === "") {
      errors.title = "Title is required.";
    } else if (input.title.trim().length > 100) {
      errors.title = "Title must be 100 characters or fewer.";
    } else {
      values.title = input.title.trim();
    }
  }

  if ("description" in input) {
    if (input.description === null || input.description === undefined) {
      values.description = "";
    } else if (typeof input.description !== "string") {
      errors.description = "Description must be text.";
    } else if (input.description.trim().length > 500) {
      errors.description = "Description must be 500 characters or fewer.";
    } else {
      values.description = input.description.trim();
    }
  }

  if ("priority" in input) {
    if (!PRIORITIES.includes(input.priority)) {
      errors.priority = "Priority must be one of: " + PRIORITIES.join(", ") + ".";
    } else {
      values.priority = input.priority;
    }
  }

  if ("status" in input) {
    if (!STATUSES.includes(input.status)) {
      errors.status = "Status must be one of: " + STATUSES.join(", ") + ".";
    } else {
      values.status = input.status;
    }
  }

  if ("dueDate" in input) {
    if (input.dueDate === null || input.dueDate === "" || input.dueDate === undefined) {
      values.dueDate = null;
    } else if (typeof input.dueDate !== "string" || !isValidDate(input.dueDate)) {
      errors.dueDate = "Due date must be a real date in YYYY-MM-DD format.";
    } else {
      values.dueDate = input.dueDate;
    }
  }

  return { errors, values };
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */

function setCorsHeaders(res) {
  // Allows the React dev server (another port) to call this API locally.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// Reads the request body and parses it as JSON.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooBig = false;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooBig = true; // keep draining, but stop storing
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (tooBig) return reject({ status: 413, message: "Request body is too large." });
      const text = Buffer.concat(chunks).toString("utf8");
      if (text.trim() === "") return reject({ status: 400, message: "Request body is empty." });
      try {
        resolve(JSON.parse(text));
      } catch (err) {
        reject({ status: 400, message: "Malformed JSON in request body." });
      }
    });

    req.on("error", () => reject({ status: 400, message: "Could not read request body." }));
  });
}

/* ------------------------------------------------------------------ */
/* Route handlers                                                      */
/* ------------------------------------------------------------------ */

function findIndexById(tasks, id) {
  return tasks.findIndex((t) => t.id === id);
}

// IDs we create are UUIDs. Reject anything else early with a 400.
function isValidId(id) {
  return /^[A-Za-z0-9-]{1,64}$/.test(id);
}

async function handleRequest(req, res) {
  setCorsHeaders(res);

  // Browsers send an OPTIONS "preflight" request before POST/PUT/DELETE.
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const parts = pathname.split("/").filter(Boolean); // e.g. ["api","tasks","123"]

  // GET /api/health
  if (pathname === "/api/health") {
    if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed." });
    return sendJson(res, 200, { status: "ok", message: "Backend is running." });
  }

  // Everything below is /api/tasks or /api/tasks/:id
  if (parts[0] !== "api" || parts[1] !== "tasks" || parts.length > 3) {
    return sendJson(res, 404, { error: "Route not found." });
  }

  const id = parts[2]; // undefined for /api/tasks
  if (id !== undefined && !isValidId(id)) {
    return sendJson(res, 400, { error: "Invalid task ID." });
  }

  /* ----- /api/tasks ----- */
  if (id === undefined) {
    if (req.method === "GET") {
      return sendJson(res, 200, readTasks());
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const { errors, values } = validateTask(body, true);
      if (Object.keys(errors).length > 0) {
        return sendJson(res, 400, { error: "Validation failed.", details: errors });
      }

      const now = new Date().toISOString();
      const task = {
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description || "",
        priority: values.priority || "Medium",
        status: values.status || "Pending",
        dueDate: values.dueDate || null,
        createdAt: now,
        updatedAt: now,
      };

      const tasks = readTasks();
      tasks.push(task);
      writeTasks(tasks);
      return sendJson(res, 201, task);
    }

    return sendJson(res, 405, { error: "Method not allowed." });
  }

  /* ----- /api/tasks/:id ----- */
  if (req.method === "GET") {
    const task = readTasks().find((t) => t.id === id);
    if (!task) return sendJson(res, 404, { error: "Task not found." });
    return sendJson(res, 200, task);
  }

  if (req.method === "PUT") {
    const body = await readJsonBody(req);
    const { errors, values } = validateTask(body, false);
    if (Object.keys(errors).length > 0) {
      return sendJson(res, 400, { error: "Validation failed.", details: errors });
    }

    const tasks = readTasks();
    const index = findIndexById(tasks, id);
    if (index === -1) return sendJson(res, 404, { error: "Task not found." });

    tasks[index] = { ...tasks[index], ...values, updatedAt: new Date().toISOString() };
    writeTasks(tasks);
    return sendJson(res, 200, tasks[index]);
  }

  if (req.method === "DELETE") {
    const tasks = readTasks();
    const index = findIndexById(tasks, id);
    if (index === -1) return sendJson(res, 404, { error: "Task not found." });

    const [removed] = tasks.splice(index, 1);
    writeTasks(tasks);
    return sendJson(res, 200, { message: "Task deleted.", task: removed });
  }

  return sendJson(res, 405, { error: "Method not allowed." });
}

/* ------------------------------------------------------------------ */
/* Start the server                                                    */
/* ------------------------------------------------------------------ */

ensureTasksFile();

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    if (res.headersSent) return;
    // Errors we threw on purpose (e.g. malformed JSON) carry a status code.
    if (err && err.status) return sendJson(res, err.status, { error: err.message });
    console.error("Server error:", err);
    sendJson(res, 500, { error: (err && err.message) || "Internal server error." });
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use. Close the other program or set a different PORT.");
  } else {
    console.error("Server failed to start:", err.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log("Task API running at http://localhost:" + PORT);
  console.log("Health check:      http://localhost:" + PORT + "/api/health");
});
