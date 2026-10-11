import type { Request, Response } from 'express';
import { app } from '../src/app.js';

// Vercel serverless entry. `src/server.ts` calls `listen()`, which cannot run
// on serverless — so we define a handler function locally and delegate to the
// Express app. A locally-defined function satisfies Vercel's "default export
// must be a function" validator (a bare `export default app` re-export gets
// traced back to `src/app.js`, which has only a named export).
// All routes (`/health`, `/api/v1/*`) reach here via the rewrite in vercel.json.
export default function handler(req: Request, res: Response): unknown {
  return app(req, res);
}
