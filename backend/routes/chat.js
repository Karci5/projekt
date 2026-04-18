const express = require("express");
const db = require("../db"); // správny import
const { storeImageDataUrl } = require('../utils/uploadStore');
const router = express.Router();

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

// získať správy medzi dvoma používateľmi
router.get("/messages", async (req, res) => {
  const { user1, user2 } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT m.*, 
              r.id as reply_id, r.message as reply_message, r.sender_id as reply_sender_id,
              u.username as reply_username
       FROM chat_messages m
       LEFT JOIN chat_messages r ON m.reply_to_id = r.id
       LEFT JOIN chat_users u ON r.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [user1, user2, user2, user1]
    );

    // parse JSON attachments so frontend always gets objects
    const parsed = rows.map(r => {
      let attachment = null;
      if (r.attachment) {
        let raw = r.attachment;
        if (Buffer.isBuffer(raw)) raw = raw.toString();
        try {
          attachment = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          attachment = raw; // fallback to raw string if not JSON
        }
        if (attachment && attachment.data && Buffer.isBuffer(attachment.data)) {
          attachment = { ...attachment, data: attachment.data.toString() };
        }
      }
      
      // build reply object if present
      let replyTo = null;
      if (r.reply_id) {
        replyTo = {
          id: r.reply_id,
          message: r.reply_message,
          sender_id: r.reply_sender_id,
          username: r.reply_username
        };
      }

      return { 
        ...r, 
        attachment,
        replyTo,
        // clean up the joined fields
        reply_id: undefined,
        reply_message: undefined,
        reply_sender_id: undefined
      };
    });

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// poslať správu
router.post("/messages", async (req, res) => {
  const { sender_id, receiver_id, message, reply_to_id } = req.body;
  let { attachment } = req.body;

  try {
    // Check if sender is blocked by receiver
    const [blockCheck] = await db.execute(
      "SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
      [receiver_id, sender_id]
    );

    if (blockCheck.length > 0) {
      return res.status(403).json({ error: "Tento používateľ ťa má blokovaného" });
    }

    if (attachment && attachment.type === 'image' && attachment.data) {
      try {
        const saved = await saveImageAttachment(attachment);
        if (saved) attachment = saved;
      } catch (err) {
        return res.status(400).json({ error: String(err) });
      }
    }

    // Ak attachment je objekt (napr. video), serializujeme do JSON stringu pre DB
    const attachmentForDb = attachment
      ? (typeof attachment === 'string' ? attachment : JSON.stringify(attachment))
      : null;

    const [result] = await db.execute(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment, reply_to_id)
       VALUES (?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, message || '', attachmentForDb, reply_to_id || null]
    );

    // socket.io emit
    const io = req.app.get("io"); // získame io z app

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
      }
    }

    const payload = {
      id: result.insertId,
      sender_id: String(sender_id),
      receiver_id: String(receiver_id),
      message: message || '',
      attachment: attachment || null,
      reply_to_id: reply_to_id || null,
      replyTo: replyTo,
      created_at: new Date()
    };

    // Emit only to receiver (sender gets message via response callback)
    io.to(String(receiver_id)).emit("new_message", payload);

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// upraviť správu
router.put("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { message, user_id } = req.body;

  try {
    // overiť že správa patrí tomuto používateľovi
    const [rows] = await db.execute(
      `SELECT * FROM chat_messages WHERE id = ? AND sender_id = ?`,
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Nemáš oprávnenie upraviť túto správu" });
    }

    await db.execute(
      `UPDATE chat_messages SET message = ?, edited = 1 WHERE id = ?`,
      [message, id]
    );

    const io = req.app.get("io");
    const originalMsg = rows[0];
    
    const payload = {
      id: parseInt(id),
      sender_id: String(originalMsg.sender_id),
      receiver_id: String(originalMsg.receiver_id),
      message,
      edited: true,
      attachment: originalMsg.attachment,
      created_at: originalMsg.created_at
    };

    io.to(String(originalMsg.receiver_id)).emit("message_updated", payload);
    io.to(String(originalMsg.sender_id)).emit("message_updated", payload);

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// vymazať správu
router.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    // overiť že správa patrí tomuto používateľovi
    const [rows] = await db.execute(
      `SELECT * FROM chat_messages WHERE id = ? AND sender_id = ?`,
      [id, user_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Nemáš oprávnenie vymazať túto správu" });
    }

    await db.execute(`DELETE FROM chat_messages WHERE id = ?`, [id]);

    const io = req.app.get("io");
    const originalMsg = rows[0];

    const payload = {
      id: parseInt(id),
      sender_id: String(originalMsg.sender_id),
      receiver_id: String(originalMsg.receiver_id)
    };

    io.to(String(originalMsg.receiver_id)).emit("message_deleted", payload);
    io.to(String(originalMsg.sender_id)).emit("message_deleted", payload);

    res.json({ ok: true, message_id: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

module.exports = router;
