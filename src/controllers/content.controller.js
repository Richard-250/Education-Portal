import Content from "../models/content.js";
import cloudinary from "cloudinary";
import CloudinaryConfig from "../config/cloudinary.js";
import { notifyStudentsNewContent } from "../service/notificationService.js";

const cloudinaryV2 = cloudinary.v2;

export const createContent = async (req, res) => {
  try {
    const {
      title,
      kind,
      message,
      description,
      type,
      subject,
      grade,
      contentType,
      tags,
      accessibleTo,
    } = req.body;

    // Handle file upload
    let fileUrl = null;
    let cloudinaryPublicId = null;

    if (req.file) {
      if (contentType !== "text") {
        const uploadResult =
          await CloudinaryConfig.CloudinaryService.uploadFile({
            path: req.file.path,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
          });
        fileUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
      }
    }

    // Create content
    const newContent = new Content({
      title,
      kind,
      description,
      type,
      subject,
      message,
      grade,
      contentType,
      fileUrl,
      cloudinaryPublicId,
      teacher: req.user._id,
      tags: tags || [],
      isPublished: false,
      accessibleTo: accessibleTo || "all",
    });

    await newContent.save();

    // Send push notification to students
    try {
      // await //createNotification(newContent);
      await notifyStudentsNewContent(newContent);
      console.log("Push notifications sent successfully");
    } catch (notificationError) {
      console.error(
        "Push notification failed, but content was saved:",
        notificationError
      );
      // Continue even if notifications fail
    }

    res.status(201).json({
      message: "Content created and notifications sent successfully",
      content: newContent,
    });
  } catch (error) {
    console.error("Content creation error:", error);
    res.status(500).json({
      message: "Failed to create content",
      error: error.message,
    });
  }
};

// // Publish content (making it visible to students)
// export const publishContent = async (req, res) => {
//   try {
//     const { contentId } = req.params;

//     // Find and update content
//     const content = await Content.findOneAndUpdate(
//       {
//         _id: contentId,
//         teacher: req.user._id
//       },
//       {
//         isPublished: true,
//         publishedAt: new Date()
//       },
//       { new: true }
//     );

//     if (!content) {
//       return res.status(404).json({
//         message: 'Content not found or unauthorized'
//       });
//     }

//     // Notify students about published content
//     await NotificationService.notifyStudentsContentPublished(content);

//     res.json({
//       message: 'Content published successfully',
//       content
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to publish content',
//       error: error.message
//     });
//   }
// };

// // Get content for students
// export const getStudentContent = async (req, res) => {
//   try {
//     const { subject, grade } = req.query;

//     // Build query for accessible content
//     const query = {
//       isPublished: true,
//       accessibleTo: { $in: ['all', 'specific'] }
//     };

//     if (subject) query.subject = subject;
//     if (grade) query.grade = grade;

//     // Fetch content with minimal sensitive information
//     const contents = await Content.find(query)
//       .select('title description type subject grade contentType fileUrl')
//       .sort({ publishedAt: -1 });

//     res.json(contents);
//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to fetch content',
//       error: error.message
//     });
//   }
// };

// // Get content for teachers (with more details)
// export const getTeacherContent = async (req, res) => {
//   try {
//     const contents = await Content.find({
//       teacher: req.user._id
//     }).sort({ createdAt: -1 });

//     res.json(contents);
//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to fetch teacher content',
//       error: error.message
//     });
//   }
// };

// // Update content details
// export const updateContent = async (req, res) => {
//   try {
//     const { contentId } = req.params;
//     const updateData = req.body;

//     // Prevent changing certain fields
//     delete updateData.teacher;
//     delete updateData.isPublished;
//     delete updateData.publishedAt;

//     const updatedContent = await Content.findOneAndUpdate(
//       {
//         _id: contentId,
//         teacher: req.user._id
//       },
//       updateData,
//       { new: true }
//     );

//     if (!updatedContent) {
//       return res.status(404).json({
//         message: 'Content not found or unauthorized'
//       });
//     }

//     // Notify students about content update
//     await NotificationService.notifyStudentsContentUpdated(updatedContent);

//     res.json({
//       message: 'Content updated successfully',
//       content: updatedContent
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to update content',
//       error: error.message
//     });
//   }
// };
