const mongoose = require('mongoose');

// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
// const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

const MONGO_URI="mongodb+srv://app:Njs5GskFAcpuuwmU@cluster0.r9ehqv7.mongodb.net/?appName=Cluster0";
const MONGO_DB_NAME ="ecommerce";

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


