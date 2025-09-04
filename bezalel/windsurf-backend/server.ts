import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your Next.js app
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// --- Health check ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// --- Store playback info + viewers per room ---
const rooms: Record<string, { playbackUrl?: string; viewers: Set<string> }> =
  {};

// --- Socket.io handling ---
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // When a viewer or board joins a room
  socket.on("joinRoom", (roomId: string) => {
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = { viewers: new Set() };
    }

    socket.join(roomId);
    rooms[roomId].viewers.add(socket.id);

    // Send current playbackUrl if it exists
    if (rooms[roomId].playbackUrl) {
      socket.emit("playbackInfo", {
        playbackUrl: rooms[roomId].playbackUrl,
      });
    }

    // Update viewer count
    io.to(roomId).emit("viewerCount", rooms[roomId].viewers.size);
  });

  // When the board host sets/updates playback
  socket.on("setPlaybackUrl", ({ roomId, playbackUrl }) => {
    console.log(`Room ${roomId} playback set: ${playbackUrl}`);
    if (!rooms[roomId]) {
      rooms[roomId] = { viewers: new Set() };
    }

    rooms[roomId].playbackUrl = playbackUrl;
    io.to(roomId).emit("playbackInfo", { playbackUrl });
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const roomId in rooms) {
      rooms[roomId].viewers.delete(socket.id);
      io.to(roomId).emit("viewerCount", rooms[roomId].viewers.size);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
