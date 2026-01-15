const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isMongoConnected } = require('../config/mongodb');
const mongoService = require('../services/mongoService');

// Apply authentication middleware to all routes except debug
router.use((req, res, next) => {
  // Skip auth for debug endpoint
  if (req.path === '/debug/env') {
    return next();
  }
  // Apply auth middleware to all other routes
  authenticate(req, res, next);
});

/**
 * GET /api/debug/env
 * Debug endpoint to check environment variables (development only)
 */
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  res.json({
    mongoConnected: isMongoConnected(),
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /api/zones
 * Fetch all available zones from MongoDB
 */
router.get('/zones', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Fetching zones from MongoDB');
    const zones = await mongoService.getZones();
    
    // Add units from MongoDB
    for (const zone of zones) {
      const units = await mongoService.getUnitsByZone(zone.id);
      zone.units = units;
    }
    
    res.json({ success: true, zones, source: 'mongodb' });
  } catch (error) {
    console.error('Error in /api/zones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zones',
      message: error.message,
    });
  }
});

/**
 * GET /api/attendees/:zoneId
 * Fetch attendees for a specific zone from MongoDB
 */
router.get('/attendees/:zoneId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { zoneId } = req.params;
    console.log('[API] Fetching attendees from MongoDB for zone:', zoneId);
    const attendees = await mongoService.getAttendeesByZone(zoneId);
    res.json({ success: true, attendees, source: 'mongodb' });
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
 * Fetch all agenda items from MongoDB
 */
router.get('/agendas', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Fetching agendas from MongoDB');
    const agendas = await mongoService.getAgendas();
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
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { meetingId } = req.params;
    const meetingData = await mongoService.getMeetingById(meetingId);

    if (!meetingData) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    const report = mongoService.generateReport(meetingData);

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
 * GET /api/meetings/check-week
 * Check if a meeting already exists for a zone in a given week (Wednesday to Tuesday)
 */
router.get('/meetings/check-week', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { zoneName, date, excludeMeetingId } = req.query;

    if (!zoneName || !date) {
      return res.status(400).json({
        success: false,
        error: 'zoneName and date are required',
      });
    }

    const existingMeeting = await mongoService.getMeetingForZoneWeek(
      zoneName,
      date,
      excludeMeetingId || null
    );

    if (existingMeeting) {
      return res.json({
        success: true,
        exists: true,
        existingMeeting,
      });
    }

    res.json({
      success: true,
      exists: false,
    });
  } catch (error) {
    console.error('Error in /api/meetings/check-week:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check week meetings',
      message: error.message,
    });
  }
});

/**
 * POST /api/meetings
 * Save meeting summary to MongoDB
 */
router.post('/meetings', express.json(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const {
      zoneName,
      date,
      startTime,
      endTime,
      agendas,
      minutes,
      attendance,
      qhls,
      swagatham,
      adhyakshan,
      nandhi,
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

    const result = await mongoService.saveMeeting({
      zoneName,
      date,
      startTime,
      endTime,
      agendas: Array.isArray(agendas) ? agendas : [],
      minutes,
      attendance,
      qhls: Array.isArray(qhls) ? qhls : [],
      swagatham: swagatham || '',
      adhyakshan: adhyakshan || '',
      nandhi: nandhi || '',
    });

    res.json({
      success: true,
      message: 'Meeting summary saved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in POST /api/meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save meeting summary',
      message: error.message,
    });
  }
});

/**
 * GET /api/meetings/list
 * Get all meetings from MongoDB
 */
router.get('/meetings/list', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Fetching meetings from MongoDB');
    const meetings = await mongoService.getAllMeetings();
    res.json({ success: true, meetings });
  } catch (error) {
    console.error('Error in /api/meetings/list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/meetings/:meetingId
 * Delete a meeting from MongoDB
 */
router.delete('/meetings/:meetingId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { meetingId } = req.params;
    const result = await mongoService.deleteMeeting(meetingId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in DELETE /api/meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting',
      message: error.message,
    });
  }
});

/**
 * PUT /api/meetings/:meetingId
 * Update a meeting in MongoDB
 */
