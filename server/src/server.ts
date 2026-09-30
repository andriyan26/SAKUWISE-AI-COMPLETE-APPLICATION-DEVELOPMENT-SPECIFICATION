import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 SAKUWISE AI Server running on port ${ENV.PORT}`);
  console.log(`🌐 Base URL: http://localhost:${ENV.PORT}`);
  console.log(`✨ Health check: http://localhost:${ENV.PORT}/api/health`);
  console.log(`⚡ Environment: ${ENV.NODE_ENV}`);
  console.log(`=========================================`);
});
