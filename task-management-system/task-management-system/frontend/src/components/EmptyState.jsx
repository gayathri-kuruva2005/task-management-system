export default function EmptyState({ onAdd }) {
  return (
    <div className="state" data-testid="empty-state">
      <h2>No tasks yet</h2>
      <p>Add your first task to start tracking your work.</p>
      <button className="btn btn-primary" onClick={onAdd}>
        + Add task
      </button>
    </div>
  );
}
