import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const plugins = [react()];

  // Only load API middleware during local dev server ('serve')
  if (command === 'serve') {
    plugins.push({
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            try {
              const apiHandlerPath = './server/apiHandler.ts';
              const { handleApiRequest } = await import(/* @vite-ignore */ apiHandlerPath);
              const handled = await handleApiRequest(req, res);
              if (handled) return;
            } catch (err) {
              console.error('API Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
              return;
            }
          }
          next();
        });
      }
    });
  }

  return {
    plugins,
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            icons: ['lucide-react']
          }
        }
      }
    }
  };
});
