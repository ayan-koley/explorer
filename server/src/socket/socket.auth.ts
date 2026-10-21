import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';

export type AuthUser = { id: number; username?: string };

function tokenFromSocket(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) return authToken;

  const authorization = socket.handshake.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length);

  const accessCookie = socket.handshake.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('accessToken='));
  return accessCookie ? decodeURIComponent(accessCookie.slice('accessToken='.length)) : null;
}

export function authenticateSocket(socket: Socket, next: (error?: Error) => void) {
  const token = tokenFromSocket(socket);
  if (!token) return next(new Error('Authentication required'));

  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error('Invalid or expired access token'));
  }
}
