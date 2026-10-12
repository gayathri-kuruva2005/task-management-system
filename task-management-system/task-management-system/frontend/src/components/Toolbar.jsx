import { STATUSES, PRIORITIES } from "../utils.js";

export default function Toolbar({ filters, onChange, onClear, shown, total }) {
  const hasFilters =
    filters.search !== "" || filters.status !== "All" || filters.priority !== "All";

  return (
    <section className="toolbar" aria-label="Search, filter and sort">
      <div className="field field-search">
        <label htmlFor="search">Search by title</label>
        <input
          id="search"
          type="search"
          placeholder="Type to search…"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => onChange("status", e.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-priority">Priority</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={(e) => onChange("priority", e.target.value)}
        >
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={filters.sort} onChange={(e) => onChange("sort", e.target.value)}>
          <option value="created-desc">Created: newest first</option>
          <option value="created-asc">Created: oldest first</option>
          <option value="due-asc">Due date: soonest first</option>
          <option value="due-desc">Due date: latest first</option>
        </select>
      </div>

      <div className="toolbar-meta">
        <span data-testid="result-count">
          Showing {shown} of {total}
        </span>
        {hasFilters && (
          <button className="btn btn-link" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
