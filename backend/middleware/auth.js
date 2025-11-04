const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log(`🔐 [AUTH] Request to: ${req.method} ${req.originalUrl}`);
    
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ [AUTH] No valid authorization header found`);
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      console.log(`❌ [AUTH] No token found after Bearer`);
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`✅ [AUTH] Token verified for user ID: ${decoded.userId}`);
      
      // Get user from token
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log(`❌ [AUTH] User not found for ID: ${decoded.userId}`);
        return res.status(401).json({
          success: false,
          message: 'Token is not valid - user not found'
        });
      }

      if (!user.isActive) {
        console.log(`❌ [AUTH] User account is deactivated: ${user.email}`);
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      console.log(`✅ [AUTH] User authenticated: ${user.email} (${user.role})`);

      // Add user to request with standardized format
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      next();
    } catch (err) {
      console.log(`❌ [AUTH] Token verification failed:`, err.message);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.error('❌ [AUTH] Middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = auth;
