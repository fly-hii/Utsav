import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

let io: Server;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware for WebSocket
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const decoded = verifyAccessToken(token);
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`[WebSocket] User connected: ${userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Join committee room if applicable
    socket.on('join:committee', (committeeId: string) => {
      socket.join(`committee:${committeeId}`);
      console.log(`[WebSocket] User ${userId} joined committee room: ${committeeId}`);
    });

    socket.on('leave:committee', (committeeId: string) => {
      socket.leave(`committee:${committeeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] User disconnected: ${userId}`);
    });
  });

  return io;
}

/**
 * Get the WebSocket server instance
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

// ============================================================
// Emit helpers for real-time events
// ============================================================

/**
 * Emit a new donation event to a committee room
 */
export function emitDonation(committeeId: string, donation: any): void {
  getIO().to(`committee:${committeeId}`).emit('donation:new', donation);
}

/**
 * Emit a new expense event to a committee room
 */
export function emitExpense(committeeId: string, expense: any): void {
  getIO().to(`committee:${committeeId}`).emit('expense:new', expense);
}

/**
 * Emit a notification to a specific user
 */
export function emitNotification(userId: string, notification: any): void {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emit dashboard update to a committee room
 */
export function emitDashboardUpdate(committeeId: string, data: any): void {
  getIO().to(`committee:${committeeId}`).emit('dashboard:update', data);
}
