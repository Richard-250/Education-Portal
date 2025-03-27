import Content from '../models/content.js';
import cloudinary from 'cloudinary';
import { validationResult } from 'express-validator';
import NotificationService from '../services/notificationService.js';

const cloudinaryV2 = cloudinary.v2;

// Create a new lesson/content
export const createContent = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      description, 
      type, 
      subject, 
      grade, 
      contentType, 
      tags,
      accessibleTo
    } = req.body;

    // Handle file upload to Cloudinary for media files
    let fileUrl = null;
    let cloudinaryPublicId = null;
    if (req.file) {
      // Check file size and type restrictions
      if (contentType !== 'text') {
        const uploadResult = await cloudinaryV2.uploader.upload(req.file.path, {
          folder: 'education-portal',
          resource_type: contentType === 'video' ? 'video' : 'auto',
          // Add more Cloudinary upload options as needed
        });

        fileUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
      }
    }

    // Create content
    const newContent = new Content({
      title,
      description,
      type,
      subject,
      grade,
      contentType,
      fileUrl,
      cloudinaryPublicId,
      teacher: req.user._id, // Assuming authenticated teacher
      tags: tags || [],
      isPublished: false,
      accessibleTo: accessibleTo || 'all'
    });

    // Save content
    await newContent.save();

    // Notify students about new content
    await NotificationService.notifyStudentsNewContent(newContent);

    res.status(201).json({
      message: 'Content created successfully',
      content: newContent
    });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create content', 
      error: error.message 
    });
  }
};

// Publish content (making it visible to students)
export const publishContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    // Find and update content
    const content = await Content.findOneAndUpdate(
      { 
        _id: contentId, 
        teacher: req.user._id 
      },
      { 
        isPublished: true, 
        publishedAt: new Date() 
      },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ 
        message: 'Content not found or unauthorized' 
      });
    }

    // Notify students about published content
    await NotificationService.notifyStudentsContentPublished(content);

    res.json({
      message: 'Content published successfully',
      content
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to publish content', 
      error: error.message 
    });
  }
};

// Get content for students
export const getStudentContent = async (req, res) => {
  try {
    const { subject, grade } = req.query;

    // Build query for accessible content
    const query = {
      isPublished: true,
      accessibleTo: { $in: ['all', 'specific'] }
    };

    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    // Fetch content with minimal sensitive information
    const contents = await Content.find(query)
      .select('title description type subject grade contentType fileUrl')
      .sort({ publishedAt: -1 });

    res.json(contents);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch content', 
      error: error.message 
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

// Update content details
export const updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const updateData = req.body;

    // Prevent changing certain fields
    delete updateData.teacher;
    delete updateData.isPublished;
    delete updateData.publishedAt;

    const updatedContent = await Content.findOneAndUpdate(
      { 
        _id: contentId, 
        teacher: req.user._id 
      },
      updateData,
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({ 
        message: 'Content not found or unauthorized' 
      });
    }

    // Notify students about content update
    await NotificationService.notifyStudentsContentUpdated(updatedContent);

    res.json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update content', 
      error: error.message 
    });
  }
};
