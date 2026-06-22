import { Router } from 'express';
import { listTransactionsWithBalance } from '../services/balanceService.js';
import {
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
  ValidationError,
} from '../services/transactionService.js';

const router = Router();

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

router.get('/', (req, res) => {
  const { from, to, account_id } = req.query;
  const accountId = account_id ? Number(account_id) : undefined;
  res.json(listTransactionsWithBalance({ from, to, accountId }));
});

router.post('/', (req, res) => {
  try {
    const result = createTransaction(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/transfer', (req, res) => {
  try {
    const result = createTransfer(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/:id', (req, res) => {
  try {
    const result = updateTransaction(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// Must be registered before the '/:id' route below — Express matches
// routes top-to-bottom, and '/:id' would otherwise capture this path with
// id="all".
router.delete('/all', (req, res) => {
  try {
    const deleted = deleteAllTransactions();
    res.json({ deleted });
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/:id', (req, res) => {
  try {
    deleteTransaction(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
