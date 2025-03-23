import logger from '../utils/logger.js';
import User from '../models/user.js';

export class CustomError extends Error {
    constructor(message, statusCode, req) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
        this.request = {
            method: req.method,
            url: req.originalUrl,
            user: req.user ? req.user.id : 'anonymous',
        };
    }

    // Separate async logging method
    async logError() {
        try {
            const user = await User.findById(this.request.user).select('-password');
            logger.error({
                message: this.message,
                statusCode: this.statusCode,
                stack: this.stack,
                request: this.request,
                userDetails: user || 'User not found',
            });
        } catch (err) {
            logger.error({
                message: this.message,
                statusCode: this.statusCode,
                stack: this.stack,
                request: this.request,
                errorFetchingUser: err.message,
            });
        }
    }
}
