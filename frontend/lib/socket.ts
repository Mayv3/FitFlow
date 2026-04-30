import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const token = Cookies.get('token') ?? ''
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      auth: { token },
      withCredentials: true,
    });
  }
  return socket;
}
