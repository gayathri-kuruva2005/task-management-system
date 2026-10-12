export const STATUSES = ["Pending", "In Progress", "Completed"];
export const PRIORITIES = ["Low", "Medium", "High"];

// Today's date as YYYY-MM-DD in the user's local time zone.
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// "2026-10-12" -> "12 Oct 2026"
export function formatDate(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(task) {
  return Boolean(task.dueDate) && task.status !== "Completed" && task.dueDate < todayString();
}

// Turns "In Progress" into "in-progress" for CSS class names.
export function slug(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}
