# Committee Management Feature

## Overview
Added a comprehensive committee management system to allow admins to add, edit, and delete committee members with role and zone assignments.

## Changes Made

### Backend (API Routes)
**File**: `backend/routes/api.js`

Added the following endpoints:

1. **GET /api/committees** - Fetch all committee members (with optional zone filter)
   - Returns enriched data with role names and zone names
   - Supports filtering by zoneId query parameter

2. **GET /api/committee-roles** - Fetch all available committee roles
   - Returns list of roles for dropdown selection

3. **POST /api/committees** - Create a new committee member
   - Auto-generates committeeId
   - Validates required fields (name, roleId, zoneId)
   - Optional fields: mobile, whatsapp

4. **PUT /api/committees/:committeeId** - Update existing committee member
   - Updates all fields for a specific committee member

5. **DELETE /api/committees/:committeeId** - Delete a committee member
   - Removes committee member from database

### Frontend Components

#### 1. CommitteeManagement Component
**File**: `frontend/src/components/CommitteeManagement.jsx`

Features:
- **Add/Edit Form**: Modal-style form with the following fields:
  - Name (text input) - Required
  - Role (dropdown) - Required - populated from committee roles
  - Zone (dropdown) - Required - populated from zones
  - Mobile (tel input) - Optional
  - WhatsApp (tel input) - Optional

- **Committee Table**: Displays all committee members with:
  - Committee ID
  - Name
  - Role (Malayalam name)
  - Zone name
  - Mobile number
  - WhatsApp number
  - Action buttons (Edit/Delete)

- **Zone Filter**: Dropdown to filter committee members by zone

- **Responsive Design**: Mobile-friendly layout with proper styling

#### 2. App Routing
**File**: `frontend/src/App.jsx`

- Added route `/committee` protected by admin role
- Imported CommitteeManagement component

#### 3. Bottom Navigation
**File**: `frontend/src/components/BottomNavigation.jsx`

- Added "Committee" icon (users icon)
- Added "കമ്മിറ്റി" tab for admin users
- Positioned between QHLS and Admin tabs

## Database Models Used

### Committee Model
```javascript
{
  committeeId: String (unique, auto-generated),
  name: String (required),
  roleId: String (required),
  zoneId: String (required),
  mobile: String (optional),
  whatsapp: String (optional),
  timestamps: true
}
```

### CommitteeRole Model
```javascript
{
  roleId: String (unique),
  name: String (Malayalam name),
  englishName: String,
  timestamps: true
}
```

### Zone Model
```javascript
{
  zoneId: String (unique),
  name: String,
  districtId: String,
  roles: Array,
  timestamps: true
}
```

## Access Control
- Committee management is restricted to **admin users only**
- Protected by `requiredRole="admin"` in the route
- Only visible in navigation for admin users

## User Flow

1. Admin navigates to Committee tab in bottom navigation
2. Clicks "+ Add Member" button to open the form
3. Fills in required fields (Name, Role, Zone) and optional fields (Mobile, WhatsApp)
4. Submits form to create new committee member
5. Can filter table by zone using dropdown
6. Can edit existing members by clicking edit button
7. Can delete members by clicking delete button (with confirmation)

## Styling
- Consistent with existing app design
- Uses CSS variables for theming
- Responsive grid layout for form
- Hover effects on buttons and table rows
- Clean, modern card-based UI

## Next Steps (Optional Enhancements)
- Add search functionality to filter by name
- Add bulk import from CSV/Excel
- Add export to PDF/Excel functionality
- Add committee member photos
- Add email field
- Add pagination for large datasets
- Add sorting by columns
