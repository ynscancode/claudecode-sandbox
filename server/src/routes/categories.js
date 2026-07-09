import { Router } from 'express';
import { listCategories, createCategory, deleteCategory } from '../services/categoryService.js';
import { sendError as handleError } from '../utils/errorHandler.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const categories = await listCategories(req.query.account_id, req.userId);
    res.json(categories);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createCategory(req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteCategory(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
