import { io } from "socket.io-client";

const FORM_API_URL = import.meta.env.VITE_FORM_API_URL || "http://localhost:3000";

export const socket = io(FORM_API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
