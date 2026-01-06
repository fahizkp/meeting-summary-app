/**
 * MongoDB Service
 * Provides CRUD operations for all collections
 */

const { isMongoConnected } = require('../config/mongodb');
const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');

class MongoService {
  /**
   * Check if MongoDB is available
   */
  isAvailable() {
    return isMongoConnected();
  }

  // ==================== DISTRICTS ====================

  async getDistricts() {
    return District.find().sort({ districtId: 1 });
  }

  async getDistrictById(districtId) {
    return District.findOne({ districtId });
  }

  async createDistrict(data) {
    const district = new District(data);
    return district.save();
  }

  // ==================== ZONES ====================

  async getZones(districtId = null) {
    const query = districtId ? { districtId } : {};
    const zones = await Zone.find(query).sort({ zoneId: 1 });
    
    // Transform to match existing API format
    return zones.map(zone => ({
      id: zone.zoneId,
      name: zone.name,
      districtId: zone.districtId,
      roles: zone.roles || [],
    }));
  }

  async getZoneById(zoneId) {
    return Zone.findOne({ zoneId });
  }

  async createZone(data) {
    const zone = new Zone(data);
    return zone.save();
  }

  async updateZone(zoneId, data) {
    return Zone.findOneAndUpdate(
      { zoneId },
      { $set: data },
      { new: true }
    );
  }

  async upsertZone(zoneId, data) {
    return Zone.findOneAndUpdate(
      { zoneId },
      { $set: { ...data, zoneId } },
      { new: true, upsert: true }
    );
  }

  // ==================== UNITS ====================

  async getUnits(zoneId = null) {
    const query = zoneId ? { zoneId } : {};
    return Unit.find(query).sort({ unitId: 1 });
  }

  async getUnitsByZone(zoneId) {
    const units = await Unit.find({ zoneId }).sort({ name: 1 });
    return units.map(u => u.name);
  }

  async createUnit(data) {
    const unit = new Unit(data);
    return unit.save();
  }

  async upsertUnit(unitId, data) {
    return Unit.findOneAndUpdate(
      { unitId },
      { $set: { ...data, unitId } },
      { new: true, upsert: true }
    );
  }

  // ==================== USERS ====================

  async getUserByUsername(username) {
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    });
    
    if (!user) return null;
    
    return {
      username: user.username,
      password: user.password,
      roles: user.roles || [],
      zoneAccess: user.zoneAccess || [],
      districtAccess: user.districtAccess || [],
      createdDate: user.createdAt?.toISOString() || '',
    };
  }

  async createUser(data) {
    const user = new User({
      ...data,
      username: data.username.toLowerCase(),
    });
    return user.save();
  }

  async updateUser(username, data) {
    return User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: data },
      { new: true }
    );
  }

  async upsertUser(username, data) {
    return User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: { ...data, username: username.toLowerCase() } },
      { new: true, upsert: true }
    );
  }

  async getAllUsers() {
    const users = await User.find().sort({ username: 1 });
    return users.map(u => ({
      username: u.username,
      roles: u.roles || [],
      zoneAccess: u.zoneAccess || [],
      districtAccess: u.districtAccess || [],
      createdDate: u.createdAt?.toISOString() || '',
    }));
  }

  // ==================== ATTENDEES (from Committee + Units) ====================

  async getAttendeesByZone(zoneId) {
    // Get zone info for unit members
    const Zone = require('../models/Zone');
    const zoneInfo = await Zone.findOne({ zoneId });
    const currentZoneName = zoneInfo ? zoneInfo.name : '';

    const attendees = [];

    // Get committee members (secretariat)
    const Committee = require('../models/Committee');
    const CommitteeRole = require('../models/CommitteeRole');
    
    // Fetch generic roles map
    const rolesList = await CommitteeRole.find({});
    const roleMap = {};
    rolesList.forEach(r => { roleMap[r.roleId] = r.name; });

    const committeeMembers = await Committee.find({ zoneId });

    // Custom sort: Treasurer (CR05) should come last
    const rolePriority = {
      'CR01': 1, // President
      'CR02': 2, // Vice President
      'CR03': 3, // Secretary
      'CR04': 4, // Joint Secretary
      'CR06': 5, // Executive Member
      'CR05': 99 // Treasurer
    };

    committeeMembers.sort((a, b) => {
      const pA = rolePriority[a.roleId] || 50;
      const pB = rolePriority[b.roleId] || 50;
      return pA - pB;
    });

    committeeMembers.forEach(member => {
      // Use Malayalam role from CommitteeRole if available
      const displayRole = (member.roleId && roleMap[member.roleId]) ? roleMap[member.roleId] : '';
      
      attendees.push({
        name: member.name,
        role: displayRole,
        zoneName: member.zoneName || currentZoneName,
        mobile: member.mobile || '',
        whatsapp: member.whatsapp || '',
      });
    });

    // Get unit members
    const units = await Unit.find({ zoneId });
    units.forEach(unit => {
      if (unit.members) {
        unit.members.forEach(m => {
          attendees.push({
            name: m.name,
            role: m.role || 'Member',
            zoneName: currentZoneName,
            mobile: '',
            whatsapp: '',
          });
        });
      }
    });

    return attendees;
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpsertZones(zones) {
    const operations = zones.map(zone => ({
      updateOne: {
        filter: { zoneId: zone.zoneId },
        update: { $set: zone },
        upsert: true,
      },
    }));
    return Zone.bulkWrite(operations);
  }

  async bulkUpsertUnits(units) {
    const operations = units.map(unit => ({
      updateOne: {
        filter: { unitId: unit.unitId },
        update: { $set: unit },
        upsert: true,
      },
    }));
    return Unit.bulkWrite(operations);
  }

  async bulkUpsertUsers(users) {
    const operations = users.map(user => ({
      updateOne: {
        filter: { username: user.username.toLowerCase() },
        update: { $set: { ...user, username: user.username.toLowerCase() } },
        upsert: true,
      },
    }));
    return User.bulkWrite(operations);
  }
}

module.exports = new MongoService();
