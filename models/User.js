const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  userType: {
    type: String,
    enum: ['coach', 'player', 'organizer'],
    required: [true, 'Please specify user type']
  },
  sportsPreferences: {
    type: [String],
    enum: ['soccer', 'basketball', 'baseball', 'volleyball', 'tennis', 'cricket', 'football', 'kabaddi', 'kho-kho', 'other'],
    default: []
  },
  googleId: {
    type: String
  },

  appleId: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  passwordChangedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Update passwordChangedAt field when password is modified
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  const config = require('../config/config');
  return jwt.sign({ id: this._id }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);