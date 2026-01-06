# Environment Setup

This application uses two separate Google Sheets:
1. **SOURCE Spreadsheet** - Contains master data (zones, attendees, agendas, users) - READ ONLY
2. **TARGET Spreadsheet** - Where meeting summaries are saved - WRITE

## Create a `.env` file in the `backend` directory with the following variables:

```env
# Spreadsheet IDs (found in the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
# Use separate IDs for reading master data and writing meeting summaries
GOOGLE_SHEETS_SOURCE_SPREADSHEET_ID=your_source_spreadsheet_id_here
GOOGLE_SHEETS_TARGET_SPREADSHEET_ID=your_target_spreadsheet_id_here

# BACKWARD COMPATIBLE: If you want to use a single spreadsheet for both, use:
# GOOGLE_SHEETS_SPREADSHEET_ID=your_single_spreadsheet_id_here

# Service Account Credentials
# Get these from Google Cloud Console -> IAM & Admin -> Service Accounts
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# MongoDB Configuration (optional - falls back to Google Sheets if not set)
# Format: mongodb://username:password@host:port/database?authSource=admin
MONGODB_URI=mongodb://user:password@137.59.86.122:27017/meeting_app?authSource=admin
```

## Spreadsheet Structure

### SOURCE Spreadsheet (Read-only)
This spreadsheet contains master data that the application reads from:

| Sheet Name | Columns | Description |
|------------|---------|-------------|
| ZoneData | A: ZoneId, B: ZoneName, C: AttendeeName, D: Role, E: Unit | Zone and attendee information |
| Agenda | A: AgendaItem | List of agenda items |
| Users | A: Username, B: Password, C: Role, D: CreatedDate | User authentication data |

### TARGET Spreadsheet (Write)
This spreadsheet stores meeting summaries. The application creates weekly sheets automatically.

| Column | Header | Format |
|--------|--------|--------|
| A | MeetingId | `MEET-timestamp` |
| B | Zone | Zone name |
| C | Date | Meeting date |
| D | StartTime | Start time |
| E | EndTime | End time |
| F | Agendas | Comma-separated |
| G | Attendees | Comma-separated (present only) |
| H | Leave | `Name (reason), Name2` |
| I | AdditionalAttendees | Manual entry |
| J | Minutes | Comma-separated |
| K | QHLS | JSON |

## Setting up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account (IAM & Admin -> Service Accounts)
5. Download the JSON key file
6. Share both spreadsheets with the service account email (Editor access)
7. Copy the `client_email` and `private_key` from the JSON file to your `.env`

