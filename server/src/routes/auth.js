import { Router } from 'express';
import {
  signup,
  login,
  createGuest,
  getUser,
  deleteAccount,
  ValidationError,
  AuthenticationError,
} from '../services/authService.js';
import requireUser from '../middleware/requireUser.js';

const router = Router();

function handleError(res, err) {
  if (err instanceof AuthenticationError || err.statusCode === 401) {
    return res.status(401).json({ error: err.message });
  }
  if (err instanceof ValidationError || err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }
  if (err.statusCode === 404) {
    return res.status(404).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const { token, user } = await signup({ username, password });
    res.status(201).json({ token, user });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const { token, user } = await login({ username, password });
    res.status(200).json({ token, user });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/guest', async (req, res) => {
  try {
    const { token, user } = await createGuest();
    res.status(201).json({ token, user });
  } catch (err) {
    handleError(res, err);
  }
});

// requireUser applied INSIDE the router only for this one route — every
// other /api/auth route is JWT-exempt (see index.js's router registration).
router.get('/me', requireUser, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.status(200).json({ user });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /me — self-only account deletion; requireUser applied INSIDE the
// router (same convention as GET /me) so req.userId comes from the verified
// JWT, never from the body/params — there is no admin delete-other-user path.
// Body: { password } (required unless the account is a guest, which has no
// password to verify). On success the account and all its data are gone; no
// token is returned since there is nothing left to authenticate.
router.delete('/me', requireUser, async (req, res) => {
  try {
    const { password } = req.body || {};
    const result = await deleteAccount(req.userId, { password });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// Stateless — the server has no session to invalidate; the client discards
// its stored token. No requireUser needed (a logout call should never itself
// require a still-valid token).
router.post('/logout', (req, res) => {
  res.status(200).json({ ok: true });
});

export default router;
