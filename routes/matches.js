const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiter for match creation and updates
const matchActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 match actions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, msg: 'Too many match actions, please try again later.' }
});

// @route   GET api/matches
// @desc    Get all matches or filtered matches
// @access  Public
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Filter by sport
    if (req.query.sport && req.query.sport !== 'all') {
      query.sport = req.query.sport;
    }
    
    // Filter by skill level
    if (req.query.skillLevel && req.query.skillLevel !== 'all') {
      query.skillLevel = req.query.skillLevel;
    }
    
    // Filter by date
    if (req.query.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (req.query.date) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query.date = { $gte: today, $lt: tomorrow };
          break;
        case 'tomorrow':
          const tomorrowStart = new Date(today);
          tomorrowStart.setDate(tomorrowStart.getDate() + 1);
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          query.date = { $gte: tomorrowStart, $lt: dayAfterTomorrow };
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          query.date = { $gte: today, $lt: nextWeek };
          break;
        case 'weekend':
          const friday = new Date(today);
          friday.setDate(friday.getDate() + (5 - friday.getDay() + 7) % 7);
          const monday = new Date(friday);
          monday.setDate(monday.getDate() + 3);
          query.date = { $gte: friday, $lt: monday };
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          query.date = { $gte: today, $lt: nextMonth };
          break;
      }
    }
    
    // Geospatial query if lat/lng provided
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const distance = parseInt(req.query.distance) || 10;
      
      // Convert miles to meters for MongoDB $maxDistance (1 mile = 1609.34 meters)
      const maxDistance = distance * 1609.34;
      
      // Use MongoDB's geospatial query
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      };
    }
    
    // Find matches based on query
    const matches = await Match.find(query)
      .populate('organizer', 'name')
      .sort({ date: 1 });
    
    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/matches/:id
// @desc    Get match by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('organizer', 'name')
      .populate('participants.user', 'name');
    
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: {
          message: 'Match not found',
          type: 'ResourceNotFound'
        }
      });
    }
    
    res.json({
      success: true,
      data: match
    });
  } catch (err) {
    console.error('Error fetching match:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        error: {
          message: 'Match not found - invalid ID format',
          type: 'ResourceNotFound'
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: {
        message: 'Server error while fetching match',
        type: 'ServerError',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
});

// @route   POST api/matches
// @desc    Create a match
// @access  Private
router.post('/', auth, matchActionLimiter, [
  check('title', 'Title is required').not().isEmpty(),
  check('sport', 'Sport is required').not().isEmpty(),
  check('date', 'Valid date is required').isISO8601().toDate(),
  check('time', 'Time is required').not().isEmpty(),
  check('location.address', 'Address is required').not().isEmpty(),
  check('location.coordinates', 'Coordinates must be an array of 2 numbers').isArray().custom(coords => {
    return coords.length === 2 && 
           !isNaN(parseFloat(coords[0])) && 
           !isNaN(parseFloat(coords[1]));
  }),
  check('skillLevel', 'Skill level is required').isIn(['beginner', 'intermediate', 'advanced', 'all']),
  check('playersNeeded', 'Players needed must be a positive number').isInt({ min: 1 }),
  check('description').optional().trim()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const {
      title,
      sport,
      location,
      date,
      skillLevel,
      spotsAvailable,
      description
    } = req.body;
    
    // Create new match
    const newMatch = new Match({
      title,
      sport,
      location,
      date,
      skillLevel,
      spotsAvailable,
      description,
      organizer: req.user.id
    });
    
    const match = await newMatch.save();
    
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/matches/:id
// @desc    Update a match
// @access  Private
router.put('/:id', auth, matchActionLimiter, [
  check('title').optional().not().isEmpty(),
  check('sport').optional().not().isEmpty(),
  check('date').optional().isISO8601().toDate(),
  check('time').optional().not().isEmpty(),
  check('location.address').optional().not().isEmpty(),
  check('location.coordinates').optional().isArray().custom(coords => {
    return coords.length === 2 && 
           !isNaN(parseFloat(coords[0])) && 
           !isNaN(parseFloat(coords[1]));
  }),
  check('skillLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'all']),
  check('playersNeeded').optional().isInt({ min: 1 }),
  check('description').optional().trim()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    // Check if user is the organizer
    if (match.organizer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this match' });
    }
    
    // Update fields
    const {
      title,
      sport,
      location,
      date,
      skillLevel,
      spotsAvailable,
      description
    } = req.body;
    
    if (title) match.title = title;
    if (sport) match.sport = sport;
    if (location) match.location = location;
    if (date) match.date = date;
    if (skillLevel) match.skillLevel = skillLevel;
    if (spotsAvailable !== undefined) match.spotsAvailable = spotsAvailable;
    if (description) match.description = description;
    
    await match.save();
    
    res.json(match);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/matches/:id
// @desc    Delete a match
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    // Check if user is the organizer
    if (match.organizer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this match' });
    }
    
    await match.remove();
    
    res.json({ msg: 'Match removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/matches/:id/join
// @desc    Join a match
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    // Check if match is full
    if (match.spotsAvailable <= 0) {
      return res.status(400).json({ msg: 'Match is full' });
    }
    
    // Check if user is already a participant
    if (match.participants.some(participant => participant.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already joined this match' });
    }
    
    // Add user to participants
    match.participants.unshift({ user: req.user.id });
    
    // Decrease spots available
    match.spotsAvailable -= 1;
    
    await match.save();
    
    res.json({ msg: 'Successfully joined match', match });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/matches/:id/leave
// @desc    Leave a match
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    // Check if user is a participant
    const participantIndex = match.participants.findIndex(
      participant => participant.user.toString() === req.user.id
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ msg: 'Not a participant in this match' });
    }
    
    // Remove user from participants
    match.participants.splice(participantIndex, 1);
    
    // Increase spots available
    match.spotsAvailable += 1;
    
    await match.save();
    
    res.json({ msg: 'Successfully left match', match });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;