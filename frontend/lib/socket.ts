import { io, Socket } from 'socket.io-client';
let socket: Socket | null = null;

export function getSocket(gymId: string) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      query: { gymId },
      withCredentials: true,
    });
  }
  return socket;
}