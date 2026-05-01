const { put } = require('@vercel/blob');
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const USER_KEY = 'skincarevault_user_data';

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  // 移除 base64 照片，保留 Blob URL（imgUrl）
  const clean = {
    ...value,
    products: (value.products || []).map(p => {
      const { imgData, ...rest } = p;
      return rest;
    })
  };
  const json = JSON.stringify(clean);
  const encoded = encodeURIComponent(json);
  const res = await fetch(`${KV_URL}/set/${key}/${encoded}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const result = await res.json();
  console.log('KV set result:', JSON.stringify(result));
  if (result.error) throw new Error(result.error);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.body && req.body.action === 'load') {
    try {
      const data = await kvGet(USER_KEY);
      return res.status(200).json({ data });
    } catch (e) {
      console.error('Load error:', e.message);
      return res.status(200).json({ data: null });
    }
  }

  if (req.body && req.body.action === 'save') {
    try {
      await kvSet(USER_KEY, req.body.data);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Save error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.body && req.body.action === 'upload-image') {
    try {
      const { imageData, mimeType } = req.body;
      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const buffer = Buffer.from(imageData, 'base64');
      const blob = await put(`photos/${Date.now()}.${ext}`, buffer, {
        access: 'public',
        contentType: mimeType,
      });
      return res.status(200).json({ url: blob.url });
    } catch (e) {
      console.error('Upload error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    const body = { ...req.body, model: 'claude-sonnet-4-5' };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) console.error('Anthropic error:', JSON.stringify(data));
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
