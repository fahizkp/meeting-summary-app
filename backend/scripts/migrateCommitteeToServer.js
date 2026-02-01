/**
 * Committee Data Migration Script for Server
 * This script migrates committee member data from Google Sheets to MongoDB
 * Run this directly on the server to populate the committee table
 * 
 * Usage on server:
 *   cd /srv/apps/meeting-summary/backend
 *   node scripts/migrateCommitteeToServer.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to load Google Sheets service:', error.message);
  console.error('Make sure Google Sheets credentials are configured on the server.');
  process.exit(1);
}

const COMMITTEE_ROLES_DATA = [
  { id: 'CR01', name: 'പ്രസിഡന്റ്', englishName: 'President' },
  { id: 'CR02', name: 'വൈസ് പ്രസിഡന്റ്', englishName: 'Vice President' },
  { id: 'CR03', name: 'സെക്രെട്ടറി', englishName: 'Secretary' },
  { id: 'CR04', name: 'ജോയിന്റ് സെക്രട്ടറി', englishName: 'Joint Secretary' },
  { id: 'CR05', name: 'ട്രെഷറർ', englishName: 'Treasurer' },
  { id: 'CR06', name: 'എക്സിക്യൂട്ടീവ് മെമ്പർ', englishName: 'Executive Member' },
];

async function migrateCommitteeData() {
  console.log('===========================================');
  console.log('  Committee Data Migration to Server');
  console.log('  From Google Sheets → MongoDB');
  console.log('===========================================\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not set in .env file!');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Step 1: Ensure Committee Roles exist
    console.log('Step 1: Setting up Committee Roles...');
    for (const roleData of COMMITTEE_ROLES_DATA) {
      await CommitteeRole.findOneAndUpdate(
        { roleId: roleData.id },
        { $set: roleData },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Configured ${COMMITTEE_ROLES_DATA.length} committee roles\n`);

    // Step 2: Fetch data from Google Sheets
    console.log('Step 2: Fetching data from Google Sheets...');
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.sourceSpreadsheetId,
      range: 'ZoneData!A2:E',
    });

    const rows = response.data.values || [];
    console.log(`  ✓ Found ${rows.length} rows in ZoneData\n`);

    // Step 3: Process and identify committee members
    console.log('Step 3: Processing committee members...');
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
    console.log(`  ✓ Identified ${zones.length} zones with committee members\n`);

    // Step 4: Update zones with roles
    console.log('Step 4: Updating zones with committee roles...');
    for (const zone of zones) {
      await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: { roles: zone.roles } },
        { upsert: false }
      );
      console.log(`  ✓ ${zone.zoneId}: ${zone.zoneName} - ${zone.roles.length} roles`);
    }
    console.log('');

    // Step 5: Clear existing committee members (optional - comment out if you want to keep existing)
    console.log('Step 5: Clearing existing committee members...');
    const deleteResult = await Committee.deleteMany({});
    console.log(`  ✓ Cleared ${deleteResult.deletedCount} existing committee members\n`);

    // Step 6: Create committee member documents
    console.log('Step 6: Creating committee member documents...');
    let committeeCounter = 1;
    let totalCreated = 0;
    const createdMembers = [];

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
        }

        const committeeId = `C${String(committeeCounter++).padStart(3, '0')}`;
        const member = await Committee.create({
          committeeId,
          name: roleData.name,
          roleId: roleId,
          zoneId: zone.zoneId,
          mobile: '',
          whatsapp: ''
        });
        
        createdMembers.push({
          id: committeeId,
          name: roleData.name,
          role: roleData.role,
          roleId: roleId,
          zone: zone.zoneName
        });
        
        totalCreated++;
      }
    }
    console.log(`  ✓ Created ${totalCreated} committee members\n`);

    // Step 7: Show summary by zone
    console.log('Step 7: Summary by Zone:\n');
    for (const zone of zones) {
      const members = createdMembers.filter(m => m.zone === zone.zoneName);
      console.log(`  📍 ${zone.zoneName} (${zone.zoneId}): ${members.length} members`);
      members.forEach(m => {
        const roleName = COMMITTEE_ROLES_DATA.find(r => r.id === m.roleId)?.name || m.roleId;
        console.log(`     • ${m.name} - ${roleName}`);
      });
      console.log('');
    }

    // Step 8: Verify specific members
    console.log('Step 8: Verifying key members...\n');
    
    // Check for Suhair in Pandikkad
    const suhair = createdMembers.find(m => 
      m.name.includes('സുഹൈർ') && m.zone.includes('പാണ്ടിക്കാട്')
    );
    if (suhair) {
      console.log(`  ✅ Suhair found in Pandikkad:`);
      console.log(`     ID: ${suhair.id}`);
      console.log(`     Name: ${suhair.name}`);
      console.log(`     Role: ${suhair.role}`);
      console.log(`     Zone: ${suhair.zone}\n`);
    } else {
      console.log(`  ⚠️  Suhair not found in Pandikkad\n`);
    }

    console.log('===========================================');
    console.log('  ✅ Migration Complete!');
    console.log('===========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   • Total Zones:            ${zones.length}`);
    console.log(`   • Total Committee Members: ${totalCreated}`);
    console.log(`   • Committee Roles:        ${COMMITTEE_ROLES_DATA.length}`);
    
    // Count by role
    console.log(`\n📋 Members by Role:`);
    COMMITTEE_ROLES_DATA.forEach(role => {
      const count = createdMembers.filter(m => m.roleId === role.id).length;
      console.log(`   • ${role.name}: ${count}`);
    });
    
    console.log('\n===========================================\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateCommitteeData();
