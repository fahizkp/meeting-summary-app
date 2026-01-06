/**
 * Zone Helper Service
 * Provides utilities for working with zones and matching zone IDs to names
 */

let zonesCache = null;

/**
 * Set the zones cache (call this when zones are fetched)
 */
export const setZonesCache = (zones) => {
  zonesCache = zones;
};

/**
 * Get zone name from zone ID
 */
export const getZoneNameById = (zoneId) => {
  if (!zonesCache) return zoneId;
  const zone = zonesCache.find(z => z.id === zoneId);
  return zone ? zone.name : zoneId;
};

/**
 * Get zone ID from zone name
 */
export const getZoneIdByName = (zoneName) => {
  if (!zonesCache) return zoneName;
  const zone = zonesCache.find(z => z.name === zoneName);
  return zone ? zone.id : zoneName;
};

/**
 * Check if a meeting belongs to any of the accessible zones
 * @param {Object} meeting - Meeting object with zoneName or zoneId
 * @param {Array} accessibleZoneIds - Array of zone IDs user can access
 * @returns {boolean}
 */
export const isMeetingAccessible = (meeting, accessibleZoneIds) => {
  if (!accessibleZoneIds || accessibleZoneIds === null) {
    // null means user can access all zones
    return true;
  }

  if (!Array.isArray(accessibleZoneIds) || accessibleZoneIds.length === 0) {
    return false;
  }

  // Try to match by zone ID first
  if (meeting.zoneId && accessibleZoneIds.includes(meeting.zoneId)) {
    return true;
  }

  // Try to match by zone name
  if (meeting.zoneName) {
    // Convert zone name to ID and check
    const meetingZoneId = getZoneIdByName(meeting.zoneName);
    if (accessibleZoneIds.includes(meetingZoneId)) {
      return true;
    }
    
    // Also check if zone name directly matches any zone ID (for backward compatibility)
    if (accessibleZoneIds.includes(meeting.zoneName)) {
      return true;
    }
  }

  return false;
};

/**
 * Filter meetings based on accessible zones
 * @param {Array} meetings - Array of meeting objects
 * @param {Array|null} accessibleZoneIds - Array of zone IDs or null for all access
 * @returns {Array} Filtered meetings
 */
export const filterMeetingsByZoneAccess = (meetings, accessibleZoneIds) => {
  if (!Array.isArray(meetings)) {
    return [];
  }

  // If accessibleZoneIds is null, user can see all meetings
  if (accessibleZoneIds === null) {
    return meetings;
  }

  // Filter meetings
  return meetings.filter(meeting => isMeetingAccessible(meeting, accessibleZoneIds));
};
