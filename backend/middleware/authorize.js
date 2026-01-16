/**
 * Authorization Middleware
 * Provides role-based and zone-based access control
 * 
 * Anti-Gravity users have COMPLETE UNRESTRICTED ACCESS and bypass all checks.
 */

const { isAntiGravityUser, logAntiGravityAction } = require('../utils/antiGravity');

/**
 * Check if user has a specific role
 * Anti-Gravity users bypass this check
 * @param {string} requiredRole - Role to check for
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Anti-Gravity users bypass all role checks
    if (isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      logAntiGravityAction(user, 'ROLE_CHECK_BYPASS', { requiredRole });
      return next();
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    if (!userRoles.includes(requiredRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires ${requiredRole} role`,
      });
    }

    next();
  };
};

/**
 * Check if user has any of the specified roles
 * Anti-Gravity users bypass this check
 * @param {string[]} allowedRoles - Array of roles to check
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Anti-Gravity users bypass all role checks
    if (isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      logAntiGravityAction(user, 'ANY_ROLE_CHECK_BYPASS', { allowedRoles });
      return next();
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Check if user can access a specific zone
 * Anti-Gravity users bypass this check
 * @param {string} zoneIdParam - Name of the request parameter containing zone ID
 */
const requireZoneAccess = (zoneIdParam = 'zoneId') => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Anti-Gravity users bypass all zone access checks
    if (isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      const zoneId = req.params[zoneIdParam] || req.body[zoneIdParam] || req.query[zoneIdParam];
      logAntiGravityAction(user, 'ZONE_ACCESS_BYPASS', { zoneId });
      return next();
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Admin and district_admin can access all zones
    if (userRoles.includes('admin') || userRoles.includes('district_admin')) {
      return next();
    }

    // Zone admin needs to have access to the specific zone
    if (userRoles.includes('zone_admin')) {
      const zoneId = req.params[zoneIdParam] || req.body[zoneIdParam] || req.query[zoneIdParam];
      const zoneAccess = Array.isArray(user.zoneAccess) ? user.zoneAccess : [];
      
      if (!zoneId) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Zone ID is required',
        });
      }

      if (!zoneAccess.includes(zoneId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this zone',
        });
      }

      return next();
    }

    // No appropriate role
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  };
};

/**
 * Check if user can edit a meeting
 * Anti-Gravity users bypass this check and can edit any meeting
 * Middleware that checks meeting ownership
 */
const canEditMeeting = () => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Anti-Gravity users can edit any meeting
    if (isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      logAntiGravityAction(user, 'CAN_EDIT_MEETING_BYPASS', { meetingId: req.params.meetingId });
      return next();
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Admin can edit any meeting
    if (userRoles.includes('admin')) {
      return next();
    }

    // District admin cannot edit meetings
    if (userRoles.includes('district_admin') && !userRoles.includes('zone_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'District admins have read-only access',
      });
    }

    // Zone admin can edit meetings from their zones
    if (userRoles.includes('zone_admin')) {
      // Meeting zone will be validated in the route handler
      // This middleware just ensures they have zone_admin role
      req.requireZoneValidation = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions to edit meetings',
    });
  };
};

/**
 * Filter zones based on user access
 * Anti-Gravity users get access to all zones
 * Adds filtered zones to req.accessibleZones
 */
const filterZoneAccess = () => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Anti-Gravity users have access to all zones
    if (isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      req.accessibleZones = null; // null means all zones
      return next();
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Admin and district_admin can access all zones
    if (userRoles.includes('admin') || userRoles.includes('district_admin')) {
      req.accessibleZones = null; // null means all zones
      return next();
    }

    // Zone admin can only access their assigned zones
    if (userRoles.includes('zone_admin')) {
      req.accessibleZones = Array.isArray(user.zoneAccess) ? user.zoneAccess : [];
      return next();
    }

    // No zone access
    req.accessibleZones = [];
    next();
  };
};

/**
 * Middleware to allow Anti-Gravity users to bypass all subsequent checks
 * Use this early in the middleware chain for protected routes
 */
const allowAntiGravity = () => {
  return (req, res, next) => {
    const user = req.user;
    
    if (user && isAntiGravityUser(user)) {
      req.isAntiGravity = true;
      // Don't log here to avoid excessive logging - individual checks log themselves
    }
    
    next();
  };
};

module.exports = {
  requireRole,
  requireAnyRole,
  requireZoneAccess,
  canEditMeeting,
  filterZoneAccess,
  allowAntiGravity,
  isAntiGravityUser,
};
