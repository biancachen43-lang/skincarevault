// Bumps service-worker.js CACHE_NAME with a UTC timestamp.
// Runs as Vercel's buildCommand on every deployment,
// so every deploy gets a guaranteed-unique SW version.
'use strict';
const fs   = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'service-worker.js');
const ts     = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
let   src    = fs.readFileSync(swPath, 'utf8');

src = src.replace(/const CACHE_NAME = 'skinku-[^']*'/, `const CACHE_NAME = 'skinku-${ts}'`);
fs.writeFileSync(swPath, src, 'utf8');
console.log('[bump-sw] CACHE_NAME → skinku-' + ts);
