import { useEffect } from "react";

export default function ConfirmDialog({ task, busy, error, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="dialog dialog-small" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Delete this task?</h2>
        <p>
          “{task.title}” will be permanently removed. This can't be undone.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Keep task
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </div>
    </div>
  );
}
