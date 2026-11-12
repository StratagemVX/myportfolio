import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, ApiError } from '../src/services/apiClient';
import { handleApiRequest } from '../server/apiHandler';
import { stateManager } from '../server/state';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';

// Helper to create mock IncomingMessage
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}): IncomingMessage {
  const req = new EventEmitter() as unknown as IncomingMessage;
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = {
    host: 'localhost:3000',
    'content-type': 'application/json',
    ...(options.headers || {})
  };
  req.socket = { remoteAddress: '127.0.0.1' } as any;

  // Simulate streaming body
  process.nextTick(() => {
    if (options.body !== undefined) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.emit('data', Buffer.from(payload));
    }
    req.emit('end');
  });

  return req;
}

// Helper to create mock ServerResponse
function createMockResponse(): {
  res: ServerResponse;
  getStatusCode: () => number;
  getHeaders: () => Record<string, string>;
  getBody: () => string;
  getJson: () => any;
} {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body = '';

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = value;
      return this;
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    headersSent: false,
    end(data?: any) {
      if (data) {
        body += typeof data === 'string' ? data : data.toString();
      }
      this.headersSent = true;
      return this;
    }
  } as unknown as ServerResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
    getJson: () => (body ? JSON.parse(body) : null)
  };
}

describe('Authentication & API Resilience Suite (Phase 2 & Phase 9)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Frontend SecurityApiClient Resilience (No SyntaxError on HTML)', () => {
    it('safely handles Vercel 404 HTML response without throwing SyntaxError: Unexpected token', async () => {
      // Mock fetch returning Vercel 404 plain text / HTML page
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({
          'content-type': 'text/plain; charset=utf-8'
        }),
        text: vi.fn().mockResolvedValue('The page could not be found\n\nNOT_FOUND\n\nbom1::ks95b-1794307990041-2a1ab4961591')
      } as any);

      await expect(apiClient.login('the.suryaputraa@gmail.com', 'mypassword')).rejects.toThrow(ApiError);

      try {
        await apiClient.login('the.suryaputraa@gmail.com', 'mypassword');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('ENDPOINT_NOT_FOUND');
        expect(err.status).toBe(404);
        expect(err.message).toBe('The requested authentication endpoint could not be found. Please contact support or try again later.');
        expect(err.message).not.toContain('Unexpected token');
        expect(err.message).not.toContain('The page c');
      }
    });

    it('safely handles 502/503 Service Unavailable HTML responses gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8'
        }),
        text: vi.fn().mockResolvedValue('<html><body><h1>503 Service Unavailable</h1></body></html>')
      } as any);

      try {
        await apiClient.login('the.suryaputraa@gmail.com', 'mypassword');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('AUTH_SERVICE_UNAVAILABLE');
        expect(err.status).toBe(503);
        expect(err.message).toBe('Authentication service is temporarily unavailable. Please retry in a few moments.');
      }
    });

    it('safely handles network failure / offline errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await apiClient.login('the.suryaputraa@gmail.com', 'mypassword');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('NETWORK_ERROR');
        expect(err.status).toBe(0);
        expect(err.message.toLowerCase()).toContain('network');
      }
    });

    it('safely handles 204 No Content without crashing on JSON parsing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('')
      } as any);

      const result = await apiClient.logout();
      expect(result).toBeUndefined();
    });

    it('parses structured backend errors correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Authentication failed. Invalid administrator credentials.' }))
      } as any);

      try {
        await apiClient.login('the.suryaputraa@gmail.com', 'wrongpassword');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(401);
        expect(err.message).toBe('Authentication failed. Invalid administrator credentials.');
      }
    });
  });

  describe('Backend API Endpoints & Health Route Verification (Phase 3 & Phase 9)', () => {
    beforeEach(() => {
      stateManager.pendingLoginChallenges.clear();
    });

    it('GET /api/health returns HTTP 200 with { status: "ok", service: "portfolio-api" } and integration matrix', async () => {
      const req = createMockRequest({ method: 'GET', url: '/api/health' });
      const { res, getStatusCode, getJson, getHeaders } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(true);
      expect(getStatusCode()).toBe(200);
      expect(getHeaders()['content-type']).toContain('application/json');

      const data = getJson();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('portfolio-api');
      expect(data.health).toBe('HEALTHY');
      expect(data.matrix).toBeDefined();
    });

    it('GET /health (normalized root route) returns HTTP 200 with { status: "ok", service: "portfolio-api" }', async () => {
      const req = createMockRequest({ method: 'GET', url: '/health' });
      const { res, getStatusCode, getJson } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(true);
      expect(getStatusCode()).toBe(200);

      const data = getJson();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('portfolio-api');
    });

    it('POST /api/auth/login with missing credentials returns 400 JSON error', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/auth/login',
        body: { identifier: '', passphrase: '' }
      });
      const { res, getStatusCode, getJson } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(true);
      expect(getStatusCode()).toBe(400);

      const data = getJson();
      expect(data.error).toBe('Both login identifier and password are required.');
    });

    it('POST /api/auth/login with invalid credentials returns 401 JSON error (no HTML)', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/auth/login',
        body: { identifier: 'the.suryaputraa@gmail.com', passphrase: 'IncorrectPassword!999' }
      });
      const { res, getStatusCode, getJson } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(true);
      expect(getStatusCode()).toBe(401);

      const data = getJson();
      expect(data.error).toBe('Authentication failed. Invalid administrator credentials.');
    });

    it('POST /api/auth/login with valid owner credentials returns 200 with mandatory MFA challenge', async () => {
      const ownerState = stateManager.getState();
      const ownerEmail = ownerState.owner.loginEmail;
      const validPass = process.env.ADMIN_PASSWORD;
      if (!validPass || validPass.length < 16) {
        throw new Error('ADMIN_PASSWORD with at least 16 characters must be configured for auth tests.');
      }

      const req = createMockRequest({
        method: 'POST',
        url: '/api/auth/login',
        body: { identifier: ownerEmail, passphrase: validPass }
      });
      const { res, getStatusCode, getJson } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(true);
      expect(getStatusCode()).toBe(200);

      const data = getJson();
      expect(data.requireMfa).toBe(true);
      expect(data.challengeToken).toBeDefined();
      expect(data.challengeToken).toMatch(/^chal_\d+_/);
      expect(data.allowedFactors).toContain('TOTP');
    });

    it('GET /api/nonexistent-route returns false or 404 without HTML exception', async () => {
      const req = createMockRequest({ method: 'GET', url: '/api/nonexistent-route' });
      const { res, getStatusCode } = createMockResponse();

      const handled = await handleApiRequest(req, res);
      expect(handled).toBe(false);
      expect(getStatusCode()).toBe(200); // Unhandled returns false so caller can respond with 404 JSON
    });
  });
});
