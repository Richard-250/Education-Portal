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


  
export const getAllUsers = async (req, res, next) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Set up pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Set up filtering
    const filterOptions = {};
    
    // Filter by role if provided
    if (req.query.role) {
      filterOptions.role = req.query.role;
    }
    
    // Filter by two-factor status if provided
    if (req.query.twoFactorEnabled !== undefined) {
      filterOptions.twoFactorEnabled = req.query.twoFactorEnabled === 'true';
    }
    
    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filterOptions.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }
    
    // Execute query with pagination
    const users = await User.find(filterOptions)
      .select('_id firstName lastName email role twoFactorEnabled createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(filterOptions);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getUserById = async (req, res, next) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};


export const adminUpdateUser = async (req, res, next) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { firstName, lastName, email, role, twoFactorEnabled } = req.body;
    
    // Find the user
    const user = await User.findById(req.params.id);
    
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
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
    
    // Save the updated user
    await user.save();
    
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
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (req, res, next) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Check if user is trying to delete themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account this way'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};




// DELETE /api/users/:id
//PUT /api/users/:id  adminUpdateUser
// GET /api/users/:id getUserById
// GET /api/users  getAllUsers
//  PUT /api/users/profile updateUserProfile