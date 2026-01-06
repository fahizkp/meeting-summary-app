# RBAC Quick Reference

## Google Sheets Update (REQUIRED FIRST!)

### Users Sheet - New Structure
```
Column A: Username
Column B: Password
Column C: Roles (comma-separated)
Column D: ZoneAccess (comma-separated zone IDs)
Column E: CreatedDate
```

### Example Users
```
admin1    | pass123 | admin                        |        | 2026-01-01
district1 | pass123 | district_admin               |        | 2026-01-01
zone1     | pass123 | zone_admin                   | Z001   | 2026-01-01
zone2     | pass123 | zone_admin                   | Z002   | 2026-01-01
both1     | pass123 | zone_admin,district_admin    | Z003   | 2026-01-01
```

## Role Permissions Matrix

| Action | zone_admin | district_admin | admin |
|--------|-----------|----------------|-------|
| Create Meeting | ✅ (own zones) | ❌ | ✅ |
| Edit Meeting | ✅ (own zones) | ❌ | ✅ |
| Delete Meeting | ✅ (own zones) | ❌ | ✅ |
| View Meetings | ✅ (own zones) | ✅ (all zones) | ✅ |
| Dashboard | ❌* | ✅ (all zones) | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

*Unless also has district_admin role

## UI Visibility

### Navigation Tabs
- **മീറ്റിംഗ് ഫോം**: zone_admin, admin
- **റിപ്പോർട്ട്**: Everyone
- **ഡാഷ്ബോർഡ്**: district_admin, admin

### Meeting Report Buttons
- **View**: Everyone
- **Edit**: zone_admin (own zones), admin
- **Delete**: zone_admin (own zones), admin

## Testing Checklist

- [ ] Updated Users sheet with new columns
- [ ] Added test users with different roles
- [ ] Restarted backend server
- [ ] Logged in as zone_admin - sees only assigned zones
- [ ] Logged in as district_admin - sees all meetings, no edit
- [ ] Logged in as admin - sees everything, can edit
- [ ] Logged in as combined role - has both permissions
- [ ] Tabs show/hide correctly
- [ ] Edit/Delete buttons show/hide correctly

## Common Issues

### "No zones accessible"
- Check ZoneAccess column has correct zone IDs
- Zone IDs must match ZoneData sheet exactly
- Example: If ZoneData has "Z001", use "Z001" not "Zone 1"

### "Can't see meetings"
- Zone filtering uses zone ID/name matching
- Check zone helper is caching zones correctly
- Verify meetings have zoneName field

### "Edit buttons not showing"
- Check user has zone_admin role
- Verify canEditMeetings() returns true
- Check browser console for errors

## Files to Know

### Backend
- `middleware/authorize.js` - Authorization functions
- `services/googleSheets.js` - User data parsing
- `routes/auth.js` - JWT token generation

### Frontend
- `services/auth.js` - Permission checking
- `services/zoneHelper.js` - Zone ID/name mapping
- `App.jsx` - Navigation control
- `components/MeetingForm.jsx` - Zone filtering
- `components/MeetingReport.jsx` - Meeting filtering

## Quick Commands

```bash
# Restart backend (if needed)
cd backend
npm start

# Check backend logs
# Look for user login and role information

# Frontend should auto-reload
# If not, refresh browser
```

## Support

See detailed documentation in:
- `.claude/rbac_complete_summary.md` - Full implementation details
- `.claude/rbac_implementation_plan.md` - Original plan
- `.claude/rbac_progress.md` - Progress tracking
