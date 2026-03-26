#!/usr/bin/env node

require('dotenv').config()
const mongoose = require('mongoose')

console.log('MONGODB_URI:', process.env.MONGODB_URI)

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edulearn')
    console.log('✅ Connected to MongoDB')
    
    // Test the connection with a simple command
    await mongoose.connection.db.admin().ping()
    console.log('✅ Database ping successful')
    
    console.log('Available collections:')
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(collections.map(c => c.name).join(', '))
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  }
}

testConnection()