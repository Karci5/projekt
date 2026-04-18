const express = require("express");
const db = require("../db"); // db je teraz priamo pool

const router = express.Router();

// Vráti všetkých používateľov okrem seba
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  try {
    const [users] = await db.execute(
      "SELECT id, username, profile_picture FROM chat_users WHERE id != ?",
      [userId]
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chyba servera" });
  }
});

module.exports = router;
