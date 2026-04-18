const express = require("express");
const db = require("../db");
const { storeImageDataUrl } = require('../utils/uploadStore');
const router = express.Router();

let avatarColumnChecked = false;
async function ensureAvatarColumn() {
  if (avatarColumnChecked) return;
  const [cols] = await db.execute("SHOW COLUMNS FROM `groups` LIKE 'avatar'");
  if (!cols || cols.length === 0) {
    await db.execute("ALTER TABLE `groups` ADD COLUMN `avatar` TEXT DEFAULT NULL AFTER `description`");
  }
  avatarColumnChecked = true;
}

// pridať členov do existujúcej skupiny
router.post("/:groupId/invite", async (req, res) => {
  const { groupId } = req.params;
  const { members } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ ok: false, error: "Zoznam členov je prázdny" });
  }
  try {
    // zisti existujúcich členov
    const [existing] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    const existingIds = new Set(existing.map(e => e.user_id));
    let added = [];
    for (const memberId of members) {
      if (!existingIds.has(memberId)) {
        await db.execute(
          `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`,
          [groupId, memberId]
        );
        added.push(memberId);
      }
    }
    // emit socket event pre nových členov aj existujúcich
    const io = req.app.get("io");
    const payload = { group_id: parseInt(groupId), new_members: added };
    // všetkým novým členom
    added.forEach(id => io.to(String(id)).emit("group_member_added", payload));
    // všetkým v skupine update
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    allMembers.forEach(m => io.to(String(m.user_id)).emit("group_updated_members", payload));
    res.json({ ok: true, added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

async function saveImageAttachment(attachment) {
  if (!attachment || attachment.type !== 'image' || !attachment.data) return null;
  const stored = await storeImageDataUrl(
    db,
    attachment.data,
    `group_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    'images'
  );
  return stored ? stored.url : null;
}

async function getGroupAndPermissions(groupId, userId) {
  const [groups] = await db.execute(
    `SELECT id, created_by, theme_id, theme_permission FROM \`groups\` WHERE id = ?`,
    [groupId]
  );
  if (groups.length === 0) return { group: null, isMember: false, isAdmin: false };

  const group = groups[0];
  const [memberRows] = await db.execute(
    `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
    [groupId, userId]
  );
  const isMember = memberRows.length > 0;
  const memberRole = memberRows[0]?.role || null;
  const isAdmin = String(group.created_by) === String(userId) || memberRole === 'admin';
  return { group, isMember, isAdmin };
}

// === GROUPS MESSAGES ROUTES (must be before generic /:id routes) ===

// vytvoriť novú skupinu
router.post("/", async (req, res) => {
  const { name, description, created_by, members, avatar } = req.body;

  try {
    await ensureAvatarColumn();

    // vytvor skupinu
    const [result] = await db.execute(
      `INSERT INTO \`groups\` (name, description, created_by, avatar) VALUES (?, ?, ?, ?)`,
      [name, description || '', created_by, avatar || null]
    );

    const groupId = result.insertId;

    // pridaj tvorcu ako člena
    await db.execute(
      `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')`,
      [groupId, created_by]
    );

    // pridaj ostatných členov ak existujú
    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberId of members) {
        if (memberId != created_by) {
          await db.execute(
            `INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`,
            [groupId, memberId]
          );
        }
      }
    }

    const io = req.app.get("io");
    const payload = {
      id: groupId,
      name,
      description: description || '',
      avatar: avatar || null,
      created_by,
      member_count: (members ? members.length : 0) + 1
    };

    // notify all members
    io.to(String(created_by)).emit("group_created", payload);
    if (members) {
      members.forEach(id => io.to(String(id)).emit("group_created", payload));
    }

    res.json({ ok: true, group: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// update group avatar
router.post("/:groupId/avatar", async (req, res) => {
  const { groupId } = req.params;
  const { userId, avatar } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    await ensureAvatarColumn();

    // check membership
    const [members] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );
    if (members.length === 0) {
      return res.status(403).json({ ok: false, error: "Nie si členom tejto skupiny" });
    }

    await db.execute(
      `UPDATE \`groups\` SET avatar = ? WHERE id = ?`,
      [avatar || null, groupId]
    );

    const io = req.app.get("io");
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    const payload = { id: parseInt(groupId), avatar: avatar || null };
    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_updated", payload);
    });

    res.json({ ok: true, avatar: avatar || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// === GET ROUTES ===

// získať všetky skupiny používateľa
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM \`groups\` g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.updated_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// získať správy skupiny
router.get("/:groupId/messages", async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT gm.*, u.username, u.profile_picture,
              r.id as reply_id, r.message as reply_message, r.sender_id as reply_sender_id,
              ru.username as reply_username
       FROM group_messages gm
       INNER JOIN chat_users u ON gm.sender_id = u.id
       LEFT JOIN group_messages r ON gm.reply_to_id = r.id
       LEFT JOIN chat_users ru ON r.sender_id = ru.id
       WHERE gm.group_id = ?
       ORDER BY gm.created_at ASC`,
      [groupId]
    );

    // parse JSON attachments

    const parsed = rows.map(r => {
      let attachment = null;
      if (r.attachment) {
        let raw = r.attachment;
        if (Buffer.isBuffer(raw)) raw = raw.toString();
        try {
          attachment = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          attachment = raw;
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

      // Oprava: profile_picture s prefixom ak chýba
      let profile_picture = r.profile_picture;
      if (profile_picture && typeof profile_picture === 'string' && profile_picture.length > 0 && !profile_picture.includes('/uploads/')) {
        profile_picture = '/uploads/profile_pictures/' + profile_picture;
      }

      return {
        ...r,
        profile_picture,
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

// poslať správu do skupiny
router.post("/:groupId/messages", async (req, res) => {
  const { groupId } = req.params;
  const { sender_id, message, reply_to_id } = req.body;
  let { attachment } = req.body;

  try {
    // over či je user členom
    const [members] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, sender_id]
    );

    if (members.length === 0) {
      return res.status(403).json({ error: "Nie si členom tejto skupiny" });
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
      `INSERT INTO group_messages (group_id, sender_id, message, attachment, reply_to_id)
       VALUES (?, ?, ?, ?, ?)`,
      [groupId, sender_id, message || '', attachmentForDb, reply_to_id || null]
    );

    // update group timestamp
    await db.execute(`UPDATE \`groups\` SET updated_at = NOW() WHERE id = ?`, [groupId]);

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
      }
    }

    const io = req.app.get("io");
    const payload = {
      id: result.insertId,
      group_id: parseInt(groupId),
      sender_id: String(sender_id),
      message: message || '',
      attachment: attachment || null,
      reply_to_id: reply_to_id || null,
      replyTo: replyTo,
      created_at: new Date(),
      username: userInfo[0].username,
      profile_picture: userInfo[0].profile_picture
    };

    // emit všetkým členom skupiny
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("new_group_message", payload);
    });

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// získať členov skupiny
router.get("/:groupId/members", async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.profile_picture, gm.joined_at,
              CASE WHEN gm.role = 'admin' OR g.created_by = u.id THEN 'admin' ELSE 'member' END AS role,
              CASE WHEN gm.role = 'admin' OR g.created_by = u.id THEN 1 ELSE 0 END AS is_admin
       FROM group_members gm
       INNER JOIN chat_users u ON gm.user_id = u.id
       INNER JOIN \`groups\` g ON g.id = gm.group_id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// získať nastavenie motívu skupiny + oprávnenia
router.get("/:groupId/theme-settings", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.query || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    const { group, isMember, isAdmin } = await getGroupAndPermissions(groupId, userId);

    if (!group) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }
    if (!isMember) {
      return res.status(403).json({ ok: false, error: "Nie si členom tejto skupiny" });
    }

    const canEdit = isAdmin || group.theme_permission === 'all_members';
    res.json({
      ok: true,
      themeId: group.theme_id || 'default',
      themePermission: group.theme_permission || 'admin_only',
      canEdit
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// zmeniť motív skupiny
router.post("/:groupId/theme", async (req, res) => {
  const { groupId } = req.params;
  const { userId, themeId } = req.body || {};

  if (!userId || !themeId) {
    return res.status(400).json({ ok: false, error: "UserId a themeId sú povinné" });
  }

  try {
    const { group, isMember, isAdmin } = await getGroupAndPermissions(groupId, userId);

    if (!group) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }
    if (!isMember) {
      return res.status(403).json({ ok: false, error: "Nie si členom tejto skupiny" });
    }

    const canEdit = isAdmin || group.theme_permission === 'all_members';
    if (!canEdit) {
      return res.status(403).json({ ok: false, error: "Motív môže meniť iba admin skupiny" });
    }

    await db.execute(
      `UPDATE \`groups\` SET theme_id = ? WHERE id = ?`,
      [themeId, groupId]
    );

    const io = req.app.get("io");
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    const payload = {
      group_id: parseInt(groupId),
      theme_id: themeId,
      theme_permission: group.theme_permission || 'admin_only',
      changed_by: String(userId)
    };
    allMembers.forEach(m => io.to(String(m.user_id)).emit("group_theme_changed", payload));

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// admin nastaví kto môže meniť motív skupiny
router.post("/:groupId/theme-permission", async (req, res) => {
  const { groupId } = req.params;
  const { userId, mode } = req.body || {};

  if (!userId || !mode) {
    return res.status(400).json({ ok: false, error: "UserId a mode sú povinné" });
  }
  if (!['admin_only', 'all_members'].includes(mode)) {
    return res.status(400).json({ ok: false, error: "Neplatný mód oprávnenia" });
  }

  try {
    const { group, isMember, isAdmin } = await getGroupAndPermissions(groupId, userId);

    if (!group) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }
    if (!isMember) {
      return res.status(403).json({ ok: false, error: "Nie si členom tejto skupiny" });
    }
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: "Iba admin môže meniť oprávnenie motívu" });
    }

    await db.execute(
      `UPDATE \`groups\` SET theme_permission = ? WHERE id = ?`,
      [mode, groupId]
    );

    const io = req.app.get("io");
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    const payload = {
      group_id: parseInt(groupId),
      theme_id: group.theme_id || 'default',
      theme_permission: mode,
      changed_by: String(userId)
    };
    allMembers.forEach(m => io.to(String(m.user_id)).emit("group_theme_changed", payload));

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// opustiť skupinu
router.post("/:groupId/leave", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    await db.execute(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );

    const io = req.app.get("io");
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    const payload = { group_id: parseInt(groupId), user_id: String(userId) };
    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_member_left", payload);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// admin odstráni člena skupiny
router.delete("/:groupId/members/:memberId", async (req, res) => {
  const { groupId, memberId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    const [groups] = await db.execute(
      `SELECT id, created_by FROM \`groups\` WHERE id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }

    const group = groups[0];
    const [requesterRows] = await db.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );
    const requester = requesterRows[0] || null;
    const isAdmin = String(group.created_by) === String(userId) || requester?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: "Iba admin skupiny môže odstraňovať členov" });
    }

    if (String(memberId) === String(group.created_by)) {
      return res.status(400).json({ ok: false, error: "Vlastníka skupiny nie je možné odstrániť" });
    }

    const [membership] = await db.execute(
      `SELECT user_id, role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    if (membership.length === 0) {
      return res.status(404).json({ ok: false, error: "Používateľ nie je členom skupiny" });
    }

    // ochrana: skupina musí mať aspoň 1 admina po odstránení
    const [adminCountRows] = await db.execute(
      `SELECT COUNT(*) as cnt FROM group_members gm
       WHERE gm.group_id = ? AND gm.user_id != ?
         AND (gm.role = 'admin' OR gm.user_id = ?)`,
      [groupId, memberId, group.created_by]
    );
    if (adminCountRows[0].cnt === 0) {
      return res.status(400).json({ ok: false, error: "Skupina musí mať aspoň jedného admina" });
    }

    await db.execute(
      `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    const io = req.app.get("io");
    const payload = { group_id: parseInt(groupId), user_id: String(memberId), removed_by: String(userId) };

    // inform removed user
    io.to(String(memberId)).emit("group_member_removed", payload);

    // inform remaining members
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_updated_members", payload);
    });

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// admin povýši člena na admina
router.post("/:groupId/members/:memberId/promote", async (req, res) => {
  const { groupId, memberId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    const [groups] = await db.execute(
      `SELECT id, created_by FROM \`groups\` WHERE id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }

    const group = groups[0];
    const [requesterRows] = await db.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );
    const requester = requesterRows[0] || null;
    const isAdmin = String(group.created_by) === String(userId) || requester?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: "Iba admin skupiny môže povýšiť členov" });
    }

    const [targetRows] = await db.execute(
      `SELECT user_id, role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Používateľ nie je členom skupiny" });
    }

    if (targetRows[0].role === 'admin') {
      return res.status(400).json({ ok: false, error: "Používateľ už je admin" });
    }

    await db.execute(
      `UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    const io = req.app.get("io");
    const payload = { group_id: parseInt(groupId), user_id: String(memberId), promoted_by: String(userId) };

    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_updated_members", payload);
    });

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// admin zníži admina späť na člena
router.post("/:groupId/members/:memberId/demote", async (req, res) => {
  const { groupId, memberId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ ok: false, error: "UserId is required" });
  }

  try {
    const [groups] = await db.execute(
      `SELECT id, created_by FROM \`groups\` WHERE id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ ok: false, error: "Skupina neexistuje" });
    }

    const group = groups[0];
    const [requesterRows] = await db.execute(
      `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, userId]
    );
    const requester = requesterRows[0] || null;
    const isAdmin = String(group.created_by) === String(userId) || requester?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: "Iba admin skupiny môže znižovať členov" });
    }

    if (String(memberId) === String(group.created_by)) {
      return res.status(400).json({ ok: false, error: "Vlastníka skupiny nie je možné znížiť" });
    }

    const [targetRows] = await db.execute(
      `SELECT user_id, role FROM group_members WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Používateľ nie je členom skupiny" });
    }

    if (targetRows[0].role !== 'admin') {
      return res.status(400).json({ ok: false, error: "Používateľ nie je admin" });
    }

    // ochrana: skupina musí mať aspoň 1 admina po znížení
    const [adminCountRows] = await db.execute(
      `SELECT COUNT(*) as cnt FROM group_members gm
       WHERE gm.group_id = ? AND gm.user_id != ?
         AND (gm.role = 'admin' OR gm.user_id = ?)`,
      [groupId, memberId, group.created_by]
    );
    if (adminCountRows[0].cnt === 0) {
      return res.status(400).json({ ok: false, error: "Skupina musí mať aspoň jedného admina" });
    }

    await db.execute(
      `UPDATE group_members SET role = 'member' WHERE group_id = ? AND user_id = ?`,
      [groupId, memberId]
    );

    const io = req.app.get("io");
    const payload = { group_id: parseInt(groupId), user_id: String(memberId), demoted_by: String(userId) };

    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );
    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_updated_members", payload);
    });

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Chyba servera" });
  }
});

// upraviť správu v skupine
router.put("/:groupId/messages/:id", async (req, res) => {
  const { groupId, id } = req.params;
  const { message, user_id } = req.body;

  try {
    // over či správa patrí tomuto používateľovi
    const [rows] = await db.execute(
      `SELECT * FROM group_messages WHERE id = ? AND sender_id = ? AND group_id = ?`,
      [id, user_id, groupId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Nemáš oprávnenie upraviť túto správu" });
    }

    await db.execute(
      `UPDATE group_messages SET message = ?, edited = 1 WHERE id = ?`,
      [message, id]
    );

    const io = req.app.get("io");
    const originalMsg = rows[0];
    
    const payload = {
      id: parseInt(id),
      group_id: parseInt(groupId),
      sender_id: String(originalMsg.sender_id),
      message,
      edited: true,
      attachment: originalMsg.attachment,
      created_at: originalMsg.created_at
    };

    // emit všetkým členom skupiny
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_message_updated", payload);
    });

    res.json({ ok: true, payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

// vymazať správu zo skupiny
router.delete("/:groupId/messages/:id", async (req, res) => {
  const { groupId, id } = req.params;
  const { user_id } = req.body;

  try {
    // over či správa patrí tomuto používateľovi
    const [rows] = await db.execute(
      `SELECT * FROM group_messages WHERE id = ? AND sender_id = ? AND group_id = ?`,
      [id, user_id, groupId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Nemáš oprávnenie vymazať túto správu" });
    }

    await db.execute(`DELETE FROM group_messages WHERE id = ?`, [id]);

    const io = req.app.get("io");
    const originalMsg = rows[0];

    const payload = {
      id: parseInt(id),
      group_id: parseInt(groupId),
      sender_id: String(originalMsg.sender_id)
    };

    // emit všetkým členom skupiny
    const [allMembers] = await db.execute(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [groupId]
    );

    allMembers.forEach(m => {
      io.to(String(m.user_id)).emit("group_message_deleted", payload);
    });

    res.json({ ok: true, message_id: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

module.exports = router;
