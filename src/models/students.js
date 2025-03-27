import mongoose from 'mongoose';
import User from './user';

// Student Schema (extends User)
const StudentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }],
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'pending'],
      default: 'active'
    }
  }],
  achievements: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    dateEarned: {
      type: Date,
      default: Date.now
    },
    badgeUrl: {
      type: String
    }
  }],
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    remark: {
      type: String
    }
  }],
  academicRecords: {
    GPA: {
      type: Number,
      min: 0,
      max: 4
    },
    academicStanding: {
      type: String,
      enum: ['good', 'warning', 'probation', 'suspended'],
      default: 'good'
    }
  },
  specialNeeds: {
    hasSpecialNeeds: {
      type: Boolean,
      default: false
    },
    details: {
      type: String
    }
  },
  primaryLanguage: {
    type: String,
    default: 'English'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get student age
StudentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Add compound indexes
StudentSchema.index({ grade: 1, studentId: 1 });
StudentSchema.index({ grade: 1, dateOfBirth: 1 });
StudentSchema.index({ 'enrolledCourses.course': 1, 'enrolledCourses.status': 1 });
StudentSchema.index({ 'academicRecords.GPA': 1, 'academicRecords.academicStanding': 1 });
StudentSchema.index({ 'attendance.date': 1, 'attendance.status': 1 });
StudentSchema.index({ parents: 1, grade: 1 });

// Pre-save hook to set role
StudentSchema.pre('save', function(next) {
  if (!this.role) {
    this.role = 'student';
  }
  next();
});

const Student = User.discriminator('Student', StudentSchema);

export default Student;