import { createApiApp } from '../src/server/api';

// Vercel serverless entry. All `/api/*` requests are rewritten here (see
// vercel.json) and routed by the Express app.
export default createApiApp();
