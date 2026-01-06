# Role-Based Access Control (RBAC) Implementation Plan

## Overview
Implement a flexible role-based access control system with three main roles that can be combined:
1. **Zone Admin** - Manage meetings for specific zone(s)
2. **District Admin** - View all zone data (read-only)
3. **Admin** - Manage user roles and permissions

## Key Requirements
- Users can have multiple roles simultaneously
- Zone Admins can be assigned to one or more zones
- Permissions are additive (having multiple roles grants combined permissions)

## Database Schema Changes

### Users Sheet Structure (Google Sheets)
Current: `Username | Password | Role | CreatedDate`
New: `Username | Password | Roles | ZoneAccess | CreatedDate`

- **Roles**: Comma-separated list (e.g., "zone_admin,district_admin")
- **ZoneAccess**: Comma-separated zone IDs for zone_admin role (e.g., "Z001,Z002")

## Backend Changes

### 1. Update User Service (`backend/services/googleSheets.js`)
- Modify `getUserByUsername()` to parse roles and zone access
- Return user object with:
  ```javascript
  {
    username: string,
    password: string,
    roles: string[], // ['zone_admin', 'district_admin', 'admin']
    zoneAccess: string[], // ['Z001', 'Z002']
    createdDate: string
  }
  ```

### 2. Update Auth Route (`backend/routes/auth.js`)
- Modify JWT token to include roles and zoneAccess
- Token payload:
  ```javascript
  {
    username: string,
    roles: string[],
    zoneAccess: string[]
  }
  ```

### 3. Create Authorization Middleware (`backend/middleware/authorize.js`)
- `requireRole(role)` - Check if user has specific role
- `requireAnyRole([roles])` - Check if user has any of the roles
- `requireZoneAccess(zoneId)` - Check if user can access specific zone
- `canEditMeeting(meetingData)` - Check if user can edit a meeting

### 4. Update API Routes (`backend/routes/api.js`)
- Apply authorization middleware to protect endpoints
- Filter data based on user's zone access
- Implement zone-specific queries

### 5. Create User Management Routes (`backend/routes/users.js`)
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:username` - Update user roles (admin only)
- `DELETE /api/users/:username` - Delete user (admin only)

## Frontend Changes

### 1. Update Auth Service (`frontend/src/services/auth.js`)
- Store and retrieve roles and zoneAccess from user data
- Add helper functions:
  - `hasRole(role)`
  - `hasAnyRole([roles])`
  - `canAccessZone(zoneId)`
  - `canEditMeeting(meeting)`

### 2. Update App Navigation (`frontend/src/App.jsx`)
- Show/hide tabs based on user roles:
  - Meeting Form: zone_admin only
  - Report: zone_admin (own zones), district_admin (all zones)
  - Dashboard: district_admin, admin

### 3. Update Meeting Form (`frontend/src/components/MeetingForm.jsx`)
- Filter zones dropdown to show only accessible zones
- Disable form if user doesn't have zone_admin role

### 4. Update Meeting Report (`frontend/src/components/MeetingReport.jsx`)
- Filter meetings based on user's zone access
- Show edit/delete buttons only for zone_admin with access
- Show all meetings for district_admin (read-only)

### 5. Update Dashboard (`frontend/src/components/Dashboard.jsx`)
- Filter data based on user's zone access
- Show all zones for district_admin
- Show only accessible zones for zone_admin

### 6. Create User Management Component (`frontend/src/components/UserManagement.jsx`)
- Admin-only interface to manage users
- Add/edit/delete users
- Assign roles and zone access

## Permission Matrix

| Feature | Zone Admin | District Admin | Admin |
|---------|-----------|----------------|-------|
| Create Meeting (own zones) | ✅ | ❌ | ❌ |
| Edit Meeting (own zones) | ✅ | ❌ | ❌ |
| Delete Meeting (own zones) | ✅ | ❌ | ❌ |
| View Meetings (own zones) | ✅ | ✅ | ✅ |
| View Meetings (all zones) | ❌ | ✅ | ✅ |
| Dashboard (own zones) | ✅ | ❌ | ❌ |
| Dashboard (all zones) | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Assign Roles | ❌ | ❌ | ✅ |

## Implementation Steps

1. ✅ Create implementation plan
2. ⬜ Update Google Sheets Users table structure
3. ⬜ Update backend user service to parse new format
4. ⬜ Create authorization middleware
5. ⬜ Update auth routes to include roles in JWT
6. ⬜ Update API routes with authorization checks
7. ⬜ Create user management API routes
8. ⬜ Update frontend auth service
9. ⬜ Update App.jsx navigation logic
10. ⬜ Update MeetingForm with zone filtering
11. ⬜ Update MeetingReport with permission checks
12. ⬜ Update Dashboard with zone filtering
13. ⬜ Create UserManagement component
14. ⬜ Test all permission scenarios

## Migration Notes

### Existing Users
- Current users with `role: "admin"` → `roles: "admin", zoneAccess: ""`
- Current users with `role: "user"` → Need manual assignment of zone_admin + zones

### Google Sheets Update
1. Add new column "ZoneAccess" after "Roles"
2. Rename "Role" column to "Roles"
3. Update existing data format
4. Keep backward compatibility during migration
