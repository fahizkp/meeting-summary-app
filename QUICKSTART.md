# Quick Start Guide

## Prerequisites Check

- [ ] Node.js installed (v16+)
- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] Service Account created and key downloaded
- [ ] Google Sheets spreadsheet created with ZoneData and Agenda sheets
- [ ] Spreadsheet shared with service account email

## 5-Minute Setup

### 1. Backend Setup (2 minutes)

```bash
cd meeting-summary-app/backend
npm install
```

Create `.env` file:
```env
GOOGLE_SHEETS_SPREADSHEET_ID=1Uvk7jYc680IvuuVFB2G3sLX79psU1ew7BCMSGcXTx7w
GOOGLE_SHEETS_CLIENT_EMAIL=mlp-east-admin@meeting-minutes-v1.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCyTrpNQzfq0mg0\n7z6eG+5rMQLPkfjRke8cWy/aFKxQ5W0tZ9ZTZzIpPYvMrZpDAmt8Xf6JNJ0/peK9\nGKBUsUVtV54qwfuTIpTjVfyWSkDonAHShfWuOXcYHFt2sAmQTk2ukVs226CSORFT\nu7ViuWa/U5vL4DqYXNqQj0cQvjGZ+RjLWPmEdulGV3Ct12gT+RNQ/GjFIU9augoW\n89hNeau1NXilyolUUc09AgJ8f9m3gHUzYlsk/4NRzEbymGsz8AGSd1t1vytiRa3d\npEtifaV1x8UGvu8q2iz47M6qEXIgWYw//3O/QFaSbgqeYc3kN3GcHp3QloNejS6Y\nKPMKXBThAgMBAAECggEAKlfaU6tFDelyEDIJbXwmEgQFThw02bW9cf8wnaofoqVd\nGDWKtuswhQ0l1BEc61FZi6L5pYUeW6VN80h0GLCxU05FlBNVZiNF9reugFU5VVPo\n9eDUj097ufjP+p9C4idKOMyxe9VLrDXLqNYQdNWg8goNmyyQVarlR4OS5YW5Gz5g\nHMKzMcHnCaPLZN4JkDm0llHJKudITsBdNTtc6GZr2BHsDmlA0F9nxNktniWpon3z\nq9QnHlgbJ6k1kJ1tvq8xE1Ek6aX37DjSpsThYlc1TZu38mrrz+jKwHVL80pNsyJt\nkSsYpWMm81uNGJJJL8qXIgf9joHkdZLAfAC/fwXAfQKBgQDWN3Ef5TjdDHHHyjCw\nUZbZVjfuKVKsdRDyQHM1NNJSV+Ly+5AZKMrBqSyacsTTdQIPvf0a1Kvjh8Au7ZrE\noQmzserwAy08GRYA5LbNKAKTy+8YmoPMX6YtFglOSkA+Eg5h5VGiOcuUpPegBOjf\nfACEJtANe3Pco/rj2VBJE8PIzQKBgQDVFjnbe0IyP1HfgWovxWOymHl0ijlYhKyi\nakNDeEQwwZZGBK0gCm2y93QrLOob9SH0TzlwrqAHorpmdaAgx6T39bCqWhmZ0E+P\nXvGk2NmqNNLcrHdvJyBuSbPQLNqf6scyJCfzhYzEfDk00Dd0tCeycPmDRJnQAyMK\n0xdb/IVMZQKBgHuYz498nTuFM5z3vvHskWHiyjCC7S2N+fIcV5yqVnOmO87AcNrj\nW2EzsAWJFKGBEGhu0TuK24ZTTAKHm1W6KLPigtBqtM3JF5X6YLKsVBhcgR6sAEGK\nKoI3BbWDR9/IYT4ApwI34ItqR2mvi4FutYmKL16oDSiQAHE4cIdJfRw9AoGAFV/r\nYdbVZxDu94qVykD0pT+iP0x2QCje4FPkd2oi/PkOR+vEKgihxGgKISKaQT+vrkAc\nNO9vYhSyugBmlaMxKyZcGFp9Yu6AbJNLjguqmeY+mKA8Qswb9rQx81nsfEoivSbf\nUxA8dKE5Y9DXHz/LE509iitheno2E6nlF/cWr/kCgYEAqJNoIKO3VSgr7r+caLHa\nH2qULfILvzNCkIx7gbEhvC25bqnGWZkgSpIujB0F6zxt1EwUluYIszwl/pnjDth6\nKUyVdWnJi1KcHRIp1N1uMZbEpOrmt1Gv1LO+R1DsfLw12c3nT2uhlSaYOZk23Ms4\ntGqDSoiZBj8/A9xusgxv1pc=\n-----END PRIVATE KEY-----\n"
PORT=3001
```

Start backend:
```bash
npm start
```

### 2. Frontend Setup (1 minute)

```bash
cd meeting-summary-app/frontend
npm install
npm run dev
```

### 3. Access Application

Open browser: `http://localhost:3000`

## Google Sheets Setup Checklist

### ZoneData Sheet
- [ ] Column A: ZoneId
- [ ] Column B: ZoneName  
- [ ] Column C: AttendeeName
- [ ] Column D: Role
- [ ] Added all 17 zones
- [ ] Added attendees for each zone (one row per attendee)

### Agenda Sheet
- [ ] Column A: AgendaItem (one item per row, starting from row 2)
- [ ] Added agenda items

### Week-Based Meeting Sheets
- [ ] **Note**: Week sheets (e.g., `Nov19`, `Nov26`, `Dec02`) are created automatically
- [ ] No manual setup needed - sheets are created when meetings are saved
- [ ] Sheet names are based on the Wednesday of the week (format: `MMMDD`)

### Permissions
- [ ] Spreadsheet shared with service account email
- [ ] Service account has "Editor" role

## Testing

1. Select a zone from dropdown
2. Verify attendees load
3. Mark some attendees as Present/Absent
4. Add absence reasons for absent attendees
5. Add meeting minutes
6. Submit form
7. Check Google Sheets - new row should appear in the week-specific sheet (e.g., `Nov19`, `Nov26`)

## Common Issues

**Backend won't start:**
- Check `.env` file exists and has all variables
- Verify private key format (keep `\n` characters)

**Frontend can't connect:**
- Ensure backend is running on port 3001
- Check browser console for CORS errors

**No zones/attendees loading:**
- Verify spreadsheet ID is correct
- Check spreadsheet is shared with service account
- Verify ZoneData sheet has correct column structure

**Can't save meetings:**
- Week sheets are created automatically - no manual setup needed
- Verify service account has Editor permissions
- Check that the date format is correct (YYYY-MM-DD)

