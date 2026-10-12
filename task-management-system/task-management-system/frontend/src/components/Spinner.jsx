export default function Spinner({ label = "Loading tasks…" }) {
  return (
    <div className="state" role="status" data-testid="loading">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
