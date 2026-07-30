import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initializeWebSocket } from './websocket/socket';
import { testConnection } from './config/database';

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION: Server caught an unexpected error!');
  console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION: Promise rejection was not caught!');
  console.error('Reason:', reason);
});

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initializeWebSocket(server);

  // Test Direct AWS RDS MySQL Connection
  const isConnected = await testConnection();
  if (isConnected) {
    console.log('✅ Connected to AWS RDS MySQL pool (mysql2)');
  } else {
    console.warn('⚠️ Could not connect to AWS RDS MySQL. Check credentials in .env file.');
  }

  // Start HTTP + Socket server
  server.listen(env.PORT, () => {
    console.log(`
    ================================================
    🎪 UTSAV DIRECT RDS MYSQL BACKEND IS LIVE!
    ================================================
    📡 REST API:    http://localhost:${env.PORT}/api
    🏥 Health:      http://localhost:${env.PORT}/health
    ⚡ WebSocket:   ws://localhost:${env.PORT}
    🗄️ Database:    AWS RDS MySQL (${env.DB_HOST})
    ================================================
    `);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
