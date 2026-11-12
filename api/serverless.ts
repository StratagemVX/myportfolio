import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../server/apiHandler';
import { handleCorsAndPreflight } from '../server/cors';
import { assertSecuritySecrets } from '../server/cryptoUtils';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (handleCorsAndPreflight(req, res, process.env) === 'handled') {
    return;
  }

  assertSecuritySecrets(process.env);

  // Normalize URL from Vercel rewrites or direct requests
  const host = req.headers.host || 'localhost:3000';
  const urlObj = new URL(req.url || '/', `http://${host}`);
  
  // 1. Check for __path parameter from vercel.json rewrite: /api/:path* -> /api/index.js?__path=$1
  const customPath = urlObj.searchParams.get('__path');
  // 2. Check for Vercel matched path header
  const matchedPath = (req.headers['x-matched-path'] as string) || 
                      (req.headers['x-vercel-matched-path'] as string);

  let targetPath = urlObj.pathname;
  if (customPath) {
    const clean = customPath.replace(/^\/+/, '');
    targetPath = (clean === 'health' || clean === 'api/health') ? '/api/health' : ('/api/' + clean);
    urlObj.searchParams.delete('__path');
  } else if (matchedPath && matchedPath.startsWith('/api')) {
    targetPath = matchedPath;
  } else if (targetPath === '/health') {
    targetPath = '/api/health';
  } else if (!targetPath.startsWith('/api')) {
    targetPath = '/api' + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);
  }

  // Rebuild req.url
  const queryStr = urlObj.searchParams.toString();
  req.url = targetPath + (queryStr ? `?${queryStr}` : '');

  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint ${req.method} ${req.url} was not found.`
        }
      }));
    }
  } catch (error) {
    console.error('Unhandled server error in Vercel Serverless Function:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected internal server error occurred.'
        }
      }));
    }
  }
}
