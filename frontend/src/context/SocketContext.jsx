import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// Create a context for the socket
const SocketContext = createContext();

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user] = useAuthState(auth);
  const [connectionError, setConnectionError] = useState(null);  // Connect to the socket when the user is authenticated
  useEffect(() => {
    let newSocket = null;

    // Only create socket if we have a user and we're not already connected
    if (user && !socket) {
      console.log("Attempting to connect socket for user:", user.displayName);
      
      try {
        // Connect to the socket server with error handling
        // Using the correct server port that matches your backend
        newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
          query: {
            userId: user.uid,
            userName: user.displayName || "Anonymous",
          },
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
          autoConnect: false, // Don't auto connect to avoid connection errors
        });

        // Set up all event handlers before connecting
        newSocket.on("connect", () => {
          console.log("Socket connected successfully");
          setConnectionError(null);
        });

        // Handle connection errors gracefully to prevent app crashes
        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setConnectionError("Chat server connection issue");
          
          // Don't keep trying to reconnect - this prevents cascading errors
          newSocket.disconnect();
        });

        // Handle disconnection
        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
        });
        
        // Only after setting up all handlers, connect and store in state
        try {
          newSocket.connect();
          setSocket(newSocket);
        } catch (connectErr) {
          console.error("Failed to connect socket:", connectErr);
        }
      } catch (err) {
        console.error("Socket creation error:", err);
        setConnectionError("Failed to initialize chat");
      }
    }

    // Clean up function
    return () => {
      // Use the socket from closure and from state to ensure we clean up correctly
      const socketToCleanup = newSocket || socket;
      
      if (socketToCleanup) {
        console.log("Cleaning up socket connection");
        try {
          // Properly clean up to prevent memory leaks
          socketToCleanup.off("connect");
          socketToCleanup.off("connect_error");
          socketToCleanup.off("disconnect");
          socketToCleanup.removeAllListeners();
          socketToCleanup.disconnect();
          
          // Only clear the state if the socket being cleaned up is the current socket
          if (socketToCleanup === socket) {
            setSocket(null);
          }
        } catch (err) {
          console.error("Socket cleanup error:", err);
        }
      }
    };
  }, [user, socket]);

  // The value that will be given to the context
  const value = { socket, connectionError };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
