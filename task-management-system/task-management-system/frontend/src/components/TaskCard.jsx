import { STATUSES, formatDate, isOverdue, slug } from "../utils.js";

export default function TaskCard({ task, busy, onEdit, onDelete, onStatusChange }) {
  const overdue = isOverdue(task);

  return (
    <li className={"task task-" + slug(task.status)} data-testid="task-card">
      <div className="task-main">
        <div className="task-head">
          <h3 className="task-title">{task.title}</h3>
          <div className="badges">
            <span className={"badge badge-priority-" + slug(task.priority)}>
              {task.priority} priority
            </span>
            <span className={"badge badge-status-" + slug(task.status)}>{task.status}</span>
          </div>
        </div>

        {task.description && <p className="task-desc">{task.description}</p>}

        <p className="task-meta">
          {task.dueDate ? (
            <span className={overdue ? "due overdue" : "due"}>
              {overdue ? "Overdue: " : "Due "}
              {formatDate(task.dueDate)}
            </span>
          ) : (
            <span className="due none">No due date</span>
          )}
          <span className="created">Created {formatDate(task.createdAt)}</span>
        </p>
      </div>

      <div className="task-actions">
        <label className="visually-hidden" htmlFor={"status-" + task.id}>
          Change status of {task.title}
        </label>
        <select
          id={"status-" + task.id}
          className="status-select"
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatusChange(task, e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" disabled={busy} onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </li>
  );
}