router.put('/meetings/:meetingId', express.json(), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { meetingId } = req.params;
    const {
      zoneName,
      date,
      startTime,
      endTime,
      agendas,
      minutes,
      attendance,
      qhls,
      swagatham,
      adhyakshan,
      nandhi,
    } = req.body;

    if (!zoneName || !date || !minutes || !attendance) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Zone name, date, minutes, and attendance are required',
      });
    }

    if (!Array.isArray(minutes) || !Array.isArray(attendance)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'Minutes and attendance must be arrays',
      });
    }

    const result = await mongoService.updateMeeting(meetingId, {
      zoneName,
      date,
      startTime,
      endTime,
      agendas: Array.isArray(agendas) ? agendas : [],
      minutes,
      attendance,
      qhls: Array.isArray(qhls) ? qhls : [],
      swagatham: swagatham || '',
      adhyakshan: adhyakshan || '',
      nandhi: nandhi || '',
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in PUT /api/meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meeting',
      message: error.message,
    });
  }
});

/**
 * GET /api/attendance-summary
 * Get attendance summary by weeks for a specific zone
 */
router.get('/attendance-summary', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { zoneId, startDate, endDate } = req.query;

    if (!zoneId || zoneId === 'All') {
      return res.status(400).json({
        success: false,
        error: 'A specific zone must be selected'
      });
    }

    // 1. Fetch all attendees for this zone
    const allZones = await mongoService.getZones();
    const zone = allZones.find(z => z.name === zoneId || z.id === zoneId);

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found'
      });
    }

    const attendees = await mongoService.getAttendeesByZone(zone.id);

    // 2. Fetch meetings in range for this zone
    const meetings = await mongoService.getMeetingsByDateRange(startDate, endDate);
    const zoneMeetings = meetings.filter(m => m.zoneName === zone.name);

    // 3. Group meetings by week
    const weekMeetingsMap = new Map();
    zoneMeetings.forEach(meeting => {
      const weekKey = meeting.date ? meeting.date.substring(0, 10) : 'unknown';
      if (!weekMeetingsMap.has(weekKey)) {
        weekMeetingsMap.set(weekKey, meeting);
      }
    });

    // Sort weeks chronologically
    const sortedWeeks = Array.from(weekMeetingsMap.keys()).sort();

    // 4. Build attendance data for each attendee
    const attendanceData = attendees.map((attendee, index) => {
      const weeklyStatus = {};
      let presentCount = 0;
      let totalWeeks = sortedWeeks.length;

      sortedWeeks.forEach(week => {
        const meeting = weekMeetingsMap.get(week);
        if (meeting && meeting.attendance) {
          const record = meeting.attendance.find(a => a.name === attendee.name);
          if (record) {
            if (record.status === 'present') {
              weeklyStatus[week] = 'P';
              presentCount++;
            } else if (record.status === 'leave') {
              weeklyStatus[week] = 'L';
            } else {
              weeklyStatus[week] = 'A';
            }
          } else {
            weeklyStatus[week] = 'A';
          }
        } else {
          weeklyStatus[week] = '-';
        }
      });

      const percentage = totalWeeks > 0 ? ((presentCount / totalWeeks) * 100).toFixed(1) : '0.0';

      return {
        slNo: index + 1,
        name: attendee.name,
        role: attendee.role,
        weeklyStatus,
        totalAttendance: `${presentCount} out of ${totalWeeks}`,
        presentCount,
        totalWeeks,
        percentage: parseFloat(percentage)
      };
    });

    res.json({
      success: true,
      data: {
        zoneName: zone.name,
        weeks: sortedWeeks,
        attendees: attendanceData,
        totalMeetings: zoneMeetings.length
      }
    });

  } catch (error) {
    console.error('Error in /api/attendance-summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance summary',
      message: error.message
    });
  }
});

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    const { startDate, endDate, zoneId } = req.query;
    
    // 1. Fetch meetings in range
    const meetings = await mongoService.getMeetingsByDateRange(startDate, endDate);
    
    // 2. Fetch all zones
    const allZones = await mongoService.getZones();
    const zoneNames = allZones.map(z => z.name);

    // Filter by Zone if provided
    let filteredMeetings = meetings;
    if (zoneId && zoneId !== 'All') {
      console.log(`[API] Filtering details for zone: "${zoneId}"`);
      filteredMeetings = meetings.filter(m => (m.zoneName || '').trim() === zoneId.trim());
      console.log(`[API] Found ${filteredMeetings.length} meetings for zone "${zoneId}"`);
    }

    // Count meetings per zone
    const zoneMeetingCounts = {};
    filteredMeetings.forEach(m => {
      zoneMeetingCounts[m.zoneName] = (zoneMeetingCounts[m.zoneName] || 0) + 1;
    });

    // Zones WITH meetings
    const zonesWithMeetings = zoneNames
      .filter(z => zoneMeetingCounts[z] > 0)
      .map(z => ({ zoneName: z, meetingCount: zoneMeetingCounts[z] }));

    // Zones WITHOUT meetings
    const noMeetingZones = zoneNames
      .filter(z => !zoneMeetingCounts[z])
      .map(z => ({ zoneName: z, reason: "" }));

    // Attendance Stats
    const personStats = {};
    const sortedMeetings = [...filteredMeetings].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Map to track last meeting attendance
    const lastMeetingByZone = {};

    sortedMeetings.forEach(meeting => {
      lastMeetingByZone[meeting.zoneName] = meeting;

      const meetingAttendees = meeting.attendance || [];
      
      meetingAttendees.forEach(record => {
        const name = record.name;

        if (!personStats[name]) {
          personStats[name] = {
            name: name,
            present: 0,
            leave: 0,
            total: 0,
            maxConsecutiveLeaves: 0,
            currentConsecutiveLeaves: 0,
            lastAttendedDate: null,
            zone: meeting.zoneName
          };
        }

        personStats[name].total += 1;

        if (record.status === 'present') {
          personStats[name].present += 1;
          personStats[name].currentConsecutiveLeaves = 0;
          personStats[name].lastAttendedDate = meeting.date;
        } else if (record.status === 'leave') {
          personStats[name].leave += 1;
          personStats[name].currentConsecutiveLeaves += 1;
          if (personStats[name].currentConsecutiveLeaves > personStats[name].maxConsecutiveLeaves) {
            personStats[name].maxConsecutiveLeaves = personStats[name].currentConsecutiveLeaves;
          }
        }
      });
    });

    // Finalize Stats
    const summaryStats = Object.values(personStats).map(p => ({
      name: p.name,
      total: p.total,
      present: p.present,
      leave: p.leave,
      absent: p.total - p.present - p.leave,
      percentage: p.total > 0 ? ((p.present / p.total) * 100).toFixed(1) : 0,
      consecutiveLeaves: p.maxConsecutiveLeaves,
      currentStreak: p.currentConsecutiveLeaves,
      lastAttended: p.lastAttendedDate,
      zone: p.zone
    }));

    // Consecutive Leave List (Current Streak >= 3)
    const consecutiveLeaveList = summaryStats
      .filter(p => p.currentStreak >= 3)
      .map(p => ({
        name: p.name,
        zone: p.zone,
        consecutiveLeaves: p.currentStreak,
        lastAttendedDate: p.lastAttended
      }));

    // Latest Meeting Leaves
    let latestMeeting = null;
    if (sortedMeetings.length > 0) {
      latestMeeting = sortedMeetings[sortedMeetings.length - 1];
    }

    const latestLeaves = [];
    if (latestMeeting) {
      (latestMeeting.attendance || []).forEach(a => {
        if (a.status === 'leave') {
          latestLeaves.push({
            name: a.name,
            reason: a.reason,
            zone: latestMeeting.zoneName
          });
        }
      });
    }

    // Meetings list
    const meetingsList = filteredMeetings.map(meeting => ({
      meetingId: meeting.meetingId,
      date: meeting.date,
      zoneName: meeting.zoneName,
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Helper to get week number
    const getWeekNumber = (d) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return weekNo;
    };

    res.json({
      success: true,
      data: {
        totalMeetings: filteredMeetings.length,
        totalZones: allZones.length,
        zonesWithMeetings,
        noMeetingZones,
        missingReports: noMeetingZones.length,
        consecutiveAbsence: consecutiveLeaveList,
        latestLeaves: latestLeaves,
        meetingsList,
        attendanceRegister: summaryStats.slice(0, 50),
        totalMembers: summaryStats.length,
        qhlsMissingBranches: [], // TODO: Implement QHLS tracking
        currentWeek: getWeekNumber(new Date(startDate || new Date())),
      }
    });

  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error.message
    });
  }
});

module.exports = router;
