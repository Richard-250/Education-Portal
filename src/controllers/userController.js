import User from "../models/user.js";
import crypto from "crypto";
import { generateToken } from "../utils/genToken.js";
import { sendVerificationEmail, sendTwoFactorEmail } from "../service/emailService.js";
import resendEmailVerification from "../utils/resendEmailVerif.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User Already Exists",});
    }

    const user = await User.create({
      email, password, firstName, lastName, phoneNumber,
    });

    const verificationToken = user.createEmailVerificationToken();

    try {
      await user.save({ validateBeforeSave: false });
      console.log("user saved");
    } catch (err) {
      console.error("Error saving user:", err);
      return res.status(500).json({ success: false, message: "Error saving user" });
    }
    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify-email/${verificationToken}`;

    try {
      await sendVerificationEmail({
        email: user.email,
        subject: "Education Portal - Verify Your Email",
        firstName: user.firstName,
        verificationUrl,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
      });
      console.log("user registered successfully", user);
    } catch (err) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      try {
        await user.save();
      } catch (err) {
        console.error("Error saving user:", err);
        return res.status(500).json({ success: false, message: "Error saving user" });
      }
      return res.status(500).json({
        success: false,
        message: "Error sending verification email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const verifyEmail = async (req, res) => {

    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
          emailVerificationToken: hashedToken,
          emailVerificationExpires: { $gt: Date.now() }
        });
    
       if (!user) {
        return res.redirect('/api/auth/resend-verification-email');
        } 

    if (user.isVerified) {
        return res.status(400).json({ 
          message: 'Email is already verified.' 
        });
      }
        // Update user
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(200).json({
          success: true,
          message: 'Email verified successfully'
        });
      } catch (error) {
        console.error("Error in  verifyEmail:", error);
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    };
    
    export const resendVerificationEmail = async (req, res) => {
      try {
        const { email } = req.body; /// Get email from request body or query params
    
        if (!email) {
          return res.status(400).json({ success: false, message: 'Email is required' });
        }
    
        const user = await User.findOne({ email });
    
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        if (user.isVerified) {
          return res.status(400).json({ success: false, message: 'Email is already verified' });
        }
    
        // Generate new token
        const { token, hashedToken, emailVerificationExpires } = resendEmailVerification();
    
        // Update user with new verification token and expiration
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save({ validateBeforeSave: false });
    
        // Send new verification email
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
        await sendVerificationEmail({
          email: user.email,
          subject: "Education Portal - Verify Your Email",
          firstName: user.firstName,
          verificationUrl,
        });
    
        res.status(200).json({
          success: true,
          message: 'Verification email sent successfully',
        });
      } catch (error) {
        console.error("Error in resendVerificationEmail:", error);
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    };
    
    export const loginUser = async (req, res) => {
        try {
          const { email, password } = req.body;
      
          // Check if email and password exist
          if (!email || !password) {
            return res.status(400).json({
               success: false, message: 'Please provide email and password'
            });
          }
          // Find user
          const user = await User.findOne({ email }).select('+password');
          
          if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials'
            });
          }
          // Check if email is verified
          if (!user.isVerified) {
            return res.status(401).json({
              success: false,
              message: 'Please verify your email before logging in'
            });
          }
          // If 2FA is enabled, send verification code
          if (user.twoFactorEnabled) {
            // Generate and save temporary token for the 2FA process
            const tempToken = user.createTwoFactorTempToken();
            await user.save({ validateBeforeSave: false });
      
            // Generate 2FA code
            const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedCode = crypto
              .createHash('sha256')
              .update(twoFactorCode)
              .digest('hex');
      
            // Store hashed code in Redis with 10-minute expiry
            redisClient.setex(`2fa_${user._id.toString()}`, 600, hashedCode);
      
            // Send 2FA code via email
            await sendTwoFactorEmail({
              email: user.email,
              subject: 'Education Portal - Your 2FA Code',
              firstName: user.firstName,
              code: twoFactorCode
            });
      
            return res.status(200).json({
              success: true,
              message: '2FA code sent to your email',
              tempToken,
              requiresTwoFactor: true
            });
          }
      
          // Generate token
          const token = generateToken(user._id);
      
          // Update last login
          user.lastLogin = Date.now();
          await user.save({ validateBeforeSave: false });
      
          res.status(200).json({
            success: true,
            token,
            user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            },
            message: 'Login successfully',
          });
        } catch (error) {
          console.error("Error in Login:", error);
          res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
        }
      };
      

      exports.verifyTwoFactor = async (req, res, next) => {
        try {
          const { code, tempToken } = req.body;
      
          if (!code || !tempToken) {
            return res.status(400).json({
              success: false,
              message: 'Please provide verification code and temporary token'
            });
          }
      
          const hashedToken = crypto
            .createHash('sha256')
            .update(tempToken)
            .digest('hex');
      
          const user = await User.findOne({
            twoFactorTempToken: hashedToken,
            twoFactorTempExpires: { $gt: Date.now() }
          });
      
          if (!user) {
            return res.status(400).json({
              success: false,
              message: 'Token is invalid or has expired'
            });
          }
      
          // Get hashed code from Redis
          // const hashedStoredCode = await redisClient.get(`2fa_${user._id.toString()}`);
          const hashedCode = crypto
            .createHash('sha256')
            .update(code)
            .digest('hex');
      
          // Validate code
          // For simplicity, using direct comparison instead of Redis in this example
          if (hashedCode !== hashedStoredCode) {
            return res.status(401).json({
              success: false,
              message: 'Invalid verification code'
            });
          }
      
          // Clear temporary token
          user.twoFactorTempToken = undefined;
          user.twoFactorTempExpires = undefined;
          
          // Update last login
          user.lastLogin = Date.now();
          await user.save({ validateBeforeSave: false });
      
          // Generate token
          const token = generateToken(user._id);
      
          res.status(200).json({
            success: true,
            token,
            user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          });
        } catch (error) {
          next(error);
        }
      };
    