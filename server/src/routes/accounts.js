import { Router } from 'express';
import { getAccountBalances } from '../services/balanceService.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAccountBalances());
});

export default router;
