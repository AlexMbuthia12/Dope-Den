const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
   await connectDB();

   app.listen(PORT, () => {
     logger.info(`Server running on http://localhost:${PORT}`);
   });
  } catch (error) {
   logger.error(`Failed to start server: ${error.message}`);
   process.exit(1);
  }
}

startServer();

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
