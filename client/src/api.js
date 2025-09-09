
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function createNote(title) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export async function getNote(id) {
  const res = await fetch(`${API_BASE}/notes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch note");
  return res.json();
}

export async function saveNote(id, content) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}
