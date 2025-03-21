import { Router } from "express";
import validateSignup from "../../validations/signup.js";
// import validateLogin from "../../validations/login.js";
import { registerUser, verifyEmail, resendVerificationEmail } from "../../controllers/userController.js";




const route = Router();

route.post('/signup', validateSignup, registerUser );
route.get('/api/auth/verify-email/:token', verifyEmail);
route.post('/api/auth/resend-verification-email', resendVerificationEmail)
// route.post('/login', validateLogin, loginUser);


export default route;