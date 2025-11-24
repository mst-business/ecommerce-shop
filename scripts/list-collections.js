const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  const dbName = process.env.MONGO_DB_NAME || 'ecommerce';

  console.log('Listing MongoDB collections...');
  console.log(`URI: ${uri}`);
  console.log(`DB Name: ${dbName}`);

  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('No collections found in this database.');
    } else {
      collections.forEach((c) => console.log(`- ${c.name}`));
    }
  } catch (err) {
    console.error('Failed to list collections:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();


