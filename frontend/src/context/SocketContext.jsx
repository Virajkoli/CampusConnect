import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const normalizeBaseUrl = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const isLocalHost = (host = "") => {
  const normalized = String(host || "")
    .trim()
    .toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
};

const resolveSocketServerUrl = () => {
  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_URL || "");
  const localhostBase = "http://localhost:5000";

  if (typeof window === "undefined") {
    return envBase || localhostBase;
  }

  const currentHost = String(window.location.hostname || "").trim();
  if (!isLocalHost(currentHost)) {
    return envBase || localhostBase;
  }

  if (!envBase) {
    return localhostBase;
  }

  try {
    const envHost = new URL(envBase).hostname;
    if (!isLocalHost(envHost)) {
      return localhostBase;
    }
  } catch {
    return localhostBase;
  }

  return envBase;
};

const SOCKET_SERVER_URL = resolveSocketServerUrl();

// Create a context for the socket
const SocketContext = createContext();

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user] = useAuthState(auth);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  // Connect to the socket when the authenticated user changes.
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch {
          // Ignore cleanup failures on sign-out.
        }
      }
      socketRef.current = null;
      setSocket(null);
      setConnectionError(null);
      return;
    }

    let nextSocket;

    try {
      nextSocket = io(SOCKET_SERVER_URL, {
        query: {
          userId: user.uid,
          userName: user.displayName || "Anonymous",
        },
        reconnectionAttempts: 6,
        reconnectionDelay: 1000,
        timeout: 10000,
      });
    } catch (err) {
      console.error("Socket creation error:", err);
      setConnectionError("Failed to initialize chat");
      return;
    }

    const onConnect = () => {
      setConnectionError(null);
    };

    const onConnectError = (err) => {
      console.error("Socket connection error:", err);
      setConnectionError("Realtime connection issue");
    };

    const onDisconnect = (reason) => {
      if (reason !== "io client disconnect") {
        console.warn("Socket disconnected:", reason);
      }
    };

    nextSocket.on("connect", onConnect);
    nextSocket.on("connect_error", onConnectError);
    nextSocket.on("disconnect", onDisconnect);

    socketRef.current = nextSocket;
    setSocket(nextSocket);

    return () => {
      if (nextSocket) {
        try {
          nextSocket.off("connect", onConnect);
          nextSocket.off("connect_error", onConnectError);
          nextSocket.off("disconnect", onDisconnect);
          nextSocket.disconnect();
          if (socketRef.current === nextSocket) {
            socketRef.current = null;
            setSocket(null);
          }
        } catch (err) {
          console.error("Socket cleanup error:", err);
        }
      }
    };
  }, [user?.uid, user?.displayName]);

  // The value that will be given to the context
  const value = { socket, connectionError };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
