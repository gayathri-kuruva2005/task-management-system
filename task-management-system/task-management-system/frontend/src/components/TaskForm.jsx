import { useEffect, useRef, useState } from "react";
import { STATUSES, PRIORITIES, todayString } from "../utils.js";

// Used for both creating (task = null) and editing (task = existing task).
export default function TaskForm({ task, onSave, onCancel }) {
  const isEditing = Boolean(task);

  const [values, setValues] = useState({
    title: task ? task.title : "",
    description: task ? task.description : "",
    priority: task ? task.priority : "Medium",
    status: task ? task.status : "Pending",
    dueDate: task && task.dueDate ? task.dueDate : "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current && titleRef.current.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onCancel]);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const found = {};
    const title = values.title.trim();
    if (title === "") found.title = "Enter a title for the task.";
    else if (title.length > 100) found.title = "Keep the title to 100 characters or fewer.";

    if (values.description.trim().length > 500)
      found.description = "Keep the description to 500 characters or fewer.";

    // New tasks can't be due in the past. Existing tasks may already be overdue.
    if (values.dueDate && !isEditing && values.dueDate < todayString())
      found.dueDate = "Choose today or a later date.";

    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || null,
      });
    } catch (err) {
      // Show the server's field-level messages if it sent any.
      if (err.details && Object.keys(err.details).length > 0) setErrors(err.details);
      setSubmitError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <h2 id="form-title">{isEditing ? "Edit task" : "Add task"}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              ref={titleRef}
              value={values.title}
              onChange={handleChange}
              placeholder="e.g. Finish DBMS assignment"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}
          </div>

          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={values.description}
              onChange={handleChange}
              placeholder="Add any details you want to remember"
              aria-invalid={Boolean(errors.description)}
            />
            <span className="char-count">{values.description.length}/500</span>
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={values.priority} onChange={handleChange}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.priority && <p className="field-error">{errors.priority}</p>}
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={values.status} onChange={handleChange}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.status && <p className="field-error">{errors.status}</p>}
            </div>

            <div className="field">
              <label htmlFor="dueDate">Due date (optional)</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={values.dueDate}
                onChange={handleChange}
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
            </div>
          </div>

          {submitError && <p className="form-error" role="alert">{submitError}</p>}

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
