/**
 * Re-migrate Committee Members
 * Clears existing committee data and re-imports from Google Sheets
 * 
 * Usage: node scripts/reMigrateCommittee.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Committee = require('../models/Committee');
const Zone = require('../models/Zone');

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to load Google Sheets service:', error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

const COMMITTEE_ROLES_DATA = [
  { id: 'CR01', name: 'പ്രസിഡന്റ്', englishName: 'President' },
  { id: 'CR02', name: 'വൈസ് പ്രസിഡന്റ്', englishName: 'Vice President' },
  { id: 'CR03', name: 'സെക്രെട്ടറി', englishName: 'Secretary' },
  { id: 'CR04', name: 'ജോയിന്റ് സെക്രട്ടറി', englishName: 'Joint Secretary' },
  { id: 'CR05', name: 'ട്രെഷറർ', englishName: 'Treasurer' },
  { id: 'CR06', name: 'എക്സിക്യൂട്ടീവ് മെമ്പർ', englishName: 'Executive Member' },
];

async function reMigrateCommittee() {
  console.log('\\n===========================================');
  console.log('  Re-Migrating Committee Members');
  console.log('===========================================\\n');

  try {
    // Step 1: Clear existing committee data
    console.log('Step 1: Clearing existing committee data...');
    const deleteResult = await Committee.deleteMany({});
    console.log(`  ✓ Deleted ${deleteResult.deletedCount} existing committee members`);

    // Step 2: Clear roles from zones
    console.log('\\nStep 2: Clearing roles from zones...');
    await Zone.updateMany({}, { $set: { roles: [] } });
    console.log('  ✓ Cleared roles from all zones');

    // Step 3: Fetch data from Google Sheets
    console.log('\\nStep 3: Fetching data from Google Sheets...');
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.sourceSpreadsheetId,
      range: 'ZoneData!A2:E',
    });

    const rows = response.data.values || [];
    console.log(`  ✓ Found ${rows.length} rows in ZoneData`);

    // Step 4: Process and identify committee members
    console.log('\\nStep 4: Processing committee members...');
    const zonesMap = new Map();

    rows.forEach((row) => {
      const zoneId = row[0];
      const zoneName = row[1];
      const attendeeName = row[2];
      const role = row[3] || 'Member';

      if (!zoneId || !zoneName) return;

      if (!zonesMap.has(zoneId)) {
        zonesMap.set(zoneId, {
          zoneId,
          zoneName,
          roles: []
        });
      }

      const zone = zonesMap.get(zoneId);

      // Check if Zone Committee Member (both English and Malayalam)
      const zoneLevelRoles = [
        'President', 'പ്രസിഡന്റ്',
        'Secretary', 'സെക്രട്ടറി', 'സെക്രെട്ടറി',
        'Treasurer', 'ട്രെഷറർ',
        'Vice President', 'വൈസ് പ്രസിഡന്റ്',
        'Joint Secretary', 'ജോയിന്റ് സെക്രട്ടറി', 'ജോയിന്റ് സെക്രെട്ടറി',
        'Executive Member', 'എക്സിക്യൂട്ടീവ് മെമ്പർ'
      ];
      
      const isCommitteeRole = attendeeName && zoneLevelRoles.some(r => role.toLowerCase().includes(r.toLowerCase()));

      if (isCommitteeRole) {
        zone.roles.push({ role, name: attendeeName });
      }
    });

    const zones = Array.from(zonesMap.values());
    console.log(`  ✓ Identified ${zones.length} zones with committee members`);

    // Step 5: Update zones with roles
    console.log('\\nStep 5: Updating zones with committee roles...');
    for (const zone of zones) {
      await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: { roles: zone.roles } },
        { upsert: false }
      );
      console.log(`  ✓ ${zone.zoneId}: ${zone.zoneName} - ${zone.roles.length} roles`);
    }

    // Step 6: Create committee member documents
    console.log('\\nStep 6: Creating committee member documents...');
    let committeeCounter = 1;
    let totalCreated = 0;

    for (const zone of zones) {
      for (const roleData of zone.roles) {
        // Determine Role ID
        let roleId = 'CR06'; // Default to Executive Member
        const normalized = roleData.role.toLowerCase().trim();
        
        const matched = COMMITTEE_ROLES_DATA.find(r => {
          const engMatch = r.englishName && normalized.includes(r.englishName.toLowerCase());
          const malMatch = r.name && normalized.includes(r.name);
          return engMatch || malMatch;
        });

        if (matched) {
          roleId = matched.id;
        } else if (normalized.includes('member') || normalized.includes('മെമ്പർ')) {
          roleId = 'CR06';
        } else {
          console.log(`    ! Unknown role: "${roleData.role}" for ${roleData.name} - using default CR06`);
        }

        const committeeId = `C${String(committeeCounter++).padStart(3, '0')}`;
        await Committee.create({
          committeeId,
          name: roleData.name,
          roleId: roleId,
          zoneId: zone.zoneId,
          mobile: '',
          whatsapp: ''
        });
        
        console.log(`  ✓ ${committeeId}: ${roleData.name} - ${roleData.role} -> ${roleId} (${zone.zoneId})`);
        totalCreated++;
      }
    }

    console.log('\\n===========================================');
    console.log('  Re-Migration Complete!');
    console.log(`  Total Committee Members Created: ${totalCreated}`);
    console.log('===========================================\\n');

  } catch (error) {
    console.error('\\nRe-migration failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\\n');

    await reMigrateCommittee();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main();
