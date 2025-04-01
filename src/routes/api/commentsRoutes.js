import express from 'express';
const router = express.Router();
import { restrictTo, authenticate } from '../../middleware/auth.js';
import { postComment, replyToComment } from '../../controllers/comments.controller.js';


router.use(authenticate);
router.post('/api/contents/:contentId/comments', restrictTo('teacher', 'student'), postComment);
router.post('/api/contents/:contentId/comments/:commentId/replies', restrictTo('teacher', 'student'), replyToComment)

export default router