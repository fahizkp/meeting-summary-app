/**
 * Local Data Seeder
 * Populates MongoDB with dummy data for local development
 * 
 * Usage: node scripts/seedData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const District = require('../models/District');
const Zone = require('../models/Zone');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Agenda = require('../models/Agenda');
const Committee = require('../models/Committee');
const CommitteeRole = require('../models/CommitteeRole');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_app';

const COMMITTEE_ROLES_DATA = [
  { id: 'CR01', name: 'പ്രസിഡന്റ്', englishName: 'President' },
  { id: 'CR02', name: 'വൈസ് പ്രസിഡന്റ്', englishName: 'Vice President' },
  { id: 'CR03', name: 'സെക്രെട്ടറി', englishName: 'Secretary' },
  { id: 'CR04', name: 'ജോയിന്റ് സെക്രട്ടറി', englishName: 'Joint Secretary' },
  { id: 'CR05', name: 'ട്രെഷറർ', englishName: 'Treasurer' },
  { id: 'CR06', name: 'എക്സിക്യൂട്ടീവ് മെമ്പർ', englishName: 'Executive Member' },
];

const DEFAULT_AGENDAS = [
  'ഹാജർ',
  'മുൻ മീറ്റിംഗ് റിപ്പോർട്ട്',
  'സാമ്പത്തിക റിപ്പോർട്ട്',
  'QHLS റിപ്പോർട്ട്',
  'പരിപാടികൾ',
  'അംഗത്വം',
  'മറ്റുള്ളവ',
];

async function seed() {
  console.log('--- Seeding Data ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    District.deleteMany({}),
    Zone.deleteMany({}),
    Unit.deleteMany({}),
    User.deleteMany({}),
    Meeting.deleteMany({}),
    Agenda.deleteMany({}),
    Committee.deleteMany({}),
    CommitteeRole.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // 1. Roles
  for (const roleData of COMMITTEE_ROLES_DATA) {
    await CommitteeRole.create({
      roleId: roleData.id,
      name: roleData.name,
      englishName: roleData.englishName
    });
  }

  // 2. District
  const district = await District.create({
    districtId: 'D001',
    name: 'Malappuram West',
  });

  // 3. Zones
  const zones = [];
  for (let i = 1; i <= 3; i++) {
    const zone = await Zone.create({
      zoneId: `Z00${i}`,
      name: `Zone ${i}`,
      districtId: 'D001',
      roles: [] // Will be populated via Committee model logic mostly, but let's leave empty here
    });
    zones.push(zone);

    // Units
    for (let j = 1; j <= 3; j++) {
      await Unit.create({
        unitId: `U${i}${j}`,
        name: `Unit ${i}-${j}`,
        zoneId: zone.zoneId,
        members: []
      });
    }

    // Committee Members (Attendees)
    // Create President, Secretary, Member for each zone
    await Committee.create({ committeeId: `C${i}1`, name: `President Z${i}`, roleId: 'CR01', zoneId: zone.zoneId });
    await Committee.create({ committeeId: `C${i}2`, name: `Secretary Z${i}`, roleId: 'CR03', zoneId: zone.zoneId });
    await Committee.create({ committeeId: `C${i}3`, name: `Treasurer Z${i}`, roleId: 'CR05', zoneId: zone.zoneId });
    await Committee.create({ committeeId: `C${i}4`, name: `Member Z${i}`, roleId: 'CR06', zoneId: zone.zoneId });
  }

  // 4. Users
  await User.create({
    username: 'admin',
    password: 'password',
    roles: ['admin'],
    districtAccess: ['D001']
  });

  await User.create({
    username: 'district_admin',
    password: 'password',
    roles: ['district_admin'],
    districtAccess: ['D001']
  });

  await User.create({
    username: 'zone_admin',
    password: 'password',
    roles: ['zone_admin'],
    zoneAccess: ['Z001'], // Zone 1
    districtAccess: ['D001']
  });

  console.log('Created Users: admin/password, district_admin/password, zone_admin/password');

  // 5. Agendas
  for (let i = 0; i < DEFAULT_AGENDAS.length; i++) {
    await Agenda.create({
      agendaId: `AGD${i}`,
      name: DEFAULT_AGENDAS[i],
      order: i,
      isDefault: true
    });
  }

  // 6. Dummy Meetings
  // Create 2 meetings for Zone 1
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const createMeeting = async (zoneId, zoneName, dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // Attendees
    const attendees = [
      { name: `President ${zoneName.replace('Zone ', 'Z')}`, role: 'President', status: 'present' },
      { name: `Secretary ${zoneName.replace('Zone ', 'Z')}`, role: 'Secretary', status: 'present' },
      { name: `Treasurer ${zoneName.replace('Zone ', 'Z')}`, role: 'Treasurer', status: 'leave', reason: 'Sick' },
      { name: `Member ${zoneName.replace('Zone ', 'Z')}`, role: 'Member', status: 'present' },
    ];

    await Meeting.create({
      meetingId: `MEET-${Date.now()}-${Math.random()}`,
      zoneId: zoneId,
      zoneName: zoneName,
      date: dateStr,
      startTime: '10:00',
      endTime: '11:00',
      agendas: DEFAULT_AGENDAS,
      minutes: ['Decision 1', 'Decision 2'],
      attendance: attendees,
      qhls: [
        { unit: 'Unit 1-1', day: 'mon', faculty: 'F1', male: 10, female: 5 }
      ],
      swagatham: `Secretary ${zoneName.replace('Zone ', 'Z')}`,
      adhyakshan: `President ${zoneName.replace('Zone ', 'Z')}`,
      nandhi: `Member ${zoneName.replace('Zone ', 'Z')}`
    });
  };

  // Meeting today (Zone 1)
  await createMeeting('Z001', 'Zone 1', today);
  // Meeting last week (Zone 1)
  await createMeeting('Z001', 'Zone 1', lastWeek);
  
  // Meeting today (Zone 2)
  await createMeeting('Z002', 'Zone 2', today);

  console.log('Seeding Complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
