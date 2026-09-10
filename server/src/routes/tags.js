import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createTag, getTags, updateTag, deleteTag } from '../controllers/tagController.js';

const router = Router();
router.use(auth);

router.post('/', createTag);
router.get('/', getTags);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
