import express from 'express';
const router = express.Router();
import CloudinaryConfig from '../../config/cloudinary.js';
import { restrictTo, authenticate } from '../../middleware/auth.js';
import { createContent, publishContent, getStudentContent, getTeacherContent, getAdminAllContent, updateContent } from '../../controllers/content.controller.js';

// Teacher routes for content management
router.use(authenticate);
router.post('/create', restrictTo('teacher'), CloudinaryConfig.upload.single('file'), createContent);
router.get('/api/content/student', restrictTo('teacher', 'student'), getStudentContent);
router.get('/api/content/teacher', restrictTo('teacher'), getTeacherContent);
router.get('/api/content/admin', restrictTo('teacher'), getAdminAllContent);
router.put('/api/publish/:contentId', restrictTo('teacher'), publishContent);

router.patch('/update/:contentId', restrictTo('teacher'), CloudinaryConfig.upload.single('file'),  updateContent
);

export default router;