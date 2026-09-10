import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getActivities } from '../controllers/activityController.js';

const router = Router();
router.use(auth);

router.get('/', getActivities);

export default router;
