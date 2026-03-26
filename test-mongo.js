// MongoDB Connection Test
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

console.log('Using MongoDB URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('✅ Connected to MongoDB successfully');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // Test a simple query
    const db = mongoose.connection.db;
    const { name } = await db.collection('counters').findOne({ _id: 'test' });
    console.log('Test document found:', name);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();