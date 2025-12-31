require('dotenv').config();
const GoogleSheetsService = require('../services/googleSheets');

async function testDashboardLogic() {
  try {
    console.log('Initializing Google Sheets Service...');
    const service = new GoogleSheetsService();
    
    // Test Date Range: last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60); // Check last 60 days
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    console.log(`Fetching meetings between ${startStr} and ${endStr}...`);
    const meetings = await service.getMeetingsByDateRange(startStr, endStr);
    console.log(`Found ${meetings.length} meetings.`);

    if (meetings.length > 0) {
      console.log('Sample Meeting:', JSON.stringify(meetings[0], null, 2));
    }

    // --- Analytics Logic Verification ---
    console.log('\nRunning Analytics Logic...');

    const allZones = await service.getZones();
    const zoneNames = allZones.map(z => z.name);
    
    const zonesWithMeetings = new Set(meetings.map(m => m.zoneName));
    const noMeetingZones = zoneNames.filter(z => !zonesWithMeetings.has(z));
    
    console.log(`Zones with meetings: ${zonesWithMeetings.size}`);
    console.log(`Zones WITHOUT meetings: ${noMeetingZones.length}`);
    if (noMeetingZones.length > 0) {
      console.log('Missing Zones:', noMeetingZones.slice(0, 5));
    }

    const personStats = {}; 
    const sortedMeetings = [...meetings].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Stats Calculation
    sortedMeetings.forEach(meeting => {
      const meetingAttendees = meeting.attendance || [];
      meetingAttendees.forEach(record => {
          const name = record.name;
          if (!personStats[name]) {
              personStats[name] = {
                  name: name,
                  present: 0,
                  leave: 0,
                  total: 0,
                  maxConsecutiveLeaves: 0,
                  currentConsecutiveLeaves: 0,
                  lastAttendedDate: null,
                  zone: meeting.zoneName
              };
          }
          personStats[name].total += 1;
          if (record.status === 'present') {
              personStats[name].present += 1;
              personStats[name].currentConsecutiveLeaves = 0;
              personStats[name].lastAttendedDate = meeting.date;
          } else if (record.status === 'leave') {
              personStats[name].leave += 1;
              personStats[name].currentConsecutiveLeaves += 1;
              if (personStats[name].currentConsecutiveLeaves > personStats[name].maxConsecutiveLeaves) {
                  personStats[name].maxConsecutiveLeaves = personStats[name].currentConsecutiveLeaves;
              }
          }
      });
    });

    const consecutiveAbsenceList = Object.values(personStats)
        .filter(p => p.currentConsecutiveLeaves >= 3)
        .map(p => ({
            name: p.name,
            consecutiveAbsences: p.currentConsecutiveLeaves
        }));

    console.log(`\nFound ${consecutiveAbsenceList.length} people with 3+ consecutive absences.`);
    if (consecutiveAbsenceList.length > 0) {
        console.log(consecutiveAbsenceList.slice(0, 3));
    }

    console.log('\nVerification Complete.');

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

testDashboardLogic();
