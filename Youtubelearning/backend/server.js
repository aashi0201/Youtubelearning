require("dotenv").config();
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./config/env");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const createApp = require("./app");
const Message = require("./models/Message");
const { initCron } = require("./cron/syncActivity");

env.validateStartupEnv();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"],
});

if (env.REDIS_URL) {
  const pubClient = createClient({ url: env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  }).catch((err) => {
    console.error("Redis adapter connection error:", err);
  });
}

// Store online users: Map<userId, socketId>
const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.error("[Socket Middleware] Connection rejected: Missing token");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Force ID to string to avoid Map mismatch (Object vs String)
    const rawId = decoded.id || decoded._id || decoded.userId;
    socket.userId = String(rawId);
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.userId);
  console.log(`[Socket] User joined: ${userId} (Socket: ${socket.id})`);
  
  // Update with the latest socket ID for this user
  onlineUsers.set(userId, socket.id);
  
  const onlineIds = Array.from(onlineUsers.keys());
  io.emit("onlineUsers", onlineIds);
  console.log("[Socket] Current online count:", onlineIds.length);

  socket.on("sendMessage", async ({ receiverId, message }) => {
    try {
      const receiverIdStr = String(receiverId);
      const senderIdStr = String(socket.userId);

      const newMessage = await Message.create({
        sender: senderIdStr,
        receiver: receiverIdStr,
        content: message,
      });
      
      console.log(`[Message] ${senderIdStr} -> ${receiverIdStr}: "${message}"`);

      const messageData = newMessage.toObject();
      // Ensure sender and receiver IDs are strings in the emitted object
      messageData.sender = String(messageData.sender);
      messageData.receiver = String(messageData.receiver);

      const receiverSocketId = onlineUsers.get(receiverIdStr);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageData);
        console.log(`[Socket] Delivered to receiver socket: ${receiverSocketId}`);
      } else {
        console.log(`[Socket] Receiver ${receiverIdStr} is OFFLINE.`);
      }

      // ALWAYS send back to sender so their UI updates
      socket.emit("newMessage", messageData);
    } catch (err) {
      console.error("[Socket] Message error:", err);
    }
  });

  socket.on("typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { userId: senderId });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", socket.userId, "Remaining online:", onlineUsers.size);
  });
});


app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Initialize Cron Jobs
initCron(io);

console.log("Configuration validated");

async function startServer() {
  try {
    if (env.DATABASE_PROVIDER === "mongo") {
      await mongoose.connect(env.MONGO_URI);
      console.log("MongoDB connected");
    } else {
      console.log("MongoDB skipped because DATABASE_PROVIDER=supabase");
    }

    const PORT = env.PORT;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      if (env.DATABASE_PROVIDER === "mongo") {
        await mongoose.connection.close(false);
        console.log("MongoDB connection closed");
      }
      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error.message);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
