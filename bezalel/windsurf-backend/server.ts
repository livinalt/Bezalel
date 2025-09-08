import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import winston from "winston";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Debug environment variables
console.log("Loaded environment variables:", {
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
});

// Environment validation
const requiredEnvVars = ["PORT", "CLIENT_URL"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

// Express app setup
const app = express();
const server = createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, "http://localhost:3000"]
  : ["http://localhost:3000"];

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unexpected error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

// Socket.IO connection handling
io.on("connection", (socket: Socket) => {
  logger.info("New socket connection", { socketId: socket.id });

  socket.on("joinSession", (roomId: string) => {
    if (typeof roomId !== "string" || !roomId) {
      logger.warn("Invalid roomId for joinSession", { socketId: socket.id });
      socket.emit("error", { message: "Invalid roomId" });
      return;
    }

    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);
    const viewerCount = room ? room.size : 0;
    io.to(roomId).emit("viewerCount", viewerCount);
    logger.info("Socket joined room", {
      socketId: socket.id,
      roomId,
      viewerCount,
    });
  });

  socket.on("disconnect", () => {
    logger.info("Socket disconnected", { socketId: socket.id });
    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
    rooms.forEach((roomId) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      const viewerCount = room ? room.size : 0;
      io.to(roomId).emit("viewerCount", viewerCount);
      logger.info("Viewer count updated", { roomId, viewerCount });
    });
  });

  socket.on("error", (error) => {
    logger.error("Socket error", { socketId: socket.id, error });
  });
});

// Start server
const PORT = parseInt(process.env.PORT || "3001", 10);
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  io.close();
});
