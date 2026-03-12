require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ 
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false 
}));
app.use(compression());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/search', require('./routes/search'));
app.use('/api/content', require('./routes/content'));

// Config route for IP discovery in development
app.get('/api/config', (req, res) => {
  let localIp = 'localhost';
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) { localIp = iface.address; break; }
    }
  }
  res.json({ localIp, port: PORT });
});

// Export for Vercel
module.exports = app;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running → http://localhost:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
