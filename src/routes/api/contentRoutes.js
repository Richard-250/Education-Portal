import express from 'express';
const router = express.Router();
import CloudinaryConfig from '../../config/cloudinary.js';
import { restrictTo, authenticate } from '../../middleware/auth.js';
import { createContent, publishContent, getStudentContent } from '../../controllers/content.controller.js';

// Teacher routes for content management
router.use(authenticate);
router.post('/create', restrictTo('teacher'), CloudinaryConfig.upload.single('file'), createContent);
router.get('/api/content', restrictTo('teacher'), getStudentContent);
router.put('/api/publish/:contentId', restrictTo('teacher'), publishContent);

// router.put('/update/:contentId', 
//   authMiddleware, 
//   roleMiddleware(['teacher']),
//   validateContentUpdate,
//   uploadMiddleware.single('file'), // Optional file update
//   updateContent
// );

// router.get('/teacher/contents', 
//   authMiddleware, 
//   roleMiddleware(['teacher']),
//   getTeacherContent
// );

// // Student routes for content retrieval
// router.get('/student/contents', 
//   authMiddleware, 
//   roleMiddleware(['student']),
//   validateContentRetrieval,
//   getStudentContent
// );

// // Parent routes for content visibility (limited access)
// router.get('/parent/contents', 
//   authMiddleware, 
//   roleMiddleware(['parent']),
//   validateContentRetrieval,
//   getStudentContent // Reuse student content retrieval with additional filtering
// );

// // Optional: Route for specific content details
// router.get('/details/:contentId', 
//   authMiddleware,
//   param('contentId').isMongoId().withMessage('Invalid content ID'),
//   (req, res, next) => {
//     // Middleware to check user role and content accessibility
//     const userRole = req.user.role;
    
//     if (userRole === 'teacher') {
//       // Teachers can see all their own content
//       return next();
//     }
    
//     if (userRole === 'student') {
//       // Students can only see published content
//       req.accessCondition = { isPublished: true };
//       return next();
//     }
    
//     if (userRole === 'parent') {
//       // Parents have restricted access
//       req.accessCondition = { 
//         isPublished: true,
//         accessibleTo: 'all'
//       };
//       return next();
//     }
    
//     return res.status(403).json({ message: 'Access denied' });
//   },
//   // Note: You'll need to implement getContentDetails in your controller
//   (req, res) => {
//     // Placeholder for content details handler
//     res.status(501).json({ message: 'Content details endpoint not implemented' });
//   }
// );

export default router;