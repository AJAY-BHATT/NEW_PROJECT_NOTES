
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNote } from "../api.js";

export default function Home() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [joinId, setJoinId] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const note = await createNote(title.trim());
      nav(`/note/${note._id}`);
    } catch (e) {
      alert(e.message);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!joinId.trim()) return;
    nav(`/note/${joinId.trim()}`);
  }

  return (
    <div className="card">
      <h1>Create or Join</h1>
      <div className="row">
        <form onSubmit={handleCreate} className="card" style={{flex: 1, minWidth: 260}}>
          <label>New Note Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Project plan..." />
          <div style={{marginTop: 8}}>
            <button type="submit">Create & Go</button>
          </div>
          <p className="small" style={{marginTop:8}}>You will be redirected to /note/:id</p>
        </form>

        <form onSubmit={handleJoin} className="card" style={{flex: 1, minWidth: 260}}>
          <label>Open by Note ID</label>
          <input value={joinId} onChange={e=>setJoinId(e.target.value)} placeholder="Paste Note ID (Mongo _id)" />
          <div style={{marginTop: 8}}>
            <button type="submit">Open Note</button>
          </div>
          <p className="small" style={{marginTop:8}}>Share this ID with others to collaborate.</p>
        </form>
      </div>
    </div>
  );
}
