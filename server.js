const express = require('express');

// Load centralized configuration
const config = require('./config/config');

// Import security and utility middleware
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Security middleware - Configure Helmet for enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
})); // Set security headers

// Configure rate limiters for different routes
// Global rate limiter - applies to all routes as a baseline protection
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Default: 15 minutes
  max: config.rateLimit.maxRequests, // Limit each IP to configured number of requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// API rate limiter - more strict limits for API endpoints
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Default: 15 minutes
  max: config.rateLimit.apiMax, // Limit each IP to configured number of API requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many API requests, please try again later.' }
});

// Create custom rate limiters for specific routes
const createRateLimiter = (max, message) => rateLimit({
  windowMs: config.rateLimit.windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message }
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

// Apply stricter API rate limiting to API routes
app.use('/api/', apiLimiter);

// Middleware
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(cookieParser()); // Parse cookies
app.use(cors());

// Security middleware
// Sanitize data against NoSQL query injection
app.use(mongoSanitize());
// Sanitize data against XSS attacks
app.use(xss());
// Prevent HTTP Parameter Pollution attacks
app.use(hpp({
  whitelist: ['sport', 'date', 'skillLevel', 'location'] // Whitelist certain query parameters that can be duplicated
}));

app.use(session({
  secret: config.jwt.secret,
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
require('./config/passport');

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/gemini', require('./routes/gemini'));

// Apply refresh token middleware to all routes
app.use(require('./middleware/refreshToken'));

// Global error handling middleware
app.use(errorHandler);

// Serve static assets in production
if (config.server.isProduction) {
  // Set static folder
  app.use(express.static('public'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Define port
const PORT = config.server.port;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));