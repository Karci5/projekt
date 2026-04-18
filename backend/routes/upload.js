const express = require('express');
const db = require('../db');
const { parseImageDataUrl, storeImageDataUrl } = require('../utils/uploadStore');
const router = express.Router();

// Accepts JSON body: { filename?: string, data: 'data:<mime>;base64,<data>' }
router.post('/', async (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!data) return res.status(400).json({ ok: false, error: 'Missing data' });

    const parsed = parseImageDataUrl(data);
    if (!parsed) {
      return res.status(400).json({ ok: false, error: 'Invalid image data URL' });
    }

    const mime = parsed.mime;
    const ext = parsed.ext;

    // Only allow images for profile uploads
    if (mime && !mime.startsWith('image/')) {
      return res.status(400).json({ ok: false, error: 'Only image uploads are allowed' });
    }

    const size = parsed.size;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB safety limit
    if (size > maxSizeBytes) {
      return res.status(413).json({ ok: false, error: 'File too large (max 5MB)' });
    }

    const isProfile = filename && filename.startsWith('profile_');
    const folder = isProfile ? 'profile_pictures' : 'images';
    const stored = await storeImageDataUrl(db, data, filename || `${folder}_${Date.now()}`, folder);
    if (!stored) {
      return res.status(400).json({ ok: false, error: 'Failed to store image' });
    }

    res.json({
      ok: true,
      url: stored.url,
      filename: filename || null,
      mime: mime || null,
      size
    });
  } catch (err) {
    console.error('uploads_base64 error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

module.exports = router;