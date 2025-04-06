const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  sport: {
    type: String,
    required: [true, 'Please specify a sport'],
    enum: ['soccer', 'basketball', 'baseball', 'volleyball', 'tennis', 'cricket', 'football', 'kabaddi', 'kho-kho', 'other']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Please add latitude']
      },
      lng: {
        type: Number,
        required: [true, 'Please add longitude']
      }
    }
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'professional', 'all'],
    default: 'all'
  },
  spotsAvailable: {
    type: Number,
    required: [true, 'Please specify available spots'],
    min: [0, 'Spots available cannot be negative']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for geospatial queries
MatchSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Match', MatchSchema);