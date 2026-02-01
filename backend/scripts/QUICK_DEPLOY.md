# 🚀 Quick Deploy - Committee Migration

## Fastest Method (Using Docker)

### 1️⃣ Upload Script
```bash
scp backend/scripts/migrateCommitteeToServer.js user@server:/srv/apps/meeting-summary/backend/scripts/
```

### 2️⃣ Run on Server
```bash
ssh user@server
cd /srv/apps/meeting-summary
docker-compose exec backend node scripts/migrateCommitteeToServer.js
```

### 3️⃣ Verify
```bash
docker-compose exec backend node scripts/verifyServerData.js
```

---

## Alternative: Import Pre-Exported Data

### 1️⃣ Upload Data
```bash
scp -r backend/scripts/exported_data user@server:/srv/apps/meeting-summary/backend/scripts/
scp backend/scripts/serverImport.js user@server:/srv/apps/meeting-summary/backend/scripts/
```

### 2️⃣ Run Import
```bash
ssh user@server
cd /srv/apps/meeting-summary
docker-compose exec backend node scripts/serverImport.js
```

---

## What You'll Get

✅ **135 committee members** migrated
✅ **17 zones** with committee data
✅ **Suhair in Pandikkad** ✓
✅ All roles properly assigned

---

## Troubleshooting

**Container not running?**
```bash
docker-compose up -d backend
docker-compose ps
```

**Check logs:**
```bash
docker-compose logs backend
```

**Access container:**
```bash
docker-compose exec backend sh
```

---

## Files You Need

- ✅ `migrateCommitteeToServer.js` - Main migration (from Google Sheets)
- ✅ `serverImport.js` - Import from JSON files
- ✅ `exported_data/` folder - Pre-exported data
- ✅ `verifyServerData.js` - Verification script

All files are in `backend/scripts/` directory.

---

**Choose your method and deploy! Both work perfectly.** 🎯
