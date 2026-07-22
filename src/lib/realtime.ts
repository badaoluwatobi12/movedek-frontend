import { io, type Socket } from "socket.io-client";

const baseUrl = () => (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/api\/?$/, "");
let socket: Socket | null = null;
export function realtimeSocket() {
  if (!socket) socket = io(baseUrl(), { withCredentials: true, transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 10000 });
  return socket;
}
