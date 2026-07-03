import app from '../src/index.js';

export default app;

// Vercel's default body parser would consume the request stream before
// Express ever sees it — multer on /api/imports/parse needs the raw
// multipart stream, and express.json() (already wired in src/index.js)
// needs to parse the body itself for JSON routes. Disabling Vercel's
// bodyParser lets Express own the whole request body lifecycle, unchanged
// from local dev.
export const config = {
  api: {
    bodyParser: false,
  },
};
