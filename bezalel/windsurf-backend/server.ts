import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import Replicate from "replicate";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // adjust in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// AI Enhancement Route (Replicate API with ControlNet Scribble)
app.post("/api/enhance", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786e9257117c67b3c96d1384b61c82c01c5f83e",
      {
        input: {
          image, // URL or base64 from client
          prompt:
            prompt ||
            "Enhance sketch to detailed artwork, vibrant colors, clean lines",
          num_outputs: 1,
          num_inference_steps: 50,
        },
      }
    );

    res.json({ enhancedImage: output });
  } catch (error) {
    console.error("Enhance error:", error);
    res.status(500).json({ error: "AI enhancement failed" });
  }
});

// WebRTC Signaling + Viewer Count
io.on("connection", (socket) => {
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);

    // Emit viewer count (subtract 1 for the drawer)
    const room = io.sockets.adapter.rooms.get(sessionId);
    const viewerCount = room ? room.size - 1 : 0;
    io.to(sessionId).emit("viewerCount", viewerCount);
  });

  socket.on("offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("offer", offer);
  });

  socket.on("answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    // Update viewer count for all sessions the socket was in
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const roomData = io.sockets.adapter.rooms.get(room);
        const viewerCount = roomData ? roomData.size - 1 : 0;
        io.to(room).emit("viewerCount", viewerCount);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
