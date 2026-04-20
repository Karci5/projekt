const express = require("express");
const db = require("../db");
const { privacySettings } = require("../index");
const router = express.Router();

// Update privacy settings (show_online) - in-memory only
router.post("/privacy-settings", async (req, res) => {
  const { userId, showOnline } = req.body;
  if (!userId || typeof showOnline === 'undefined') {
    return res.status(400).json({ error: "userId a showOnline sú povinné" });
  }
  privacySettings[userId] = !!showOnline;
  res.json({ message: "Privacy settings updated (in-memory)" });
});

// Get privacy settings (show_online) - in-memory only
router.get("/privacy-settings/:userId", async (req, res) => {
  const userId = req.params.userId;
  const showOnline = privacySettings[userId] !== undefined ? privacySettings[userId] : true;
  res.json({ userId, showOnline });
});

// Get user profile
router.get("/:userId", async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, username, email, profile_picture FROM chat_users WHERE id = ?",
      [req.params.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update profile picture
router.post("/update-picture", async (req, res) => {
  const { userId, profilePicture } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "UserId is required" });
  }

  try {
    await db.execute(
      "UPDATE chat_users SET profile_picture = ? WHERE id = ?",
      [profilePicture || null, userId]
    );

    res.json({ message: "Profile picture updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update username
router.post("/update-username", async (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ error: "UserId and username are required" });
  }

  try {
    await db.execute(
      "UPDATE chat_users SET username = ? WHERE id = ?",
      [username, userId]
    );

    res.json({ message: "Username updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
