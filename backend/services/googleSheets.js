require('dotenv').config();
const { google } = require('googleapis');

/**
 * Calculate the Wednesday of the week containing the given date
 * Returns the date formatted as "MMMDD" (e.g., "Nov19", "Dec02")
 * Week starts on Wednesday
 */
function getWeekSheetName(dateString) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday, ..., 6 = Saturday
  
  // Calculate days to subtract to get to Wednesday
  // Wednesday is day 3 (0-indexed)
  let daysToSubtract;
  if (dayOfWeek === 3) {
    // Already Wednesday
    daysToSubtract = 0;
  } else if (dayOfWeek > 3) {
    // Thursday (4), Friday (5), Saturday (6) - go back to previous Wednesday
    daysToSubtract = dayOfWeek - 3;
  } else {
    // Sunday (0), Monday (1), Tuesday (2) - go back to previous Wednesday
    daysToSubtract = dayOfWeek + 4; // 0+4=4, 1+4=5, 2+4=6
  }
  
  const wednesday = new Date(date);
  wednesday.setDate(date.getDate() - daysToSubtract);
  
  // Format as "MMMDD"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[wednesday.getMonth()];
  const day = String(wednesday.getDate()).padStart(2, '0');
  
  return `${month}${day}`;
}

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    
    // Source spreadsheet for reading master data (zones, attendees, agendas, users)
    this.sourceSpreadsheetId = process.env.GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Target spreadsheet for writing meeting summaries
    this.targetSpreadsheetId = process.env.GOOGLE_SHEETS_TARGET_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Validate required environment variables
    if (!this.sourceSpreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID (or GOOGLE_SHEETS_SPREADSHEET_ID) is not set in environment variables');
    }
    if (!this.targetSpreadsheetId) {
      throw new Error('GOOGLE_SHEETS_TARGET_SPREADSHEET_ID (or GOOGLE_SHEETS_SPREADSHEET_ID) is not set in environment variables');
    }
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL is not set in environment variables');
    }
    if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error('GOOGLE_SHEETS_PRIVATE_KEY is not set in environment variables');
    }
    
    this.initializeAuth();
  }

  initializeAuth() {
    try {
      let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
      
      // Handle different private key formats
      if (privateKey) {
        // Remove surrounding quotes if present
        privateKey = privateKey.replace(/^["']|["']$/g, '');
        
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // If it's base64 encoded, decode it
        if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
          try {
            privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
          } catch (e) {
            // Not base64, continue with original
          }
        }
        
        // Ensure proper newlines are present
        if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
      }
      
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Error initializing Google Sheets auth:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  /**
   * Get all unique zones from ZoneData sheet (from SOURCE spreadsheet)
   */
  async getZones() {
    try {
      if (!this.sourceSpreadsheetId) {
        throw new Error('Source Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sourceSpreadsheetId,
        range: 'ZoneData!A2:E', // Column A: ZoneId, B: ZoneName, E: Unit
      });

      const rows = response.data.values || [];
      const zonesMap = new Map();

      rows.forEach((row) => {
        const zoneId = row[0];
        const zoneName = row[1];
        const unit = row[4]?.trim();

        if (!zoneId || !zoneName) {
          return;
        }

        if (!zonesMap.has(zoneId)) {
          zonesMap.set(zoneId, {
            name: zoneName,
            units: new Set(),
          });
        }

        if (unit) {
          zonesMap.get(zoneId).units.add(unit);
        }
      });

      const zones = Array.from(zonesMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        units: Array.from(data.units),
      }));

      return zones;
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  }

  /**
   * Get attendees for a specific zone (from SOURCE spreadsheet)
   */
  async getAttendeesByZone(zoneId) {
    try {
      if (!this.sourceSpreadsheetId) {
        throw new Error('Source Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sourceSpreadsheetId,
        range: 'ZoneData!A2:D', // ZoneId, ZoneName, AttendeeName, Role
      });

      const rows = response.data.values || [];
      const attendees = [];

      rows.forEach((row) => {
        if (row[0] === zoneId && row[2]) {
          attendees.push({
            name: row[2],
            role: row[3] || '', // Role is in column D
          });
        }
      });

      return attendees;
    } catch (error) {
      console.error('Error fetching attendees:', error);
      throw error;
    }
  }

  /**
   * Get agenda items from Agenda sheet (from SOURCE spreadsheet)
   */
  async getAgendas() {
    try {
      if (!this.sourceSpreadsheetId) {
        throw new Error('Source Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sourceSpreadsheetId,
        range: 'Agenda!A2:A', // Column A only, starting from row 2
      });

      const rows = response.data.values || [];
      const agendas = rows
        .map((row) => row[0])
        .filter((agenda) => agenda && agenda.trim() !== '');

      return agendas;
    } catch (error) {
      console.error('Error fetching agendas:', error);
      throw error;
    }
  }

  /**
   * Get user by username from Users sheet (from SOURCE spreadsheet)
   * New format: Username | Password | Roles | ZoneAccess | CreatedDate
   * Roles: comma-separated (e.g., "zone_admin,district_admin")
   * ZoneAccess: comma-separated zone IDs (e.g., "Z001,Z002")
   */
  async getUserByUsername(username) {
    try {
      if (!this.sourceSpreadsheetId) {
        throw new Error('Source Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sourceSpreadsheetId,
        range: 'Users!A2:E', // Column A: Username, B: Password, C: Roles, D: ZoneAccess, E: CreatedDate
      });

      const rows = response.data.values || [];
      
      for (const row of rows) {
        if (row[0] && row[0].trim().toLowerCase() === username.trim().toLowerCase()) {
          // Parse roles - support both old single role and new comma-separated roles
          let roles = [];
          const rolesStr = row[2] || '';
          if (rolesStr) {
            roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean);
          }
          
          // Parse zone access
          let zoneAccess = [];
          const zoneAccessStr = row[3] || '';
          if (zoneAccessStr) {
            zoneAccess = zoneAccessStr.split(',').map(z => z.trim()).filter(Boolean);
          }
          
          return {
            username: row[0].trim(),
            password: row[1] || '', // Plain text for now, will be hashed later
            roles: roles, // Array of roles
            zoneAccess: zoneAccess, // Array of zone IDs
            createdDate: row[4] || '',
          };
        }
      }

      return null; // User not found
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Check if a sheet exists in the TARGET spreadsheet
   */
  async sheetExists(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });
      
      const sheets = response.data.sheets || [];
      return sheets.some(sheet => sheet.properties.title === sheetName);
    } catch (error) {
      console.error('Error checking if sheet exists:', error);
      throw error;
    }
  }

  /**
   * Create a new sheet with headers (in TARGET spreadsheet)
   */
  async createWeekSheet(sheetName) {
    try {
      // Create the sheet
      const createResponse = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.targetSpreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          }],
        },
      });

      const sheetId = createResponse.data.replies[0].addSheet.properties.sheetId;

      // Add headers to row 1
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.targetSpreadsheetId,
        range: `${sheetName}!A1:K1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'MeetingId',
            'Zone',
            'Date',
            'StartTime',
            'EndTime',
            'Agendas',
            'Attendees',
            'Leave',
            'AdditionalAttendees',
            'Minutes',
            'QHLS',
          ]],
        },
      });

      // Format header row (bold)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.targetSpreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 11,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9,
                  },
                },
              },
              fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor',
            },
          }],
        },
      });

      return sheetName;
    } catch (error) {
      console.error('Error creating week sheet:', error);
      throw error;
    }
  }

  /**
   * Get or create a week sheet
   */
  async getOrCreateWeekSheet(sheetName) {
    const exists = await this.sheetExists(sheetName);
    if (!exists) {
      await this.createWeekSheet(sheetName);
    }
    return sheetName;
  }

  /**
   * Parse comma-separated attendees string back to attendance array
   * @param {string} attendeesText - Comma-separated names of present attendees
   * @param {string} leaveText - Comma-separated names with reasons: "Name (reason), Name2"
   * @returns {Array} - Array of attendance objects
   */
  parseAttendanceFromColumns(attendeesText, leaveText) {
    const attendance = [];

    // Parse present attendees
    if (attendeesText && attendeesText.trim()) {
      const presentNames = attendeesText.split(',').map(name => name.trim()).filter(Boolean);
      presentNames.forEach(name => {
        attendance.push({
          name,
          role: '',
          status: 'present',
          reason: '',
        });
      });
    }

    // Parse leave attendees with reasons
    if (leaveText && leaveText.trim()) {
      // Match "Name (reason)" or just "Name"
      const leaveEntries = leaveText.split(',').map(entry => entry.trim()).filter(Boolean);
      leaveEntries.forEach(entry => {
        const match = entry.match(/^(.+?)\s*\((.+)\)$/);
        if (match) {
          attendance.push({
            name: match[1].trim(),
            role: '',
            status: 'leave',
            reason: match[2].trim(),
          });
        } else {
          attendance.push({
            name: entry.trim(),
            role: '',
            status: 'leave',
            reason: '',
          });
        }
      });
    }

    return attendance;
  }

  /**
   * Get meeting data by meeting ID (from TARGET spreadsheet)
   */
  async getMeetingById(meetingId) {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
      }

      // Get all sheets from TARGET spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });

      const sheets = spreadsheet.data.sheets || [];
      
      // Search through all week sheets
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title;
        // Skip non-week sheets (ZoneData, Agenda, etc.)
        if (sheetName === 'ZoneData' || sheetName === 'Agenda' || sheetName === 'MeetingSummaries' || sheetName === 'Users') {
          continue;
        }

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.targetSpreadsheetId,
            range: `${sheetName}!A2:K`, // Skip header row
          });

          const rows = response.data.values || [];
          
          for (const row of rows) {
            if (row[0] === meetingId) {
              // New column structure:
              // A=MeetingId, B=Zone, C=Date, D=StartTime, E=EndTime, 
              // F=Agendas, G=Attendees, H=Leave, I=AdditionalAttendees, J=Minutes, K=QHLS
              
              // Parse agendas from comma-separated text
              const agendasText = row[5] || '';
              const agendas = agendasText ? agendasText.split(',').map(a => a.trim()).filter(Boolean) : [];

              // Parse attendance from Attendees (G) and Leave (H) columns
              const attendeesText = row[6] || '';
              const leaveText = row[7] || '';
              const attendance = this.parseAttendanceFromColumns(attendeesText, leaveText);

              // Parse minutes from comma-separated text
              const minutesText = row[9] || '';
              const minutes = minutesText ? minutesText.split(',').map(m => m.trim()).filter(Boolean) : [];

              // QHLS is still JSON
              let qhls = [];
              try {
                qhls = row[10] ? JSON.parse(row[10]) : [];
              } catch (e) {
                qhls = [];
              }

              return {
                meetingId: row[0],
                zoneName: row[1],
                date: row[2],
                startTime: row[3] || '',
                endTime: row[4] || '',
                agendas,
                minutes,
                attendance,
                qhls,
              };
            }
          }
        } catch (error) {
          // Continue searching other sheets
          continue;
        }
      }

      return null; // Meeting not found
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw error;
    }
  }

  /**
   * Get all meetings from all week sheets (from TARGET spreadsheet)
   */
  async getAllMeetings() {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
      }

      // Get all sheets from TARGET spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });

      const sheets = spreadsheet.data.sheets || [];
      const allMeetings = [];
      
      // Search through all week sheets
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title;
        // Skip non-week sheets (ZoneData, Agenda, Users, etc.)
        if (sheetName === 'ZoneData' || sheetName === 'Agenda' || sheetName === 'MeetingSummaries' || sheetName === 'Users') {
          continue;
        }

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.targetSpreadsheetId,
            range: `${sheetName}!A2:K`, // Skip header row
          });

          const rows = response.data.values || [];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0] && row[0].startsWith('MEET-')) {
              // Extract date from meetingId (timestamp)
              const timestamp = row[0].replace('MEET-', '');
              const savedDate = new Date(parseInt(timestamp));
              
              // Parse attendance data for dashboard
              const attendeesText = row[6] || '';
              const leaveText = row[7] || '';
              const attendance = this.parseAttendanceFromColumns(attendeesText, leaveText);
              
              // Parse basic QHLS for dashboard
              let qhls = [];
              try {
                qhls = row[10] ? JSON.parse(row[10]) : [];
              } catch (e) {
                qhls = [];
              }

              allMeetings.push({
                meetingId: row[0],
                zoneName: row[1] || '',
                date: row[2] || '',
                savedDate: savedDate.toISOString().split('T')[0], // YYYY-MM-DD format
                savedDateTime: savedDate.toISOString(),
                sheetName: sheetName,
                rowIndex: i + 2,
                attendance, // Add attendance for analytics
                qhls, // Add QHLS for analytics
              });
            }
          }
        } catch (error) {
          // Continue searching other sheets
          continue;
        }
      }

      // Sort by saved date (newest first)
      allMeetings.sort((a, b) => new Date(b.savedDateTime) - new Date(a.savedDateTime));

      return allMeetings;
    } catch (error) {
      console.error('Error fetching all meetings:', error);
      throw error;
    }
  }

  /**
   * Get meetings within a date range (from TARGET spreadsheet)
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   */
  async getMeetingsByDateRange(startDate, endDate) {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
      }

      // Get all sheets from TARGET spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });

      const sheets = spreadsheet.data.sheets || [];
      const allMeetings = [];
      
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999); // Include the end date fully

      // Search through all week sheets
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title;
        // Skip non-week sheets
        if (sheetName === 'ZoneData' || sheetName === 'Agenda' || sheetName === 'MeetingSummaries' || sheetName === 'Users') {
          continue;
        }

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.targetSpreadsheetId,
            range: `${sheetName}!A2:K`, // Skip header row
          });

          const rows = response.data.values || [];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0] && row[0].startsWith('MEET-')) {
              const meetingDateStr = row[2]; // Date column
              if (!meetingDateStr) continue;

              const meetingDate = new Date(meetingDateStr);
              
              // Filter by date range
              if (start && meetingDate < start) continue;
              if (end && meetingDate > end) continue;

              // Parse attendance data
              const attendeesText = row[6] || '';
              const leaveText = row[7] || '';
              const attendance = this.parseAttendanceFromColumns(attendeesText, leaveText);
              
              // Parse basic QHLS
              let qhls = [];
              try {
                qhls = row[10] ? JSON.parse(row[10]) : [];
              } catch (e) {
                qhls = [];
              }

              // Parse Minutes (array)
              const minutesText = row[9] || '';
              const minutes = minutesText ? minutesText.split(',').map(m => m.trim()).filter(Boolean) : [];

              allMeetings.push({
                meetingId: row[0],
                zoneName: row[1] || '',
                date: meetingDateStr,
                startTime: row[3] || '',
                endTime: row[4] || '',
                attendance,
                qhls,
                minutes,
                sheetName: sheetName,
                rowIndex: i + 2,
              });
            }
          }
        } catch (error) {
          console.error(`Error reading sheet ${sheetName}:`, error.message);
          continue;
        }
      }

      // Sort by date (newest first)
      allMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));

      return allMeetings;
    } catch (error) {
      console.error('Error fetching meetings by date range:', error);
      throw error;
    }
  }

  /**
   * Delete a meeting by ID (from TARGET spreadsheet)
   */
  async deleteMeeting(meetingId) {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
      }

      // Get all sheets from TARGET spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });

      const sheets = spreadsheet.data.sheets || [];
      
      // Search through all week sheets
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title;
        // Skip non-week sheets
        if (sheetName === 'ZoneData' || sheetName === 'Agenda' || sheetName === 'MeetingSummaries' || sheetName === 'Users') {
          continue;
        }

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.targetSpreadsheetId,
            range: `${sheetName}!A2:K`,
          });

          const rows = response.data.values || [];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0] === meetingId) {
              // Found the meeting, delete the row (row index is i + 2 because we skip header)
              const rowToDelete = i + 2;
              
              await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.targetSpreadsheetId,
                resource: {
                  requests: [{
                    deleteDimension: {
                      range: {
                        sheetId: sheet.properties.sheetId,
                        dimension: 'ROWS',
                        startIndex: rowToDelete - 1, // 0-indexed
                        endIndex: rowToDelete,
                      },
                    },
                  }],
                },
              });

              return { success: true, sheetName, rowNumber: rowToDelete };
            }
          }
        } catch (error) {
          // Continue searching other sheets
          continue;
        }
      }

      return null; // Meeting not found
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  /**
   * Update a meeting by ID (in TARGET spreadsheet)
   */
  async updateMeeting(meetingId, meetingData) {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
      }

      // Get all sheets from TARGET spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.targetSpreadsheetId,
      });

      const sheets = spreadsheet.data.sheets || [];
      
      // Search through all week sheets
      for (const sheet of sheets) {
        const sheetName = sheet.properties.title;
        // Skip non-week sheets
        if (sheetName === 'ZoneData' || sheetName === 'Agenda' || sheetName === 'MeetingSummaries' || sheetName === 'Users') {
          continue;
        }

        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.targetSpreadsheetId,
            range: `${sheetName}!A2:K`,
          });

          const rows = response.data.values || [];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0] === meetingId) {
              const rowIndex = i + 2;

              const {
                zoneName,
                date,
                startTime,
                endTime,
                agendas = [],
                minutes = [],
                attendance = [],
                qhls = [],
              } = meetingData;

              // Format agendas as comma-separated text
              const agendasText = Array.isArray(agendas) ? agendas.join(', ') : '';

              // Format minutes as comma-separated text
              const minutesText = Array.isArray(minutes) ? minutes.join(', ') : '';

              // Split attendance into present attendees and leave attendees
              const presentAttendees = [];
              const leaveAttendees = [];

              if (Array.isArray(attendance)) {
                attendance.forEach((item) => {
                  if (item.status === 'present') {
                    presentAttendees.push(item.name);
                  } else if (item.status === 'leave') {
                    const reason = item.reason ? ` (${item.reason})` : '';
                    leaveAttendees.push(`${item.name}${reason}`);
                  }
                });
              }

              // Comma-separated strings for attendees and leave
              const attendeesText = presentAttendees.join(', ');
              const leaveText = leaveAttendees.join(', ');

              // Additional attendees placeholder (preserve existing if any)
              const additionalAttendeesText = row[8] || '';

              // QHLS stays as JSON
              const qhlsJson = JSON.stringify(qhls || []);

              const values = [[
                meetingId,
                zoneName || row[1] || '',
                date || row[2] || '',
                startTime || '',
                endTime || '',
                agendasText,
                attendeesText,
                leaveText,
                additionalAttendeesText,
                minutesText,
                qhlsJson,
              ]];

              await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.targetSpreadsheetId,
                range: `${sheetName}!A${rowIndex}:K${rowIndex}`,
                valueInputOption: 'RAW',
                resource: {
                  values,
                },
              });

              return { success: true, sheetName, rowNumber: rowIndex };
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  /**
   * Generate formatted report from meeting data
   */
  generateReport(meetingData) {
    const { attendance, agendas, minutes, qhls } = meetingData;

    // Separate present and leave attendees
    const presentAttendees = [];
    const leaveAttendees = [];

    attendance.forEach((item) => {
      const name = item.name;

      if (item.status === 'present') {
        presentAttendees.push(name);
      } else if (item.status === 'leave') {
        const reason = item.reason ? ` (${item.reason})` : '';
        leaveAttendees.push(`${name}${reason}`);
      }
    });

    // Format QHLS data
    let qhlsReport = '';
    if (qhls && qhls.length > 0) {
      // Headings
      const headings = 'യൂണിറ്റ്, ദിവസം, ഫാക്കൽറ്റി, പുരുഷൻ, സ്ത്രീ';
      
      // Data rows
      const qhlsRows = qhls
        .filter(row => row.unit || row.day || row.faculty || row.male || row.female)
        .map(row => {
          const unit = row.unit || '';
          const day = row.day || '';
          const faculty = row.faculty || '';
          const male = row.male || '0';
          const female = row.female || '0';
          return `${unit}, ${day}, ${faculty}, ${male}, ${female}`;
        });

      qhlsReport = `${headings}\n${qhlsRows.join('\n')}`;
    }

    // Format agendas with serial numbers
    const formattedAgendas = agendas && agendas.length > 0
      ? agendas.map((agenda, index) => `${index + 1}. ${agenda}`).join('\n')
      : 'അജണ്ടകളില്ല';

    // Format minutes with serial numbers
    const formattedMinutes = minutes && minutes.length > 0
      ? minutes.map((minute, index) => `${index + 1}. ${minute}`).join('\n')
      : 'തീരുമാനങ്ങളില്ല';

    // Build report
    const report = {
      attendees: presentAttendees.join('\n'),
      leaveAayavar: leaveAttendees.join('\n'),
      agenda: formattedAgendas,
      minutes: formattedMinutes,
      qhlsStatus: qhlsReport,
    };

    return report;
  }

  /**
   * Save meeting summary to week-specific sheet (in TARGET spreadsheet)
   */
  async saveMeetingSummary(meetingData) {
    try {
      if (!this.targetSpreadsheetId) {
        throw new Error('Target Spreadsheet ID is not configured');
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
      } = meetingData;

      // Calculate week sheet name from date
      const weekSheetName = getWeekSheetName(date);
      
      // Get or create the week sheet
      await this.getOrCreateWeekSheet(weekSheetName);

      // Generate a unique meeting ID (timestamp-based)
      const meetingId = `MEET-${Date.now()}`;

      // Format agendas as comma-separated text
      const agendasText = Array.isArray(agendas) ? agendas.join(', ') : '';

      // Format minutes as comma-separated text
      const minutesText = Array.isArray(minutes) ? minutes.join(', ') : '';

      // Split attendance into present attendees and leave attendees
      const presentAttendees = [];
      const leaveAttendees = [];

      if (Array.isArray(attendance)) {
        attendance.forEach((item) => {
          if (item.status === 'present') {
            presentAttendees.push(item.name);
          } else if (item.status === 'leave') {
            const reason = item.reason ? ` (${item.reason})` : '';
            leaveAttendees.push(`${item.name}${reason}`);
          }
        });
      }

      // Comma-separated strings for attendees and leave
      const attendeesText = presentAttendees.join(', ');
      const leaveText = leaveAttendees.join(', ');

      // Additional attendees placeholder (empty for now)
      const additionalAttendeesText = '';

      // QHLS stays as JSON
      const qhlsJson = JSON.stringify(qhls || []);

      const values = [[
        meetingId,
        zoneName,
        date,
        startTime || '',
        endTime || '',
        agendasText,
        attendeesText,
        leaveText,
        additionalAttendeesText,
        minutesText,
        qhlsJson,
      ]];

      // Append to the week-specific sheet in TARGET spreadsheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.targetSpreadsheetId,
        range: `${weekSheetName}!A:K`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values,
        },
      });

      return {
        success: true,
        meetingId,
        weekSheet: weekSheetName,
        rowNumber: response.data.updates.updatedRows,
      };
    } catch (error) {
      console.error('Error saving meeting summary:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();

