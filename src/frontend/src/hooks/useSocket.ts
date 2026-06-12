import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

// Explicit env wins; otherwise dev talks to the API directly, while prod connects
// same-origin (nginx reverse-proxies /socket.io to the API container).
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');
// Backend messaging gateway uses the `messaging` namespace
const MESSAGING_NS = `${SOCKET_URL}/messaging`;

let globalSocket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(MESSAGING_NS, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on unmount — keep global connection alive
    };
  }, [accessToken]);

  const emit = useCallback((event: string, data?: unknown) => {
    globalSocket?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    globalSocket?.on(event, handler);
    return () => { globalSocket?.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    globalSocket?.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
