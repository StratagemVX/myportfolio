import 'dotenv/config';
import http from 'node:http';
import { handleApiRequest } from './apiHandler';
import { handleCorsAndPreflight } from './cors';
import { assertSecuritySecrets, formatIST } from './cryptoUtils';
import { isFirebaseConfigured } from './firebase';

assertSecuritySecrets(process.env);

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = http.createServer(async (req, res) => {
  if (handleCorsAndPreflight(req, res, process.env) === 'handled') {
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
