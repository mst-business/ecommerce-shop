const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

let isConnected = false;

async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(MONGO_URI, {
    dbName: MONGO_DB_NAME,
  });

  isConnected = true;
  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};


