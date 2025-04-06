const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Rate limiter for Gemini API
const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimit.geminiMax, // Limit each IP to configured number of requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: {
    message: 'Too many requests to AI service, please try again later.',
    type: 'RateLimitError'
  }}
});

// Initialize Gemini API with the API key
if (!config.gemini.apiKey || config.gemini.apiKey.trim() === '') {
  throw new Error('GEMINI_API_KEY is not configured in environment variables');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(config.gemini.apiKey.trim());
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
  throw new Error('Invalid Gemini API key configuration');
}

// @route   POST api/gemini/chat
// @desc    Send message to Gemini AI and get response
// @access  Public
router.post('/chat', geminiLimiter, [
  check('message', 'Message is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: {
        message: 'Invalid input',
        type: 'ValidationError',
        details: errors.array()
      }
    });
  }
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: {
          message: 'Message is required',
          type: 'ValidationError'
        }
      });
    }

    // Initialize the model (Gemini Pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create a chat session
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    
    // Return the response
    res.json({
      success: true,
      response: text,
      history: [...(history || []), 
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text }] }
      ]
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (err.message.includes('API key')) {
      errorMessage = 'Invalid API key configuration';
      statusCode = 401;
    } else if (err.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
      statusCode = 429;
    } else if (err.response?.status === 429) {
      errorMessage = 'Too many requests. Please try again later';
      statusCode = 429;
    } else if (err.message.includes('content filtered')) {
      errorMessage = 'Content was filtered by safety settings';
      statusCode = 400;
    } else if (err.message.includes('invalid')) {
      errorMessage = 'Invalid request parameters';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: {
        message: errorMessage,
        type: err.name || 'GeminiError',
        details: config.server.nodeEnv === 'development' ? err.message : undefined
      }
    });
    }
  });

module.exports = router;