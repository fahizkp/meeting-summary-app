require('dotenv').config();
const mongoose = require('mongoose');
const Unit = require('./models/Unit');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function checkUnits() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const units = await Unit.find().limit(5);
    console.log(`\nFound ${units.length} units (showing first 5):`);
    
    units.forEach(unit => {
      console.log(`\n${unit.unitId}: ${unit.name} (Zone: ${unit.zoneId})`);
      console.log(`  Members: ${unit.members.length}`);
      unit.members.slice(0, 3).forEach(member => {
        console.log(`    - ${member.name} (${member.role})`);
      });
      if (unit.members.length > 3) {
        console.log(`    ... and ${unit.members.length - 3} more`);
      }
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUnits();
