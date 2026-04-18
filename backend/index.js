const express = require("express");
const http = require("http");
const net = require("net");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require('path');

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat"); 
const usersRoutes = require("./routes/users");
const friendsRoute = require("./routes/friends.js");
const profileRoutes = require("./routes/profile");
const uploadsRoutes = require("./routes/uploads");
const uploadRoutes = require("./routes/upload");
const groupsRoutes = require("./routes/groups");
const { storeImageDataUrl, getUploadByFilename } = require('./utils/uploadStore');

require("dotenv").config();
const db = require('./db');

const app = express();
const server = http.createServer(app);

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    const parsed = new URL(String(value).trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return String(value).trim().replace(/\/$/, "");
  }
}

const configuredOrigins = String(process.env.CORS_ORIGIN || "")
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL || "https://projekt-frontend-05yt.onrender.com");

const allowedOrigins = Array.from(new Set([
  ...configuredOrigins,
  frontendOrigin,
  frontendOrigin.replace('://karoltomko.sk', '://www.karoltomko.sk'),
  'https://projekt-frontend-05yt.onrender.com',
].filter(Boolean)));

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(normalizedOrigin);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    console.error('CORS blocked origin:', origin, 'allowed:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 50e6, // 50MB - podpora veľkých obrázkov cez paste/upload
});

app.use(cors(corsOptions));
// allow larger payloads for image/video data URLs (paste/upload)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const passport = require('./passport');
app.use(passport.initialize());
// session: false is passed per-route, no global passport.session() needed
// app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoute);
app.use("/api/profile", profileRoutes);
app.use("/api/groups", groupsRoutes);
// serve uploaded files from frontend/public/uploads (primary)
app.use('/uploads', express.static(path.join(__dirname, '..', 'frontend', 'public', 'uploads')));
// fallback for legacy files saved under backend/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// uploads API
app.use('/api/uploads', uploadsRoutes);
// upload (single or multi file handler)
app.use('/api/upload', uploadRoutes);

// Socket.IO
app.set("io", io); // aby sme ho mohli použiť v routách

