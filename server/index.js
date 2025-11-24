require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./routes');
const { connectDatabase } = require('./config/database');
const { seedExampleData } = require('./config/seed');

const app = express();
const PORT = process.env.API_PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

app.use(
  '/images',
  express.static(path.join(__dirname, '..', 'public', 'images'))
);

app.use('/api', apiRouter);

async function startServer() {
  try {
    await connectDatabase();
    await seedExampleData();

    app.listen(PORT, () => {
      console.log(`API server listening at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

startServer();

