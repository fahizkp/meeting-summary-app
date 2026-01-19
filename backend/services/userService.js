const mongoService = require('./mongoService');
const { isMongoConnected } = require('../config/mongodb');

class UserService {
  /**
   * Get user by username from MongoDB
   */
  async getUserByUsername(username) {
    try {
      if (!isMongoConnected()) {
        throw new Error('MongoDB is not connected');
      }

      console.log('[UserService] Fetching user from MongoDB');
      const user = await mongoService.getUserByUsername(username);
      
      if (!user) {
        console.log(`[UserService] User not found: ${username}`);
        return null;
      }

      return user;
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
