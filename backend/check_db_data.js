const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const count = await Meeting.countDocuments();
    console.log(`Total Meetings in DB: ${count}`);

    if (count > 0) {
      const sample = await Meeting.findOne().sort({ createdAt: -1 });
      console.log('Latest Meeting Sample:', JSON.stringify(sample, null, 2));
    }
    
    // Check zones
    const distinctZones = await Meeting.distinct('zoneName');
    console.log('Distinct Zones in Meetings:', distinctZones);

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`Total Users: ${userCount}`);
    if (userCount > 0) {
        const admin = await User.findOne({ roles: 'admin' });
        console.log('Admin user exists:', !!admin);
    }

    // Check if we have dynamic Zones collection (if applicable) or relying on static/other
    // The app seems to rely on 'Unit' or 'Zone' models sometimes?
    // Let's check 'Unit' which usually groups into zones
    try {
        const Unit = require('./models/Unit');
        const unitCount = await Unit.countDocuments();
        console.log(`Total Units: ${unitCount}`);
    } catch (e) { console.log('Unit model check failed', e.message); }


  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
