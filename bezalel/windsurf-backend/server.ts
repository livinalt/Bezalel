import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

// Mock Daydream API for testing
app.post("/mock/daydream/streams", (req, res) => {
  console.log("Mock API called with body:", req.body);
  res.json({
    id: "mock123",
    whip_url: "https://mock-ingest.daydream.live",
    output_playback_id: "mock-playback-id",
  });
});

const sessions: { [key: string]: number } = {};

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on("joinSession", (sessionId: string) => {
    socket.join(sessionId);
    sessions[sessionId] = (sessions[sessionId] || 0) + 1;
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
    io.to(sessionId).emit("viewerCount", sessions[sessionId]);
  });

  socket.on(
    "playbackInfo",
    ({ playbackUrl, roomId }: { playbackUrl: string; roomId: string }) => {
      console.log(
        `Broadcasting playbackInfo for room ${roomId}: ${playbackUrl}`
      );
      io.to(roomId).emit("playbackInfo", { playbackUrl });
    }
  );

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const sessionId in sessions) {
      if (io.sockets.adapter.rooms.get(sessionId)?.has(socket.id)) {
        sessions[sessionId] = Math.max((sessions[sessionId] || 0) - 1, 0);
        io.to(sessionId).emit("viewerCount", sessions[sessionId]);
        if (sessions[sessionId] === 0) {
          delete sessions[sessionId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
