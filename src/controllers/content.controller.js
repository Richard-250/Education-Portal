import Content from "../models/content.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import CloudinaryConfig from "../config/cloudinary.js";
import { notifyStudentsNewContent, sendNotification, createNotification } from "../service/notificationService.js";

const cloudinaryV2 = cloudinary.v2;
export const createContent = async (req, res) => {
  try {
    // 1. Destructure and validate required fields
    const { 
      title,
      description,
      subject,
      grade,
      contentType,
      // Optional fields
      kind = 'lesson',
      type = 'material',
      tags = [],
      accessibleTo = 'all',
      message = ''
    } = req.body;

    if (!title || !description || !subject || !grade || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, subject, grade, and contentType are required'
      });
    }

    // 2. Validate content type and file presence
    if (contentType !== 'text' && !req.file) {
      return res.status(400).json({
        success: false,
        message: `File is required for content type: ${contentType}`
      });
    }

    // 3. Handle file upload (if applicable)
    let fileUrl = null;
    let cloudinaryPublicId = null;

    if (req.file && contentType !== 'text') {
      try {
        const uploadResult = await CloudinaryConfig.CloudinaryService.uploadFile({
          path: req.file.path,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        });
        fileUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;

        // Clean up temp file after upload
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Temp file cleanup failed:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file'
        });
      }
    }

    // 4. Create and save content
    const newContent = new Content({
      title,
      description,
      subject,
      grade,
      contentType,
      // Optional fields with defaults
      kind,
      type,
      message,
      tags,
      accessibleTo,
      // System fields
      fileUrl,
      cloudinaryPublicId,
      teacher: req.user._id,
      isPublished: false,
      createdAt: new Date()
    });

    await newContent.save();

    // 5. Notifications (fire-and-forget)
    notifyStudentsNewContent(newContent).catch(err => 
      console.error('Notification failed:', err)
    );

    // 6. Success response
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: newContent
    });

  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const publishContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    // 1. Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid content ID format' 
      });
    }

    // 2. Check if content exists and is owned by teacher
    const existingContent = await Content.findOne({
      _id: contentId,
      teacher: req.user._id
    });

    if (!existingContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Content not found or unauthorized' 
      });
    }

    // 3. Explicit check for already published content
    if (existingContent.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Content is already published',
        publishedAt: existingContent.publishedAt // Include publish date for reference
      });
    }

    // 4. Proceed with publishing
    const content = await Content.findByIdAndUpdate(
      contentId,
      { 
        isPublished: true,
        publishedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    // 5. Notifications (non-blocking)
    notifyStudentsNewContent(content).catch(err => 
      console.error('Student notification failed:', err)
    );

    if (content.teacher) {
      const notificationData = {
        title: 'Content Published',
        message: `"${content.title}" is now live for students`,
        contentId: content._id,
        kind: 'content_published',
        recipient: content.teacher._id
      };

      await Promise.all([
        sendNotification('notification', `user-${content.teacher._id}`, notificationData),
        createNotification(notificationData)
      ]);
    }

    // 6. Success response
    res.json({ 
      success: true,
      message: 'Content published successfully',
      data: {
        ...content.toObject(),
        // Include useful metadata
        firstTimePublished: !existingContent.publishedAt 
      }
    });

  } catch (error) {
    console.error('Publish Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const getStudentContent = async (req, res) => {
  try {
    const { subject, grade, search, page = 1, limit = 5 } = req.query;
    const skip = (page - 1) * limit;

    // Validate subject and grade (if provided)
    if (subject && subject.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot be empty.',
      });
    }

    if (grade && grade.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Grade cannot be empty.',
      });
    }

    // Build base query
    const query = {
      isPublished: true,
      accessibleTo: { $in: ['all', 'specific'] },
    };

    // Apply filters (only if non-empty)
    if (subject?.trim()) query.subject = subject.trim();
    if (grade?.trim()) query.grade = grade.trim();

    // Apply search (only if non-empty)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // Fetch paginated content
    const contents = await Content.find(query)
      .select('title description type subject grade contentType fileUrl')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Content.countDocuments(query);

    // Handle no results
    if (contents.length === 0) {
      return res.status(200).json({
        success: true,
        message: search
          ? 'No content matches your search criteria.'
          : 'No content available.',
        data: [],
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Success response
    res.json({
      success: true,
      data: contents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message,
    });
  }
};
// Get content for teachers (with more details)
export const getTeacherContent = async (req, res) => {
  try {
    const contents = await Content.find({
      teacher: req.user._id
    }).sort({ createdAt: -1 });

    res.json(contents);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch teacher content',
      error: error.message
    });
  }
};

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
