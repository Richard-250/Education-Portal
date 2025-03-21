import crypto from 'crypto';

const generateEmailVerificationToken = () => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');

  // Hash the token for security
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Set expiration time (e.g., 2 hours from now)
  const emailVerificationExpires = Date.now() + 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  return { token, hashedToken, emailVerificationExpires };
};

export default generateEmailVerificationToken