const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Message = require("../models/Message");

// [GET] /api/community/users
router.get("/users", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const { search } = req.query;

    const query = { _id: { $ne: currentUserId } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    let selectFields = "name username avatar bio stats level skills leetcode codeforces codechef tuf github location schoolCompany website socialLinks";
    
    const users = await User.find(query)
      .select(selectFields)
      .lean();

    // Auto-migrate legacy pending connections to accepted
    await Connection.updateMany(
      { status: { $ne: "accepted" } },
      { $set: { status: "accepted" } }
    );

    // Calculate real accepted connection count for each user
    const acceptedConnections = await Connection.find({ status: "accepted" }).lean();
    const countMap = {};
    for (const conn of acceptedConnections) {
      const s = String(conn.sender?._id || conn.sender || "");
      const r = String(conn.receiver?._id || conn.receiver || "");
      if (s) countMap[s] = (countMap[s] || 0) + 1;
      if (r) countMap[r] = (countMap[r] || 0) + 1;
    }

    // Direct connections for current logged in user
    const myConnections = await Connection.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ],
      status: "accepted"
    }).lean();

    const myConnectedPeerIds = new Set(
      myConnections.map((c) => {
        const s = String(c.sender?._id || c.sender || "");
        const r = String(c.receiver?._id || c.receiver || "");
        return s === String(currentUserId) ? r : s;
      })
    );

    const enrichedUsers = users.map((u) => {
      const uId = String(u._id);
      let cCount = countMap[uId] || 0;
      if (myConnectedPeerIds.has(uId)) {
        cCount = Math.max(cCount, 1);
      }
      return {
        ...u,
        connectionsCount: cCount,
        stats: {
          ...(u.stats || {}),
          connectionsCount: cCount,
        },
      };
    });

    res.json({
      success: true,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// [GET] /api/community/leaderboard
router.get("/leaderboard", auth, async (req, res) => {
  try {
    const { sortBy = "xp" } = req.query;
    
    let sortObj = {};
    if (sortBy === "streak") sortObj = { "stats.streakDays": -1 };
    else if (sortBy === "videos") sortObj = { "stats.completedVideos": -1 };
    else sortObj = { "stats.xp": -1 };

    const topUsers = await User.find({ isActive: true })
      .select("name username avatar stats level bio")
      .sort(sortObj)
      .limit(20)
      .lean();

    res.json({
      success: true,
      leaderboard: topUsers
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// [POST] /send-request
router.post("/send-request", auth, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const { receiverId } = req.body;
    
    if (!receiverId) return res.status(400).json({ error: "Receiver ID required" });

    // Check existing
    let connection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (connection) {
      connection.status = "accepted";
      await connection.save();
    } else {
      connection = new Connection({
        sender: senderId,
        receiver: receiverId,
        status: "accepted",
      });
      await connection.save();
    }

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("request_accepted", { senderId, receiverId });
        io.to(receiverSocketId).emit("new_request", { senderId, receiverId });
      }
    }

    res.json({ success: true, message: "Connected successfully", connection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] /accept-request
router.post("/accept-request", auth, async (req, res) => {
  try {
    const { connectionId } = req.body;
    const connection = await Connection.findById(connectionId);

    if (!connection) return res.status(404).json({ error: "Connection not found" });

    connection.status = "accepted";
    await connection.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const senderSocketId = onlineUsers.get(connection.sender.toString());
      const receiverSocketId = onlineUsers.get(connection.receiver.toString());
      
      if (senderSocketId) {
        io.to(senderSocketId).emit("request_accepted", { senderId: connection.sender, receiverId: connection.receiver });
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("request_accepted", { senderId: connection.sender, receiverId: connection.receiver });
      }
    }

    res.json({ success: true, message: "Request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] /remove-connection
router.post("/remove-connection", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.userId || req.user.id;

    await Connection.findOneAndDelete({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const targetSocketId = onlineUsers.get(userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("connection_removed", { userId1: currentUserId, userId2: userId });
      }
    }

    res.json({ success: true, message: "Connection removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /requests
router.get("/requests", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const requests = await Connection.find({
      receiver: userId,
      status: "pending",
    }).populate("sender", "name username avatar");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /connections
router.get("/connections", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Ensure all connections involving this user are active
    await Connection.updateMany(
      {
        $or: [{ sender: userId }, { receiver: userId }],
        status: { $ne: "accepted" }
      },
      { $set: { status: "accepted" } }
    );

    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" },
      ],
    }).populate("sender receiver", "name username avatar bio stats level skills github leetcode codeforces");

    const acceptedConnections = await Connection.find({ status: "accepted" }).lean();
    const countMap = {};
    for (const conn of acceptedConnections) {
      const s = String(conn.sender?._id || conn.sender || "");
      const r = String(conn.receiver?._id || conn.receiver || "");
      if (s) countMap[s] = (countMap[s] || 0) + 1;
      if (r) countMap[r] = (countMap[r] || 0) + 1;
    }

    const users = connections.map((c) => {
      const sId = String(c.sender?._id || c.sender || "");
      const other = sId === String(userId) ? c.receiver : c.sender;
      const otherObj = other?.toObject ? other.toObject() : other || {};
      const otherId = String(otherObj?._id || "");
      const cCount = Math.max(countMap[otherId] || 0, 1);
      return {
        ...otherObj,
        user: {
          ...otherObj,
          connectionsCount: cCount,
        },
        connectionsCount: cCount,
        connectionId: c._id,
      };
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /api/community/messages/:userId
router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const currentUserId = String(req.user.userId || req.user.id);
    const otherUserId = String(req.params.userId);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Deduplicate any consecutive duplicate messages from DB history
    const deduped = [];
    for (const m of messages) {
      const isDuplicate = deduped.some((existing) => {
        if (String(existing._id) === String(m._id)) return true;
        const sameSender = String(existing.sender) === String(m.sender);
        const sameReceiver = String(existing.receiver) === String(m.receiver);
        const sameContent = String(existing.content || "").trim() === String(m.content || "").trim();
        const timeDiff = Math.abs(new Date(existing.createdAt).getTime() - new Date(m.createdAt).getTime());
        return sameSender && sameReceiver && sameContent && timeDiff < 3000;
      });

      if (!isDuplicate) {
        deduped.push({
          ...m,
          _id: String(m._id),
          sender: String(m.sender),
          receiver: String(m.receiver),
          senderId: String(m.sender),
          receiverId: String(m.receiver),
          message: m.content,
        });
      }
    }

    res.json(deduped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] Internal Message Saving
router.post("/messages", auth, async (req, res) => {
  try {
    const senderId = String(req.user.userId || req.user.id);
    const { receiverId, message } = req.body;
    const receiverIdStr = String(receiverId || "").trim();
    const text = String(message || "").trim();

    if (!receiverIdStr || !text) {
      return res.status(400).json({ error: "receiverId and message are required" });
    }

    // Duplicate guard: if identical message was saved in last 2.5 seconds (e.g. by socket), return it
    const recent = await Message.findOne({
      sender: senderId,
      receiver: receiverIdStr,
      content: text,
      createdAt: { $gte: new Date(Date.now() - 2500) },
    }).lean();

    if (recent) {
      const messageData = {
        ...recent,
        _id: String(recent._id),
        sender: senderId,
        receiver: receiverIdStr,
        senderId,
        receiverId: receiverIdStr,
        content: text,
        message: text,
      };
      return res.json(messageData);
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverIdStr,
      content: text,
    });

    await newMessage.save();

    const messageData = {
      ...newMessage.toObject(),
      _id: String(newMessage._id),
      sender: senderId,
      receiver: receiverIdStr,
      senderId,
      receiverId: receiverIdStr,
      content: text,
      message: text,
    };

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const receiverSocketId = onlineUsers.get(receiverIdStr);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageData);
      }
    }

    res.json(messageData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /api/community/users/:userId - Full public profile
router.get("/users/:userId", auth, async (req, res) => {
  try {
    const currentUserId = String(req.user.userId || req.user.id);
    const targetParam = req.params.userId;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(targetParam)) {
      user = await User.findById(targetParam)
        .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
        .lean();
    }

    if (!user) {
      user = await User.findOne({ username: targetParam })
        .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
        .lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const targetUserId = String(user._id);

    // Check connection between current user and target user
    const connection = await Connection.findOne({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
      status: "accepted",
    });

    // Calculate total connections for this user
    const userConnections = await Connection.find({
      $or: [
        { sender: targetUserId },
        { receiver: targetUserId },
      ],
      status: "accepted",
    }).lean();

    let connectionsCount = userConnections.length;
    if (connection && connectionsCount === 0) {
      connectionsCount = 1;
    }

    res.json({
      success: true,
      user: {
        ...user,
        portfolioProjects: Array.isArray(user.portfolioProjects) ? user.portfolioProjects : [],
        experience: Array.isArray(user.experience) ? user.experience : [],
        education: Array.isArray(user.education) ? user.education : [],
        skills: Array.isArray(user.skills) ? user.skills : [],
        socialLinks: user.socialLinks || {},
        verifiedPlatforms: user.verifiedPlatforms || {},
        stats: user.stats || { streakDays: 0, xp: 0, completedVideos: 0, totalWatchTimeSec: 0, completedPlaylists: 0 },
        connectionsCount,
        isConnected: Boolean(connection),
      },
    });
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
});

module.exports = router;
