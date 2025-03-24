import User from "../models/user.js";
import { CustomError } from "../middleware/errorhandler.js";
import { sendPasswordResetEmail } from "../service/emailService.js";
import crypto from "crypto";

export const enableTwoFactor =  async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
    
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
    if (user.twoFactorEnabled) {
        return res.status(401).json({
            success: false,
            message: 'two factor already set to true'
        })
    }
        // Update user
        user.twoFactorEnabled = true;
        await user.save({ validateBeforeSave: false });
    
        res.status(200).json({
          success: true,
          message: 'Two-factor authentication enabled successfully'
        });
      } catch (error) {
        next(error);
      }
    };

    
export const disableTwoFactor = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      // Update user
      user.twoFactorEnabled = false;
      await user.save({ validateBeforeSave: false });
  
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication disabled successfully'
      });
    } catch (error) {
      next(error);
    }
  };
  
  
export const forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your email'
        });
      }
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user found with that email'
        });
      }
  
      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
  
      // Send password reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
      
      try {
        await sendPasswordResetEmail({
          email: user.email,
          subject: 'Education Portal - Password Reset',
          firstName: user.firstName,
          resetUrl
        });
  
        res.status(200).json({
          success: true,
          message: 'Password reset link sent to your email'
        });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
  
        return res.status(500).json({
          success: false,
          message: 'Error sending email. Please try again.'
        });
      }
    } catch (error) {
      next(error);
    }
  };
  

  export const resetPassword = async (req, res, next) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a new password'
        });
      }
  
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
  
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token is invalid or has expired'
        });
      }
  
      // Update user
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  };
  

  export const getCurrentUser = async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      next(error);
    }
  };


  export const updateUserProfile = async (req, res, next) => {
    try {
      const { firstName, lastName, email } = req.body;
      
      // Find the user
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use'
          });
        }
      }
      
      // Update user fields if provided
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      
      // Save the updated user
      await user.save();
      
      // Return updated user data
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };