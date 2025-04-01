import Joi from "joi";

// Content creation schema
const contentCreationSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.empty': 'Title must not be empty',
      'string.min': 'Title must be between 3 and 100 characters',
      'string.max': 'Title must be between 3 and 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string().trim().max(500).optional()
    .messages({
      'string.max': 'Description must be less than 500 characters'
    }),
  type: Joi.string().valid('lesson', 'assignment', 'quiz', 'resource').required()
    .messages({
      'any.only': 'Invalid content type',
      'any.required': 'Content type is required'
    }),
  subject: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.min': 'Subject must be between 2 and 50 characters',
      'string.max': 'Subject must be between 2 and 50 characters',
      'any.required': 'Subject is required'
    }),
  grade: Joi.number().integer().min(1).max(12).required()
    .messages({
      'number.min': 'Grade must be between 1 and 12',
      'number.max': 'Grade must be between 1 and 12',
      'number.base': 'Grade must be a number',
      'any.required': 'Grade is required'
    }),
  contentType: Joi.string().valid('text', 'video', 'image', 'pdf', 'document').required()
    .messages({
      'any.only': 'Invalid content type',
      'any.required': 'Content type is required'
    }),
  tags: Joi.array().optional()
    .messages({
      'array.base': 'Tags must be an array'
    }),
  accessibleTo: Joi.string().valid('all', 'specific').optional()
    .messages({
      'any.only': 'Invalid accessibility option'
    })
});

// Content update schema
const contentUpdateSchema = Joi.object({
  contentId: Joi.string().hex().length(24).required()
    .messages({
      'string.hex': 'Invalid content ID',
      'string.length': 'Invalid content ID',
      'any.required': 'Content ID is required'
    }),
  title: Joi.string().trim().min(3).max(100).optional()
    .messages({
      'string.min': 'Title must be between 3 and 100 characters',
      'string.max': 'Title must be between 3 and 100 characters'
    }),
  description: Joi.string().trim().max(500).optional()
    .messages({
      'string.max': 'Description must be less than 500 characters'
    }),
  tags: Joi.array().optional()
    .messages({
      'array.base': 'Tags must be an array'
    })
});

// Content retrieval schema
const contentRetrievalSchema = Joi.object({
  subject: Joi.string().trim().min(2).max(50).optional()
    .messages({
      'string.min': 'Subject must be between 2 and 50 characters',
      'string.max': 'Subject must be between 2 and 50 characters'
    }),
  grade: Joi.number().integer().min(1).max(12).optional()
    .messages({
      'number.min': 'Grade must be between 1 and 12',
      'number.max': 'Grade must be between 1 and 12',
      'number.base': 'Grade must be a number'
    })
});

// Validation middleware functions
const validateContentCreation = (req, res, next) => {
  const { error } = contentCreationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

const validateContentUpdate = (req, res, next) => {
  const data = { ...req.body, contentId: req.params.contentId };
  const { error } = contentUpdateSchema.validate(data, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

const validateContentRetrieval = (req, res, next) => {
  const { error } = contentRetrievalSchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

export default {
  validateContentCreation,
  validateContentUpdate,
  validateContentRetrieval
};