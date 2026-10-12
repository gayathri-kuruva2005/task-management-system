export default function Dashboard({ tasks }) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === "Pending").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;

  const pct = (n) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <section className="dashboard" aria-label="Task summary">
      <div className="stats">
        <div className="stat stat-total" data-testid="stat-total">
          <span className="stat-label">Total tasks</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat stat-pending" data-testid="stat-pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{pending}</span>
        </div>
        <div className="stat stat-in-progress" data-testid="stat-in-progress">
          <span className="stat-label">In progress</span>
          <span className="stat-value">{inProgress}</span>
        </div>
        <div className="stat stat-completed" data-testid="stat-completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{completed}</span>
        </div>
      </div>

      <div
        className="progress"
        role="img"
        aria-label={completed + " of " + total + " tasks completed"}
      >
        <div className="progress-seg seg-completed" style={{ width: pct(completed) + "%" }} />
        <div className="progress-seg seg-in-progress" style={{ width: pct(inProgress) + "%" }} />
        <div className="progress-seg seg-pending" style={{ width: pct(pending) + "%" }} />
      </div>
    </section>
  );
}
