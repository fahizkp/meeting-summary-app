require('dotenv').config();
const mongoose = require('mongoose');
const Committee = require('./models/Committee');
const CommitteeRole = require('./models/CommitteeRole');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';
const TARGET_ZONE_ID = '7';

async function checkCommittee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const members = await Committee.find({ zoneId: TARGET_ZONE_ID });
    console.log(`Found ${members.length} members for Zone ${TARGET_ZONE_ID}`);

    for (const member of members) {
      console.log(`- Name: ${member.name}`);
      console.log(`  RoleID: ${member.roleId}`);
      // Find role name
      const role = await CommitteeRole.findOne({ roleId: member.roleId });
      console.log(`  RoleName: ${role ? role.name : 'UNKNOWN'}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCommittee();
