const mongoose = require('mongoose');
const Zone = require('./models/Zone');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function checkZones() {
    try {
        await mongoose.connect(MONGODB_URI);
        const zones = await Zone.find({});
        console.log('Zones in DB:');
        zones.forEach(z => console.log(`${z.zoneId}: ${z.name}`));
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkZones();
