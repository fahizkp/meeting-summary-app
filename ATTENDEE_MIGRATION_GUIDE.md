# Attendee Source Migration Guide

## Change Summary

**Date**: 2026-01-28

**Change**: Meeting attendees are now fetched **ONLY from the Committee table**

**Previous Behavior**: 
- Attendees came from Committee table + Unit table
- Unit members were included as general "Member" role

**New Behavior**:
- Attendees come from Committee table ONLY
- All meeting participants must be registered in Committee table
- Unit members are no longer automatically included

## Impact

### ⚠️ **Critical**: Empty Attendee Lists

If you have zones with:
- ✅ Unit members defined
- ❌ NO Committee members defined

**Result**: The meeting form will show **NO attendees** for that zone.

### Action Required

**Before creating meetings**, you must:

1. **Add all participants to the Committee table** using the Committee Management interface
2. **Assign proper roles** to each member
3. **Include contact information** (mobile/WhatsApp)

## Migration Steps

### Step 1: Identify Affected Zones

Check which zones have Unit members but no Committee members:

```javascript
// Run this in MongoDB shell or script
db.units.aggregate([
  {
    $lookup: {
      from: "committees",
      localField: "zoneId",
      foreignField: "zoneId",
      as: "committeeMembers"
    }
  },
  {
    $match: {
      "members": { $exists: true, $ne: [] },
      "committeeMembers": { $size: 0 }
    }
  },
  {
    $project: {
      zoneId: 1,
      zoneName: 1,
      unitMembers: { $size: "$members" }
    }
  }
])
```

### Step 2: Migrate Unit Members to Committee

For each zone with Unit members:

1. **Login as admin**
2. **Navigate to Committee Management** (`/committee`)
3. **Add each member** with appropriate role:
   - Use existing roles (President, Secretary, etc.)
   - Or use "Executive Member" for general members
4. **Include contact information** if available

### Step 3: Verify Migration

1. **Go to Meeting Form** (`/form`)
2. **Select each zone**
3. **Verify attendees list** is populated correctly

## Benefits of This Change

### ✅ Better Organization
- All members have defined roles
- Clear hierarchy and responsibilities

### ✅ Contact Information
- Mobile and WhatsApp numbers stored
- Easier communication and coordination

### ✅ Data Integrity
- Single source of truth for participants
- No duplicate or conflicting member data

### ✅ Accountability
- Track who should attend meetings
- Better attendance reporting

## Committee Roles Available

| Role ID | Malayalam Name | English Name |
|---------|----------------|--------------|
| CR01 | പ്രസിഡന്റ് | President |
| CR02 | വൈസ് പ്രസിഡന്റ് | Vice President |
| CR03 | സെക്രട്ടറി | Secretary |
| CR04 | ജോയിന്റ് സെക്രട്ടറി | Joint Secretary |
| CR05 | ട്രഷറർ | Treasurer |
| CR06 | എക്സിക്യൂട്ടീവ് മെമ്പർ | Executive Member |

**Tip**: Use "Executive Member" (CR06) for general participants who don't have specific leadership roles.

## Rollback (If Needed)

If you need to temporarily revert to the old behavior:

1. Open `backend/services/mongoService.js`
2. Find the `getAttendeesByZone` function (around line 166)
3. Add back the Unit members code:

```javascript
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
```

4. Restart the backend server

## Support

If you encounter issues:

1. **Check Committee table** has members for the zone
2. **Verify zoneId** matches between Zone and Committee tables
3. **Check backend logs** for any errors
4. **Use Committee Management** interface to add missing members

## Questions?

Refer to `ATTENDEES_DATA_SOURCE.md` for detailed documentation on the attendee data flow.
