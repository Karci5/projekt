function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1] || '';
  if (mime && !mime.startsWith('image/')) return null;

  const base64 = match[2] || '';
  const buffer = Buffer.from(base64, 'base64');
  const size = buffer.length;
  const ext = (mime.split('/')[1] || 'bin').toLowerCase();

  return { mime, base64, buffer, size, ext };
}

async function storeImageDataUrl(db, dataUrl, filename = 'image', folder = 'images') {
  const parsed = parseImageDataUrl(dataUrl);
  if (!parsed) return null;

  const maxSizeBytes = 5 * 1024 * 1024;
  if (parsed.size > maxSizeBytes) throw new Error('File too large (max 5MB)');

  const filenameWithExt = `${filename}.${parsed.ext}`;
  const [result] = await db.execute(
    'INSERT INTO uploads (filename, mime_type, size_bytes, data) VALUES (?, ?, ?, ?)',
    [filenameWithExt, parsed.mime || null, parsed.size, parsed.buffer]
  );

  const id = result.insertId;
  const url = `/uploads/${folder}/${filenameWithExt}`;
  return {
    id,
    url,
    filename: filenameWithExt,
    mime: parsed.mime || null,
    size: parsed.size,
    ext: parsed.ext,
  };
}

async function getUploadByFilename(db, filename) {
  const [rows] = await db.execute(
    'SELECT id, mime_type, data FROM uploads WHERE filename = ? ORDER BY id DESC LIMIT 1',
    [filename]
  );
  return rows && rows.length ? rows[0] : null;
}

module.exports = {
  parseImageDataUrl,
  storeImageDataUrl,
  getUploadByFilename,
};
