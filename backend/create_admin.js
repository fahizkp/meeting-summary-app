const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const admin = new User({
      username: 'admin',
      password: 'password',
      roles: ['admin']
    });

    await admin.save();
    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
