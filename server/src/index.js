import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import accountsRouter from './routes/accounts.js';
import transactionsRouter from './routes/transactions.js';
import summaryRouter from './routes/summary.js';
import budgetsRouter from './routes/budgets.js';
import categoriesRouter from './routes/categories.js';
import importsRouter from './routes/imports.js';

const app = express();

// CORS_ORIGIN, if set, restricts allowed origins (comma-separated list
// supported) — for the public-internet deployment where this API has no
// auth and will be reached from a separately-hosted frontend (Vercel/
// Netlify). Left unset, behavior is unchanged from before: fully open,
// which is fine for local dev (client dev server + backend, no public
// exposure).
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: allowedOrigins }));
} else {
  app.use(cors());
}

// Simple bearer-token auth gate. When API_TOKEN is set (production), every
// request must carry `Authorization: Bearer <token>` — or, for the export
// download endpoint which uses direct anchor navigation (can't set headers),
// a `?token=<token>` query param is also accepted on that one route.
// When API_TOKEN is unset (local dev), the gate is skipped entirely.
const apiToken = process.env.API_TOKEN;
if (apiToken) {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const bearer = req.headers['authorization'];
    const queryToken = req.query.token;
    if (bearer === `Bearer ${apiToken}` || queryToken === apiToken) return next();
    res.status(401).json({ error: 'Unauthorized' });
  });
}

app.use(express.json());

app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/categories', categoriesRouter);
// Larger JSON body limit scoped to this router only: a ~20k-row commit
// payload (~2-4MB) would exceed express.json()'s default 100KB cap and get
// rejected with an HTML 413 before reaching the route. The global
// express.json() above stays at its default for every other router.
app.use('/api/imports', express.json({ limit: '25mb' }), importsRouter);

const PORT = process.env.PORT || 4000;
// On Vercel this module is imported by api/index.js as a serverless handler
// — there is no long-running process to bind a port on, and calling
// app.listen() there would be a no-op at best / an error at worst. Local
// dev and any non-Vercel host (still start the server normally.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Budget server listening on http://localhost:${PORT}`);
  });
}

export default app;
