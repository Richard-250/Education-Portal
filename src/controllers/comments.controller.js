import Content from "../models/content.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import { getUserFromToken } from "../utils/getUserFromToken.js";
import {
  sendNotification,
  createNotification,
} from "../service/notificationService.js";

// Post a new comment
export const postComment = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { text } = req.body;

    // Get user from token
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    
    // Check if content exists and allows comments
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    if (!content.commentSettings.allowComments) {
      return res
        .status(403)
        .json({ error: "Comments are disabled for this content" });
    }

    if (
      content.commentSettings.onlyTeacherCanComment &&
      user.userType !== "teacher"
    ) {
      return res
        .status(403)
        .json({ error: "Only teachers can comment on this content" });
    }

    const userNames = await User.findById(user.userId);

    // Create new comment
    const newComment = {
      user: user.userId,
      userType: user.userType,
      text,
      replies: [],
    };

    // Add comment to content
    content.comments.push(newComment);
    await content.save();

    if (content.teacher) {
      const teacherId = content.teacher._id;
      const notificationData = {
        title: "New Comment on Your Content",
        message: `${userNames.firstName}-${userNames.lastName} commented on your lesson: '${text}'`,
        contentId,
        kind: "new_comment",
        recipientType: "teacher",
      };
      
      await Promise.all([
        sendNotification("notification", teacherId, notificationData),
        createNotification({
          ...notificationData,
          recipient: content.teacher._id,
        })
      ]);
      
      console.log("notification sent and saved to teacher");
    }

    // Return the full content with populated comments
    const updatedContent = await Content.findById(contentId)
      .populate("comments.user", "firstName lastName profilePhoto")
      .populate("comments.replies.user", "firstName lastName profilePhoto");

    res.status(201).json({
      message: "Comment posted successfully",
      comment: newComment,
      content: updatedContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reply to a comment
export const replyToComment = async (req, res) => {
  try {
    const { contentId, commentId } = req.params;
    const { text } = req.body;

    // Get user from token
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    const userNames = await User.findById(user.userId);
    
    // Find the content
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    // Find the comment
    const comment = content.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check comment settings
    if (!content.commentSettings.allowComments) {
      return res
        .status(403)
        .json({ error: "Comments are disabled for this content" });
    }

    if (
      content.commentSettings.onlyTeacherCanComment &&
      user.userType !== "teacher" // Fixed inconsistency with lowercase "teacher"
    ) {
      return res
        .status(403)
        .json({ error: "Only teachers can comment on this content" });
    }

    // Add reply
    comment.replies.push({
      user: user.userId,
      userType: user.userType,
      text,
    });

    await content.save();

    const commenterId = comment.user;
    const notificationData = {
      title: "New Reply to Your Comment",
      message: `${userNames.firstName}-${userNames.lastName} replied to your comment: "${text}"`,
      contentId,
      kind: "comment_reply",
      recipientType: "student",
    };
    
    await Promise.all([
      sendNotification("notification", commenterId, notificationData),
      createNotification({ ...notificationData, recipient: comment.user })
    ]);

    // Return the updated content
    const updatedContent = await Content.findById(contentId)
      .populate("comments.user", "firstName lastName profilePhoto")
      .populate("comments.replies.user", "firstName lastName profilePhoto");
      
    res.status(201).json({
      message: "Reply posted successfully",
      content: updatedContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    // Get user from token
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    
    // Get page number from query params, default to 1
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Fixed limit of 6 notifications per page
    const skip = (page - 1) * limit;

    // Get total count of notifications for pagination info
    const totalCount = await Notification.countDocuments({
      recipient: user.userId,
    });

    // Get notifications sorted by newest first, with pagination
    const notifications = await Notification.find({
      recipient: user.userId,
      // recipientType: user.userType.toLowerCase(),
    })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .populate("relatedContent", "title contentType")
      .populate("teacher", "firstName lastName profilePhoto");

    if (!notifications) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: user.userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const user = getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const result = await Notification.updateMany(
      {
        recipient: user.userId,
        // recipientType: user.userType.toLowerCase(),
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};