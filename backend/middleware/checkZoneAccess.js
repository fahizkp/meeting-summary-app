/**
 * Zone Access Middleware
 * Verifies if a user has access to a specific zone
 */

/**
 * Check if user has access to a specific zone
 * @param {Object} user - User object from req.user
 * @param {String} zoneId - Zone ID to check access for
 * @returns {Boolean} - True if user has access, false otherwise
 */
function hasZoneAccess(user, zoneId) {
  // Admin has access to all zones
  if (user.roles && user.roles.includes('admin')) {
    return true;
  }

  // Check if user has zone_admin role and zone is in their zoneAccess array
  if (user.roles && user.roles.includes('zone_admin')) {
    if (user.zoneAccess && Array.isArray(user.zoneAccess)) {
      return user.zoneAccess.includes(zoneId);
    }
  }

  return false;
}

/**
 * Middleware to check zone access for a specific zone
 * Expects zoneId in req.body or req.params
 */
function checkZoneAccess(req, res, next) {
  const zoneId = req.body.zoneId || req.params.zoneId || req.query.zoneId;
  
  if (!zoneId) {
    return res.status(400).json({
      success: false,
      error: 'Zone ID is required'
    });
  }

  if (!hasZoneAccess(req.user, zoneId)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You do not have permission to access this zone'
    });
  }

  next();
}

/**
 * Get accessible zones for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of accessible zone IDs, or 'all' for admin
 */
function getAccessibleZones(user) {
  // Admin has access to all zones
  if (user.roles && user.roles.includes('admin')) {
    return 'all';
  }

  // Return user's zone access array
  if (user.zoneAccess && Array.isArray(user.zoneAccess)) {
    return user.zoneAccess;
  }

  return [];
}

module.exports = {
  hasZoneAccess,
  checkZoneAccess,
  getAccessibleZones
};
