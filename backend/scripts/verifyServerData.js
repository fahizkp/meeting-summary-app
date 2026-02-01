/**
 * Verify Server Data
 * Quick script to verify data after migration
 * 
 * Usage on server:
 *   node scripts/verifyServerData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');
const Agenda = require('../models/Agenda');
const Meeting = require('../models/Meeting');

async function verifyData() {
  console.log('===========================================');
  console.log('  Server Data Verification');
  console.log('===========================================\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not set in .env file!');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected\n');

    console.log('📊 Data Counts:\n');

    // Count all collections
    const districtCount = await District.countDocuments();
    console.log(`   Districts:        ${districtCount}`);

    const zoneCount = await Zone.countDocuments();
    console.log(`   Zones:            ${zoneCount}`);

    const unitCount = await Unit.countDocuments();
    console.log(`   Units:            ${unitCount}`);

    const roleCount = await CommitteeRole.countDocuments();
    console.log(`   Committee Roles:  ${roleCount}`);

    const committeeCount = await Committee.countDocuments();
    console.log(`   Committee Members: ${committeeCount}`);

    const agendaCount = await Agenda.countDocuments();
    console.log(`   Agendas:          ${agendaCount}`);

    const userCount = await User.countDocuments();
    console.log(`   Users:            ${userCount}`);

    const meetingCount = await Meeting.countDocuments();
    console.log(`   Meetings:         ${meetingCount}`);

    console.log('\n📋 Sample Data:\n');

    // Show some zones
    const zones = await Zone.find({}).limit(5).select('zoneId name');
    console.log('   First 5 Zones:');
    zones.forEach(z => console.log(`     • ${z.zoneId}: ${z.name}`));

    // Check for Suhair in Pandikkad
    console.log('\n🔍 Checking for Suhair in Pandikkad:');
    const pandikkad = await Zone.findOne({ name: /പാണ്ടിക്കാട്/i });
    if (pandikkad) {
      const suhair = await Committee.findOne({ 
        zoneId: pandikkad.zoneId,
        name: /സുഹൈർ/i 
      });
      if (suhair) {
        console.log(`   ✅ Found: ${suhair.name} (${suhair.committeeId}) in ${pandikkad.name}`);
      } else {
        console.log(`   ⚠️  Suhair not found in ${pandikkad.name}`);
      }
    } else {
      console.log('   ⚠️  Pandikkad zone not found');
    }

    // Show committee members per zone
    console.log('\n👥 Committee Members by Zone:\n');
    const zonesWithCommittees = await Zone.find({});
    for (const zone of zonesWithCommittees) {
      const count = await Committee.countDocuments({ zoneId: zone.zoneId });
      console.log(`   ${zone.name}: ${count} members`);
    }

    console.log('\n===========================================');
    console.log('  ✅ Verification Complete!');
    console.log('===========================================\n');

    // Expected counts
    console.log('Expected vs Actual:');
    console.log(`   Zones:            Expected: 17,  Actual: ${zoneCount}  ${zoneCount === 17 ? '✅' : '⚠️'}`);
    console.log(`   Committee Members: Expected: 135, Actual: ${committeeCount} ${committeeCount === 135 ? '✅' : '⚠️'}`);
    console.log(`   Committee Roles:  Expected: 6,   Actual: ${roleCount}  ${roleCount === 6 ? '✅' : '⚠️'}`);
    console.log(`   Agendas:          Expected: 7,   Actual: ${agendaCount}  ${agendaCount === 7 ? '✅' : '⚠️'}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

verifyData();
