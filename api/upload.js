const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, mimeType } = req.body || {};
    if (!imageData) return res.status(400).json({ error: 'Missing imageData' });

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const buffer = Buffer.from(imageData, 'base64');
    const blob = await put(`photos/${Date.now()}.${ext}`, buffer, {
      access: 'public',
      contentType: mimeType || 'image/jpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log('Blob upload ok:', blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
