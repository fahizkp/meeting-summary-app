# Meeting Summary Application

A full-stack application for managing meeting summaries with zone-based attendee management, dynamic meeting minutes, and attendance tracking. The application supports Malayalam language for labels and data entry.

## Features

- **Zone Selection**: Dropdown with 17 zones that dynamically loads attendees
- **Dynamic Attendee List**: Automatically populated based on selected zone
- **Attendance Tracking**: Radio buttons for Present/Absent with conditional absence reason input
- **Meeting Minutes**: Dynamic textboxes to add/remove meeting minutes
- **Malayalam Support**: Full support for Malayalam language in labels and data entry
- **Google Sheets Integration**: All data stored in Google Sheets

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React with Vite
- **Data Storage**: Google Sheets API
- **Language**: Malayalam (മലയാളം) support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials

## Setup Instructions

### 1. Google Sheets API Setup

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

#### Step 2: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `meeting-summary-service`
   - Click "Create and Continue"
   - Skip role assignment (optional)
   - Click "Done"

#### Step 3: Create and Download Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the JSON file (keep it secure, do not commit to git)

#### Step 4: Create Google Sheets Spreadsheet

1. Create a new Google Sheets spreadsheet
2. Name it "Meeting Summary Data" (or any name you prefer)
3. Create the following required sheets:

   **Sheet 1: ZoneData**
   - Column A: ZoneId
   - Column B: ZoneName
   - Column C: AttendeeName
   - Column D: Role (role of the person in the secretariat)
   - Add your 17 zones and their attendees (one row per attendee per zone)

   Example:
   ```
   ZoneId | ZoneName        | AttendeeName | Role
   1      | Zone 1          | John Doe     | Secretary
   1      | Zone 1          | Jane Smith   | Member
   2      | Zone 2          | Bob Johnson | Coordinator
   ```

   **Sheet 2: Agenda**
   - Column A: AgendaItem (one agenda item per row, starting from row 2)
   - Row 1 can be a header row (optional)
   - Example:
   ```
   AgendaItem
   Budget Discussion
   Project Review
   Team Updates
   ```

   **Note**: Week-based meeting sheets (e.g., `Nov19`, `Nov26`, `Dec02`) are created automatically when meetings are saved. You don't need to create them manually.

4. Share the spreadsheet with the service account email:
   - Click "Share" button
   - Add the service account email (found in the downloaded JSON file as `client_email`)
   - Give it "Editor" permissions
   - Click "Send"

#### Step 5: Get Spreadsheet ID

1. Open your Google Sheets spreadsheet
2. The Spreadsheet ID is in the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. Copy the `SPREADSHEET_ID` part

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd meeting-summary-app/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example` if it exists):
   ```bash
   # Create .env file
   ```

4. Add your Google Sheets credentials to `.env`:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
   GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   PORT=3001
   ```

   **Important**: 
   - Get `GOOGLE_SHEETS_CLIENT_EMAIL` from the downloaded JSON file (field: `client_email`)
   - Get `GOOGLE_SHEETS_PRIVATE_KEY` from the downloaded JSON file (field: `private_key`)
   - Keep the private key in quotes and preserve the `\n` characters

5. Start the backend server:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

   The server will run on `http://localhost:3001`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd meeting-summary-app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file if you need to change the API URL:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Select a zone from the dropdown
3. The attendees list will automatically populate
4. Select the meeting date
5. Mark attendance for each attendee (Present/Absent)
   - If Absent is selected, enter the reason in the textbox that appears
6. Add meeting minutes using the "Add Minute" button
7. Fill in the meeting minutes in the textboxes
8. Click "Save Meeting Summary" to save to Google Sheets

## Project Structure

