import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createHabit, getHabits, updateHabit, deleteHabit, logHabit, getHabitStats,
  getHabitCompletions, logHabitCompletion, removeHabitCompletion
} from '../controllers/habitController.js';

const router = Router();
router.use(auth);

router.get('/completions', getHabitCompletions);
router.post('/', createHabit);
router.get('/', getHabits);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/log', logHabit);
router.post('/:id/completions', logHabitCompletion);
router.delete('/:id/completions/:date', removeHabitCompletion);
router.get('/:id/stats', getHabitStats);

export default router;
