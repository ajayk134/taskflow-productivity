import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();
router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
