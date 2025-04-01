import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  user: {
    // type: Schema.Types.ObjectId,
     type: mongoose.Schema.Types.ObjectId, ref: 'User',
    // refPath: 'comments.userType',
    required: true
  },
  userType: {
    type: String,
    // enum: ['Teacher', 'Student'],
    // message: '{VALUE} is not a valid role',
    required: true,
    // set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() // Capitalize first letter
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  replies: [{
    user: {
      type: Schema.Types.ObjectId,
      // refPath: 'comments.replies.userType',
      required: true
    },
    userType: {
      type: String,
      // enum: ['Teacher', 'Student'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});

const ContentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['lecture', 'assignment', 'quiz', 'resource'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true
  },
  kind: {
    type: String,
  },
  message: {
    type: String,
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'image', 'pdf', 'document'],
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student'
  }],
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  accessibleTo: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  comments: [CommentSchema],
  commentSettings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    onlyTeacherCanComment: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to check if content is currently accessible
ContentSchema.virtual('isAccessible').get(function() {
  const now = new Date();
  return this.isPublished && 
         (!this.expiresAt || now < this.expiresAt);
});

// Virtual for comment count
ContentSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Indexes for performance
ContentSchema.index({ teacher: 1, subject: 1, grade: 1 });
ContentSchema.index({ isPublished: 1, expiresAt: 1 });
ContentSchema.index({ 'comments.user': 1 });
ContentSchema.index({ 'comments.createdAt': -1 });

const Content = mongoose.model('Content', ContentSchema);

export default Content;