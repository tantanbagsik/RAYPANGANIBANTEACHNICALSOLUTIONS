const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://titanbagsik:db_Titankalimot08!@cluster0.oxa8u39.mongodb.net/edulearn?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });