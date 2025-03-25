import logger from './logger.js';
import User from '../models/user.js';

export const createError = (message, statusCode, req) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.request = {
    method: req.method,
    url: req.originalUrl,
    user: req.user ? req.user.id : 'anonymous'
  };

  // Capture stack trace
  Error.captureStackTrace(error, createError);

  return error;
};

export const logError = async (error) => {
  try {
    const user = error.request.user !== 'anonymous' 
      ? await User.findById(error.request.user).select('-password') 
      : null;

    logger.error({
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      request: error.request,
      userDetails: user || 'anonymous user'
    });
  } catch (err) {
    logger.error({
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      request: error.request,
      errorFetchingUser: err.message
    });
  }
};