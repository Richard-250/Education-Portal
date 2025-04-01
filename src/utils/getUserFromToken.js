import jwt from 'jsonwebtoken';

export const getUserFromToken = (req) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    if (!token) return null;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        userId: decoded.id,
        userType: decoded.role // Assuming your JWT has a 'role' field
      };
    } catch (error) {
      return null;
    }
  };