// OpportunityTracker — backend
// Pure Node.js (no external dependencies) so it runs anywhere `node` runs,
// with zero install step. Swap the DB_* functions for Prisma/Postgres later —
// every other part of the app talks to storage only through those functions.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------- storage layer (swap this block for Prisma/Postgres later) ----------

function readDb() {
  if (!fs.existsSync(DB_FILE)) return { opportunities: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { opportunities: [] };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function listOpportunities() {
  return readDb().opportunities.sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );
}

function createOpportunity(data) {
  const db = readDb();
  const now = new Date().toISOString();
  const opp = {
    id: crypto.randomUUID(),
    name: data.name?.trim() || 'Untitled opportunity',
    type: data.type || 'Job',
    deadline: data.deadline,
    notes: data.notes?.trim() || '',
    remindBefore: Array.isArray(data.remindBefore) && data.remindBefore.length
      ? data.remindBefore
      : [168, 48, 24, 3, 0.5], // hours: 7d, 2d, 1d, 3h, 30m
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  db.opportunities.push(opp);
  writeDb(db);
  return opp;
}

function updateOpportunity(id, data) {
  const db = readDb();
  const idx = db.opportunities.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  db.opportunities[idx] = {
    ...db.opportunities[idx],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.opportunities[idx];
}

function deleteOpportunity(id) {
  const db = readDb();
  const before = db.opportunities.length;
  db.opportunities = db.opportunities.filter((o) => o.id !== id);
  writeDb(db);
  return db.opportunities.length < before;
}

// ---------- tiny router ----------

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  const payload = isJson ? JSON.stringify(body) : body;
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json' : (headers['Content-Type'] || 'text/plain'),
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    req.on('data', (c) => { chunks += c; if (chunks.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!chunks) return resolve({});
      try { resolve(JSON.parse(chunks)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, decodeURIComponent(filePath.split('?')[0]));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden');
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(filePath);
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS (useful if you later split frontend/backend onto different hosts)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return send(res, 204, '');

  try {
    if (url === '/api/opportunities' && req.method === 'GET') {
      return send(res, 200, listOpportunities());
    }

    if (url === '/api/opportunities' && req.method === 'POST') {
      const data = await readBody(req);
      if (!data.name || !data.deadline) {
        return send(res, 400, { error: 'name and deadline are required' });
      }
      return send(res, 201, createOpportunity(data));
    }

    const singleMatch = url.match(/^\/api\/opportunities\/([^/]+)$/);
    if (singleMatch && (req.method === 'PUT' || req.method === 'PATCH')) {
      const data = await readBody(req);
      const updated = updateOpportunity(singleMatch[1], data);
      if (!updated) return send(res, 404, { error: 'not found' });
      return send(res, 200, updated);
    }

    if (singleMatch && req.method === 'DELETE') {
      const ok = deleteOpportunity(singleMatch[1]);
      if (!ok) return send(res, 404, { error: 'not found' });
      return send(res, 204, '');
    }

    if (url === '/api/health') {
      return send(res, 200, { status: 'ok', time: new Date().toISOString() });
    }

    if (url.startsWith('/api/')) return send(res, 404, { error: 'not found' });

    return serveStatic(req, res);
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => {
  console.log(`OpportunityTracker running on http://localhost:${PORT}`);
});
