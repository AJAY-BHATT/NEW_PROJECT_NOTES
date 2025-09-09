
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { getNote, saveNote } from "../api.js";
import UserBadge from "../components/UserBadge.jsx";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

function randomName() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Guest-${n}`;
}

export default function Editor() {
  const { id } = useParams();
  const [me, setMe] = useState(randomName());
  const [note, setNote] = useState({ title: "", content: "", updatedAt: null });
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const [lastBy, setLastBy] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const socket = useMemo(() => io(SOCKET_URL, { transports: ["websocket"] }), []);
  const saveTimer = useRef(null);
  const lastSent = useRef("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getNote(id);
        setNote(data);
        setContent(data.content || "");
      } catch (e) {
        alert("Invalid Note ID or not found");
      }
    })();
  }, [id]);

  useEffect(() => {
    socket.emit("join_note", { noteId: id, username: me });

    socket.on("active_users", (payload) => {
      if (payload.noteId === id) setUsers(payload.users);
    });

    socket.on("note_update", (payload) => {
      if (payload.noteId !== id) return;
      // Apply incoming content
      setContent(payload.content);
      setLastBy(payload.updatedBy || "Someone");
      setNote((prev) => ({ ...prev, updatedAt: payload.updatedAt || prev.updatedAt }));
      setStatus("Updated live");
      setTimeout(()=>setStatus(""), 1200);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, me, socket]);

  // Broadcast local changes live
  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    const now = new Date().toISOString();
    setLastBy(me);
    setNote((prev) => ({ ...prev, updatedAt: now }));

    socket.emit("note_update", {
      noteId: id,
      content: val,
      updatedBy: me,
      updatedAt: now
    });
  }

  // Auto-save every ~7 seconds (and on unload)
  useEffect(() => {
    function doSave() {
      if (content === lastSent.current) return;
      setSaving(true);
      saveNote(id, content)
        .then((saved) => {
          setNote((prev) => ({ ...prev, updatedAt: saved.updatedAt }));
          lastSent.current = content;
        })
        .catch((e) => console.error(e))
        .finally(() => setSaving(false));
    }

    saveTimer.current = setInterval(doSave, 7000);
    window.addEventListener("beforeunload", doSave);
    return () => {
      clearInterval(saveTimer.current);
      window.removeEventListener("beforeunload", doSave);
    };
  }, [id, content]);

  async function saveNow() {
    setSaving(true);
    try {
      const saved = await saveNote(id, content);
      setNote((prev) => ({ ...prev, updatedAt: saved.updatedAt }));
      lastSent.current = content;
      setStatus("Saved");
      setTimeout(()=>setStatus(""), 1200);
    } catch (e) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="space flex" style={{gap: 8, flexWrap: "wrap"}}>
        <div style={{display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
          <h1 style={{margin: 0}}>{note.title || "Untitled"}</h1>
          <span className="small">ID: <code>{id}</code></span>
        </div>
        <div className="row" style={{alignItems: "center"}}>
          <input
            style={{width: 140}}
            value={me}
            onChange={(e)=>setMe(e.target.value)}
            title="Change your display name"
          />
          <button onClick={saveNow} disabled={saving}>{saving ? "Saving..." : "Save Now"}</button>
        </div>
      </div>

      <hr />

      <div className="space flex" style={{gap: 8, flexWrap: "wrap"}}>
        <div className="row" style={{alignItems: "center"}}>
          <span className="badge">👥 {users.length} active</span>
          {users.map((u,i) => <UserBadge key={i} name={u} />)}
        </div>
        <div className="small">
          {note.updatedAt && (
            <>
              Last updated: {new Date(note.updatedAt).toLocaleString()}{" "}
              {lastBy && <>by <b>{lastBy}</b></>}
            </>
          )}
          {!note.updatedAt && "Not saved yet"}
          {status && <> • {status}</>}
        </div>
      </div>

      <hr />

      <textarea
        className="textarea"
        value={content}
        onChange={handleChange}
        placeholder="Start typing..."
      />
    </div>
  );
}
