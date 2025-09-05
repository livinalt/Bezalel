import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { customAlphabet } from "nanoid";
import { v4 as uuid } from "uuid";

// Generate short IDs (e.g., "abcdefghij")
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10);

interface BoardData {
  [key: string]: unknown;
}

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

// Mock Daydream API
app.post("/mock/daydream/streams", (req, res) => {
  console.log("Mock API called with body:", req.body);
  res.json({
    id: "mock123",
    whip_url: "https://mock-ingest.daydream.live",
    output_playback_id: "mock-playback-id",
  });
});

// Store short ID to board data mapping
const idMapping: Map<string, { boardId: string; data: BoardData }> = new Map();
const sessions: { [key: string]: number } = {};

// API to verify board existence
app.get("/api/board/:shortId", (req, res) => {
  const shortId = req.params.shortId;
  const board = idMapping.get(shortId);
  if (board) {
    res.json({ shortId, boardId: board.boardId });
  } else if (
    shortId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    res
      .status(410)
      .json({ error: "Legacy UUID detected. Please create a new board." });
  } else {
    res.status(404).json({ error: "Board not found" });
  }
});

// API to create a new board
app.post("/api/board", (_req, res) => {
  const shortId = nanoid();
  const boardId = uuid();
  idMapping.set(shortId, { boardId, data: {} });
  console.log(`Created board: ${shortId} -> ${boardId}`);
  res.json({ shortId, boardId });
});

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on(
    "createBoard",
    (callback: (data: { shortId: string; boardId: string }) => void) => {
      const shortId = nanoid();
      const boardId = uuid();
      idMapping.set(shortId, { boardId, data: {} });
      console.log(
        `Socket ${socket.id} created board: ${shortId} -> ${boardId}`
      );
      callback({ shortId, boardId });
    }
  );

  socket.on("joinSession", (shortId: string) => {
    const board = idMapping.get(shortId);
    if (!board) {
      socket.emit("error", { message: "Board not found" });
      console.log(
        `Socket ${socket.id} tried to join non-existent board ${shortId}`
      );
      return;
    }
    socket.join(board.boardId);
    sessions[board.boardId] = (sessions[board.boardId] || 0) + 1;
    console.log(
      `Socket ${socket.id} joined board ${board.boardId} (shortId: ${shortId})`
    );
    io.to(board.boardId).emit("viewerCount", sessions[board.boardId]);
  });

  socket.on(
    "playbackInfo",
    ({ playbackUrl, roomId }: { playbackUrl: string; roomId: string }) => {
      const board = idMapping.get(roomId);
      if (!board) {
        socket.emit("error", { message: "Board not found" });
        return;
      }
      console.log(
        `Broadcasting playbackInfo for board ${board.boardId} (shortId: ${roomId}): ${playbackUrl}`
      );
      io.to(board.boardId).emit("playbackInfo", { playbackUrl });
    }
  );

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const shortId of idMapping.keys()) {
      const board = idMapping.get(shortId);
      if (
        board &&
        io.sockets.adapter.rooms.get(board.boardId)?.has(socket.id)
      ) {
        sessions[board.boardId] = Math.max(
          (sessions[board.boardId] || 0) - 1,
          0
        );
        io.to(board.boardId).emit("viewerCount", sessions[board.boardId]);
        if (sessions[board.boardId] === 0) {
          delete sessions[board.boardId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
