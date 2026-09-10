import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createHabit, getHabits, updateHabit, deleteHabit, logHabit, getHabitStats } from '../controllers/habitController.js';

const router = Router();
router.use(auth);

router.post('/', createHabit);
router.get('/', getHabits);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/log', logHabit);
router.get('/:id/stats', getHabitStats);

export default router;
