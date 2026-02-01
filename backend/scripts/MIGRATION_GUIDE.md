# Data Migration to Server

This guide explains how to migrate data from your local MongoDB to the server MongoDB.

## Step 1: Export Data from Local (Already Done ✓)

The data has been exported to `backend/scripts/exported_data/` folder with the following files:
- `districts.json` - District data
- `zones.json` - Zone data (17 zones)
- `units.json` - Unit data
- `committeeRoles.json` - Committee role definitions
- `committees.json` - Committee members (135 members including Suhair)
- `agendas.json` - Agenda templates
- `users.json` - User accounts (passwords excluded for security)
- `meetings.json` - Meeting records

## Step 2: Upload to Server

Upload the following to your server:

1. **Upload the exported_data folder:**
   ```bash
   # From your local machine
   scp -r backend/scripts/exported_data user@your-server:/srv/apps/meeting-summary/backend/scripts/
   ```

2. **Upload the import script:**
   ```bash
   scp backend/scripts/serverImport.js user@your-server:/srv/apps/meeting-summary/backend/scripts/
   ```

## Step 3: Run Import on Server

SSH into your server and run:

```bash
# Navigate to the backend directory
cd /srv/apps/meeting-summary/backend

# Run the import script
node scripts/serverImport.js
```

The script will:
1. Check if all required files exist
2. Show you what will be imported
3. Ask for confirmation before proceeding
4. Import all data to the server MongoDB
5. Show a summary of imported data

## What Gets Imported

- ✅ All 17 zones with their data
- ✅ All 135 committee members (including Suhair in Pandikkad)
- ✅ All units with member information
- ✅ All committee roles
- ✅ All agendas
- ✅ All users (with default password for new users)
- ✅ All meeting records

## Important Notes

### User Passwords
- **Existing users**: Passwords are preserved
- **New users**: Default password is `ChangeMe123!`
- All users should change their passwords on first login

### Data Updates
- The script uses `upsert` mode, which means:
  - If a record exists (matched by ID), it will be **updated**
  - If a record doesn't exist, it will be **created**
- No data will be deleted, only added or updated

### Safety
- The script asks for confirmation before proceeding
- You can cancel at any time before confirming
- All operations are logged for verification

## Verification After Import

After running the import, you can verify the data:

```bash
# Check committee members count
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Committee = require('./models/Committee'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const count = await Committee.countDocuments(); console.log('Committee members:', count); process.exit(); });"

# Check zones count
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Zone = require('./models/Zone'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const count = await Zone.countDocuments(); console.log('Zones:', count); process.exit(); });"
```

## Troubleshooting

### Error: "exported_data directory not found"
- Make sure you uploaded the `exported_data` folder to `backend/scripts/`
- Check the path: `/srv/apps/meeting-summary/backend/scripts/exported_data/`

### Error: "MONGODB_URI not set"
- Check your `.env` file in the backend directory
- Ensure `MONGODB_URI` is properly configured

### Connection Issues
- Verify the MongoDB URI is correct
- Check if MongoDB is running on the server
- Ensure network connectivity to MongoDB

## Alternative: Manual MongoDB Import

If you prefer to use MongoDB's native tools:

```bash
# For each JSON file
mongoimport --uri="your-mongodb-uri" --collection=committees --file=exported_data/committees.json --jsonArray
mongoimport --uri="your-mongodb-uri" --collection=zones --file=exported_data/zones.json --jsonArray
# ... repeat for other collections
```

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify all files are uploaded correctly
3. Ensure MongoDB connection is working
4. Check server logs for more details
