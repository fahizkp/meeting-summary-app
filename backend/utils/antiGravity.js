/**
 * Anti-Gravity User Helper
 * 
 * Anti-Gravity users have COMPLETE UNRESTRICTED ACCESS to all features, zones, and districts.
 * This is the highest level of access in the system.
 */

/**
 * Check if a user is an Anti-Gravity super user
 * Anti-Gravity users have complete unrestricted access to everything
 * 
 * @param {Object} user - User object (from JWT token or database)
 * @returns {boolean} - True if user is Anti-Gravity
 */
const isAntiGravityUser = (user) => {
  if (!user) return false;

  // Check explicit Anti-Gravity flag
  if (user.isAntiGravity === true) {
    return true;
  }

  // Check if user has ALL three roles
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const hasAllRoles = roles.includes('admin') && 
                      roles.includes('district_admin') && 
                      roles.includes('zone_admin');
  if (hasAllRoles) {
    return true;
  }

  // Check special "ALL" access markers
  const zoneAccess = Array.isArray(user.zoneAccess) ? user.zoneAccess : [];
  const districtAccess = Array.isArray(user.districtAccess) ? user.districtAccess : [];
  
  if (zoneAccess.includes('ALL') || districtAccess.includes('ALL')) {
    return true;
  }

  return false;
};

/**
 * Get access level information for a user
 * 
 * @param {Object} user - User object
 * @returns {Object} - Access level details
 */
const getUserAccessLevel = (user) => {
  if (isAntiGravityUser(user)) {
    return {
      level: 'ANTI_GRAVITY',
      description: 'Complete Unrestricted Access',
      canAccessAllZones: true,
      canAccessAllDistricts: true,
      canCreateMeeting: true,
      canEditAnyMeeting: true,
      canDeleteAnyMeeting: true,
      canManageUsers: true,
      canViewDashboard: true,
      showAllTabs: true,
    };
  }

  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (roles.includes('admin')) {
    return {
      level: 'ADMIN',
      description: 'System Administrator',
      canAccessAllZones: true,
      canAccessAllDistricts: true,
      canCreateMeeting: true,
      canEditAnyMeeting: true,
      canDeleteAnyMeeting: true,
      canManageUsers: true,
      canViewDashboard: true,
      showAllTabs: true,
    };
  }

  if (roles.includes('district_admin')) {
    return {
      level: 'DISTRICT_ADMIN',
      description: 'District Administrator',
      canAccessAllZones: true,
      canAccessAllDistricts: false,
      canCreateMeeting: false,
      canEditAnyMeeting: false,
      canDeleteAnyMeeting: false,
      canManageUsers: false,
      canViewDashboard: true,
      showAllTabs: false,
    };
  }

  if (roles.includes('zone_admin')) {
    return {
      level: 'ZONE_ADMIN',
      description: 'Zone Administrator',
      canAccessAllZones: false,
      canAccessAllDistricts: false,
      canCreateMeeting: true,
      canEditAnyMeeting: false,
      canDeleteAnyMeeting: false,
      canManageUsers: false,
      canViewDashboard: false,
      showAllTabs: false,
    };
  }

  return {
    level: 'USER',
    description: 'Basic User',
    canAccessAllZones: false,
    canAccessAllDistricts: false,
    canCreateMeeting: false,
    canEditAnyMeeting: false,
    canDeleteAnyMeeting: false,
    canManageUsers: false,
    canViewDashboard: false,
    showAllTabs: false,
  };
};

/**
 * Log an action performed by an Anti-Gravity user
 * This is for auditing purposes - Anti-Gravity actions should be tracked
 * 
 * @param {Object} user - User who performed the action
 * @param {string} action - Action name (e.g., 'CREATE_MEETING', 'DELETE_MEETING')
 * @param {Object} details - Additional details about the action
 */
const logAntiGravityAction = (user, action, details = {}) => {
  if (isAntiGravityUser(user)) {
    console.log(`[ANTI-GRAVITY AUDIT] User: ${user.username}, Action: ${action}`, {
      timestamp: new Date().toISOString(),
      details,
    });
    // TODO: In production, this should be saved to audit log collection
  }
};

module.exports = {
  isAntiGravityUser,
  getUserAccessLevel,
  logAntiGravityAction,
};
