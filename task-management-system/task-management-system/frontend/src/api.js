// All communication with the Node.js backend happens here, using fetch().

const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API_URL + path, {
      ...options,
      // Only send a Content-Type header when we actually send a body.
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch (err) {
    const error = new Error(
      "Can't reach the backend. Start it with `npm start` in the backend folder (http://localhost:5000)."
    );
    error.network = true;
    throw error;
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    // response had no JSON body
  }

  if (!response.ok) {
    const error = new Error((data && data.error) || "Request failed (status " + response.status + ").");
    error.details = (data && data.details) || {};
    throw error;
  }
  return data;
}

export const getTasks = () => request("/tasks");

export const createTask = (task) =>
  request("/tasks", { method: "POST", body: JSON.stringify(task) });

export const updateTask = (id, changes) =>
  request("/tasks/" + id, { method: "PUT", body: JSON.stringify(changes) });

export const deleteTask = (id) => request("/tasks/" + id, { method: "DELETE" });
