/**
 * Background Sync Job
 * Syncs data from MongoDB to Google Sheets every 15 minutes
 */

const cron = require('node-cron');
const { isMongoConnected } = require('../config/mongodb');
const mongoService = require('../services/mongoService');

let googleSheetsService = null;
try {
  googleSheetsService = require('../services/googleSheets');
} catch (error) {
  console.warn('Google Sheets service not available for sync');
}

let syncInProgress = false;
let lastSyncTime = null;
let lastSyncStatus = null;

/**
 * Sync Zones from MongoDB to Google Sheets
 */
async function syncZonesToSheets() {
  if (!googleSheetsService || !isMongoConnected()) {
    return { success: false, reason: 'Services not available' };
  }

  try {
    const zones = await mongoService.getZones();
    // TODO: Implement write to Google Sheets ZoneData
    // This would require adding a writeZones method to googleSheets.js
    console.log(`[Sync] Would sync ${zones.length} zones to Google Sheets`);
    return { success: true, count: zones.length };
  } catch (error) {
    console.error('[Sync] Error syncing zones:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync Users from MongoDB to Google Sheets
 */
async function syncUsersToSheets() {
  if (!googleSheetsService || !isMongoConnected()) {
    return { success: false, reason: 'Services not available' };
  }

  try {
    const users = await mongoService.getAllUsers();
    // TODO: Implement write to Google Sheets Users
    // This would require adding a writeUsers method to googleSheets.js
    console.log(`[Sync] Would sync ${users.length} users to Google Sheets`);
    return { success: true, count: users.length };
  } catch (error) {
    console.error('[Sync] Error syncing users:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run full sync
 */
async function runSync() {
  if (syncInProgress) {
    console.log('[Sync] Sync already in progress, skipping...');
    return;
  }

  syncInProgress = true;
  const startTime = new Date();
  console.log(`[Sync] Starting sync at ${startTime.toISOString()}`);

  try {
    const results = {
      zones: await syncZonesToSheets(),
      users: await syncUsersToSheets(),
    };

    lastSyncTime = new Date();
    lastSyncStatus = {
      success: true,
      results,
      duration: Date.now() - startTime.getTime(),
    };

    console.log(`[Sync] Completed in ${lastSyncStatus.duration}ms`);
  } catch (error) {
    lastSyncStatus = {
      success: false,
      error: error.message,
      duration: Date.now() - startTime.getTime(),
    };
    console.error('[Sync] Failed:', error.message);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Start the sync scheduler
 * Runs every 15 minutes
 */
function startSyncScheduler() {
  // Run every 15 minutes: */15 * * * *
  cron.schedule('*/15 * * * *', () => {
    console.log('[Sync] Scheduled sync triggered');
    runSync();
  });

  console.log('[Sync] Scheduler started - runs every 15 minutes');
}

/**
 * Get sync status
 */
function getSyncStatus() {
  return {
    lastSyncTime,
    lastSyncStatus,
    syncInProgress,
    isMongoConnected: isMongoConnected(),
  };
}

/**
 * Manually trigger sync
 */
function triggerSync() {
  if (!syncInProgress) {
    runSync();
    return true;
  }
  return false;
}

module.exports = {
  startSyncScheduler,
  getSyncStatus,
  triggerSync,
  runSync,
};
