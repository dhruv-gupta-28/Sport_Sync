const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { ApiError } = require('./errorHandler');

/**
 * Middleware to refresh JWT tokens that are about to expire
 * This middleware should be used after the auth middleware
 * Verifies user ID in the token against the database before issuing a new token
 * Supports both header-based and cookie-based tokens
 * Enhanced with additional security checks and improved error handling
 */
module.exports = async function(req, res, next) {
  try {
    // Only proceed if user is authenticated
    if (!req.user) {
      return next();
    }
    
    // Log token refresh attempt for audit purposes
    console.log(`Token refresh attempt for user ${req.user.id}`);

    // Get token from header or cookie
    const token = req.header('x-auth-token') ||
                  (req.header('Authorization') &&
                   req.header('Authorization').startsWith('Bearer ') &&
                   req.header('Authorization').split(' ')[1]) ||
                  req.cookies.token;

    if (!token) {
      return next();
    }

    // Verify token to ensure it's valid before proceeding
    let decoded;
    try {
      // Use more strict verification options
      const verifyOptions = {
        algorithms: ['HS256'], // Only allow HS256 algorithm
        maxAge: config.jwt.expire // Enforce maximum token age
      };
      
      decoded = jwt.verify(token, config.jwt.secret, verifyOptions);
    } catch (verifyError) {
      // If token verification fails, don't refresh but continue with request
      console.log('Token verification failed:', verifyError.message);
      return next();
    }


    // Verify that the token contains a valid user ID
    if (!decoded || !decoded.id) {
      console.log('Token refresh denied: Invalid token format');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token format',
          type: 'AuthError'
        }
      });
    }

    // Verify that the user ID in the token matches the authenticated user
    if (decoded.id !== req.user.id) {
      console.log('Token refresh denied: Token user ID does not match authenticated user');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed',
          type: 'AuthError'
        }
      });
    }
    
    // Additional security check: Verify token issuer if present
    if (decoded.iss && decoded.iss !== 'sportsync-api') {
      console.log('Token refresh denied: Invalid token issuer');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token source',
          type: 'AuthError'
        }
      });
    }

    // Check if token will expire soon (less than 1 day)
    // exp is in seconds, Date.now() is in milliseconds
    const tokenExpiration = decoded.exp * 1000;
    const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);

    // If token expires in less than a day, issue a new token
    if (tokenExpiration < oneDayFromNow) {
      // Verify that the user ID in the token exists in the database
      // and that the user is still active/valid
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log('Token refresh denied: User not found in database');
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication failed',
            type: 'AuthError'
          }
        });
      }
      
      // Verify that the user is active
      if (user.status && user.status !== 'active') {
        console.log(`Token refresh denied: User account status is ${user.status}`);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is not active',
            type: 'AuthError'
          }
        });
      }

      // Verify that the token was issued after the user's password was last changed
      // This prevents use of old tokens after password change
      if (user.passwordChangedAt && decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
        console.log('Token refresh denied: Password changed after token was issued');
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication failed - please login again',
            type: 'AuthError'
          }
        });
      }
      
      // Check if user has been locked out or has suspicious activity flag
      if (user.securityFlags && user.securityFlags.includes('suspicious_activity')) {
        console.log('Token refresh denied: Account has suspicious activity flag');
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account security issue detected - please contact support',
            type: 'SecurityError'
          }
        });
      }

      // Generate new token with additional security claims
      const newToken = user.getSignedJwtToken();

      // Set new token in response header
      res.setHeader('x-auth-token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'x-auth-token');

      // Also set token as a secure cookie if in production
      if (config.server.isProduction) {
        res.cookie('token', newToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          path: '/',
          domain: config.server.cookieDomain || undefined
        });
      } else {
        // In development, set cookie without secure flag
        res.cookie('token', newToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          path: '/'
        });
      }
      
      // Update user's lastTokenRefresh timestamp if the model supports it
      if (user.lastTokenRefresh !== undefined) {
        user.lastTokenRefresh = new Date();
        await user.save({ validateBeforeSave: false });
      }

      // Log token refresh for audit purposes
      console.log(`Token refreshed for user ${user._id}`);
    }
    next();
  } catch (err) {
    console.error('Token refresh error:', err);
    
    // Log detailed error information for debugging
    if (config.server.nodeEnv === 'development') {
      console.error('Token refresh error details:', {
        userId: req.user?.id,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack
      });
    }
    
    // Continue with request even if token refresh fails
    // This prevents token refresh errors from blocking the main request
    next();
  }
};