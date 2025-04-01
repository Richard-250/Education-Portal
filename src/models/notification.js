
import mongoose from "mongoose";
import { type } from "os";
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    // required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    enum: ['student', 'parent', 'teacher'],
    required: true,
    default: 'student'
  },
  kind: {
    type: String,
    enum: [
      'new_content', 
      'content_published', 
      'content_updated', 
      'progress_update', 
      'achievement', 
      'message', 
      'assignment_due',
      'new_comment',
      'comment_reply'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedContent: {
    type: Schema.Types.ObjectId,
    ref: 'Content'
  },
  contentType: {
    type: String,
  },
  subject: {
    type: String,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  isRead: {
    type: Boolean,
    default: false
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

// Indexes for performance
NotificationSchema.index({ recipient: 1, recipientType: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Virtual to check if notification is recent
NotificationSchema.virtual('isRecent').get(function() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return this.createdAt > threeDaysAgo;
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;