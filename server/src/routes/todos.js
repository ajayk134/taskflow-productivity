import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createTodo, getTodos, getTodo, updateTodo, deleteTodo,
  permanentlyDeleteTodo, restoreTodo, duplicateTodo, archiveTodo,
  snoozeTodo, bulkUpdateTodos, bulkDeleteTodos,
  getMyDay, reorderMyDay, getTrash, emptyTrash
} from '../controllers/todoController.js';

const router = Router();
router.use(auth);

router.get('/my-day', getMyDay);
router.post('/my-day/reorder', reorderMyDay);
router.get('/trash', getTrash);
router.post('/trash/empty', emptyTrash);
router.post('/bulk-update', bulkUpdateTodos);
router.post('/bulk-delete', bulkDeleteTodos);
router.post('/', createTodo);
router.get('/', getTodos);
router.get('/:id', getTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);
router.post('/:id/permanent-delete', permanentlyDeleteTodo);
router.post('/:id/restore', restoreTodo);
router.post('/:id/duplicate', duplicateTodo);
router.post('/:id/archive', archiveTodo);
router.post('/:id/snooze', snoozeTodo);

export default router;
