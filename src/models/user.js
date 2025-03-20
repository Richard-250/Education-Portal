import mongoose from 'mongoose';
import { generateAuthToken, generateResetPasswordToken, generateVerificationToken } from '../utils/genToken.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';


// Base User Schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    required: true,
    default: 'teacher'
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  googleId: String,
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
}, {
  timestamps: true,
  discriminatorKey: 'userType',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await hashPassword(this.password);
    next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return comparePassword(candidatePassword, this.password);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
    return generateAuthToken(this._id, this.role);
  };
  
// Generate verification token
UserSchema.methods.generateVerificationToken = function () {
    const verificationToken = generateVerificationToken(this._id);
    this.verificationToken = verificationToken;
    return verificationToken;
  };

// Generate password reset token
UserSchema.methods.generateResetPasswordToken = function () {
    const resetToken = generateResetPasswordToken(this._id);
    this.resetPasswordToken = resetToken;
    this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    return resetToken;
  };

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', UserSchema);

export default User;