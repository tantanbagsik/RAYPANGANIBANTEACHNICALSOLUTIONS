const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Webhook system is running'
  });
});

const PORT = process.env.HEALTH_CHECK_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Health check service running on port ${PORT}`);
});