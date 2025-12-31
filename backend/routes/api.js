const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

let googleSheetsService;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to initialize Google Sheets service:', error.message);
  // Service will be null, routes will handle this
}

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

/**
 * GET /api/meetings/list
 * Get all meetings
 */
router.get('/meetings/list', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const meetings = await googleSheetsService.getAllMeetings();
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
 * Delete a meeting
 */
router.delete('/meetings/:meetingId', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
    });
  }
  
  try {
    const { meetingId } = req.params;
    const result = await googleSheetsService.deleteMeeting(meetingId);

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
 * Update a meeting
 */
router.put('/meetings/:meetingId', express.json(), async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized',
      message: 'Please check your .env file and ensure all required environment variables are set',
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

  try {
    const result = await googleSheetsService.updateMeeting(meetingId, {
      zoneName,
      date,
      startTime,
      endTime,
      agendas: Array.isArray(agendas) ? agendas : [],
      minutes,
      attendance,
      qhls: Array.isArray(qhls) ? qhls : [],
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
 * Returns data structured for the attendance summary table
 */
router.get('/attendance-summary', async (req, res) => {
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized'
    });
  }

  try {
    const { zoneId, startDate, endDate } = req.query;

    if (!zoneId || zoneId === 'All') {
      return res.status(400).json({
        success: false,
        error: 'A specific zone must be selected'
      });
    }

    // 1. Fetch all attendees for this zone
    const allZones = await googleSheetsService.getZones();
    const zone = allZones.find(z => z.name === zoneId || z.id === zoneId);

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found'
      });
    }

    const attendees = await googleSheetsService.getAttendeesByZone(zone.id);

    // 2. Fetch meetings in range for this zone
    const meetings = await googleSheetsService.getMeetingsByDateRange(startDate, endDate);
    const zoneMeetings = meetings.filter(m => m.zoneName === zone.name);

    // 3. Group meetings by week (using sheet name as week identifier)
    const weekMeetingsMap = new Map(); // sheetName -> meeting
    zoneMeetings.forEach(meeting => {
      // Use the sheetName (e.g., "Dec18") as week identifier
      if (!weekMeetingsMap.has(meeting.sheetName)) {
        weekMeetingsMap.set(meeting.sheetName, meeting);
      }
    });

    // Sort weeks chronologically
    const sortedWeeks = Array.from(weekMeetingsMap.keys()).sort((a, b) => {
      // Parse week names like "Dec18", "Dec25", "Jan01"
      const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      const parseWeek = (w) => {
        const month = w.substring(0, 3);
        const day = parseInt(w.substring(3));
        // Assume current year context, handle year wrap
        const year = months[month] < 6 ? 2026 : 2025; // Simple heuristic
        return new Date(year, months[month], day);
      };
      return parseWeek(a) - parseWeek(b);
    });

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
            weeklyStatus[week] = 'A'; // Absent - not in attendance list
          }
        } else {
          weeklyStatus[week] = '-'; // No meeting data
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
  if (!googleSheetsService) {
    return res.status(500).json({
      success: false,
      error: 'Google Sheets service not initialized'
    });
  }

  try {
    const { startDate, endDate, zoneId } = req.query;
    
    // 1. Fetch meetings in range
    const meetings = await googleSheetsService.getMeetingsByDateRange(startDate, endDate);
    
    // 2. Fetch all zones (to find which ones are missing)
    const allZones = await googleSheetsService.getZones();
    const zoneNames = allZones.map(z => z.name);

    // Initial Filter by Zone if provided
    let filteredMeetings = meetings;
    if (zoneId && zoneId !== 'All') {
        filteredMeetings = meetings.filter(m => m.zoneName === zoneId);
    }

    // --- Analytics Logic ---

    // A. Zones categorization for this week/month
    // Count meetings per zone
    const zoneMeetingCounts = {};
    filteredMeetings.forEach(m => {
        zoneMeetingCounts[m.zoneName] = (zoneMeetingCounts[m.zoneName] || 0) + 1;
    });

    // Zones WITH meetings (include meeting count)
    const zonesWithMeetings = zoneNames
        .filter(z => zoneMeetingCounts[z] > 0)
        .map(z => ({ zoneName: z, meetingCount: zoneMeetingCounts[z] }));

    // Zones WITHOUT meetings
    const noMeetingZones = zoneNames
        .filter(z => !zoneMeetingCounts[z])
        .map(z => ({ zoneName: z, reason: "" })); // reason can be added later if tracked

    // B. Missing Reports Calc (Using weeks.json)
    let missingWeeks = 0;
    let weeksConfig = [];
    let currentWeekInfo = null;
    try {
      weeksConfig = require('../weeks.json');

      // Find current week based on today's date (minus 1 day to handle edge cases)
      const today = new Date();
      today.setDate(today.getDate() - 1); // Subtract 1 day

      currentWeekInfo = weeksConfig.find(w => {
        const wStart = new Date(w.startDate);
        const wEnd = new Date(w.endDate);
        return today >= wStart && today <= wEnd;
      });
    } catch (e) {
      console.warn("weeks.json not found, falling back to estimation");
    }

    if (weeksConfig.length > 0) {
      // 1. Determine relevant weeks from config based on startDate/endDate query
      // If no start/end provided, assume we want to view "current state" (up to now? or all?)
      // For now, let's respect the query params strictly.
      
      const qStart = startDate ? new Date(startDate) : new Date('2025-01-01'); // Default fallback?
      const qEnd = endDate ? new Date(endDate) : new Date();

      const relevantWeeks = weeksConfig.filter(w => {
         const wStart = new Date(w.startDate);
         const wEnd = new Date(w.endDate);
         // Check overlap: Week start <= Query end AND Week end >= Query start
         return wStart <= qEnd && wEnd >= qStart;
      });

      if (zoneId && zoneId !== 'All') {
        const zoneMeetingsDates = filteredMeetings.map(m => new Date(m.date));
        
        // Count how many of the 'relevantWeeks' have at least one meeting
        let attendedWeeks = 0;
        relevantWeeks.forEach(w => {
           const wStart = new Date(w.startDate);
           const wEnd = new Date(w.endDate);
           // Check if any meeting falls in this week slot
           const hasMeeting = zoneMeetingsDates.some(mDate => mDate >= wStart && mDate <= wEnd);
           if (hasMeeting) attendedWeeks++;
        });

        missingWeeks = relevantWeeks.length - attendedWeeks;
      } else {
        // For 'All', we default to count of zones with ZERO meetings (Logic unchanged)
        missingWeeks = noMeetingZones.length;
      }

    } else {
      // Fallback (Original Logic)
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date();
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      const expectedWeeks = Math.max(1, Math.ceil((daysDiff + 1) / 7)); 

      if (zoneId && zoneId !== 'All') {
          const uniqueMeetingWeeks = new Set(filteredMeetings.map(m => m.date)).size; // approx
          missingWeeks = Math.max(0, expectedWeeks - uniqueMeetingWeeks);
      } else {
          missingWeeks = noMeetingZones.length;
      }
    }

    // C. Attendance Stats & Consecutive Absences
    // We need to track stats per person.
    // Logic adapted from previous frontend implementation but now server-side.
    const personStats = {}; 
    const peopleSet = new Set();
    
    // Sort oldest to newest for consecutive logic
    const sortedMeetings = [...filteredMeetings].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Map to track last meeting attendance for "Last Meeting Leave Details"
    const lastMeetingByZone = {}; // zoneName -> meetingObject

    sortedMeetings.forEach(meeting => {
      // Update last meeting for this zone
      lastMeetingByZone[meeting.zoneName] = meeting;

      const meetingAttendees = meeting.attendance || [];
      
      meetingAttendees.forEach(record => {
          const name = record.name;
          peopleSet.add(name);

          if (!personStats[name]) {
              personStats[name] = {
                  name: name,
                  present: 0,
                  leave: 0,
                  total: 0,
                  maxConsecutiveLeaves: 0,
                  currentConsecutiveLeaves: 0, // Auxiliary var
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
        absent: p.total - p.present - p.leave, // Assuming implied absence if not in record? Or just strictly record based.
        // Clarification: "Leave" is a status. "Absent" usually means not in record? 
        // Requirement said: "Leave members are considered absent but shown separately"
        // Let's stick to strict counts from records for now.
        percentage: p.total > 0 ? ((p.present / p.total) * 100).toFixed(1) : 0,
        consecutiveLeaves: p.maxConsecutiveLeaves, // Or current? Requirement: "absent in the last 3 consecutive meetings" usually implies Current streak.
        currentStreak: p.currentConsecutiveLeaves,
        lastAttended: p.lastAttendedDate,
        zone: p.zone
    }));

    // C. Consecutive Leave (Current Streak >= 3)
    // Note: This tracks consecutive LEAVES (not absences)
    const consecutiveLeaveList = summaryStats
        .filter(p => p.currentStreak >= 3)
        .map(p => ({
            name: p.name,
            zone: p.zone,
            consecutiveLeaves: p.currentStreak,
            lastAttendedDate: p.lastAttended
        }));

    // D. Last Meeting Leave Details
    // For the overall view, showing leaves from ALL latest zone meetings might be too much?
    // Requirement: "For the latest meeting (based on date) in the selected range"
    // If "All" zones selected, maybe just list latest leaves from the very last meeting globally? or per zone?
    // "When a district admin clicks a zone... show... Last Meeting Leave Details"
    // Let's return the global latest meeting leaves for overview, and per-zone if zone selected.
    
    let latestMeeting = null;
    if (sortedMeetings.length > 0) {
        latestMeeting = sortedMeetings[sortedMeetings.length - 1]; // Newest
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

    // E. QHLS Missing Branches
    // Find branches that haven't conducted QHLS in the filtered meetings
    const qhlsBranchesSet = new Set();
    const allBranchesSet = new Set();

    filteredMeetings.forEach(meeting => {
        // Collect all branches from attendance
        (meeting.attendance || []).forEach(a => {
            if (a.branch) {
                allBranchesSet.add(a.branch);
            }
        });

        // Collect branches that have QHLS
        (meeting.qhls || []).forEach(q => {
            if (q.branch) {
                qhlsBranchesSet.add(q.branch);
            }
        });
    });

    // Branches without QHLS
    const qhlsMissingBranches = Array.from(allBranchesSet)
        .filter(branch => !qhlsBranchesSet.has(branch))
        .map(branch => ({ branch }));

    // F. Meetings list with week info (for zone + month view)
    const meetingsList = filteredMeetings.map(meeting => {
        // Find which week this meeting falls into
        let weekNum = null;
        if (weeksConfig.length > 0) {
            const meetingDate = new Date(meeting.date);
            const weekInfo = weeksConfig.find(w => {
                const wStart = new Date(w.startDate);
                const wEnd = new Date(w.endDate);
                return meetingDate >= wStart && meetingDate <= wEnd;
            });
            if (weekInfo) {
                weekNum = weekInfo.week;
            }
        }
        return {
            meetingId: meeting.meetingId,
            date: meeting.date,
            zoneName: meeting.zoneName,
            week: weekNum
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    res.json({
        success: true,
        data: {
            totalMeetings: filteredMeetings.length,
            totalMembers: peopleSet.size,
            attendanceRegister: summaryStats,
            consecutiveAbsence: consecutiveLeaveList, // renamed internally but keeping API field name
            noMeetingZones: noMeetingZones,
            zonesWithMeetings: zonesWithMeetings,
            missingWeeks: missingWeeks,
            latestLeaves: latestLeaves,
            qhlsMissingBranches: qhlsMissingBranches,
            currentWeek: currentWeekInfo ? currentWeekInfo.week : null,
            meetingsList: meetingsList,
            debug: {
                startDate, endDate, zoneId
            }
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

