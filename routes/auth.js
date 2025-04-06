const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');
const auth = require('../middleware/auth');
const { validationSchemas, validateRequest } = require('../middleware/validator');
const { ApiError } = require('../middleware/errorHandler');
const config = require('../config/config');
const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: {
      message: 'Too many login attempts, please try again later.',
      type: 'RateLimitError'
    }
  }
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: {
      message: 'Too many registration attempts, please try again later.',
      type: 'RateLimitError'
    }
  }
});

// @route   GET api/auth/refresh
// @desc    Refresh user token
// @access  Private
router.get('/refresh', auth, async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          message: 'User not found',
          type: 'AuthError'
        }
      });
    }
    
    // Generate new token
    const token = user.getSignedJwtToken();
    
    // Return new token in header and in response
    res.setHeader('x-auth-token', token);
    res.setHeader('Access-Control-Expose-Headers', 'x-auth-token');
    
    res.json({ success: true, msg: 'Token refreshed' });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: {
        message: 'Server error during token refresh',
        type: 'ServerError',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user / Invalidate token
// @access  Private
router.post('/logout', auth, (req, res) => {
  // In a real-world scenario, you would add the token to a blacklist or
  // invalidate it in a token store. For this implementation, we'll clear
  // the token cookie and acknowledge the logout request.
  
  // Clear the token cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });
  
  res.json({ success: true, msg: 'Logged out successfully' });
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register', 
  registerLimiter, 
  validationSchemas.auth.register,
  validateRequest,
  async (req, res) => {
    const { name, email, password, userType } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ 
          success: false, 
          error: {
            message: 'User already exists',
            type: 'DuplicateResource'
          }
        });
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
        userType
      });

      // Save user to database
      await user.save();

      // Create token
      const token = user.getSignedJwtToken();

      res.status(201).json({
        success: true,
        token,
        userType: user.userType
      });
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).json({ 
        success: false, 
        error: {
          message: 'Server error during registration',
          type: 'ServerError',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
      });
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login', 
  loginLimiter,
  validationSchemas.auth.login,
  validateRequest,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({ 
          success: false, 
          error: {
            message: 'Invalid credentials',
            type: 'AuthError'
          }
        });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          error: {
            message: 'Invalid credentials',
            type: 'AuthError'
          }
        });
      }

      // Generate JWT token
      const token = user.getSignedJwtToken();

      // Set token in header
      res.setHeader('x-auth-token', token);
      res.setHeader('Access-Control-Expose-Headers', 'x-auth-token');
      
      // Set token as cookie
      const cookieOptions = {
        expires: new Date(Date.now() + config.jwt.cookieExpire * 24 * 60 * 60 * 1000),
        httpOnly: true // Cookie cannot be accessed by client-side JS
      };
      
      // Set secure flag in production
      if (config.server.isProduction) {
        cookieOptions.secure = true; // Cookie will only be sent over HTTPS
        cookieOptions.sameSite = 'strict'; // Protect against CSRF
      }
      
      res.cookie('token', token, cookieOptions);

      // Return user data without password
      user = user.toObject();
      delete user.password;

      res.json({
        success: true,
        token, // Still include token in response for backward compatibility
        user
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ 
        success: false, 
        error: {
          message: 'Server error during login',
          type: 'ServerError',
          details: config.server.nodeEnv === 'development' ? err.message : undefined
        }
      });
    }
  }
);

// @route   GET api/auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard based on user type
    const token = req.user.getSignedJwtToken();
    res.redirect(`/auth/success?token=${token}&userType=${req.user.userType}`);
  }
);

// @route   GET api/auth/facebook
// @desc    Auth with Facebook
// @access  Public
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// @route   GET api/auth/facebook/callback
// @desc    Facebook auth callback
// @access  Public
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard based on user type
    const token = req.user.getSignedJwtToken();
    res.redirect(`/auth/success?token=${token}&userType=${req.user.userType}`);
  }
);

// @route   GET api/auth/apple
// @desc    Auth with Apple
// @access  Public
router.get('/apple', passport.authenticate('apple'));

// @route   GET api/auth/apple/callback
// @desc    Apple auth callback
// @access  Public
router.get(
  '/apple/callback',
  passport.authenticate('apple', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard based on user type
    const token = req.user.getSignedJwtToken();
    res.redirect(`/auth/success?token=${token}&userType=${req.user.userType}`);
  }
);

// @route   GET api/auth/success
// @desc    Auth success redirect
// @access  Private
router.get('/success', (req, res) => {
  res.sendFile('auth-success.html', { root: './public' });
});

module.exports = router;