const express = require('express');
const cors = require('cors');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/hello', (_req, res) => {
  res.json({ msg: 'Hello from backend!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`meeting-summary-backend listening on port ${PORT}`);
});

