export default function Header({ onAdd }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div>
          <h1>Task Management System</h1>
          <p className="header-sub">Plan your work, track progress, and finish what matters.</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add task
        </button>
      </div>
    </header>
  );
}
