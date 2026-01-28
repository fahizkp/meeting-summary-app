# Meeting Attendees Data Source

## Question
**If there is no data in the committees table, from where are the names of participants populated?**

## Answer

The meeting form attendees/participants are populated from **ONE source only**:

### **Committee Table** (All Meeting Participants)
- **Model**: `Committee` 
- **Location**: `backend/models/Committee.js`
- **Fields**: 
  - `name` - Member name
  - `roleId` - Reference to CommitteeRole (e.g., President, Secretary, etc.)
  - `zoneId` - Zone assignment
  - `mobile` - Mobile number
  - `whatsapp` - WhatsApp number

**Role Priority Order** (how they appear in the list):
1. President (CR01)
2. Vice President (CR02)
3. Secretary (CR03)
4. Joint Secretary (CR04)
5. Executive Member (CR06)
6. Treasurer (CR05) - appears last

### ⚠️ **Important Change**
- **Unit members are NO LONGER included** in the attendees list
- **All meeting participants must be registered in the Committee table**
- This ensures proper role assignment and contact information for all members

## Data Flow

```
Meeting Form (Frontend)
    ↓
GET /api/attendees/:zoneId
    ↓
mongoService.getAttendeesByZone(zoneId)
    ↓
Committee.find({ zoneId })  ← Fetch all committee members for zone
    ↓
Sort by role priority (President → Treasurer)
    ↓
Return attendees array with roles in Malayalam
```

## Code Location

**Backend Service**: `backend/services/mongoService.js`

**Function**: `MongoService.getAttendeesByZone(zoneId)`

**Lines**: 166-230

## What Happens If Committee Table is Empty?

If the **Committee table has NO data** for a zone:

1. ⚠️ **No attendees will appear** in the meeting form
2. ⚠️ **You must add committee members** before creating meetings
3. ⚠️ The meeting form will show an empty attendees list
4. ✅ This ensures all participants are properly registered with roles and contact info

**Action Required**: Use the Committee Management interface to add members before creating meetings.

## Example Output Structure

```javascript
[
  // All from Committee table
  {
    name: "John Doe",
    role: "പ്രസിഡന്റ്",  // Malayalam role name
    zoneName: "Zone A",
    mobile: "1234567890",
    whatsapp: "1234567890"
  },
  {
    name: "Jane Smith",
    role: "സെക്രട്ടറി",
    zoneName: "Zone A",
    mobile: "0987654321",
    whatsapp: "0987654321"
  },
  {
    name: "Bob Johnson",
    role: "എക്സിക്യൂട്ടീവ് മെമ്പർ",
    zoneName: "Zone A",
    mobile: "1112223333",
    whatsapp: "1112223333"
  }
]
```

## How to Populate Committee Data

To add committee members, use the new **Committee Management** feature:

1. Login as **admin**
2. Navigate to **കമ്മിറ്റി** (Committee) tab in bottom navigation
3. Click **+ Add Member**
4. Fill in:
   - Name
   - Role (dropdown)
   - Zone (dropdown)
   - Mobile (optional)
   - WhatsApp (optional)
5. Click **Add Member**

## Database Models

### Committee Model
```javascript
{
  committeeId: String (unique),
  name: String (required),
  roleId: String (required),  // References CommitteeRole
  zoneId: String (required),
  mobile: String,
  whatsapp: String
}
```

### Unit Model
```javascript
{
  unitId: String (unique),
  name: String (required),
  zoneId: String (required),
  members: [
    {
      name: String,
      role: String
    }
  ]
}
```

## Summary

- **Single Source**: Committee table only
- **All participants** must be registered in the Committee table with proper roles
- **If Committee is empty**: No attendees will appear - you must add members first
- **To populate Committee**: Use the Committee Management interface (/committee route)
- **Benefits**: 
  - Ensures all members have proper role assignments
  - Maintains contact information (mobile/WhatsApp)
  - Better organization and accountability
