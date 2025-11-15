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
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Validate required environment variables
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables');
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
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Error initializing Google Sheets auth:', error);
      throw error;
    }
  }

  /**
   * Get all unique zones from ZoneData sheet
   */
  async getZones() {
    try {
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ZoneData!A2:B', // Column A: ZoneId, Column B: ZoneName (headers in row 1, data starts from row 2)
      });

      const rows = response.data.values || [];
      const zonesMap = new Map();

      // ZoneId is column A, ZoneName is column B
      rows.forEach((row) => {
        if (row[0] && row[1]) {
          zonesMap.set(row[0], row[1]);
        }
      });

      // Convert map to array of objects
      const zones = Array.from(zonesMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      return zones;
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  }

  /**
   * Get attendees for a specific zone
   */
  async getAttendeesByZone(zoneId) {
    try {
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
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
   * Get agenda items from Agenda sheet
   */
  async getAgendas() {
    try {
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID is not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
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
   * Check if a sheet exists in the spreadsheet
   */
  async sheetExists(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      const sheets = response.data.sheets || [];
      return sheets.some(sheet => sheet.properties.title === sheetName);
    } catch (error) {
      console.error('Error checking if sheet exists:', error);
      throw error;
    }
  }

  /**
   * Create a new sheet with headers
   */
  async createWeekSheet(sheetName) {
    try {
      // Create the sheet
      const createResponse = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
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
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:I1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'MeetingId',
            'ZoneName',
            'Date',
            'StartTime',
            'EndTime',
            'Agendas',
            'Minutes',
            'Attendance',
            'QHLS',
          ]],
        },
      });

      // Format header row (bold)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 9,
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
   * Save meeting summary to week-specific sheet
   */
  async saveMeetingSummary(meetingData) {
    try {
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID is not configured');
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

      // Convert arrays to JSON strings for storage
      const minutesJson = JSON.stringify(minutes);
      const attendanceJson = JSON.stringify(attendance);
      const agendasJson = JSON.stringify(agendas || []);
      const qhlsJson = JSON.stringify(qhls || []);

      const values = [[
        meetingId,
        zoneName,
        date,
        startTime || '',
        endTime || '',
        agendasJson,
        minutesJson,
        attendanceJson,
        qhlsJson,
      ]];

      // Append to the week-specific sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${weekSheetName}!A:I`,
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

