import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createProject, getProjects, getProject, updateProject,
  deleteProject, archiveProject, addSection, updateSection, deleteSection
} from '../controllers/projectController.js';

const router = Router();
router.use(auth);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/archive', archiveProject);
router.post('/:id/sections', addSection);
router.put('/:id/sections/:sectionId', updateSection);
router.delete('/:id/sections/:sectionId', deleteSection);

export default router;
