import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notificationController.js';

const router = Router();
router.use(auth);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
