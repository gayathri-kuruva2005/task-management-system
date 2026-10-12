import { useCallback, useEffect, useMemo, useState } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "./api.js";
import Header from "./components/Header.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Toolbar from "./components/Toolbar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskForm from "./components/TaskForm.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Spinner from "./components/Spinner.jsx";
import EmptyState from "./components/EmptyState.jsx";

const DEFAULT_FILTERS = { search: "", status: "All", priority: "All", sort: "created-desc" };

// Sort helpers. Tasks without a due date always go to the end.
function sortTasks(list, sort) {
  const sorted = [...list];
  if (sort === "created-desc") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "created-asc") sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "due-asc" || sort === "due-desc") {
    const direction = sort === "due-asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) * direction;
    });
  }
  return sorted;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [formState, setFormState] = useState({ open: false, task: null }); // task = null means "add"
  const [deleteState, setDeleteState] = useState({ task: null, busy: false, error: "" });
  const [busyId, setBusyId] = useState(null); // task currently being updated
  const [toast, setToast] = useState(null);

  /* ---- loading ---- */
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setTasks(await getTasks());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /* ---- toast messages ---- */
  function showToast(message, type = "success") {
    setToast({ message, type });
  }
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---- actions (each one calls the backend, then updates state) ---- */
  async function handleSave(data) {
    // Errors are thrown on purpose so the form can display them.
    if (formState.task) {
      const updated = await updateTask(formState.task.id, data);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast("Task updated.");
    } else {
      const created = await createTask(data);
      setTasks((prev) => [...prev, created]);
      showToast("Task added.");
    }
    setFormState({ open: false, task: null });
  }

  async function handleStatusChange(task, status) {
    setBusyId(task.id);
    try {
      const updated = await updateTask(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      showToast("Couldn't change status. " + err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    const task = deleteState.task;
    setDeleteState((s) => ({ ...s, busy: true, error: "" }));
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setDeleteState({ task: null, busy: false, error: "" });
      showToast("Task deleted.");
    } catch (err) {
      setDeleteState({ task, busy: false, error: err.message });
    }
  }

  /* ---- search, filter, sort ---- */
  const visibleTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const filtered = tasks.filter(
      (t) =>
        (query === "" || t.title.toLowerCase().includes(query)) &&
        (filters.status === "All" || t.status === filters.status) &&
        (filters.priority === "All" || t.priority === filters.priority)
    );
    return sortTasks(filtered, filters.sort);
  }, [tasks, filters]);

  const openAddForm = () => setFormState({ open: true, task: null });
  const closeForm = useCallback(() => setFormState({ open: false, task: null }), []);
  const closeDelete = useCallback(() => setDeleteState({ task: null, busy: false, error: "" }), []);

  /* ---- what to show in the list area ---- */
  let content;
  if (loading) {
    content = <Spinner />;
  } else if (loadError) {
    content = (
      <div className="state state-error" role="alert" data-testid="load-error">
        <h2>Couldn't load your tasks</h2>
        <p>{loadError}</p>
        <button className="btn btn-primary" onClick={loadTasks}>
          Try again
        </button>
      </div>
    );
  } else if (tasks.length === 0) {
    content = <EmptyState onAdd={openAddForm} />;
  } else if (visibleTasks.length === 0) {
    content = (
      <div className="state" data-testid="no-matches">
        <h2>No tasks match</h2>
        <p>Try a different search or clear the filters.</p>
        <button className="btn btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
          Clear filters
        </button>
      </div>
    );
  } else {
    content = (
      <ul className="task-list">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            busy={busyId === task.id}
            onEdit={(t) => setFormState({ open: true, task: t })}
            onDelete={(t) => setDeleteState({ task: t, busy: false, error: "" })}
            onStatusChange={handleStatusChange}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <Header onAdd={openAddForm} />

      <main className="container">
        <Dashboard tasks={tasks} />

        <Toolbar
          filters={filters}
          onChange={(name, value) => setFilters((f) => ({ ...f, [name]: value }))}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          shown={visibleTasks.length}
          total={tasks.length}
        />

        {content}
      </main>

      {formState.open && (
        <TaskForm task={formState.task} onSave={handleSave} onCancel={closeForm} />
      )}

      {deleteState.task && (
        <ConfirmDialog
          task={deleteState.task}
          busy={deleteState.busy}
          error={deleteState.error}
          onConfirm={handleConfirmDelete}
          onCancel={closeDelete}
        />
      )}

      {toast && (
        <div className={"toast toast-" + toast.type} role="status">
          {toast.message}
        </div>
      )}
    </>
  );
}
