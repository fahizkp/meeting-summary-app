/**
 * Export Data Script
 * Exports all data from local MongoDB to JSON files
 * 
 * Usage: node scripts/exportData.js
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

const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';
const EXPORT_DIR = path.join(__dirname, 'exported_data');

async function exportData() {
  console.log('===========================================');
  console.log('  Exporting Data from Local MongoDB');
  console.log('===========================================\n');

  try {
    // Create export directory
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    // Connect to local MongoDB
    console.log('Connecting to local MongoDB...');
    await mongoose.connect(LOCAL_MONGODB_URI);
    console.log('✓ Connected to local MongoDB\n');

    // Export Districts
    console.log('Exporting Districts...');
    const districts = await District.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'districts.json'),
      JSON.stringify(districts, null, 2)
    );
    console.log(`  ✓ Exported ${districts.length} districts`);

    // Export Zones
    console.log('Exporting Zones...');
    const zones = await Zone.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'zones.json'),
      JSON.stringify(zones, null, 2)
    );
    console.log(`  ✓ Exported ${zones.length} zones`);

    // Export Units
    console.log('Exporting Units...');
    const units = await Unit.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'units.json'),
      JSON.stringify(units, null, 2)
    );
    console.log(`  ✓ Exported ${units.length} units`);

    // Export Committee Roles
    console.log('Exporting Committee Roles...');
    const committeeRoles = await CommitteeRole.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'committeeRoles.json'),
      JSON.stringify(committeeRoles, null, 2)
    );
    console.log(`  ✓ Exported ${committeeRoles.length} committee roles`);

    // Export Committee Members
    console.log('Exporting Committee Members...');
    const committees = await Committee.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'committees.json'),
      JSON.stringify(committees, null, 2)
    );
    console.log(`  ✓ Exported ${committees.length} committee members`);

    // Export Agendas
    console.log('Exporting Agendas...');
    const agendas = await Agenda.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'agendas.json'),
      JSON.stringify(agendas, null, 2)
    );
    console.log(`  ✓ Exported ${agendas.length} agendas`);

    // Export Users (excluding passwords for security)
    console.log('Exporting Users...');
    const users = await User.find({}).select('-password').lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`  ✓ Exported ${users.length} users (passwords excluded)`);

    // Export Meetings
    console.log('Exporting Meetings...');
    const meetings = await Meeting.find({}).lean();
    fs.writeFileSync(
      path.join(EXPORT_DIR, 'meetings.json'),
      JSON.stringify(meetings, null, 2)
    );
    console.log(`  ✓ Exported ${meetings.length} meetings`);

    console.log('\n===========================================');
    console.log('  Export Complete!');
    console.log(`  Data exported to: ${EXPORT_DIR}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('\nExport failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

exportData();
