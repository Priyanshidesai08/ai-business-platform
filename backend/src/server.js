import app from './app.js';
import { env } from './config/env.js';
import { testDatabaseConnection } from './config/db.js';

const startServer = async () => {
  try {
    await testDatabaseConnection();
    app.listen(env.port, () => {
      console.log(`API running on port ${env.port}`);
      console.log(`Swagger docs available at http://localhost:${env.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
