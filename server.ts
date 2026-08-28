import 'dotenv/config';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/server/api';

// Local development / self-hosted entry point.
// On Vercel the API is served by `api/index.ts` and the frontend is static.

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const { default: express } = await import('express');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding RSVP server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
