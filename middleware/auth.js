const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = function(req, res, next) {
  // Get token from header, Authorization header, or cookie
  let token = req.header('x-auth-token');
  
  // Check for token in Authorization header (Bearer token)
  const authHeader = req.header('Authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  // Check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: {
        message: 'No token, authorization denied',
        type: 'AuthError'
      }
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = decoded;
    next();
  } catch (err) {
    let errorMessage = 'Token is not valid';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format';
    }
    
    res.status(401).json({ 
      success: false, 
      error: {
        message: errorMessage,
        type: 'AuthError',
        details: config.server.nodeEnv === 'development' ? err.message : undefined
      }
    });
  }
};