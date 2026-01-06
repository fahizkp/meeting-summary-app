const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const User = require('../models/User');

async function verify() {
  await mongoose.connect('mongodb://localhost:27017/meeting_app');
  
  const zones = await Zone.find();
  const users = await User.find();
  
  console.log('\n=== MongoDB Data ===');
  console.log(`\nZones: ${zones.length}`);
  zones.forEach(z => {
    console.log(`  - ${z.zoneId}: ${z.name} (${z.roles.length} roles)`);
  });
  
  console.log(`\nUsers: ${users.length}`);
  users.forEach(u => {
    console.log(`  - ${u.username} [${u.roles.join(', ')}]`);
  });
  
  await mongoose.connection.close();
}

verify();
