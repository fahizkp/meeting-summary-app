require('dotenv').config();

// Validate critical environment variables before starting
if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  console.error('ERROR: GOOGLE_SHEETS_SPREADSHEET_ID is not set in .env file');
  console.error('Please create a .env file in the backend directory with your Google Sheets credentials');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Meeting Summary API is running' });
});

// API routes
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
  console.log(`Spreadsheet ID: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Set' : 'NOT SET'}`);
});

