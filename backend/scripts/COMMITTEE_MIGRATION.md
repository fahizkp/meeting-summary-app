# Committee Data Migration - Server Script

## Overview
This script migrates committee member data directly from Google Sheets to the server MongoDB. It's designed to run on the server and will fetch fresh data from Google Sheets.

## Prerequisites

### On Server
1. **Google Sheets Service Account** configured
   - Service account JSON file in place
   - Environment variables set in `.env`:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_PRIVATE_KEY`
     - `GOOGLE_SHEET_ID`

2. **MongoDB Connection** configured
   - `MONGODB_URI` set in `.env`

## How to Run on Server

### Step 1: Upload the Script
```bash
# From your local machine
scp backend/scripts/migrateCommitteeToServer.js user@server:/srv/apps/meeting-summary/backend/scripts/
```

### Step 2: SSH to Server
```bash
ssh user@server
cd /srv/apps/meeting-summary/backend
```

### Step 3: Run the Migration
```bash
node scripts/migrateCommitteeToServer.js
```

## What the Script Does

### Step-by-Step Process

1. **✅ Sets up Committee Roles**
   - Creates/updates 6 role definitions
   - പ്രസിഡന്റ് (President)
   - വൈസ് പ്രസിഡന്റ് (Vice President)
   - സെക്രെട്ടറി (Secretary)
   - ജോയിന്റ് സെക്രട്ടറി (Joint Secretary)
   - ട്രെഷറർ (Treasurer)
   - എക്സിക്യൂട്ടീവ് മെമ്പർ (Executive Member)

2. **📥 Fetches from Google Sheets**
   - Reads from `ZoneData` sheet
   - Processes all rows (A2:E)

3. **🔍 Identifies Committee Members**
   - Detects zone-level roles (both Malayalam and English)
   - Filters out unit-level members
   - Groups by zone

4. **📝 Updates Zone Records**
   - Updates each zone with its committee roles

5. **🗑️ Clears Old Data**
   - Removes existing committee members
   - Ensures fresh start

6. **➕ Creates New Records**
   - Creates committee member documents
   - Assigns proper role IDs
   - Links to zones

7. **✅ Verifies Results**
   - Shows summary by zone
   - Checks for Suhair in Pandikkad
   - Displays counts by role

## Expected Output

```
===========================================
  Committee Data Migration to Server
  From Google Sheets → MongoDB
===========================================

Connecting to MongoDB...
✓ Connected to MongoDB

Step 1: Setting up Committee Roles...
  ✓ Configured 6 committee roles

Step 2: Fetching data from Google Sheets...
  ✓ Found 137 rows in ZoneData

Step 3: Processing committee members...
  ✓ Identified 17 zones with committee members

Step 4: Updating zones with committee roles...
  ✓ 1: മമ്പാട് - 8 roles
  ✓ 2: പെരിന്തൽമണ്ണ - 8 roles
  ...

Step 5: Clearing existing committee members...
  ✓ Cleared 0 existing committee members

Step 6: Creating committee member documents...
  ✓ Created 135 committee members

Step 7: Summary by Zone:

  📍 മമ്പാട് (1): 8 members
     • അഹിത് കുമാർ - ജോയിന്റ് സെക്രട്ടറി
     • ഇഷാം - പ്രസിഡന്റ്
     ...

Step 8: Verifying key members...

  ✅ Suhair found in Pandikkad:
     ID: C024
     Name: സുഹൈർ
     Role: ട്രെഷറർ
     Zone: പാണ്ടിക്കാട്

===========================================
  ✅ Migration Complete!
===========================================

📊 Summary:
   • Total Zones:            17
   • Total Committee Members: 135
   • Committee Roles:        6

📋 Members by Role:
   • പ്രസിഡന്റ്: 17
   • വൈസ് പ്രസിഡന്റ്: 51
   • സെക്രെട്ടറി: 17
   • ജോയിന്റ് സെക്രട്ടറി: 34
   • ട്രെഷറർ: 17
   • എക്സിക്യൂട്ടീവ് മെമ്പർ: 0

===========================================
```

## Important Notes

### ⚠️ Data Clearing
The script **clears existing committee members** before creating new ones. This ensures:
- No duplicate entries
- Fresh data from Google Sheets
- Clean state

If you want to **keep existing data**, comment out Step 5 in the script:
```javascript
// Step 5: Clear existing committee members (optional - comment out if you want to keep existing)
// console.log('Step 5: Clearing existing committee members...');
// const deleteResult = await Committee.deleteMany({});
// console.log(`  ✓ Cleared ${deleteResult.deletedCount} existing committee members\n`);
```

### 🔄 Re-running the Script
You can safely re-run this script multiple times. It will:
- Update committee roles if changed
- Clear and recreate all committee members
- Fetch latest data from Google Sheets

### 🔐 Google Sheets Access
Make sure the service account has access to the Google Sheet:
1. Share the sheet with the service account email
2. Grant "Viewer" or "Editor" permissions

## Troubleshooting

### Error: "Failed to load Google Sheets service"
- Check if Google Sheets credentials are configured
- Verify service account JSON file exists
- Check environment variables in `.env`

### Error: "MONGODB_URI not set"
- Ensure `.env` file exists in backend directory
- Verify `MONGODB_URI` is set correctly

### No committee members found
- Check if Google Sheet has data in `ZoneData` sheet
- Verify column D contains role information
- Check if roles are in Malayalam or English

### Suhair not found
- Verify the name spelling in Google Sheets
- Check if Pandikkad zone exists
- Ensure the role is recognized (should be ട്രെഷറർ)

## Verification After Migration

Run the verification script:
```bash
node scripts/verifyServerData.js
```

Or check manually:
```bash
# Count committee members
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Committee = require('./models/Committee'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const count = await Committee.countDocuments(); console.log('Committee members:', count); process.exit(); });"

# Find Suhair
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Committee = require('./models/Committee'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const member = await Committee.findOne({ name: /സുഹൈർ/i }); console.log(member); process.exit(); });"
```

---

**Ready to run!** This script will populate your server's committee table with all 135 members from Google Sheets, including Suhair in Pandikkad.
