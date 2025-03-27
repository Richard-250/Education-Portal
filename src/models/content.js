import mongoose from "mongoose";
const Schema = mongoose.Schema;

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
    enum: ['lesson', 'assignment', 'quiz', 'resource'],
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

// Indexes for performance
ContentSchema.index({ teacher: 1, subject: 1, grade: 1 });
ContentSchema.index({ isPublished: 1, expiresAt: 1 });

const Content = mongoose.model('Content', ContentSchema);

export default Content;