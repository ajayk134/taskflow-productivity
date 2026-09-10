import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getDashboard, getAnalytics } from '../controllers/statsController.js';

const router = Router();
router.use(auth);

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

export default router;
