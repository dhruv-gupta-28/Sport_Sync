/**
 * Configuration module for centralized environment variable handling
 * Loads and validates environment variables from .env file
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Define configuration object with all environment variables
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production'
  },
  
  // Database configuration
  database: {
    mongoUri: process.env.MONGO_URI
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10)
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000, // Default: 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
    registerMax: parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '3', 10),
    apiMax: parseInt(process.env.API_RATE_LIMIT_MAX || '50', 10),
    geminiMax: parseInt(process.env.GEMINI_RATE_LIMIT_MAX || '5', 10)
  },
  
  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
      callbackUrl: process.env.APPLE_CALLBACK_URL
    }
  },
  
  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },

  // Google Maps configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  }

};

// Validate required configuration
function validateConfig() {
  const requiredVars = [
    { path: 'database.mongoUri', name: 'MONGO_URI' },
    { path: 'jwt.secret', name: 'JWT_SECRET' },
    { path: 'jwt.expire', name: 'JWT_EXPIRE' }
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(({ path, name }) => {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      current = current[key];
      if (current === undefined || current === null || current === '') {
        missingVars.push(name);
        break;
      }
    }
  });
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

// Validate configuration on module load
validateConfig();

module.exports = config;
