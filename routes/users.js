const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validationSchemas, validateRequest } = require('../middleware/validator');
const config = require('../config/config');

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          message: 'User not found',
          type: 'ResourceNotFound'
        }
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ 
      success: false, 
      error: {
        message: 'Server error while fetching user profile',
        type: 'ServerError',
        details: config.server.nodeEnv === 'development' ? err.message : undefined
      }
    });
  }
});

// @route   PUT api/users/me
// @desc    Update user profile
// @access  Private
router.put('/me', auth, validationSchemas.user.updateProfile, validateRequest, async (req, res) => {
  const { name, email } = req.body;
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  
  try {
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: {
          message: 'User not found',
          type: 'ResourceNotFound'
        }
      });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    
    // Check for duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email already in use',
          type: 'ValidationError'
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: {
        message: 'Server error while updating profile',
        type: 'ServerError',
        details: config.server.nodeEnv === 'development' ? err.message : undefined
      }
    });
  }
});

module.exports = router;