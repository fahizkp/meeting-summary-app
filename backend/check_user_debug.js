require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Zone = require('./models/Zone');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';
const TARGET_USERNAME = '9496842474';

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: TARGET_USERNAME });
    if (!user) {
      console.log(`User ${TARGET_USERNAME} NOT FOUND.`);
    } else {
      console.log('User Found:', JSON.stringify(user, null, 2));
      
      // Check zoneAccess
      if (user.zoneAccess && user.zoneAccess.length > 0) {
        console.log('User zoneAccess:', user.zoneAccess);
        for (const access of user.zoneAccess) {
             // Try ID first
             let zone = await Zone.findOne({ zoneId: access });
             if (zone) {
                 console.log(`  [ID Match] Found Zone: ${zone.zoneId} - ${zone.name}`);
             } else {
                 // Try Name
                 zone = await Zone.findOne({ name: access });
                 if (zone) {
                     console.log(`  [Name Match] Found Zone: ${zone.zoneId} - ${zone.name}`);
                     console.log(`  >> Fix required: Replace "${access}" with "${zone.zoneId}"`);
                 } else {
                     console.log(`  [No Match] Could not find zone for "${access}"`);
                 }
             }
        }
      } else {
        console.log('User has NO zoneAccess.');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
