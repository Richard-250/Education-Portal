import Content from "../models/content.js";
import User from "../models/user.js";
import { getUserFromToken } from "../utils/getUserFromToken.js";
import { sendNotification, createNotification, NotificationTypes } from "../service/notificationService.js";

// Post a new comment
export const postComment = async (req, res) => {
    try {
      const { contentId } = req.params;
      const { text } = req.body;
  
      // Get user from token
      const user = getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }
//   console.log(user)
      // Check if content exists and allows comments
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
  
      if (!content.commentSettings.allowComments) {
        return res.status(403).json({ error: 'Comments are disabled for this content' });
      }
  
      if (content.commentSettings.onlyTeacherCanComment && user.userType !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can comment on this content' });
      }
  
      const userNames = User.findById(user.userId)

      // Create new comment
      const newComment = {
        user: user.userId,
        userType: user.userType,
        text,
        replies: []
      };
  
      // Add comment to content
      content.comments.push(newComment);
      await content.save(newComment);
  

      if (content.teacher) {
        const teacherId = content.teacher._id;
        const notificationData = {
            title: 'New Comment on Your Content',
            message: `${userNames.firstName}-${userNames.lastName}  commented on your lesson: '${text}'`,
            contentId,
            kind: 'new_comment',
            recipientType: 'teacher'
        };
        await sendNotification('notification', teacherId, notificationData);
        console.log('notification sent to teacher: ', notificationData )
        await createNotification({ ...notificationData, recipient: content.teacher._id });
        console.log('notification to teacher saved ')
    }

      // Return the full content with populated comments
      const updatedContent = await Content.findById(contentId)
        .populate('comments.user', 'firstName lastName profilePhoto')
        .populate('comments.replies.user', 'firstName lastName profilePhoto');
  
      res.status(201).json({
        message: 'Comment posted successfully',
        comment: newComment,
        content: updatedContent
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
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }
  
      // Find the content
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
  
      // Find the comment
      const comment = content.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      // Check comment settings
      if (!content.commentSettings.allowComments) {
        return res.status(403).json({ error: 'Comments are disabled for this content' });
      }
  
      if (content.commentSettings.onlyTeacherCanComment && user.userType !== 'Teacher') {
        return res.status(403).json({ error: 'Only teachers can comment on this content' });
      }
  
      // Add reply
      comment.replies.push({
        user: user.userId,
        userType: user.userType,
        text
      });
  
      await content.save();
  
      const commenterId = comment.user;
      const notificationData = {
          title: 'New Reply to Your Comment',
          message: `${userNames.firstName}-${userNames.lastName}  replied to your comment: "${text}"`,
          contentId,
          recipientType: 'student'
      };
      await sendNotification('notification', commenterId, notificationData);
      await createNotification({ ...notificationData, recipient: comment.user });


      // Return the updated content
      const updatedContent = await Content.findById(contentId)
      .populate('comments.user', 'firstName lastName profilePhoto')
      .populate('comments.replies.user', 'firstName lastName profilePhoto');
      res.status(201).json({
        message: 'Reply posted successfully',
        content: updatedContent
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };