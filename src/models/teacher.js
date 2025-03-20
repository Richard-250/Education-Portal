import mongoose from 'mongoose';
import User from './user';

// Teacher Schema (extends User)
const TeacherSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number
    }
  }],
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true,
    default: 'Teacher'
  },
  classesTaught: [{
    name: {
      type: String,
      required: true
    },
    grade: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      required: true
    },
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: {
        type: String
      },
      endTime: {
        type: String
      },
      roomNumber: {
        type: String
      }
    }]
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    issuingAuthority: {
      type: String
    },
    year: {
      type: Number
    },
    expiryDate: {
      type: Date
    },
    certificationId: {
      type: String
    }
  }],
  specializations: [{
    type: String
  }],
  availability: {
    officeHours: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: {
        type: String
      },
      endTime: {
        type: String
      },
      location: {
        type: String
      }
    }],
    isAvailableForSubstitution: {
      type: Boolean,
      default: false
    }
  },
  contractDetails: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    contractType: {
      type: String,
      enum: ['permanent', 'contract', 'part-time', 'substitute'],
      default: 'permanent'
    },
    workingHoursPerWeek: {
      type: Number
    }
  },
  performanceReviews: [{
    date: {
      type: Date
    },
    reviewer: {
      type: String
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String
    }
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to set role
TeacherSchema.pre('save', function(next) {
  if (!this.role) {
    this.role = 'teacher';
  }
  next();
});

// Virtual to get all active classes
TeacherSchema.virtual('activeClasses').get(function() {
  const currentYear = new Date().getFullYear().toString();
  return this.classesTaught.filter(cls => cls.academicYear === currentYear);
});

// Virtual to check if certifications are expiring soon (within 3 months)
TeacherSchema.virtual('expiringCertifications').get(function() {
  const today = new Date();
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);
  
  return this.certifications.filter(cert => {
    if (cert.expiryDate) {
      const expiryDate = new Date(cert.expiryDate);
      return expiryDate <= threeMonthsFromNow && expiryDate >= today;
    }
    return false;
  });
});

// Index for frequently queried fields
TeacherSchema.index({ employeeId: 1, subjects: 1, department: 1 });

const Teacher = User.discriminator('Teacher', TeacherSchema);

export default Teacher;