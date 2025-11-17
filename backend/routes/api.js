const express = require('express');
const router = express.Router();

let googleSheetsService;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to initialize Google Sheets service:', error.message);
  // Service will be null, routes will handle this
}

/**
 * GET /api/debug/env
 * Debug endpoint to check environment variables (development only)
 */
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  res.json({
    hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    spreadsheetIdLength: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.length || 0,
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'Set' : 'Not set',
    privateKeyLength: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length || 0,
  });
});

/**
 * GET /api/zones
 * Fetch all available zones
 */
router.get('/zones', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const zones = await googleSheetsService.getZones();
    res.json({ success: true, zones });
  } catch (error) {
    console.error('Error in /api/zones:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zones',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/attendees/:zoneId
 * Fetch attendees for a specific zone
 */
router.get('/attendees/:zoneId', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const { zoneId } = req.params;
    const attendees = await googleSheetsService.getAttendeesByZone(zoneId);
    res.json({ success: true, attendees });
  } catch (error) {
    console.error('Error in /api/attendees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendees',
      message: error.message,
    });
  }
});

/**
 * GET /api/agendas
 * Fetch all agenda items
 */
router.get('/agendas', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const agendas = await googleSheetsService.getAgendas();
    res.json({ success: true, agendas });
  } catch (error) {
    console.error('Error in /api/agendas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agendas',
      message: error.message,
    });
  }
});

/**
 * GET /api/meetings/:meetingId/report
 * Generate formatted report for a meeting
 */
router.get('/meetings/:meetingId/report', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const { meetingId } = req.params;
    const meetingData = await googleSheetsService.getMeetingById(meetingId);

    if (!meetingData) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    const report = googleSheetsService.generateReport(meetingData);

    res.json({
      success: true,
      meetingData,
      report,
    });
  } catch (error) {
    console.error('Error in /api/meetings/:meetingId/report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message,
    });
  }
});

/**
 * POST /api/meetings
 * Save meeting summary
 */
router.post('/meetings', express.json(), async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const {
      zoneName,
      date,
      startTime,
      endTime,
      agendas,
      minutes,
      attendance,
      qhls,
    } = req.body;

    // Validation
    if (!zoneName || !date || !minutes || !attendance) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (!Array.isArray(minutes) || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        error: 'Minutes and attendance must be arrays',
      });
    }

    const result = await googleSheetsService.saveMeetingSummary({
      zoneName,
      date,
      startTime,
      endTime,
      agendas: Array.isArray(agendas) ? agendas : [],
      minutes,
      attendance,
      qhls: Array.isArray(qhls) ? qhls : [],
    });

    res.json({
      success: true,
      message: 'Meeting summary saved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in /api/meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save meeting summary',
      message: error.message,
    });
  }
});

module.exports = router;

