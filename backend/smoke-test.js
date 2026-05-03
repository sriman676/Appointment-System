const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load basic env (we will override MONGO_URI)
dotenv.config();

const startSmokeTest = async () => {
  try {
    console.log('--- STARTING SMOKE TEST MODE (In-Memory Database) ---');
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    
    // OVERRIDE for server.js
    process.env.MONGO_URI = uri;
    console.log(`[SMOKE] Virtual MongoDB started at: ${uri}`);

    // Require the actual server
    // Note: server.js calls connectDB() internally when not in 'test' env
    const server = require('./server');
    
    // Give it a second to connect
    setTimeout(() => {
      console.log('--- SYSTEM READY FOR VERIFICATION ---');
      console.log('Frontend: http://localhost:5173');
      console.log('Backend API: http://localhost:5000');
    }, 2000);

  } catch (error) {
    console.error('[SMOKE] Failed to start:', error);
  }
};

startSmokeTest();
