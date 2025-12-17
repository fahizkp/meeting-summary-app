require('dotenv').config();

// Validate critical environment variables before starting
// Support both new separate spreadsheet IDs and legacy single ID
const hasSourceId = process.env.GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID;
const hasTargetId = process.env.GOOGLE_SHEETS_TARGET_SPREADSHEET_ID;
const hasLegacyId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

if (!hasSourceId && !hasLegacyId) {
  console.error('ERROR: GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID (or GOOGLE_SHEETS_SPREADSHEET_ID) is not set in .env file');
  console.error('Please create a .env file in the backend directory with your Google Sheets credentials');
  console.error('See ENV_SETUP.md for configuration details');
  process.exit(1);
}

if (!hasTargetId && !hasLegacyId) {
  console.error('ERROR: GOOGLE_SHEETS_TARGET_SPREADSHEET_ID (or GOOGLE_SHEETS_SPREADSHEET_ID) is not set in .env file');
  console.error('Please create a .env file in the backend directory with your Google Sheets credentials');
  console.error('See ENV_SETUP.md for configuration details');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['*'];
    
    // Log for debugging
    console.log('CORS request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // If CORS_ORIGIN is '*', allow all origins
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Meeting Summary API is running' });
});

// Auth routes (public, no authentication required)
app.use('/api/auth', authRoutes);

// API routes (protected, require authentication)
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Debug endpoint: http://localhost:${PORT}/api/debug/env`);
  console.log(`Source Spreadsheet (read): ${hasSourceId ? 'Set' : (hasLegacyId ? 'Using legacy ID' : 'NOT SET')}`);
  console.log(`Target Spreadsheet (write): ${hasTargetId ? 'Set' : (hasLegacyId ? 'Using legacy ID' : 'NOT SET')}`);
});

