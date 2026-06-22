import { Router } from 'express';
import multer from 'multer';
import { parseFile, commitImport, ValidationError } from '../services/importService.js';

const router = Router();

// multer config scoped to this file only — 10MB memory-buffered upload,
// nothing else in the codebase needs file uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function handleError(res, err) {
  if (err instanceof ValidationError || err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }
  if (err.statusCode === 404) {
    return res.status(404).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

router.post('/parse', (req, res) => {
  upload.single('file')(req, res, (uploadErr) => {
    if (uploadErr) {
      // multer surfaces oversized-file / malformed-multipart errors here,
      // before our own handler ever runs — treat as a clean 400.
      return res.status(400).json({ error: uploadErr.message || 'File upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    try {
      const result = parseFile(req.file.buffer);
      res.json(result);
    } catch (err) {
      handleError(res, err);
    }
  });
});

router.post('/commit', (req, res) => {
  try {
    const result = commitImport(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
