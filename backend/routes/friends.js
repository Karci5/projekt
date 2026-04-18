const express = require("express");
const db = require("../db"); // db je teraz priamo pool

const router = express.Router();

// Všetci priatelia používateľa
router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [friends] = await db.execute(
      `SELECT u.id, u.username, u.profile_picture 
       FROM friends f 
       JOIN chat_users u ON u.id = f.friend_id 
       WHERE f.user_id = ?`,
      [userId]
    );
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Stav prítomnosti priateľov (online/lastActive)
router.get("/:userId/presence", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [result] = await db.execute(
      `SELECT f.friend_id as userId,
              CASE WHEN COALESCE(u.is_online, 0) = 1 THEN 1 ELSE 0 END as isOnline,
              u.last_active as lastActive
       FROM friends f
       INNER JOIN chat_users u ON u.id = f.friend_id
       WHERE f.user_id = ?`,
      [userId]
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Poslať žiadosť
router.post("/request", async (req, res) => {
  const { fromUser, toUser } = req.body;
  if (!fromUser || !toUser) {
    return res.status(400).json({ error: "Neplatné údaje: chýba odosielateľ alebo príjemca." });
  }
  if (String(fromUser) === String(toUser)) {
    return res.status(400).json({ error: "Nemôžeš poslať žiadosť sebe." });
  }
  try {
    const [alreadyFriends] = await db.execute(
      "SELECT id FROM friends WHERE user_id = ? AND friend_id = ? LIMIT 1",
      [fromUser, toUser]
    );
    if (alreadyFriends.length > 0) {
      return res.status(400).json({ error: "Tento používateľ je už medzi priateľmi." });
    }

    const [existing] = await db.execute(
      `SELECT id, sender_id, receiver_id, status
       FROM friend_requests
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY id DESC`,
      [fromUser, toUser, toUser, fromUser]
    );

    const sameDirection = existing.find(
      (row) => String(row.sender_id) === String(fromUser) && String(row.receiver_id) === String(toUser)
    );
    const reverseDirection = existing.find(
      (row) => String(row.sender_id) === String(toUser) && String(row.receiver_id) === String(fromUser)
    );

    if (sameDirection && sameDirection.status === 'pending') {
      const io = req.app.get("io");
      const [[sender]] = await db.execute("SELECT username FROM chat_users WHERE id = ?", [fromUser]);
      io.to(String(toUser)).emit("friend_request", {
        fromUser: fromUser,
        username: sender ? sender.username : "Používateľ"
      });
      return res.json({ message: "Žiadosť je už odoslaná a čaká na prijatie." });
    }

    if (reverseDirection && reverseDirection.status === 'pending') {
      return res.status(400).json({ error: "Tento používateľ ti už poslal žiadosť. Skontroluj prijaté žiadosti." });
    }

    if (sameDirection) {
      await db.execute(
        "UPDATE friend_requests SET status = 'pending' WHERE id = ?",
        [sameDirection.id]
      );
    } else if (reverseDirection) {
      await db.execute(
        "UPDATE friend_requests SET sender_id = ?, receiver_id = ?, status = 'pending' WHERE id = ?",
        [fromUser, toUser, reverseDirection.id]
      );
    } else {
      await db.execute(
        "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')",
        [fromUser, toUser]
      );
    }

    // Socket.IO notification for receiver
    const io = req.app.get("io");
    // Get sender username for notification
    const [[sender]] = await db.execute("SELECT username FROM chat_users WHERE id = ?", [fromUser]);
    io.to(String(toUser)).emit("friend_request", {
      fromUser: fromUser,
      username: sender ? sender.username : "Používateľ"
    });

    res.json({ message: "Žiadosť poslaná" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Všetky žiadosti pre používateľa
router.get("/requests/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [requests] = await db.execute(
      `SELECT fr.id, u.username, fr.sender_id 
       FROM friend_requests fr 
       JOIN chat_users u ON u.id = fr.sender_id 
       WHERE fr.receiver_id = ? AND fr.status='pending'`,
      [userId]
    );
    res.json(requests.map(r => ({ id: r.sender_id, username: r.username })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

router.get("/requests/:userId/sent", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [requests] = await db.execute(
      `SELECT u.id, u.username
       FROM friend_requests fr
       JOIN chat_users u ON u.id = fr.receiver_id
       WHERE fr.sender_id = ? AND fr.status = 'pending'
       ORDER BY fr.id DESC`,
      [userId]
    );
    res.json(requests || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

router.post("/request/cancel", async (req, res) => {
  const { fromUser, toUser } = req.body || {};
  if (!fromUser || !toUser) {
    return res.status(400).json({ error: "Chýba odosielateľ alebo príjemca." });
  }

  try {
    const [result] = await db.execute(
      `DELETE FROM friend_requests
       WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
      [fromUser, toUser]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Odoslaná žiadosť nebola nájdená." });
    }

    const io = req.app.get("io");
    io.to(String(fromUser)).emit("friend_request_updated", { userId: fromUser, friendId: toUser, status: 'cancelled' });
    io.to(String(toUser)).emit("friend_request_updated", { userId: fromUser, friendId: toUser, status: 'cancelled' });

    res.json({ ok: true, message: "Žiadosť bola zrušená." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Prijať žiadosť
router.post("/accept", async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await db.execute(
      "UPDATE friend_requests SET status='accepted' WHERE sender_id=? AND receiver_id=?",
      [friendId, userId]
    );

    await db.execute(
      "INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)",
      [userId, friendId, friendId, userId]
    );

    const io = req.app.get("io");
    io.to(String(userId)).emit("friend_request_updated", { userId, friendId, status: 'accepted' });
    io.to(String(friendId)).emit("friend_request_updated", { userId, friendId, status: 'accepted' });

    res.json({ message: "Prijateľ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Odmietnuť žiadosť
router.post("/decline", async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await db.execute(
      "UPDATE friend_requests SET status='rejected' WHERE sender_id=? AND receiver_id=?",
      [friendId, userId]
    );

    const io = req.app.get("io");
    io.to(String(userId)).emit("friend_request_updated", { userId, friendId, status: 'rejected' });
    io.to(String(friendId)).emit("friend_request_updated", { userId, friendId, status: 'rejected' });

    res.json({ message: "Odmietnuté" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Odstrániť priateľa (obojstranne)
router.delete("/remove", async (req, res) => {
  const { userId, friendId } = req.body || {};
  if (!userId || !friendId) {
    return res.status(400).json({ ok: false, error: "Chýba userId alebo friendId" });
  }

  try {
    await db.execute(
      "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
      [userId, friendId, friendId, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// Obnoviť priateľa (pre Undo)
router.post("/restore", async (req, res) => {
  const { userId, friendId } = req.body || {};
  if (!userId || !friendId) {
    return res.status(400).json({ ok: false, error: "Chýba userId alebo friendId" });
  }

  try {
    const [existing] = await db.execute(
      "SELECT id FROM friends WHERE user_id = ? AND friend_id = ?",
      [userId, friendId]
    );

    if (existing.length === 0) {
      await db.execute(
        "INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)",
        [userId, friendId, friendId, userId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// Blokovať používateľa
router.post("/block", async (req, res) => {
  const { userId, blockedId } = req.body;
  if (!userId || !blockedId) {
    return res.status(400).json({ error: "Chýba userId alebo blockedId" });
  }

  try {
    await db.execute(
      "INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)",
      [userId, blockedId]
    );
    res.json({ ok: true, message: "Používateľ bol blokovaný" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Odblokovať používateľa
router.post("/unblock", async (req, res) => {
  const { userId, blockedId } = req.body;
  if (!userId || !blockedId) {
    return res.status(400).json({ error: "Chýba userId alebo blockedId" });
  }

  try {
    await db.execute(
      "DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
      [userId, blockedId]
    );
    res.json({ ok: true, message: "Používateľ bol odblokovaný" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Zistiť, či je používateľ blokovaný (pre priateľa)
router.get("/:userId/blocked-by-me", async (req, res) => {
  const userId = req.params.userId;
  const { checkUserId } = req.query;
  
  if (!checkUserId) {
    return res.status(400).json({ error: "Chýba checkUserId" });
  }

  try {
    const [blocked] = await db.execute(
      "SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
      [userId, checkUserId]
    );
    res.json({ isBlocked: blocked.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Zistiť, či ma tento používateľ blokovaného (pre priateľa - dostane info že je blokovaný)
router.get("/:userId/am-i-blocked", async (req, res) => {
  const userId = req.params.userId;
  const { byUserId } = req.query;
  
  if (!byUserId) {
    return res.status(400).json({ error: "Chýba byUserId" });
  }

  try {
    const [blocked] = await db.execute(
      "SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?",
      [byUserId, userId]
    );
    res.json({ amBlocked: blocked.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// Zoznam používateľov, ktorých som blokoval
router.get("/:userId/blocked", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.profile_picture, b.created_at as blockedAt
       FROM blocked_users b
       INNER JOIN chat_users u ON u.id = b.blocked_id
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

module.exports = router;
