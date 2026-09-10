import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createGoal, getGoals, updateGoal, deleteGoal, addMilestone, updateMilestone } from '../controllers/goalController.js';

const router = Router();
router.use(auth);

router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/milestones', addMilestone);
router.put('/:id/milestones/:milestoneId', updateMilestone);

export default router;
