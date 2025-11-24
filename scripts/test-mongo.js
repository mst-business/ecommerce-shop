const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  const dbName = process.env.MONGO_DB_NAME || 'ecommerce';

  console.log('Testing MongoDB connection...');
  console.log(`URI: ${uri}`);
  console.log(`DB Name: ${dbName}`);

  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    console.log('Mongo connection successful');
  } catch (err) {
    console.error('Mongo connection failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();


