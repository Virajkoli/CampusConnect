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
  const [connectionError, setConnectionError] = useState(null);

  // Connect to the socket when the user is authenticated
  useEffect(() => {
    let newSocket = null;

    if (user) {
      console.log(
        "Attempting to connect socket.io for user:",
        user.displayName
      );

      try {
        // Connect to the socket server
        newSocket = io("http://localhost:5000", {
          query: {
            userId: user.uid,
            userName: user.displayName || "Anonymous",
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        newSocket.on("connect", () => {
          console.log("Socket.io connected successfully");
          setConnectionError(null);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setConnectionError(
            "Unable to connect to chat server. Please try again later."
          );
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
        });

        // Set the socket in state
        setSocket(newSocket);
      } catch (err) {
        console.error("Error creating socket connection:", err);
        setConnectionError("Failed to initialize chat connection");
      }

      // Cleanup function to disconnect socket when the component unmounts or user logs out
      return () => {
        if (newSocket) {
          console.log("Disconnecting socket");
          newSocket.disconnect();
        }
      };
    }

    return () => {};
  }, [user]);

  // The value that will be given to the context
  const value = { socket, connectionError };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
