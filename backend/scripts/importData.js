/**
 * Import Data Script
 * Imports all data from JSON files to server MongoDB
 * 
 * Usage: MONGODB_URI=<server_uri> node scripts/importData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');
const Agenda = require('../models/Agenda');
const Meeting = require('../models/Meeting');

const IMPORT_DIR = path.join(__dirname, 'exported_data');

async function importData() {
  console.log('===========================================');
  console.log('  Importing Data to Server MongoDB');
  console.log('===========================================\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable not set!');
    console.error('Usage: MONGODB_URI=<server_uri> node scripts/importData.js');
    process.exit(1);
  }

  console.log(`Target MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  try {
    // Check if export directory exists
    if (!fs.existsSync(IMPORT_DIR)) {
      console.error(`ERROR: Export directory not found: ${IMPORT_DIR}`);
      console.error('Please run exportData.js first!');
      process.exit(1);
    }

    // Connect to server MongoDB
    console.log('Connecting to server MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to server MongoDB\n');

    // Import Districts
    console.log('Importing Districts...');
    const districtsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'districts.json'), 'utf8'));
    for (const district of districtsData) {
      delete district._id;
      delete district.__v;
      await District.findOneAndUpdate(
        { districtId: district.districtId },
        { $set: district },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${districtsData.length} districts`);

    // Import Committee Roles
    console.log('Importing Committee Roles...');
    const rolesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'committeeRoles.json'), 'utf8'));
    for (const role of rolesData) {
      delete role._id;
      delete role.__v;
      await CommitteeRole.findOneAndUpdate(
        { roleId: role.roleId },
        { $set: role },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${rolesData.length} committee roles`);

    // Import Zones
    console.log('Importing Zones...');
    const zonesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'zones.json'), 'utf8'));
    for (const zone of zonesData) {
      delete zone._id;
      delete zone.__v;
      await Zone.findOneAndUpdate(
        { zoneId: zone.zoneId },
        { $set: zone },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${zonesData.length} zones`);

    // Import Units
    console.log('Importing Units...');
    const unitsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'units.json'), 'utf8'));
    for (const unit of unitsData) {
      delete unit._id;
      delete unit.__v;
      await Unit.findOneAndUpdate(
        { unitId: unit.unitId },
        { $set: unit },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${unitsData.length} units`);

    // Import Committee Members
    console.log('Importing Committee Members...');
    const committeesData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'committees.json'), 'utf8'));
    for (const committee of committeesData) {
      delete committee._id;
      delete committee.__v;
      await Committee.findOneAndUpdate(
        { committeeId: committee.committeeId },
        { $set: committee },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${committeesData.length} committee members`);

    // Import Agendas
    console.log('Importing Agendas...');
    const agendasData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'agendas.json'), 'utf8'));
    for (const agenda of agendasData) {
      delete agenda._id;
      delete agenda.__v;
      await Agenda.findOneAndUpdate(
        { agendaId: agenda.agendaId },
        { $set: agenda },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${agendasData.length} agendas`);

    // Import Users (Note: passwords were excluded during export)
    console.log('Importing Users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'users.json'), 'utf8'));
    console.log('  ⚠️  WARNING: User passwords were not exported for security.');
    console.log('  ⚠️  You will need to reset passwords for all users!');
    for (const user of usersData) {
      delete user._id;
      delete user.__v;
      // Set a default password that must be changed
      user.password = 'ChangeMe123!';
      await User.findOneAndUpdate(
        { username: user.username },
        { $set: user },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${usersData.length} users (with default password: ChangeMe123!)`);

    // Import Meetings
    console.log('Importing Meetings...');
    const meetingsData = JSON.parse(fs.readFileSync(path.join(IMPORT_DIR, 'meetings.json'), 'utf8'));
    for (const meeting of meetingsData) {
      delete meeting._id;
      delete meeting.__v;
      await Meeting.findOneAndUpdate(
        { meetingId: meeting.meetingId },
        { $set: meeting },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Imported ${meetingsData.length} meetings`);

    console.log('\n===========================================');
    console.log('  Import Complete!');
    console.log('===========================================');
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('  1. All users have default password: ChangeMe123!');
    console.log('  2. Users must change their passwords on first login');
    console.log('  3. Consider running a password reset for all users\n');

  } catch (error) {
    console.error('\nImport failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

importData();
