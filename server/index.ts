import 'dotenv/config';
import http from 'node:http';
import { handleApiRequest } from './apiHandler';
import { formatIST } from './cryptoUtils';
import { isFirebaseConfigured } from './firebase';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Production Allowed Origins
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://chethan-kumar-portfolio.vercel.app',
  'https://backend-api-production-c798.up.railway.app'
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (process.env.NODE_ENV !== 'production') return true;

  const configured = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Production origins must match an explicitly configured origin exactly.
  return [...defaultAllowedOrigins.filter((value) => !value.startsWith('http://localhost') && !value.startsWith('http://127.0.0.1')), ...configured].includes(origin);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;

  if (origin && !isOriginAllowed(origin)) {
    res.statusCode = 403;
    res.end('Origin not allowed');
    return;
  }

  if (origin) {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    if (origin && !isOriginAllowed(origin)) {
      res.statusCode = 403;
      res.end();
      return;
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Root & Standard Health Check Endpoints for Railway & Monitoring
  if ((pathname === '/health' || pathname === '/api/health' || pathname === '/') && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'portfolio-api',
        health: 'HEALTHY',
        uptimeSeconds: Math.floor(process.uptime()),
        timestampIST: formatIST(),
        environment: process.env.NODE_ENV || 'production'
      })
    );
    return;
  }

  // Deep Readiness Check (Verifies runtime dependencies & persistence tier)
  if ((pathname === '/health/ready' || pathname === '/api/health/ready') && req.method === 'GET') {
    const firestoreReady = isFirebaseConfigured();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'READY',
        timestampIST: formatIST(),
        checks: {
          runtime: 'ONLINE',
          persistence: firestoreReady ? 'FIREBASE_FIRESTORE' : 'LOCAL_SECURITY_STATE_FALLBACK',
          auth0Configured: Boolean(process.env.VITE_AUTH0_DOMAIN && !process.env.VITE_AUTH0_DOMAIN.includes('your-tenant')),
          twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('ACxxxx'))
        }
      })
    );
    return;
  }

  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found', path: req.url }));
    }
  } catch (error) {
    console.error('Unhandled server error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio API Server listening on port ${PORT} (0.0.0.0)`);
});
