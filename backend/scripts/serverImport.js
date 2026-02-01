/**
 * Server Data Migration Script
 * Run this script on the server to import data from exported JSON files
 * 
 * Prerequisites:
 * 1. Upload the 'exported_data' folder to backend/scripts/ on the server
 * 2. Ensure .env file is configured with server MONGODB_URI
 * 
 * Usage on server:
 *   cd /srv/apps/meeting-summary/backend
 *   node scripts/serverImport.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');
const Agenda = require('../models/Agenda');
const Meeting = require('../models/Meeting');

const IMPORT_DIR = path.join(__dirname, 'exported_data');

// Function to ask for confirmation
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function importData() {
  console.log('===========================================');
  console.log('  Server Data Migration');
  console.log('  Meeting Summary App');
  console.log('===========================================\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI environment variable not set!');
    console.error('Please check your .env file.');
    process.exit(1);
  }

  // Mask password in URI for display
  const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`Target MongoDB: ${maskedUri}\n`);

  try {
    // Check if export directory exists
    if (!fs.existsSync(IMPORT_DIR)) {
      console.error(`❌ ERROR: Export directory not found: ${IMPORT_DIR}`);
      console.error('Please upload the exported_data folder to backend/scripts/');
      process.exit(1);
    }

    // List files in export directory
    const files = fs.readdirSync(IMPORT_DIR);
    console.log('✓ Found exported_data directory');
    console.log(`  Files: ${files.join(', ')}\n`);

    // Ask for confirmation
    const answer = await askQuestion('⚠️  This will import/update data in the server database. Continue? (yes/no): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('\nMigration cancelled.');
      process.exit(0);
    }

    console.log('');

    // Connect to server MongoDB
    console.log('Connecting to server MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to server MongoDB\n');

    let stats = {
      districts: 0,
      zones: 0,
      units: 0,
      committeeRoles: 0,
      committees: 0,
      agendas: 0,
      users: 0,
      meetings: 0
    };

    // Import Districts
    console.log('📦 Importing Districts...');
    const districtsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'districts.json'), 'utf8'));
    for (const district of districtsData) {
      delete district._id;
      delete district.__v;
      await District.findOneAndUpdate(
        { districtId: district.districtId },
        { $set: district },
        { upsert: true, new: true }
      );
      stats.districts++;
    }
    console.log(`   ✓ Imported ${stats.districts} districts\n`);

    // Import Committee Roles
    console.log('📦 Importing Committee Roles...');
    const rolesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'committeeRoles.json'), 'utf8'));
    for (const role of rolesData) {
      delete role._id;
      delete role.__v;
      await CommitteeRole.findOneAndUpdate(
        { roleId: role.roleId },
        { $set: role },
        { upsert: true, new: true }
      );
      stats.committeeRoles++;
    }
    console.log(`   ✓ Imported ${stats.committeeRoles} committee roles\n`);

    // Import Zones
    console.log('📦 Importing Zones...');
    const zonesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'zones.json'), 'utf8'));
    for (const zone of zonesData) {
      delete zone._id;
      delete zone.__v;
      await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: zone },
        { upsert: true, new: true }
      );
      stats.zones++;
    }
    console.log(`   ✓ Imported ${stats.zones} zones\n`);

    // Import Units
    console.log('📦 Importing Units...');
    const unitsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'units.json'), 'utf8'));
    for (const unit of unitsData) {
      delete unit._id;
      delete unit.__v;
      await Unit.findOneAndUpdate(
        { unitId: unit.unitId },
        { $set: unit },
        { upsert: true, new: true }
      );
      stats.units++;
    }
    console.log(`   ✓ Imported ${stats.units} units\n`);

    // Import Committee Members
    console.log('📦 Importing Committee Members...');
    const committeesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'committees.json'), 'utf8'));
    for (const committee of committeesData) {
      delete committee._id;
      delete committee.__v;
      await Committee.findOneAndUpdate(
        { committeeId: committee.committeeId },
        { $set: committee },
        { upsert: true, new: true }
      );
      stats.committees++;
    }
    console.log(`   ✓ Imported ${stats.committees} committee members\n`);

    // Import Agendas
    console.log('📦 Importing Agendas...');
    const agendasData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'agendas.json'), 'utf8'));
    for (const agenda of agendasData) {
      delete agenda._id;
      delete agenda.__v;
      await Agenda.findOneAndUpdate(
        { agendaId: agenda.agendaId },
        { $set: agenda },
        { upsert: true, new: true }
      );
      stats.agendas++;
    }
    console.log(`   ✓ Imported ${stats.agendas} agendas\n`);

    // Import Users
    console.log('📦 Importing Users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'users.json'), 'utf8'));
    console.log('   ⚠️  Note: User passwords were not exported for security.');
    console.log('   ⚠️  Setting default password: ChangeMe123!\n');
    for (const user of usersData) {
      delete user._id;
      delete user.__v;
      // Only set default password if user doesn't exist
      const existingUser = await User.findOne({ username: user.username });
      if (!existingUser) {
        user.password = 'ChangeMe123!';
      } else {
        delete user.password; // Keep existing password
      }
      await User.findOneAndUpdate(
        { username: user.username },
        { $set: user },
        { upsert: true, new: true }
      );
      stats.users++;
    }
    console.log(`   ✓ Imported ${stats.users} users\n`);

    // Import Meetings
    console.log('📦 Importing Meetings...');
    const meetingsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'meetings.json'), 'utf8'));
    for (const meeting of meetingsData) {
      delete meeting._id;
      delete meeting.__v;
      await Meeting.findOneAndUpdate(
        { meetingId: meeting.meetingId },
        { $set: meeting },
        { upsert: true, new: true }
      );
      stats.meetings++;
    }
    console.log(`   ✓ Imported ${stats.meetings} meetings\n`);

    console.log('===========================================');
    console.log('  ✅ Migration Complete!');
    console.log('===========================================');
    console.log('\n📊 Summary:');
    console.log(`   • Districts:        ${stats.districts}`);
    console.log(`   • Zones:            ${stats.zones}`);
    console.log(`   • Units:            ${stats.units}`);
    console.log(`   • Committee Roles:  ${stats.committeeRoles}`);
    console.log(`   • Committee Members: ${stats.committees}`);
    console.log(`   • Agendas:          ${stats.agendas}`);
    console.log(`   • Users:            ${stats.users}`);
    console.log(`   • Meetings:         ${stats.meetings}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('   • New users have default password: ChangeMe123!');
    console.log('   • Existing user passwords were preserved');
    console.log('   • Users should change passwords on first login\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import
importData();
