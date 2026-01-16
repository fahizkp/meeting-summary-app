const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('Total Users:', users.length);
    
    users.forEach((u, index) => {
      console.log(`User ${index + 1}: ${u.username} (Roles: ${u.roles})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
