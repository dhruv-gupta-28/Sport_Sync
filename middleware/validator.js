/**
 * Input validation middleware
 * Provides reusable validation schemas and middleware for API routes
 */

const { check, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Validation result middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        type: 'ValidationError',
        details: errors.array()
      }
    });
  }
  
  next();
};

// Common validation schemas
const validationSchemas = {
  // Auth validation schemas
  auth: {
    register: [
      check('name', 'Name is required').not().isEmpty().trim(),
      check('email', 'Please include a valid email').isEmail().normalizeEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('userType', 'User type is required').isIn(['coach', 'player', 'organizer'])
    ],
    login: [
      check('email', 'Please include a valid email').isEmail().normalizeEmail(),
      check('password', 'Password is required').exists()
    ]
  },
  
  // User validation schemas
  user: {
    updateProfile: [
      check('name', 'Name is required').optional().not().isEmpty().trim(),
      check('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
      check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 }),
      check('location', 'Location cannot exceed 100 characters').optional().isLength({ max: 100 }),
      check('sportsPreferences', 'Sports preferences must be an array').optional().isArray()
    ]
  },
  
  // Match validation schemas
  match: {
    create: [
      check('title', 'Title is required').not().isEmpty().trim(),
      check('sport', 'Sport is required').not().isEmpty().trim(),
      check('date', 'Valid date is required').isISO8601().toDate(),
      check('location.address', 'Location address is required').not().isEmpty().trim(),
      check('location.coordinates.lat', 'Valid latitude is required').isFloat({ min: -90, max: 90 }),
      check('location.coordinates.lng', 'Valid longitude is required').isFloat({ min: -180, max: 180 }),
      check('skillLevel', 'Skill level is required').isIn(['beginner', 'intermediate', 'advanced', 'all']),
      check('spotsAvailable', 'Spots available must be a positive number').isInt({ min: 1 }),
      check('description', 'Description cannot exceed 1000 characters').optional().isLength({ max: 1000 })
    ],
    update: [
      check('title', 'Title must be a string').optional().isString().trim(),
      check('sport', 'Sport must be a string').optional().isString().trim(),
      check('date', 'Valid date is required').optional().isISO8601().toDate(),
      check('location.address', 'Location address must be a string').optional().isString().trim(),
      check('location.coordinates.lat', 'Valid latitude is required').optional().isFloat({ min: -90, max: 90 }),
      check('location.coordinates.lng', 'Valid longitude is required').optional().isFloat({ min: -180, max: 180 }),
      check('skillLevel', 'Invalid skill level').optional().isIn(['beginner', 'intermediate', 'advanced', 'all']),
      check('spotsAvailable', 'Spots available must be a positive number').optional().isInt({ min: 1 }),
      check('description', 'Description cannot exceed 1000 characters').optional().isLength({ max: 1000 })
    ]
  },
  
  // Gemini chat validation schemas
  gemini: {
    chat: [
      check('message', 'Message is required').not().isEmpty().trim(),
      check('history', 'History must be an array').optional().isArray()
    ]
  },
  
  // ID parameter validation
  params: {
    id: [
      check('id', 'Invalid ID').isMongoId()
    ]
  }
};

module.exports = {
  validateRequest,
  validationSchemas
};