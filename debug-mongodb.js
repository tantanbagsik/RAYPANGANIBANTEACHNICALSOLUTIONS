const mongoose = require('mongoose');

// Try different connection string formats
const uri1 = "mongodb+srv://titanbagsik:db_Titankalimot08!@cluster0.oxa8u39.mongodb.net/edulearn?retryWrites=true&w=majority";
const uri2 = "mongodb://titanbagsik:db_Titankalimot08!@cluster0.oxa8u39.mongodb.net:27017/edulearn?retryWrites=true&w=majority";

console.log('Testing connection with SRV format...');
mongoose.connect(uri1, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('SRV format connected successfully!');
  mongoose.disconnect();
})
.catch(err => {
  console.error('SRV format connection error:', err.message);
  
  console.log('\nTesting connection with standard format...');
  mongoose.connect(uri2, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('Standard format connected successfully!');
    mongoose.disconnect();
  })
  .catch(err2 => {
    console.error('Standard format connection error:', err2.message);
  });
});