```
meeting-summary-app/
├── backend/
│   ├── routes/
│   │   └── api.js           # API route handlers
│   ├── services/
│   │   └── googleSheets.js  # Google Sheets service
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env                 # Environment variables (not in git)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ZoneSelector.jsx
│   │   │   ├── AttendeeList.jsx
│   │   │   ├── MeetingMinutes.jsx
│   │   │   └── MeetingForm.jsx
│   │   ├── services/
│   │   │   └── api.js       # API service functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## API Endpoints

### GET /api/zones
Fetch all available zones.

**Response:**
```json
{
  "success": true,
  "zones": [
    { "id": "1", "name": "Zone 1" },
    { "id": "2", "name": "Zone 2" }
  ]
}
```

### GET /api/attendees/:zoneId
Fetch attendees for a specific zone.

**Response:**
```json
{
  "success": true,
  "attendees": [
    { "name": "John Doe" },
    { "name": "Jane Smith" }
  ]
}
```

### POST /api/meetings
Save meeting summary.

**Request Body:**
```json
{
  "zoneName": "Zone 1",
  "date": "2024-01-15",
  "minutes": ["Minute 1", "Minute 2"],
  "attendance": [
    {
      "name": "John Doe",
      "status": "present",
      "reason": ""
    },
    {
      "name": "Jane Smith",
      "status": "absent",
      "reason": "Sick leave"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting summary saved successfully",
  "data": {
    "meetingId": "MEET-1234567890",
    "weekSheet": "Nov19",
    "rowNumber": 1
  }
}
```

**Note**: The `weekSheet` field indicates which week sheet the meeting was saved to. Sheets are named based on the Wednesday of the week (e.g., `Nov19` for the week starting November 19).

## Troubleshooting

### Backend Issues

1. **"Error initializing Google Sheets auth"**
   - Check that your `.env` file has all required variables
   - Verify the private key format (should include `\n` characters)
   - Ensure the service account email and private key are correct

2. **"Failed to fetch zones"**
   - Verify the spreadsheet ID is correct
   - Ensure the spreadsheet is shared with the service account email
   - Check that the "ZoneData" sheet exists and has data

3. **"Failed to save meeting summary"**
   - Ensure the service account has Editor permissions on the spreadsheet
   - The week-based sheet will be created automatically - no manual setup needed
   - Check that the date format is correct (YYYY-MM-DD)

### Frontend Issues

1. **Cannot connect to backend**
   - Ensure the backend server is running on port 3001
   - Check the `VITE_API_URL` in frontend `.env` if you changed the backend port
   - Verify CORS is enabled in the backend

2. **Malayalam text not displaying correctly**
   - Ensure the Noto Sans Malayalam font is loading (check browser console)
   - Verify UTF-8 encoding is set in HTML

## Security Notes

- Never commit `.env` files or service account JSON keys to version control
- Keep your Google Service Account credentials secure
- The `.gitignore` file is configured to exclude sensitive files
- Consider using environment-specific credentials for production

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## License

ISC

## Support

For issues or questions, please check:
1. Google Sheets API documentation
2. Node.js and Express documentation
3. React documentation

## Authentication Setup

The application requires users to log in with username and password to access meeting forms and reports.

### Setting Up Users in Google Sheets

1. **Create a "Users" sheet** in your Google Sheets spreadsheet
2. **Add headers in row 1:**
   - Column A: Username
   - Column B: Password
   - Column C: Role (optional, e.g., "admin", "user")
   - Column D: CreatedDate (optional)

3. **Add user data starting from row 2:**
   ```
   Username | Password | Role | CreatedDate
   admin    | admin123 | admin | 2024-01-01
   user1    | pass123  | user  | 2024-01-01
   ```

4. **Important Notes:**
   - Passwords are currently stored as plain text (encryption will be added later)
   - Usernames are case-insensitive
   - Each username must be unique
   - Make sure the service account has access to read the Users sheet

### Environment Variables

Add to your backend `.env` file:
```env
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=24h
```

**Security Note:** 
- Change `JWT_SECRET` to a strong random string in production
- Passwords are currently stored in plain text - encryption will be implemented in a future update

## Render Deploy Checklist

1. Push the branch `render-setup/fahizkp` containing `render.yaml`.
2. In Render, choose "From Blueprint" (or let Render auto-detect `render.yaml`) to create the backend and frontend services.
3. After the backend (`meeting-summary-backend`) finishes provisioning, copy its URL (e.g., `https://meeting-summary-backend.onrender.com`) and update the Static Site's `REACT_APP_API_URL` environment variable (either directly in the dashboard or by editing `render.yaml`), then redeploy the frontend.
4. Remember that React build-time environment variables such as `REACT_APP_API_URL` require rebuilding/redeploying whenever they change.
5. Free tier services may sleep; expect cold starts and test CORS/endpoints like `/api/hello` once both services are up.
6. **Add JWT_SECRET environment variable** to your backend service in Render dashboard.

