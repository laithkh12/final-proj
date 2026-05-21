import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`TeamFlow API running on port ${env.port}`);
    console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
