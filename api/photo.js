module.exports = async function handler(req, res) {
  const blobUrl = req.query.url;
  if (!blobUrl || !blobUrl.includes('.vercel-storage.com/')) {
    return res.status(400).json({ error: 'Invalid blob URL' });
  }

  try {
    const response = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    });
    if (!response.ok) return res.status(response.status).end();

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('Photo proxy error:', e.message);
    res.status(500).end();
  }
};
