import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createTemplate, getTemplates, updateTemplate, deleteTemplate, createTodosFromTemplate } from '../controllers/templateController.js';

const router = Router();
router.use(auth);

router.post('/', createTemplate);
router.get('/', getTemplates);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/create-todos', createTodosFromTemplate);

export default router;
