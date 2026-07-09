import { Router } from 'express';
import { listTransactionsWithBalance } from '../services/balanceService.js';
import {
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
  buildTransactionsWorkbook,
  ValidationError,
} from '../services/transactionService.js';
import { sendError as handleError } from '../utils/errorHandler.js';

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/', async (req, res) => {
  try {
    const { from, to, account_id } = req.query;
    const accountId = account_id ? Number(account_id) : undefined;
    res.json(await listTransactionsWithBalance({ from, to, accountId, userId: req.userId }));
  } catch (err) {
    handleError(res, err);
  }
});

// Excel export — see the "Export endpoint contract" on the team board.
// `?all=true` exports the full history; otherwise `from`/`to` (both
// required, YYYY-MM-DD) scope a single range. Reuses
// buildTransactionsWorkbook (transactionService.js), which itself reuses
// balanceService.listTransactionsWithBalance for rows/running balance.
router.get('/export', async (req, res) => {
  try {
    const { from, to, all } = req.query;
    const isAllTime = all === 'true' || all === '1';

    if (!isAllTime && (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to))) {
      throw new ValidationError('from and to (YYYY-MM-DD) are required unless all=true');
    }

    const { buffer, filename } = await buildTransactionsWorkbook(isAllTime ? {} : { from, to }, req.userId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createTransaction(req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const result = await createTransfer(req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateTransaction(Number(req.params.id), req.body, req.userId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// Must be registered before the '/:id' route below — Express matches
// routes top-to-bottom, and '/:id' would otherwise capture this path with
// id="all".
router.delete('/all', async (req, res) => {
  try {
    const deleted = await deleteAllTransactions(req.userId);
    res.json({ deleted });
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteTransaction(Number(req.params.id), req.userId);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
