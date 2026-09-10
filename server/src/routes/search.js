import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { searchTodos, exportData, exportCSV, importData } from '../controllers/searchController.js';

const router = Router();
router.use(auth);

router.get('/', searchTodos);
router.get('/export', exportData);
router.get('/export/csv', exportCSV);
router.post('/import', importData);

export default router;
