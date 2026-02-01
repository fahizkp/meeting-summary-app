/**
 * Data Comparison Script
 * Compares Zone Committee Members between Google Sheets and MongoDB
 * Identifies missing members
 * 
 * Usage: node scripts/compareData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const Committee = require('../models/Committee');

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to load Google Sheets service:', error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function getGoogleSheetsData() {
  console.log('\n--- Fetching Data from Google Sheets ---');
  
  try {
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.sourceSpreadsheetId,
      range: 'ZoneData!A2:E',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows in ZoneData`);

    // Group by zone
    const zonesMap = new Map();

    rows.forEach((row) => {
      const zoneId = row[0];
      const zoneName = row[1];
      const attendeeName = row[2];
      const role = row[3] || 'Member';
      const unit = row[4]?.trim();

      if (!zoneId || !zoneName) return;

      if (!zonesMap.has(zoneId)) {
        zonesMap.set(zoneId, {
          zoneId,
          zoneName,
          committeeMembers: [],
          allMembers: []
        });
      }

      const zone = zonesMap.get(zoneId);
      
      // Add all members
      if (attendeeName) {
        zone.allMembers.push({
          name: attendeeName,
          role: role,
          unit: unit || 'N/A'
        });
      }

      // Check if Zone Committee Member
      const zoneLevelRoles = ['President', 'Secretary', 'Treasurer', 'Vice President', 'Joint Secretary', 'Executive Member'];
      const isCommitteeRole = attendeeName && zoneLevelRoles.some(r => role.toLowerCase().includes(r.toLowerCase()));

      if (isCommitteeRole) {
        zone.committeeMembers.push({
          name: attendeeName,
          role: role
        });
      }
    });

    return zonesMap;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error.message);
    throw error;
  }
}

async function getMongoDBData() {
  console.log('\n--- Fetching Data from MongoDB ---');
  
  try {
    const zones = await Zone.find({}).lean();
    const committees = await Committee.find({}).lean();

    console.log(`Found ${zones.length} zones in MongoDB`);
    console.log(`Found ${committees.length} committee members in MongoDB`);

    // Group committee members by zone
    const zonesMap = new Map();

    zones.forEach(zone => {
      zonesMap.set(zone.zoneId, {
        zoneId: zone.zoneId,
        zoneName: zone.name,
        committeeMembers: [],
        rolesFromZone: zone.roles || []
      });
    });

    committees.forEach(committee => {
      if (zonesMap.has(committee.zoneId)) {
        zonesMap.get(committee.zoneId).committeeMembers.push({
          name: committee.name,
          roleId: committee.roleId,
          committeeId: committee.committeeId
        });
      }
    });

    return zonesMap;
  } catch (error) {
    console.error('Error fetching MongoDB data:', error.message);
    throw error;
  }
}

function compareData(sheetsData, mongoData) {
  console.log('\n===========================================');
  console.log('  Data Comparison Report');
  console.log('===========================================\n');

  let totalMissing = 0;
  let totalExtra = 0;

  // Compare each zone
  for (const [zoneId, sheetsZone] of sheetsData.entries()) {
    const mongoZone = mongoData.get(zoneId);

    console.log(`\n📍 Zone: ${sheetsZone.zoneName} (${zoneId})`);
    console.log('─'.repeat(60));

    if (!mongoZone) {
      console.log('  ❌ ZONE NOT FOUND IN MONGODB!');
      continue;
    }

    // Get committee member names from both sources
    const sheetsMembers = new Set(sheetsZone.committeeMembers.map(m => m.name.toLowerCase().trim()));
    const mongoMembers = new Set(mongoZone.committeeMembers.map(m => m.name.toLowerCase().trim()));

    // Find missing members (in Sheets but not in MongoDB)
    const missing = [];
    sheetsZone.committeeMembers.forEach(member => {
      const normalizedName = member.name.toLowerCase().trim();
      if (!mongoMembers.has(normalizedName)) {
        missing.push(member);
      }
    });

    // Find extra members (in MongoDB but not in Sheets)
    const extra = [];
    mongoZone.committeeMembers.forEach(member => {
      const normalizedName = member.name.toLowerCase().trim();
      if (!sheetsMembers.has(normalizedName)) {
        extra.push(member);
      }
    });

    // Report
    console.log(`  Google Sheets: ${sheetsZone.committeeMembers.length} committee members`);
    console.log(`  MongoDB:       ${mongoZone.committeeMembers.length} committee members`);

    if (missing.length > 0) {
      console.log(`\n  ⚠️  MISSING in MongoDB (${missing.length}):`);
      missing.forEach(m => {
        console.log(`     - ${m.name} (${m.role})`);
      });
      totalMissing += missing.length;
    }

    if (extra.length > 0) {
      console.log(`\n  ℹ️  EXTRA in MongoDB (${extra.length}):`);
      extra.forEach(m => {
        console.log(`     - ${m.name} (${m.roleId})`);
      });
      totalExtra += extra.length;
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log('  ✅ All committee members match!');
    }

    // Show all members from Google Sheets for this zone
    console.log(`\n  📋 All members in Google Sheets (${sheetsZone.allMembers.length}):`);
    sheetsZone.allMembers.forEach((m, idx) => {
      console.log(`     ${idx + 1}. ${m.name} - ${m.role} ${m.unit !== 'N/A' ? `(Unit: ${m.unit})` : ''}`);
    });
  }

  console.log('\n===========================================');
  console.log('  Summary');
  console.log('===========================================');
  console.log(`  Total Missing in MongoDB: ${totalMissing}`);
  console.log(`  Total Extra in MongoDB:   ${totalExtra}`);
  console.log('===========================================\n');
}

async function main() {
  console.log('===========================================');
  console.log('  Data Comparison Tool');
  console.log('  Google Sheets ↔ MongoDB');
  console.log('===========================================');

  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get data from both sources
    const sheetsData = await getGoogleSheetsData();
    const mongoData = await getMongoDBData();

    // Compare
    compareData(sheetsData, mongoData);

  } catch (error) {
    console.error('\nComparison failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main();
