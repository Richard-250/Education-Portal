import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
  };

  
const generateAuthToken = (userId, userRole) => {
    return generateToken(
      { id: userId, role: userRole },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES
    );
  };

  const generateVerificationToken = (userId) => {
    return generateToken(
      { id: userId },
      process.env.JWT_EMAIL_SECRET,
      '24h' // Expires in 24 hours
    );
  };

  const generateResetPasswordToken = (userId) => {
    return generateToken(
      { id: userId },
      process.env.JWT_RESET_SECRET,
      '1h' // Expires in 1 hour
    );
  };

  
export {
    generateToken,
    generateAuthToken,
    generateVerificationToken,
    generateResetPasswordToken,
  };