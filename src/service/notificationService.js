// notificationService.js
import { Server } from 'socket.io';
import Notification from '../models/notification.js'; // Assuming this is the path to your Notification model

let io;

// Notification types enum
export const NotificationTypes = {
  NEW_CONTENT: 'new_content',
  CONTENT_PUBLISHED: 'content_published',
  CONTENT_UPDATED: 'content_updated',
  PROGRESS_UPDATE: 'progress_update',
  ACHIEVEMENT: 'achievement',
  MESSAGE: 'message',
  ASSIGNMENT_DUE: 'assignment_due'
};

/**
 * Initialize the Socket.io server
 * @param {object} server - HTTP/HTTPS server instance
 */
export const initializeSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle user joining specific rooms (e.g., by userId, role, grade, etc.)
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.io server initialized');
  return io;
};

/**
 * Get the Socket.io instance
 * @returns {object} Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocketServer first.');
  }
  return io;
};

/**
 * Create and save a notification in the database
 * @param {object} params - Notification parameters
 * @returns {Promise<object>} Created notification
 */
export const createNotification = async (params) => {
    
  try {
    const notification = new Notification({
      recipient: params.recipient,
      recipientType: params.recipientType,
      kind: params.kind,
      title: params.title,
      subject: params.subject,
      message: params.message ,
      relatedContent: params.contentId,
      teacher: params.teacherId,
      contentType: params.contentType,
      metadata: params.metadata || {}
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

/**
 * Send notification to specific users and optionally save to database
 * @param {string} event - Event name
 * @param {Array|string} recipients - User IDs or room names to receive notification
 * @param {object} data - Notification data
 * @param {boolean} persist - Whether to save the notification to database
 * @returns {Promise<boolean>} Success status
 */
export const sendNotification = async (event, recipients, data, persist = true ) => { 
  try {
    const socketIO = getIO();
    const notificationPayload = {
      ...data,
      timestamp: new Date(),
      id: Date.now().toString()
    };

    if (Array.isArray(recipients)) {
      // If recipients is an array, emit to each recipient's room
      recipients.forEach(recipient => {
        socketIO.to(recipient).emit(event, notificationPayload);
      });

      // Persist notifications if required
      // if (persist) {
        
      //   await Promise.all(recipients.map(async recipient => {
      //     if (typeof recipient === 'string' && recipient.startsWith('user-')) {
      //       console.log('reached there')
      //       const userId = recipient.replace('user-', '');
      //       await createNotification({
      //         recipient: userId,
      //         recipientType: data.recipientType || 'student', // default to student
      //         type: data.type,
      //         title: data.title,
      //         message: data.message || `changes happened to ${data.type}`,
      //         relatedContent: data.contentType,
      //         teacher: data.teacherId,
      //         metadata: data.metadata || {}
      //       });
      //     }
      //   }));
      // }
    } else {
      // If recipients is a string (single room/user or broadcast channel)
      socketIO.to(recipients).emit(event, notificationPayload);

      // // Persist notification if required and recipient is a user
      // if (persist && typeof recipients === 'string' ) {
      //   const userId = recipients.replace('user-', '');
      //   await createNotification({
      //     recipient: userId,
      //     recipientType: data.recipientType || 'student', // default to student
      //     type: data.type,
      //     title: data.title,
      //     message: data.message,
      //     relatedContent: data.contentId,
      //     teacher: data.teacherId,
      //     metadata: data.metadata || {}
      //   });
      // }
    }
    
    console.log(`Notification sent to ${Array.isArray(recipients) ? recipients.length + ' recipients' : recipients}`);
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
};

/**
 * Notify students about new content
 * @param {object} content - Content object
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyStudentsNewContent = async (content, persist = true) => {
  try {
    // Determine which rooms should receive this notification
    const rooms = [];
    
    // Add grade-specific room if content is for a specific grade
    if (content.grade && content.grade !== 'all') {
      rooms.push(`grade-${content.grade}`);
    }
    
    // Add subject-specific room if applicable
    if (content.subject) {
      rooms.push(`subject-${content.subject}`);
    }
    
    // If content is accessible to specific users, notify them individually
    if (content.accessibleTo && content.accessibleTo !== 'all' && Array.isArray(content.accessibleTo)) {
      rooms.push(...content.accessibleTo.map(userId => `user-${userId}`));
    }
    
    // If no specific targets, broadcast to all students
    if (rooms.length === 0) {
      rooms.push('role-student');
    }
    
    // Create notification payload
    const notificationData = {
      kind: NotificationTypes.NEW_CONTENT,
      title: 'New Content Available',
      message: `${content.title} has been added by your teacher`,
      contentId: content._id,
      contentType: content.contentType,
      subject: content.subject,
      teacherId: content.teacher,
      recipientType: 'student'
    };
    
    // Send notification to each room
     await sendNotification('notification', rooms, notificationData, persist = true);
    console.log('all done', 'notification data: ', notificationData)
   await createNotification(notificationData)
    console.log('notification saved successfully')
  } catch (error) {
    console.error('Failed to notify students:', error);
    return false;
  }
};

/**
 * Notify about published content
 * @param {object} content - Content object
 * @param {Array<string>} recipients - Array of user IDs
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyContentPublished = async (content, recipients, persist = true) => {
  try {
    const rooms = recipients.map(userId => `user-${userId}`);
    
    const notificationData = {
      type: NotificationTypes.CONTENT_PUBLISHED,
      title: 'Content Published',
      message: `Your content "${content.title}" has been published`,
      contentId: content._id,
      contentType: content.contentType,
      recipientType: 'teacher' // Assuming this is for teachers
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about published content:', error);
    return false;
  }
};

/**
 * Notify about updated content
 * @param {object} content - Content object
 * @param {Array<string>} recipients - Array of user IDs or room names
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyContentUpdated = async (content, recipients, persist = true) => {
  try {
    const rooms = Array.isArray(recipients) ? 
      recipients.map(r => r.startsWith('user-') || r.startsWith('role-') || r.startsWith('grade-') ? r : `user-${r}`) :
      [recipients];
    
    const notificationData = {
      type: NotificationTypes.CONTENT_UPDATED,
      title: 'Content Updated',
      message: `The content "${content.title}" has been updated`,
      contentId: content._id,
      contentType: content.contentType,
      recipientType: 'student' // Default to student, can be overridden
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about updated content:', error);
    return false;
  }
};

/**
 * Notify about progress update
 * @param {string} studentId - Student ID
 * @param {object} progressData - Progress data
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyProgressUpdate = async (studentId, progressData, persist = true) => {
  try {
    const rooms = [`user-${studentId}`, `parent-${progressData.parentId}`].filter(Boolean);
    
    const notificationData = {
      type: NotificationTypes.PROGRESS_UPDATE,
      title: 'Progress Update',
      message: `Your ${progressData.subject} progress is now ${progressData.progress}%`,
      recipientType: 'student',
      metadata: {
        subject: progressData.subject,
        progress: progressData.progress,
        previousProgress: progressData.previousProgress
      }
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about progress update:', error);
    return false;
  }
};

/**
 * Notify about achievement
 * @param {string} userId - User ID
 * @param {object} achievement - Achievement data
 * @param {string} recipientType - Type of recipient (student, parent, teacher)
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyAchievement = async (userId, achievement, recipientType = 'student', persist = true) => {
  try {
    const rooms = [`user-${userId}`];
    
    const notificationData = {
      type: NotificationTypes.ACHIEVEMENT,
      title: 'New Achievement Unlocked!',
      message: `You've earned the "${achievement.name}" badge`,
      recipientType,
      metadata: {
        badgeId: achievement.badgeId,
        achievementId: achievement.id
      }
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about achievement:', error);
    return false;
  }
};

/**
 * Notify about new message
 * @param {string} senderId - Sender ID
 * @param {string} recipientId - Recipient ID
 * @param {object} message - Message data
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyNewMessage = async (senderId, recipientId, message, persist = true) => {
  try {
    const rooms = [`user-${recipientId}`];
    
    const notificationData = {
      type: NotificationTypes.MESSAGE,
      title: 'New Message',
      message: `You have a new message from ${message.senderName}`,
      recipientType: message.recipientType,
      metadata: {
        senderId,
        messageId: message.id,
        conversationId: message.conversationId
      }
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about new message:', error);
    return false;
  }
};

/**
 * Notify about due assignment
 * @param {string} studentId - Student ID
 * @param {object} assignment - Assignment data
 * @param {boolean} persist - Whether to save notifications to database
 * @returns {Promise<boolean>} - Success status
 */
export const notifyAssignmentDue = async (studentId, assignment, persist = true) => {
  try {
    const rooms = [`user-${studentId}`];
    
    const notificationData = {
      type: NotificationTypes.ASSIGNMENT_DUE,
      title: 'Assignment Due Soon',
      message: `Your assignment "${assignment.title}" is due on ${assignment.dueDate}`,
      recipientType: 'student',
      metadata: {
        assignmentId: assignment.id,
        dueDate: assignment.dueDate,
        subject: assignment.subject
      }
    };
    
    return await sendNotification('notification', rooms, notificationData, persist);
  } catch (error) {
    console.error('Failed to notify about due assignment:', error);
    return false;
  }
};