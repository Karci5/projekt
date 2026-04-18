const express = require('express');
const router = express.Router();

// Placeholder uploads route - expects multipart/form-data in a real app.
router.post('/', (req, res) => {
  // This is a minimal placeholder. In production, use `multer` to handle file uploads.
  res.status(501).json({ ok: false, error: 'Not implemented: multipart uploads. Install and use multer.' });
});

module.exports = router;