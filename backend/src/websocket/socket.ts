import { Server as HttpServer } from 'http';

/**
 * [Vercel Production Fix]
 * WebSocket (socket.io) has been disabled.
 * Vercel Serverless functions do not support persistent WebSocket connections.
 * These are now no-ops to prevent crashes while maintaining API compatibility.
 */

export function initializeWebSocket(httpServer: HttpServer): any {
  console.log('[WebSocket] Disabled for Vercel serverless environment.');
  return null;
}

export function getIO(): any {
  return null;
}

// ============================================================
// Emit helpers (No-ops for Vercel)
// ============================================================

export function emitDonation(committeeId: string, donation: any): void {
  // No-op
}

export function emitExpense(committeeId: string, expense: any): void {
  // No-op
}

export function emitNotification(userId: string, notification: any): void {
  // No-op
}

export function emitDashboardUpdate(committeeId: string, data: any): void {
  // No-op
}
