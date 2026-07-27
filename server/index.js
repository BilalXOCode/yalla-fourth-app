// Yalla Fourth - Express server
// In production this single service serves BOTH the REST API and the
// built React app (client/dist), so the whole site runs on one URL.
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// --- Connect to MongoDB Atlas (prints success/failure in the terminal) -----
connectDB();

// --- API routes -----------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Yalla Fourth',
    stage: 3,
    time: new Date().toISOString(),
  });
});

app.use('/api/venues', require('./routes/venues.js'));
app.use('/api/matches', require('./routes/matches.js'));

// --- Serve the built React app in production ------------------------------
if (isProduction) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Yalla Fourth server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
