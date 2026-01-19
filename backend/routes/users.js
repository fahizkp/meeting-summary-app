const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const { isMongoConnected } = require('../config/mongodb');
const mongoService = require('../services/mongoService');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Fetching users from MongoDB');
    const users = await mongoService.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const { username, password, roles, zoneAccess } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Username and password are required',
      });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roles',
        message: 'At least one role must be assigned',
      });
    }

    // Validate roles
    const validRoles = ['admin', 'district_admin', 'zone_admin'];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roles',
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
      });
    }

    // If zone_admin role, validate zoneAccess
    if (roles.includes('zone_admin')) {
      if (!Array.isArray(zoneAccess) || zoneAccess.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid zone access',
          message: 'Zone admin must have at least one zone assigned',
        });
      }
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Creating user in MongoDB');
    
    // Check if user already exists
    const existingUser = await mongoService.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: `User ${username} already exists`,
      });
    }

    const user = await mongoService.createUser({
      username,
      password, // TODO: Hash password
      roles,
      zoneAccess: zoneAccess || [],
      districtAccess: ['D001'], // Default district
    });

    return res.json({
      success: true,
      message: 'User created successfully',
      user: {
        username: user.username,
        roles: user.roles,
        zoneAccess: user.zoneAccess,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

/**
 * PUT /api/users/:username
 * Update a user (admin only)
 */
router.put('/:username', express.json(), async (req, res) => {
  try {
    const { username } = req.params;
    const { password, roles, zoneAccess } = req.body;

    // Validation
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roles',
        message: 'At least one role must be assigned',
      });
    }

    // Validate roles
    const validRoles = ['admin', 'district_admin', 'zone_admin'];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roles',
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
      });
    }

    // If zone_admin role, validate zoneAccess
    if (roles.includes('zone_admin')) {
      if (!Array.isArray(zoneAccess) || zoneAccess.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid zone access',
          message: 'Zone admin must have at least one zone assigned',
        });
      }
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Updating user in MongoDB');

    // Check if user exists
    const existingUser = await mongoService.getUserByUsername(username);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `User ${username} not found`,
      });
    }

    const updateData = {
      roles,
      zoneAccess: zoneAccess || [],
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = password; // TODO: Hash password
    }

    const user = await mongoService.updateUser(username, updateData);

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        username: user.username,
        roles: user.roles,
        zoneAccess: user.zoneAccess,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/users/:username:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/users/:username
 * Delete a user (admin only)
 */
router.delete('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Prevent deleting yourself
    if (req.user.username === username) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account',
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'MongoDB is not connected',
      });
    }

    console.log('[API] Deleting user from MongoDB');

    const User = require('../models/User');
    const result = await User.findOneAndDelete({ username: username.toLowerCase() });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `User ${username} not found`,
      });
    }

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/:username:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

module.exports = router;
