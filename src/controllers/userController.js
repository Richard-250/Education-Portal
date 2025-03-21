import User from "../models/user.js";
import crypto from "crypto";
// import { generateToken, verifyToken } from "../utils/genToken.js";
import { sendVerificationEmail } from "../service/emailService.js";
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
    