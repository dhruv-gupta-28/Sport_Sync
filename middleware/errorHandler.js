/**
 * Global error handling middleware
 * Standardizes error responses across the API
 */

const config = require('../config/config');

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, statusCode, type = 'ServerError', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for server-side debugging
  console.error('Error:', err);
  
  // Default error values
  let statusCode = error.statusCode || 500;
  let errorType = error.type || 'ServerError';
  let errorMessage = error.message || 'Server Error';
  let errorDetails = error.details || null;
  
  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'ValidationError';
    errorMessage = 'Invalid input data';
    errorDetails = Object.values(err.errors).map(val => val.message);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    errorType = 'DuplicateError';
    errorMessage = 'Duplicate field value entered';
    errorDetails = err.keyValue;
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'InvalidIdError';
    errorMessage = `Invalid ${err.path}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'AuthError';
    errorMessage = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'AuthError';
    errorMessage = 'Token expired';
  }
  
  // Only include error details in development environment
  if (config.server.nodeEnv !== 'development') {
    errorDetails = undefined;
  }
  
  // Send standardized error response
  return res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      type: errorType,
      details: errorDetails
    }
  });
};

module.exports = { errorHandler, ApiError };