require('dotenv').config();
const mongoose = require('mongoose');
const Committee = require('./models/Committee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function checkCommittee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const committee = await Committee.find().limit(10);
    console.log(`Found ${committee.length} committee members (showing first 10):\n`);
    
    committee.forEach(member => {
      console.log(`${member.committeeId}: ${member.name}`);
      console.log(`  Role: ${member.role}`);
      console.log(`  Zone: ${member.zoneId}`);
      console.log(`  Mobile: ${member.mobile || '(not set)'}`);
      console.log(`  WhatsApp: ${member.whatsapp || '(not set)'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCommittee();
