const googleSheetsService = require('./googleSheets');
const mongoService = require('./mongoService');
const { isMongoConnected } = require('../config/mongodb');

class UserService {
  /**
   * Get user by username
   * Tries MongoDB first, falls back to Google Sheets
   */
  async getUserByUsername(username) {
    try {
      // Try MongoDB first if connected
      if (isMongoConnected()) {
        console.log('[UserService] Fetching user from MongoDB');
        const user = await mongoService.getUserByUsername(username);
        if (user) {
          return user;
        }
      }

      // Fallback to Google Sheets
      console.log('[UserService] Fetching user from Google Sheets');
      return await googleSheetsService.getUserByUsername(username);
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  /**
   * Verify password (plain text comparison for now)
   * TODO: Update to use bcrypt hash comparison when encryption is added
   */
  verifyPassword(inputPassword, storedPassword) {
    // Plain text comparison for now
    // When encryption is added, this will compare: bcrypt.compare(inputPassword, storedPassword)
    return inputPassword === storedPassword;
  }

  /**
   * Hash password (placeholder for future encryption)
   * TODO: Implement bcrypt hashing when encryption is added
   */
  async hashPassword(password) {
    // For now, return password as-is
    // When encryption is added: return bcrypt.hash(password, 10);
    return password;
  }
}

module.exports = new UserService();
