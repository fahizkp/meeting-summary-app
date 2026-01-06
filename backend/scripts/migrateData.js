/**
 * Data Migration Script
 * Imports Zones and Users from Google Sheets to MongoDB
 * 
 * Usage: node scripts/migrateData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');

const COMMITTEE_ROLES_DATA = [
  { id: 'CR01', name: 'പ്രസിഡന്റ്', englishName: 'President' },
  { id: 'CR02', name: 'വൈസ് പ്രസിഡന്റ്', englishName: 'Vice President' },
  { id: 'CR03', name: 'സെക്രെട്ടറി', englishName: 'Secretary' },
  { id: 'CR04', name: 'ജോയിന്റ് സെക്രട്ടറി', englishName: 'Joint Secretary' },
  { id: 'CR05', name: 'ട്രെഷറർ', englishName: 'Treasurer' },
  { id: 'CR06', name: 'എക്സിക്യൂട്ടീവ് മെമ്പർ', englishName: 'Executive Member' },
];

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to load Google Sheets service:', error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function migrateZones() {
  console.log('\n--- Migrating Zones ---');
  
  try {
    // Seed Committee Roles
    console.log('\n--- Seeding Committee Roles ---');
    for (const roleData of COMMITTEE_ROLES_DATA) {
      await CommitteeRole.findOneAndUpdate(
        { roleId: roleData.id },
        { $set: roleData },
        { upsert: true, new: true }
      );
    }

    // Get zone data from Google Sheets
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.sourceSpreadsheetId,
      range: 'ZoneData!A2:E',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows in ZoneData`);

    // Group by zoneId
    const zonesMap = new Map();
    const unitsMap = new Map(); // Map to store unit members

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
          name: zoneName,
          districtId: 'D001', // Default district
          roles: [],
          units: new Set(),
        });
      }

      const zone = zonesMap.get(zoneId);

      // Check if Zone Committee Member (Whitelist based)
      // Roles: President, Secretary, Treasurer, Vice President, Joint Secretary, Executive Member
      const zoneLevelRoles = ['President', 'Secretary', 'Treasurer', 'Vice President', 'Joint Secretary', 'Executive Member'];
      // Also check Malayalam names from constants if needed, but English usually suffices or mapped row[3] is English?
      // Assuming English roles in Column D based on previous steps.
      const isCommitteeRole = attendeeName && zoneLevelRoles.some(r => role.toLowerCase().includes(r.toLowerCase()));

      if (isCommitteeRole) {
        zone.roles.push({ role, name: attendeeName });
      }

      // Add to Unit (if unit column present)
      if (unit) {
        zone.units.add(unit);
        
        // Store unit member
        const unitKey = `${zoneId}_${unit}`;
        if (!unitsMap.has(unitKey)) {
          unitsMap.set(unitKey, {
            zoneId,
            unitName: unit,
            members: []
          });
        }
        
        if (attendeeName) {
          unitsMap.get(unitKey).members.push({
            name: attendeeName,
            role: role
          });
        }
      }
    });

    // Convert to array and save zones
    const zones = Array.from(zonesMap.values()).map(z => ({
      ...z,
      units: Array.from(z.units),
    }));

    console.log(`Migrating ${zones.length} zones...`);

    for (const zone of zones) {
      await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: { name: zone.name, districtId: zone.districtId, roles: zone.roles } },
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${zone.zoneId}: ${zone.name} (${zone.roles.length} roles)`);
    }

    // Migrate units with members
    console.log('\n--- Migrating Units ---');
    let unitCounter = 1;
    for (const [unitKey, unitData] of unitsMap.entries()) {
      const unitId = `U${String(unitCounter++).padStart(3, '0')}`;
      await Unit.findOneAndUpdate(
        { unitId },
        { $set: { name: unitData.unitName, zoneId: unitData.zoneId, members: unitData.members } },
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${unitId}: ${unitData.unitName} (in ${unitData.zoneId}) - ${unitData.members.length} members`);
    }

    // Migrate committee members (secretariat)
    console.log('\n--- Migrating Committee Members ---');
    let committeeCounter = 1;
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
        } else if (normalized.includes('member')) {
          roleId = 'CR06';
        } else {
             // Log unknown roles for debugging
             console.log(`    ! Unknown role: "${roleData.role}" using default CR06`);
        }

        const committeeId = `C${String(committeeCounter++).padStart(3, '0')}`;
        await Committee.findOneAndUpdate(
          { committeeId },
          { 
            $set: { 
              name: roleData.name, 
              roleId: roleId,
              zoneId: zone.zoneId,
              mobile: '', // To be filled later
              whatsapp: '' // To be filled later
            },
            $unset: { role: "" }
          },
          { upsert: true, new: true }
        );
        console.log(`  ✓ ${committeeId}: ${roleData.name} - ${roleData.role} -> ${roleId} (${zone.zoneId})`);
      }
    }

    return zones.length;
  } catch (error) {
    console.error('Error migrating zones:', error.message);
    throw error;
  }
}

async function migrateUsers() {
  console.log('\n--- Migrating Users ---');

  try {
    // Build Zone Map for Name -> ID resolution
    const allZones = await Zone.find({});
    const zoneResolver = new Map();
    allZones.forEach(z => {
      zoneResolver.set(z.zoneId, z.zoneId);
      zoneResolver.set(z.name, z.zoneId);
      zoneResolver.set(z.name.toLowerCase(), z.zoneId);
    });
    // Get user data from Google Sheets
    const response = await googleSheetsService.sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetsService.sourceSpreadsheetId,
      range: 'Users!A2:E',
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} users`);

    let migratedCount = 0;

    for (const row of rows) {
      const username = row[0]?.trim();
      const password = row[1] || '';
      const rolesStr = row[2] || '';
      const zoneAccessStr = row[3] || '';

      if (!username) continue;

      // Parse roles
      const roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean);
      
      // Parse zone access
      const rawAccess = zoneAccessStr.split(',').map(z => z.trim()).filter(Boolean);
      const zoneAccess = [];
      for (const item of rawAccess) {
        const resolved = zoneResolver.get(item) || zoneResolver.get(item.toLowerCase());
        if (resolved) {
          zoneAccess.push(resolved);
        } else {
          console.warn(`    ! Warning: Unknown zone access "${item}" for user ${username}`);
        }
      }

      await User.findOneAndUpdate(
        { username: username.toLowerCase() },
        { 
          $set: { 
            username: username.toLowerCase(),
            password,
            roles,
            zoneAccess,
            districtAccess: ['D001']
          } 
        },
        { upsert: true, new: true }
      );

      console.log(`  ✓ ${username} (${roles.join(', ')})`);
      migratedCount++;
    }

    return migratedCount;
  } catch (error) {
    console.error('Error migrating users:', error.message);
    throw error;
  }
}

async function createDefaultDistrict() {
  console.log('\n--- Creating Default District ---');

  try {
    const existing = await District.findOne({ districtId: 'D001' });
    if (existing) {
      console.log('  Default district already exists');
      return;
    }

    await District.create({
      districtId: 'D001',
      name: 'Default District',
    });
    console.log('  ✓ Created default district (D001)');
  } catch (error) {
    console.error('Error creating district:', error.message);
    throw error;
  }
}

async function main() {
  console.log('===========================================');
  console.log('  Data Migration: Google Sheets → MongoDB');
  console.log('===========================================');

  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    console.log('URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Create default district
    await createDefaultDistrict();

    // Migrate zones
    const zoneCount = await migrateZones();

    // Migrate users
    const userCount = await migrateUsers();

    console.log('\n===========================================');
    console.log('  Migration Complete!');
    console.log(`  - Zones: ${zoneCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('\nMigration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main();
