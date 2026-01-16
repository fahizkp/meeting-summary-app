/**
 * Create Anti-Gravity User Script
 * 
 * This script creates a super user with COMPLETE UNRESTRICTED ACCESS to all features.
 * Anti-Gravity users can:
 * - Access ALL zones in ALL districts
 * - Create, edit, delete ANY meeting
 * - Access ALL admin functions
 * - View ALL dashboard data
 * - See ALL tabs in navigation
 * 
 * Usage: node scripts/createAntiGravityUser.js
 * 
 * SECURITY WARNING: Grant Anti-Gravity access only to 1-3 trusted administrators!
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

// Configuration - Change these values before running!
const ANTI_GRAVITY_CONFIG = {
  username: 'antigravity',
  password: 'AntiGravity@2026!', // Change this to a strong password!
};

async function createAntiGravityUser() {
  try {
    console.log('🚀 Anti-Gravity User Creation Script');
    console.log('=====================================\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      username: ANTI_GRAVITY_CONFIG.username.toLowerCase() 
    });

    if (existingUser) {
      if (existingUser.isAntiGravity) {
        console.log('⚡ Anti-Gravity user already exists!');
        console.log(`   Username: ${existingUser.username}`);
        console.log(`   Roles: ${existingUser.roles.join(', ')}`);
        console.log(`   isAntiGravity: ${existingUser.isAntiGravity}`);
        console.log('\n✓ No changes made.');
      } else {
        // Upgrade existing user to Anti-Gravity
        console.log(`⚡ Upgrading existing user "${existingUser.username}" to Anti-Gravity...`);
        
        existingUser.roles = ['admin', 'district_admin', 'zone_admin'];
        existingUser.zoneAccess = ['ALL'];
        existingUser.districtAccess = ['ALL'];
        existingUser.isAntiGravity = true;
        
        await existingUser.save();
        
        console.log('\n✓ User upgraded to Anti-Gravity successfully!');
        console.log(`   Username: ${existingUser.username}`);
        console.log(`   Roles: ${existingUser.roles.join(', ')}`);
        console.log(`   Zone Access: ALL`);
        console.log(`   District Access: ALL`);
        console.log(`   isAntiGravity: true`);
      }
    } else {
      // Create new Anti-Gravity user
      console.log('⚡ Creating new Anti-Gravity user...');
      
      const antiGravityUser = new User({
        username: ANTI_GRAVITY_CONFIG.username.toLowerCase(),
        password: ANTI_GRAVITY_CONFIG.password,
        roles: ['admin', 'district_admin', 'zone_admin'],
        zoneAccess: ['ALL'],
        districtAccess: ['ALL'],
        isAntiGravity: true,
      });

      await antiGravityUser.save();

      console.log('\n✓ Anti-Gravity user created successfully!');
      console.log(`   Username: ${antiGravityUser.username}`);
      console.log(`   Password: ${ANTI_GRAVITY_CONFIG.password}`);
      console.log(`   Roles: ${antiGravityUser.roles.join(', ')}`);
      console.log(`   Zone Access: ALL`);
      console.log(`   District Access: ALL`);
      console.log(`   isAntiGravity: true`);
    }

    console.log('\n=====================================');
    console.log('⚡ ANTI-GRAVITY ACCESS GRANTED!');
    console.log('\nThis user now has COMPLETE UNRESTRICTED ACCESS to:');
    console.log('  ✓ All zones in all districts');
    console.log('  ✓ All meetings (create, edit, delete)');
    console.log('  ✓ All admin functions');
    console.log('  ✓ All dashboard data');
    console.log('  ✓ All tabs in navigation');
    console.log('\n⚠️  SECURITY REMINDER: Grant Anti-Gravity access only to trusted administrators!');

  } catch (error) {
    console.error('\n❌ Error creating Anti-Gravity user:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the script
createAntiGravityUser();
