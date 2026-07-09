import { Router } from 'express';
import {
  getBudgetsForMonth,
  setBudget,
  copyBudgetsFromRecentMonth,
  clearBudgetsForMonth,
  getRecentBudgetMonth,
} from '../services/budgetService.js';
import { sendError as handleError } from '../utils/errorHandler.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const budgets = await getBudgetsForMonth(month, req.userId);
    res.json({ month, budgets });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/recent', async (req, res) => {
  try {
    const { month } = req.query;
    const result = await getRecentBudgetMonth(month, req.userId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/', async (req, res) => {
  try {
    const result = await setBudget(req.body, req.userId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/copy-from-recent', async (req, res) => {
  try {
    const { month } = req.body;
    const result = await copyBudgetsFromRecentMonth(month, req.userId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/clear', async (req, res) => {
  try {
    const { month } = req.body;
    const result = await clearBudgetsForMonth(month, req.userId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
