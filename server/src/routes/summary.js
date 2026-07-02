import { Router } from 'express';
import { getDailySummary, getMonthlySummary, getTransactionActivity } from '../services/summaryService.js';
import { isValidDateStr, isValidMonthStr } from '../utils/dateUtils.js';

const router = Router();

router.get('/daily', (req, res) => {
  const { date } = req.query;
  if (!date || !isValidDateStr(date)) {
    return res.status(400).json({ error: 'date query param required in YYYY-MM-DD format' });
  }
  res.json(getDailySummary(date));
});

router.get('/monthly', (req, res) => {
  const { month } = req.query;
  if (!month || !isValidMonthStr(month)) {
    return res.status(400).json({ error: 'month query param required in YYYY-MM format' });
  }
  res.json(getMonthlySummary(month));
});

router.get('/activity', (req, res) => {
  res.json(getTransactionActivity());
});

export default router;
