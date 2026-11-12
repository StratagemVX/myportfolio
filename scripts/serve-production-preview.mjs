import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.env.PREVIEW_PORT || process.env.PORT || 4173);
const DIST_DIR = path.resolve('dist');
const VERCEL_JSON_PATH = path.resolve('vercel.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf'
};

function vercelPatternToRegex(source) {
  let pattern = source;
  // Convert named/unnamed Vercel path segments while keeping regex groups intact
  pattern = pattern.replace(/^\//, '\\/');
  return new RegExp(`^${pattern}$`);
}

function loadVercelHeaders() {
  if (!fs.existsSync(VERCEL_JSON_PATH)) return [];
  const cfg = JSON.parse(fs.readFileSync(VERCEL_JSON_PATH, 'utf-8'));
  return (cfg.headers || []).map((rule) => ({
    regex: vercelPatternToRegex(rule.source),
    headers: rule.headers || []
  }));
}

function applyMatchingHeaders(res, pathname, headerRules) {
  for (const rule of headerRules) {
    if (rule.regex.test(pathname)) {
      for (const h of rule.headers) {
        res.setHeader(h.key, h.value);
      }
    }
  }
}

function resolveStaticFile(pathname) {
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const trimmed = safePath.replace(/^[/\\]+/, '');
  const exact = path.join(DIST_DIR, trimmed);

  if (fs.existsSync(exact) && fs.statSync(exact).isFile()) {
    return exact;
  }

  const indexCandidate = path.join(DIST_DIR, trimmed, 'index.html');
  if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
    return indexCandidate;
  }

  const htmlCandidate = path.join(DIST_DIR, `${trimmed}.html`);
  if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
    return htmlCandidate;
  }

  return null;
}

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg']);

function sendFileResponse(req, res, filePath, ext) {
  const raw = fs.readFileSync(filePath);
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  if (COMPRESSIBLE_EXTS.has(ext) && /\bgzip\b/i.test(acceptEncoding)) {
    const compressed = zlib.gzipSync(raw, { level: 6 });
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.statusCode = 200;
    res.end(compressed);
    return;
  }
  res.statusCode = 200;
  res.end(raw);
}

const BYPASS_SPA_FALLBACK_REGEX = /^\/(api(?:\/|$)|health(?:\/|$)|llms\.txt$|ai-catalog\.json$|robots\.txt$|sitemap\.xml$|\.well-known\/|assets\/|fonts\/|current-previews\/)/;

let cachedApiHandler = null;
async function tryHandleApi(req, res) {
  if (!cachedApiHandler) {
    const apiEntry = path.resolve('api/index.js');
    if (fs.existsSync(apiEntry)) {
      try {
        const mod = await import(pathToFileURL(apiEntry).href);
        cachedApiHandler = mod.default;
      } catch (err) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: 'API handler failed closed during initialization.',
            detail: err instanceof Error ? err.message : 'Unavailable'
          })
        );
        return true;
      }
    }
  }
  if (cachedApiHandler) {
    await cachedApiHandler(req, res);
    return true;
  }
  return false;
}

export function startProductionPreviewServer(port = PORT) {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist directory not found. Run "npm run build" before starting production preview.');
  }

  const headerRules = loadVercelHeaders();

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${port}`);
      const pathname = reqUrl.pathname;

      applyMatchingHeaders(res, pathname, headerRules);

      if (pathname === '/api' || pathname.startsWith('/api/') || pathname === '/health') {
        if (pathname === '/api' || pathname === '/health') {
          req.url = '/api/health';
        }
        const handled = await tryHandleApi(req, res);
        if (handled) return;
      }

      const resolved = resolveStaticFile(pathname);
      if (resolved) {
        const ext = path.extname(resolved).toLowerCase();
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        }
        sendFileResponse(req, res, resolved, ext);
        return;
      }

      if (BYPASS_SPA_FALLBACK_REGEX.test(pathname)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not found');
        return;
      }

      const spaIndex = path.join(DIST_DIR, 'index.html');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      sendFileResponse(req, res, spaIndex, '.html');
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal preview server error');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startProductionPreviewServer(PORT).then(() => {
    console.log(`Production preview server with Vercel CSP/headers listening at http://127.0.0.1:${PORT}`);
  });
}