// Helper: persist image data URL to DB uploads table and return virtual URL path
async function saveImageAttachment(attachment) {
  if (!attachment || attachment.type !== 'image' || !attachment.data) return null;
  const stored = await storeImageDataUrl(
    db,
    attachment.data,
    `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    'images'
  );
  return stored ? stored.url : null;
}

async function serveUploadFromDb(req, res, next) {
  try {
    const { fileName } = req.params;
    const normalizedFileName = String(fileName || '').trim();
    if (!normalizedFileName) return next();

    const row = await getUploadByFilename(db, normalizedFileName);
    if (!row || !row.data) return next();

    if (row.mime_type) res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(row.data);
  } catch (err) {
    console.error('serveUploadFromDb error', err);
    return next();
  }
}

// DB-backed fallback for persisted uploads (when file doesn't exist on disk)
app.get('/uploads/images/:fileName', serveUploadFromDb);
app.get('/uploads/profile_pictures/:fileName', serveUploadFromDb);

// Debug endpoints to assist testing
app.post('/debug/emit', async (req, res) => {
  try {
    const { sender_id, receiver_id, message, save } = req.body;
    let payload;

    if (save) {
      const [result] = await db.execute(
        `INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`,
        [sender_id, receiver_id, message]
      );
      payload = {
        id: result.insertId,
        sender_id: String(sender_id),
        receiver_id: String(receiver_id),
        message,
        created_at: new Date()
      };
    } else {
      payload = {
        id: Date.now(),
        sender_id: String(sender_id),
        receiver_id: String(receiver_id),
        message,
        created_at: new Date()
      };
    }

    io.to(String(receiver_id)).emit('new_message', payload);
    io.to(String(sender_id)).emit('new_message', payload);

    console.log('Debug emit sent', payload);
    res.json({ ok: true, payload });
  } catch (err) {
    console.error('Debug emit error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/debug/rooms/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const sockets = await io.in(id).allSockets();
    res.json({ room: id, count: sockets.size, sockets: Array.from(sockets) });
  } catch (err) {
    console.error('Debug rooms error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/debug/status', (req, res) => {
  const a = server.address();
  res.json({ port: a ? a.port : null, pid: process.pid });
});

const onlineUsers = new Map();
const lastSeenByUser = new Map();
app.set('onlineUsers', onlineUsers);
app.set('lastSeenByUser', lastSeenByUser);

function emitPresence(userId, isOnline) {
  io.emit('presence_update', {
    userId: String(userId),
    isOnline: !!isOnline,
    lastActive: new Date().toISOString()
  });
}

io.on("connection", (socket) => {
  console.log("Nové pripojenie:", socket.id);

  // prihlásenie používateľa do jeho room
  socket.on("join", async (userId) => {
    socket.data.userId = String(userId);
    socket.join(String(userId));

    const currentCount = onlineUsers.get(String(userId)) || 0;
    onlineUsers.set(String(userId), currentCount + 1);
    lastSeenByUser.set(String(userId), new Date().toISOString());
    try {
      await db.execute(
        `UPDATE chat_users SET is_online = 1, last_active = NOW() WHERE id = ?`,
        [userId]
      );
    } catch (e) {
      console.warn('Failed to set online status on join', e && e.message ? e.message : e);
    }
    emitPresence(userId, true);

    console.log(`Používateľ ${userId} pripojený do roomu`);
  });

  socket.on('disconnect', async () => {
    const userId = socket.data && socket.data.userId ? String(socket.data.userId) : null;
    if (!userId) return;

    const currentCount = onlineUsers.get(userId) || 0;
    const nextCount = Math.max(0, currentCount - 1);

    if (nextCount === 0) {
      onlineUsers.delete(userId);
      const ts = new Date().toISOString();
      lastSeenByUser.set(userId, ts);
      try {
        await db.execute(
          `UPDATE chat_users SET is_online = 0, last_active = NOW() WHERE id = ?`,
          [userId]
        );
      } catch (e) {
        console.warn('Failed to set offline status on disconnect', e && e.message ? e.message : e);
      }
      io.emit('presence_update', {
        userId,
        isOnline: false,
        lastActive: ts
      });
      return;
    }

    onlineUsers.set(userId, nextCount);
  });

  // receive message from client via socket and persist to DB
  socket.on('send_message', async (msg, ack) => {
    try {
      const { sender_id, receiver_id, message, reply_to_id } = msg;
      let { attachment } = msg;

      if (attachment && attachment.type === 'image' && attachment.data) {
        try {
          const saved = await saveImageAttachment(attachment);
          if (saved) attachment = saved;
        } catch (err) {
          if (typeof ack === 'function') return ack({ ok: false, error: String(err) });
          throw err;
        }
      }

      // Ak attachment je objekt (napr. video), serializujeme do JSON stringu pre DB
      const attachmentForDb = attachment
        ? (typeof attachment === 'string' ? attachment : JSON.stringify(attachment))
        : null;

      // Validate reply_to_id - ignore temporary IDs (optimistic updates)
      const finalReplyId = reply_to_id && !String(reply_to_id).startsWith('tmp_') ? parseInt(reply_to_id) : null;

      const [result] = await db.execute(
        `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment, reply_to_id) VALUES (?, ?, ?, ?, ?)`
        , [sender_id, receiver_id, message || '', attachmentForDb, finalReplyId]
      );

      // fetch sender username
      const [userInfo] = await db.execute(
        `SELECT username FROM chat_users WHERE id = ?`,
        [sender_id]
      );
      const username = userInfo.length > 0 ? userInfo[0].username : 'Neznámy';

      // fetch reply info if reply_to_id is provided
      let replyTo = null;
      if (reply_to_id) {
        const [replyRows] = await db.execute(
          `SELECT m.id, m.message, m.sender_id, COALESCE(u.username, 'Neznámy') as username 
           FROM chat_messages m
           LEFT JOIN chat_users u ON m.sender_id = u.id
           WHERE m.id = ?`,
          [reply_to_id]
        );
        if (replyRows.length > 0) {
          replyTo = replyRows[0];
          console.log('Reply info loaded:', replyTo);
        }
      }

      // construct saved payload
      const payload = {
        id: result.insertId,
        sender_id: String(sender_id),
        receiver_id: String(receiver_id),
        message: message || '',
        attachment: attachment || null,
        reply_to_id: reply_to_id || null,
        replyTo: replyTo,
        username: username,
        created_at: new Date()
      };

      // ACK back to sender with saved payload
      if (typeof ack === 'function') ack({ ok: true, payload });

      // emit to receiver and sender rooms
      io.to(String(receiver_id)).emit('new_message', payload);
      io.to(String(sender_id)).emit('new_message', payload);

      console.log('Socket send_message saved and emitted', payload);
    } catch (err) {
      console.error('Error handling send_message', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'Server error' });
    }
  });

  // handle group message via socket
  socket.on('send_group_message', async (msg, ack) => {
    try {
      const { group_id, sender_id, message, reply_to_id } = msg;
      let { attachment } = msg;

      if (attachment && attachment.type === 'image' && attachment.data) {
        try {
          const saved = await saveImageAttachment(attachment);
          if (saved) attachment = saved;
        } catch (err) {
          if (typeof ack === 'function') return ack({ ok: false, error: String(err) });
          throw err;
        }
      }

      
      // over či je user členom
      const [members] = await db.execute(
        `SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?`,
        [group_id, sender_id]
      );

      if (members.length === 0) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Nie si členom tejto skupiny' });
        return;
      }

      // Ak attachment je objekt (napr. video), serializujeme do JSON stringu pre DB
      const attachmentForDb = attachment
        ? (typeof attachment === 'string' ? attachment : JSON.stringify(attachment))
        : null;

      // Validate reply_to_id - ignore temporary IDs (optimistic updates)
      const finalReplyId = reply_to_id && !String(reply_to_id).startsWith('tmp_') ? parseInt(reply_to_id) : null;

      const [result] = await db.execute(
        `INSERT INTO group_messages (group_id, sender_id, message, attachment, reply_to_id)
         VALUES (?, ?, ?, ?, ?)`,
        [group_id, sender_id, message || '', attachmentForDb, finalReplyId]
      );

      // update group timestamp
      await db.execute(`UPDATE \`groups\` SET updated_at = NOW() WHERE id = ?`, [group_id]);

      // získaj info o odosielateľovi
      const [userInfo] = await db.execute(
        `SELECT username, profile_picture FROM chat_users WHERE id = ?`,
        [sender_id]
      );

      // fetch reply info if reply_to_id is provided
      let replyTo = null;
      if (reply_to_id) {
        const [replyRows] = await db.execute(
          `SELECT gm.id, gm.message, gm.sender_id, COALESCE(u.username, 'Neznámy') as username 
           FROM group_messages gm
           LEFT JOIN chat_users u ON gm.sender_id = u.id
           WHERE gm.id = ?`,
          [reply_to_id]
        );
        if (replyRows.length > 0) {
          replyTo = replyRows[0];
          console.log('Group reply info loaded:', replyTo);
        }
      }

      const payload = {
        id: result.insertId,
        group_id: parseInt(group_id),
        sender_id: String(sender_id),
        message: message || '',
        attachment: attachment || null,
        reply_to_id: reply_to_id || null,
        replyTo: replyTo,
        created_at: new Date(),
        username: userInfo[0].username,
        profile_picture: userInfo[0].profile_picture
      };

      // ACK back to sender
      if (typeof ack === 'function') ack({ ok: true, payload });

      // emit všetkým členom skupiny
      const [allMembers] = await db.execute(
        `SELECT user_id FROM group_members WHERE group_id = ?`,
        [group_id]
      );

      allMembers.forEach(m => {
        io.to(String(m.user_id)).emit("new_group_message", payload);
      });

      console.log('Socket send_group_message saved and emitted', payload);
    } catch (err) {
      console.error('Error handling send_group_message', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'Server error' });
    }
  });

  // handle theme change
  socket.on('theme_change', (data) => {
    try {
      const { sender_id, receiver_id, themeId } = data;
      console.log(`Theme change from ${sender_id} to ${receiver_id}: ${themeId}`);
      
      // Check if receiver is in room
      io.in(String(receiver_id)).allSockets().then(sockets => {
        console.log(`Receiver ${receiver_id} room has ${sockets.size} socket(s):`, Array.from(sockets));
      });
      
      // emit to receiver to apply the theme
      io.to(String(receiver_id)).emit('theme_changed', {
        sender_id: String(sender_id),
        receiver_id: String(receiver_id),
        themeId
      });
      
      console.log(`Emitted theme_changed to receiver ${receiver_id}`);
    } catch (err) {
      console.error('Error handling theme_change', err);
    }
  });

});

const PORT = parseInt(process.env.PORT) || 3000;

function findAvailablePort(startPort, attemptsLeft = 10) {
  return new Promise((resolve, reject) => {
    const probe = (port, remaining) => {
      const tester = net.createServer();

      tester.once('error', (err) => {
        tester.close();
        if (err && err.code === 'EADDRINUSE' && remaining > 1) {
          console.warn(`Port ${port} in use, trying ${port + 1}...`);
          probe(port + 1, remaining - 1);
          return;
        }

        if (err && err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is in use and no free ports found after multiple attempts.`));
          return;
        }

        reject(err);
      });

      tester.once('listening', () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port);
    };

    probe(startPort, attemptsLeft);
  });
}

findAvailablePort(PORT, 10)
  .then((port) => {
    server.listen(port, () => {
      console.log(`Server beží na porte ${port}`);
    });
  })
  .catch((err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
