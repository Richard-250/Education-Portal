import mongoose from 'mongoose';
import User from './user';

// Parent Schema (extends User)
const ParentSchema = new mongoose.Schema({
  occupation: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other'],
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'USA'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    }
  },
  communicationPreferences: {
    preferredMethod: {
      type: String,
      enum: ['email', 'sms', 'app', 'call'],
      default: 'email'
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    doNotDisturbStart: {
      type: String,
      default: '22:00' // 10 PM
    },
    doNotDisturbEnd: {
      type: String,
      default: '08:00' // 8 AM
    }
  },
  paymentInformation: {
    hasSavedPayment: {
      type: Boolean,
      default: false
    },
    lastFourDigits: {
      type: String
    },
    expiryDate: {
      type: String
    },
    billingAddress: {
      sameAsAddress: {
        type: Boolean,
        default: true
      },
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  accessLevel: {
    type: String,
    enum: ['full', 'restricted', 'readonly'],
    default: 'full'
  },
  lastParentTeacherMeeting: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to set role
ParentSchema.pre('save', function(next) {
  if (!this.role) {
    this.role = 'parent';
  }
  next();
});

// Virtual to get number of associated students
ParentSchema.virtual('studentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Method to get all students' information (to be used with populate)
ParentSchema.methods.getStudentsInfo = async function() {
  await this.populate({
    path: 'students',
    select: 'firstName lastName grade studentId enrolledCourses'
  });
  return this.students;
};

// Create an index for faster lookups
ParentSchema.index({ 'students': 1 });

const Parent = User.discriminator('Parent', ParentSchema);

export default Parent;