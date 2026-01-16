const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Username and password are required',
      });
    }

    // Get user from Google Sheets
    const user = await userService.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect',
      });
    }

    // Verify password (plain text for now)
    const isPasswordValid = userService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: user.username,
        roles: user.roles || [],
        zoneAccess: user.zoneAccess || [],
        districtAccess: user.districtAccess || [],
        isAntiGravity: user.isAntiGravity || false,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Debug: Log user roles and Anti-Gravity status
    console.log('[AUTH] User logged in:', user.username, 'Roles:', user.roles, 'AntiGravity:', user.isAntiGravity || false);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          username: user.username,
          roles: user.roles || [],
          zoneAccess: user.zoneAccess || [],
          districtAccess: user.districtAccess || [],
          isAntiGravity: user.isAntiGravity || false,
        },
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify if token is valid
 */
router.post('/verify', express.json(), async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        message: 'Please provide a token',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: decoded,
        },
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is not valid',
      });
    }
  } catch (error) {
    console.error('Error in /api/auth/verify:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/logout
 * Logout (client-side token removal, this is just for consistency)
 */
router.get('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

module.exports = router;

