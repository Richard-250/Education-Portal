import { Router } from "express";
import validateSignup from "../../validations/signup.js";
import validateLogin from "../../validations/login.js";
import { authenticateUser } from "../../middleware/auth.js";
import { registerUser, verifyEmail, resendVerificationEmail, loginUser, verifyTwoFactor } from "../../controllers/userController.js";
import { enableTwoFactor, disableTwoFactor, forgotPassword, resetPassword, getCurrentUser } from "../../controllers/otherUserBased.js";



const router = Router();

router.post('/signup', validateSignup, registerUser );
router.get('/api/auth/verify-email/:token', verifyEmail);
router.post('/api/auth/resend-verification-email', resendVerificationEmail)
router.post('/login', validateLogin, loginUser);
router.post('/api/auth/verify-2fa', verifyTwoFactor);
router.post('/api/auth/enable-2fa', authenticateUser, enableTwoFactor);
router.post('/api/auth/disable-2fa', authenticateUser, disableTwoFactor);
router.post('/api/auth/forgot-password', forgotPassword);
router.patch('/api/auth/reset-password/:token', resetPassword);
router.get('/api/auth/me', authenticateUser, getCurrentUser);

router.route('/:id')
  .get(restrictTo('admin'), getUserById)
  .put(restrictTo('admin'), adminUpdateUser)
  .delete(restrictTo('admin'), deleteUser);


export default router;