import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function Chats() {
  const { teacherId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connectionError } = useSocket();
  const [user, loading] = useAuthState(auth);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [chattingWith, setChattingWith] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState("");

  // Track processed messages to avoid duplicates
  const [processedMessageIds] = useState(new Set());

  console.log("Rendering Chats component with teacherId:", teacherId);
  console.log("User auth state:", { user, loading });

  // Use socket connection error if present
  useEffect(() => {
    if (connectionError) {
      console.error("Socket connection error detected:", connectionError);
      setError(connectionError);
    }
  }, [connectionError]);

  // Check if user is a teacher
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const token = await user.getIdTokenResult();
          console.log("User token claims:", token.claims);
          setIsTeacher(!!token.claims.teacher);
        } catch (err) {
          console.error("Error getting user token:", err);
          setError("Authentication error. Please try logging in again.");
        }
      }
    };

    if (user) {
      checkUserRole();
    }
  }, [user]);

  // Handle student view with specific teacher - FIXED LOADING ISSUE
  useEffect(() => {
    let messagesUnsubscribe = null;

    // Don't try to setup chat until auth is complete and role is determined
    if (loading || !user) return;

    const setupChat = async () => {
      // Only proceed if this is a student (not a teacher) and teacherId is available
      if (isTeacher === false && teacherId) {
        console.log("Setting up student chat with teacher:", teacherId);
        setIsLoading(true);

        try {
          // Get teacher details from Firestore
          const teacherDocRef = doc(firestore, "teachers", teacherId);
          const teacherDoc = await getDoc(teacherDocRef);

          if (!teacherDoc.exists()) {
            console.error("Teacher document not found for ID:", teacherId);
            setError(
              "Teacher not found. They may have been removed from the system."
            );
            setIsLoading(false);
            return;
          }

          const teacherData = teacherDoc.data();
          console.log("Found teacher:", teacherData.name);

          setChattingWith({
            id: teacherId,
            ...teacherData,
          });

          // Check if chat already exists between this student and teacher
          const chatQuery = query(
            collection(firestore, "chats"),
            where("studentId", "==", user.uid),
            where("teacherId", "==", teacherId)
          );

          const chatSnapshot = await getDocs(chatQuery);
          console.log("Existing chat search results:", chatSnapshot.size);

          let chatDocId;

          if (chatSnapshot.empty) {
            // Create a new chat
            console.log("Creating new chat between student and teacher");
            const newChatRef = await addDoc(collection(firestore, "chats"), {
              studentId: user.uid,
              teacherId: teacherId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastMessage: "",
              lastMessageTimestamp: null,
            });
            chatDocId = newChatRef.id;
            console.log("New chat created with ID:", chatDocId);
          } else {
            // Use existing chat
            chatDocId = chatSnapshot.docs[0].id;
            console.log("Using existing chat with ID:", chatDocId);
          }

          // Set the chatId in state so other effects can use it
          setChatId(chatDocId);

          // Load messages for this chat
          const messagesQuery = query(
            collection(firestore, "messages"),
            where("chatId", "==", chatDocId),
            orderBy("timestamp", "asc")
          );

          console.log("Setting up messages listener for chat:", chatDocId);
          messagesUnsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
              console.log("Messages snapshot received:", snapshot.size);
              const messageList = [];

              snapshot.docs.forEach((doc) => {
                const messageData = {
                  id: doc.id,
                  ...doc.data(),
                };

                // Only add messages we haven't processed yet
                if (!processedMessageIds.has(doc.id)) {
                  processedMessageIds.add(doc.id);
                  messageList.push(messageData);
                }
              });

              // Only update state if we have new messages
              if (messageList.length > 0) {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  ...messageList,
                ]);
              }

              setIsLoading(false);
            },
            (err) => {
              console.error("Error in messages snapshot:", err);
              setError("Failed to load messages: " + err.message);
              setIsLoading(false);
            }
          );
        } catch (err) {
          console.error("Error setting up chat:", err);
          setError("Failed to setup chat: " + err.message);
          setIsLoading(false);
        }
      } else if (!teacherId) {
        // No teacherId specified, so this is just the main chat page
        setIsLoading(false);
      }
    };

    setupChat();

    // Clean up listeners when component unmounts
    return () => {
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    };
  }, [user, teacherId, loading, isTeacher, processedMessageIds]);

  // Connect to socket.io chat room when chatId is available
  useEffect(() => {
    if (socket && chatId) {
      console.log("Joining chat room:", chatId);
      socket.emit("join_chat", chatId);

      // Handle receiving messages via socket
      socket.on("receive_message", (newMessage) => {
        console.log("Received socket message:", newMessage);

        // Only add the message if we haven't seen it before
        if (newMessage.id && !processedMessageIds.has(newMessage.id)) {
          processedMessageIds.add(newMessage.id);
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      });

      socket.on("typing_indicator", ({ username, isTyping }) => {
        setIsTyping(isTyping);
        setWhoIsTyping(username);
      });

      socket.on("message_sent", (confirmation) => {
        console.log("Message sent confirmation:", confirmation);
      });

      return () => {
        console.log("Leaving chat room:", chatId);
        socket.off("receive_message");
        socket.off("typing_indicator");
        socket.off("message_sent");
      };
    }
  }, [socket, chatId, processedMessageIds]);

  // Handle teacher view - list of student chats
  useEffect(() => {
    let chatsUnsubscribe = null;

    if (isTeacher && user && !teacherId) {
      setIsLoading(true);

      const fetchTeacherChats = async () => {
        try {
          console.log("Fetching chats for teacher:", user.uid);
          const chatsQuery = query(
            collection(firestore, "chats"),
            where("teacherId", "==", user.uid)
          );

          chatsUnsubscribe = onSnapshot(
            chatsQuery,
            async (snapshot) => {
              console.log("Teacher chats snapshot received:", snapshot.size);
              const chatList = [];

              if (snapshot.empty) {
                setChats([]);
                setIsLoading(false);
                return;
              }

              for (const chatDoc of snapshot.docs) {
                const chatData = chatDoc.data();
                // Fetch student details
                try {
                  const studentDoc = await getDoc(
                    doc(firestore, "users", chatData.studentId)
                  );
                  if (studentDoc.exists()) {
                    chatList.push({
                      id: chatDoc.id,
                      ...chatData,
                      studentName: studentDoc.data().name || "Unknown Student",
                      studentEmail: studentDoc.data().email || "No email",
                    });
                  }
                } catch (err) {
                  console.error("Error fetching student details:", err);
                }
              }

              setChats(chatList);
              setIsLoading(false);
            },
            (err) => {
              console.error("Error in chats snapshot:", err);
              setError("Failed to load chats: " + err.message);
              setIsLoading(false);
            }
          );
        } catch (err) {
          console.error("Error fetching teacher chats:", err);
          setError("Failed to load chats. Please try again.");
          setIsLoading(false);
        }
      };

      fetchTeacherChats();

      return () => {
        if (chatsUnsubscribe) {
          chatsUnsubscribe();
        }
      };
    }
  }, [isTeacher, user, teacherId]);

  // Handle teacher selecting a chat
  const handleChatSelect = (selectedChat) => {
    // Clear any previous messages and processed IDs
    setMessages([]);
    processedMessageIds.clear();

    setChatId(selectedChat.id);
    setChattingWith({
      id: selectedChat.studentId,
      name: selectedChat.studentName,
      email: selectedChat.studentEmail,
    });

    // Load messages for the selected chat
    const messagesQuery = query(
      collection(firestore, "messages"),
      where("chatId", "==", selectedChat.id),
      orderBy("timestamp", "asc")
    );

    const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => {
        const messageData = {
          id: doc.id,
          ...doc.data(),
        };
        processedMessageIds.add(doc.id);
        return messageData;
      });

      setMessages(messageList);
      setIsLoading(false);
    });
  };

  // Handle sending a message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !chatId) return;

    const newMessage = {
      chatId,
      senderId: user.uid,
      receiverId: isTeacher ? chattingWith.id : teacherId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      // Only send through socket for real-time
      // The server will handle storing in Firestore
      if (socket) {
        socket.emit("send_message", newMessage);
        console.log("Message sent through socket:", newMessage);

        // Clear the message input immediately for better UX
        setMessage("");
      } else {
        // Fallback for when socket is not available
        console.error("Socket not available, trying direct Firestore save");
        await addDoc(collection(firestore, "messages"), newMessage);
        setMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing events
  const handleTyping = () => {
    if (socket && chatId && user?.displayName) {
      socket.emit("typing", {
        chatId,
        username: user.displayName,
      });

      // Clear typing indicator after 2 seconds
      setTimeout(() => {
        socket.emit("stop_typing", {
          chatId,
          username: user.displayName,
        });
      }, 2000);
    }
  };

  // Show a more helpful loading state with retry button
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading chat...</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 underline"
        >
          Stuck? Click to retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/discussions")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Back to Teachers
        </button>
      </div>
    );
  }

  // Teacher view - show list of chats
  if (isTeacher && !chatId) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Student Messages</h1>

        {chats.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Students will appear here when they message you.
          </div>
        ) : (
          <div className="grid gap-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => handleChatSelect(chat)}
              >
                <div>
                  <h3 className="font-medium">{chat.studentName}</h3>
                  <p className="text-sm text-gray-600">{chat.studentEmail}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {chat.lastMessage
                      ? `Last message: ${chat.lastMessage.substring(0, 50)}${
                          chat.lastMessage.length > 50 ? "..." : ""
                        }`
                      : "No messages yet"}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {chat.lastMessageTimestamp
                    ? new Date(chat.lastMessageTimestamp).toLocaleString()
                    : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat interface - both student and teacher
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[80vh] flex flex-col">
        {/* Chat header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold">
              {chattingWith ? chattingWith.name : "Chat"}
            </h2>
            <p className="text-sm opacity-80">
              {chattingWith ? chattingWith.email : ""}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => {
                setChatId(null);
                setChattingWith(null);
                setMessages([]);
                processedMessageIds.clear();
              }}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-sm"
            >
              Back to all chats
            </button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === user.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-lg ${
                      msg.senderId === user.uid
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.senderId === user.uid
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="text-sm text-gray-500 mt-2">
              {whoIsTyping} is typing...
            </div>
          )}
        </div>

        {/* Message input */}
        <form onSubmit={sendMessage} className="p-4 border-t flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chats;
