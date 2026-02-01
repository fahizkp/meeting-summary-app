/**
 * QHLS Data Migration Script
 * Imports all meeting data (including QHLS) from Google Sheets to MongoDB
 * 
 * Usage: node scripts/migrateMeetings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.error('Failed to load Google Sheets service:', error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

async function migrateMeetings() {
  console.log('\n--- Migrating Meetings with QHLS Data ---');
  
  try {
    // Get all meetings from Google Sheets
    console.log('Fetching all meetings from Google Sheets...');
    const sheetsMeetings = await googleSheetsService.getAllMeetings();
    console.log(`Found ${sheetsMeetings.length} meetings in Google Sheets`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const sheetMeeting of sheetsMeetings) {
      try {
        // Check if meeting already exists in MongoDB
        const existing = await Meeting.findOne({ meetingId: sheetMeeting.meetingId });
        
        if (existing) {
          console.log(`  ⊘ Skipping ${sheetMeeting.meetingId} (already exists)`);
          skippedCount++;
          continue;
        }

        // Get full meeting details
        const fullMeeting = await googleSheetsService.getMeetingById(sheetMeeting.meetingId);
        
        if (!fullMeeting) {
          console.log(`  ✗ Could not fetch details for ${sheetMeeting.meetingId}`);
          errorCount++;
          continue;
        }

        // Determine zoneId from zoneName (you may need to adjust this based on your data)
        // For now, we'll extract it from the meeting data or use a default
        let zoneId = '';
        
        // Try to find zone ID from zone name
        // This is a simple approach - you might need to query the Zone collection
        // to get the actual zoneId
        const zoneName = fullMeeting.zoneName || '';
        
        // Simple zone ID extraction (adjust based on your naming convention)
        // Example: if zoneName is "Manaloor Zone", we might extract "Z001" or similar
        // For now, we'll use a placeholder approach
        zoneId = zoneName.replace(/\s+/g, '_').toUpperCase();

        // Create meeting document
        const meetingDoc = {
          meetingId: fullMeeting.meetingId,
          zoneId: zoneId,
          zoneName: fullMeeting.zoneName,
          date: fullMeeting.date,
          startTime: fullMeeting.startTime || '',
          endTime: fullMeeting.endTime || '',
          agendas: fullMeeting.agendas || [],
          minutes: fullMeeting.minutes || [],
          attendance: fullMeeting.attendance || [],
          qhls: fullMeeting.qhls || [],
          swagatham: fullMeeting.swagatham || '',
          adhyakshan: fullMeeting.adhyakshan || '',
          nandhi: fullMeeting.nandhi || '',
          sheetName: sheetMeeting.sheetName || '',
        };

        // Save to MongoDB
        await Meeting.create(meetingDoc);
        
        console.log(`  ✓ Migrated ${fullMeeting.meetingId} - ${fullMeeting.zoneName} (${fullMeeting.date})`);
        if (meetingDoc.qhls && meetingDoc.qhls.length > 0) {
          console.log(`    └─ QHLS: ${meetingDoc.qhls.length} units`);
        }
        
        migratedCount++;
      } catch (error) {
        console.error(`  ✗ Error migrating ${sheetMeeting.meetingId}:`, error.message);
        errorCount++;
      }
    }

    return { migratedCount, skippedCount, errorCount };
  } catch (error) {
    console.error('Error migrating meetings:', error.message);
    throw error;
  }
}

async function updateZoneIds() {
  console.log('\n--- Updating Zone IDs ---');
  
  try {
    const Zone = require('../models/Zone');
    
    // Get all zones from MongoDB
    const zones = await Zone.find({});
    const zoneMap = new Map();
    
    zones.forEach(zone => {
      zoneMap.set(zone.name, zone.zoneId);
      zoneMap.set(zone.name.toLowerCase(), zone.zoneId);
    });

    // Update all meetings with correct zoneId
    const meetings = await Meeting.find({});
    let updatedCount = 0;

    for (const meeting of meetings) {
      const zoneName = meeting.zoneName;
      const correctZoneId = zoneMap.get(zoneName) || zoneMap.get(zoneName.toLowerCase());
      
      if (correctZoneId && correctZoneId !== meeting.zoneId) {
        await Meeting.updateOne(
          { meetingId: meeting.meetingId },
          { $set: { zoneId: correctZoneId } }
        );
        console.log(`  ✓ Updated ${meeting.meetingId}: ${meeting.zoneId} → ${correctZoneId}`);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} meeting zone IDs`);
    return updatedCount;
  } catch (error) {
    console.error('Error updating zone IDs:', error.message);
    throw error;
  }
}

async function main() {
  console.log('===========================================');
  console.log('  Meeting Data Migration: Sheets → MongoDB');
  console.log('===========================================');

  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    console.log('URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Migrate meetings
    const { migratedCount, skippedCount, errorCount } = await migrateMeetings();

    // Update zone IDs to match Zone collection
    const zoneUpdates = await updateZoneIds();

    console.log('\n===========================================');
    console.log('  Migration Complete!');
    console.log(`  - Migrated: ${migratedCount} meetings`);
    console.log(`  - Skipped: ${skippedCount} (already exist)`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Zone ID Updates: ${zoneUpdates}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('\nMigration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main();
