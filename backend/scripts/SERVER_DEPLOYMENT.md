# Server Data Migration - Quick Start

## Files Ready for Server Deployment

### 1. Data Files (in `backend/scripts/exported_data/`)
- ✅ `districts.json` - 1 district
- ✅ `zones.json` - 17 zones
- ✅ `units.json` - All units with members
- ✅ `committeeRoles.json` - 6 role definitions
- ✅ `committees.json` - 135 committee members (including Suhair)
- ✅ `agendas.json` - 7 default agendas
- ✅ `users.json` - All user accounts
- ✅ `meetings.json` - All meeting records

### 2. Import Script
- ✅ `backend/scripts/serverImport.js` - Main import script

## Quick Commands for Server

### Upload to Server
```bash
# Upload data folder
scp -r backend/scripts/exported_data user@server:/srv/apps/meeting-summary/backend/scripts/

# Upload import script
scp backend/scripts/serverImport.js user@server:/srv/apps/meeting-summary/backend/scripts/
```

### Run on Server
```bash
# SSH to server
ssh user@server

# Navigate to backend
cd /srv/apps/meeting-summary/backend

# Run import
node scripts/serverImport.js
```

## What Happens
1. Script checks for required files ✓
2. Connects to server MongoDB ✓
3. Asks for confirmation ⚠️
4. Imports all data (upsert mode - updates existing, creates new) ✓
5. Shows summary ✓

## Key Points
- **Safe**: Won't delete existing data
- **Smart**: Updates existing records, creates missing ones
- **Secure**: Preserves existing user passwords
- **Verified**: Shows summary of all imported data

## After Import
All 135 committee members will be in the server database, including:
- Suhair in Pandikkad (പാണ്ടിക്കാട്)
- All other zone secretariat members
- All units and their members
- All meeting records

---
**Ready to deploy!** Follow the commands above or see `MIGRATION_GUIDE.md` for detailed instructions.
