import 'dotenv/config';
import express from 'express';
import pinoHttp from 'pino-http';
import { readFileSync } from 'node:fs';
import { p12ToJwks } from './p12-to-jwks.js';
import { logger } from './logger.js';

const app = express();
app.use(pinoHttp({ logger }));

const PORT = parseInt(process.env.PORT || '3000', 10);
const P12_PATH = process.env.P12_PATH;
const P12_PASSWORD = process.env.P12_PASSWORD || '';
const KEY_ID = process.env.KEY_ID || 'key-1';

if (!P12_PATH) {
  logger.error('Missing P12_PATH env var. See .env.example');
  process.exit(1);
}

let cachedJwks = null;
let lastLoadError = null;

async function loadJwks() {
  try {
    const p12 = readFileSync(P12_PATH);
    cachedJwks = await p12ToJwks(p12, P12_PASSWORD, { kid: KEY_ID });
    lastLoadError = null;
  } catch (err) {
  logger.error({ err }, 'Failed to load/parse .p12');
    lastLoadError = err;
  }
}

// Load once at startup
await loadJwks();

app.get('/.well-known/jwks.json', (req, res) => {
  if (!cachedJwks) {
    return res.status(500).json({ error: 'JWKS not available', details: lastLoadError?.message });
  }
  res.json(cachedJwks);
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, jwksLoaded: !!cachedJwks });
});

app.listen(PORT, () => {
  logger.info(`JWKS server listening on http://localhost:${PORT}`);
});
