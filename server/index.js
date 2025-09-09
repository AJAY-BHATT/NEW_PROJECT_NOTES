
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigin = process.env.CLIENT_URL || "*";
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());


const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}
await mongoose.connect(MONGODB_URI);

// Note Model per spec
const noteSchema = new mongoose.Schema({
  title: String,
  content: { type: String, default: "" },
  updatedAt: Date
});
const Note = mongoose.model("Note", noteSchema);

// Socket.IO
const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, methods: ["GET", "POST"] }
});

// roomId -> Map(socketId -> username)
const roomUsers = new Map();

function getUsersInRoom(roomId) {
  const m = roomUsers.get(roomId);
  if (!m) return [];
  return Array.from(m.values());
}

io.on("connection", (socket) => {
  // join_note: { noteId, username }
  socket.on("join_note", ({ noteId, username }) => {
    socket.join(noteId);

    if (!roomUsers.has(noteId)) roomUsers.set(noteId, new Map());
    roomUsers.get(noteId).set(socket.id, username || "Guest");

    io.to(noteId).emit("active_users", {
      noteId,
      users: getUsersInRoom(noteId)
    });
  });

  // note_update: { noteId, content, updatedBy, updatedAt }
  socket.on("note_update", ({ noteId, content, updatedBy, updatedAt }) => {
    // Broadcast to others in the room
    socket.to(noteId).emit("note_update", {
      noteId,
      content,
      updatedBy,
      updatedAt
    });
  });

  socket.on("disconnecting", () => {
    const rooms = socket.rooms; // includes socket.id and joined rooms
    for (const roomId of rooms) {
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        io.to(roomId).emit("active_users", {
          noteId: roomId,
          users: getUsersInRoom(roomId)
        });
      }
    }
  });
});

// Routes
app.get("/", (req, res) => res.send("Collaborative Notes API OK"));

// Create note
app.post("/notes", async (req, res) => {
  try {
    const { title } = req.body;
    const note = await Note.create({
      title,
      content: "",
      updatedAt: new Date()
    });
    res.status(201).json(note);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get note
app.get("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Update note (fallback / autosave target)
app.put("/notes/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { content, updatedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
