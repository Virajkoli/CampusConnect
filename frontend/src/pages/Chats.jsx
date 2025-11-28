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
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaSmile,
  FaPaperclip,
  FaCircle,
  FaUserCircle,
  FaSearch,
  FaEllipsisV,
} from "react-icons/fa";

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
                // Fetch student details - try users collection first, then students collection
                try {
                  let studentName = "Unknown Student";
                  let studentEmail = "No email";

                  // Try users collection first
                  const studentDoc = await getDoc(
                    doc(firestore, "users", chatData.studentId)
                  );

                  if (studentDoc.exists()) {
                    studentName = studentDoc.data().name || "Unknown Student";
                    studentEmail = studentDoc.data().email || "No email";
                  } else {
                    // Try students collection as fallback
                    const studentsDoc = await getDoc(
                      doc(firestore, "students", chatData.studentId)
                    );
                    if (studentsDoc.exists()) {
                      studentName =
                        studentsDoc.data().name || "Unknown Student";
                      studentEmail = studentsDoc.data().email || "No email";
                    }
                  }

                  // Always add chat to list, even if student details not found
                  chatList.push({
                    id: chatDoc.id,
                    ...chatData,
                    studentName: studentName,
                    studentEmail: studentEmail,
                  });
                } catch (err) {
                  console.error("Error fetching student details:", err);
                  // Still add chat even if error fetching student details
                  chatList.push({
                    id: chatDoc.id,
                    ...chatData,
                    studentName: "Unknown Student",
                    studentEmail: "No email",
                  });
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
      if (socket && socket.connected) {
        socket.emit("send_message", newMessage);
        console.log("Message sent through socket:", newMessage);
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
      <div className="flex flex-col justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-6"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-700 text-lg font-medium mb-4"
        >
          Loading your conversations...
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          Retry Connection
        </motion.button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] p-4 bg-gradient-to-br from-red-50 to-pink-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-4"
        >
          😔
        </motion.div>
        <div className="text-red-600 text-lg font-medium mb-6 text-center max-w-md">
          {error}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/discussions")}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          ← Back to Teachers
        </motion.button>
      </div>
    );
  }

  // Teacher view - show list of chats
  if (isTeacher && !chatId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              💬 Student Messages
            </h1>
            <p className="text-gray-600">
              Manage your conversations with students
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-colors bg-white shadow-sm"
              />
            </div>
          </motion.div>

          {chats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">💌</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Messages Yet
              </h3>
              <p className="text-gray-500">
                Students will appear here when they message you
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {chats.map((chat, index) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 10 }}
                    onClick={() => handleChatSelect(chat)}
                    className="bg-white rounded-2xl p-6 hover:shadow-xl cursor-pointer transition-all border border-gray-100 group relative overflow-hidden"
                  >
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>

                    <div className="flex items-center gap-4 relative z-10">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {chat.studentName
                            ? chat.studentName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                            {chat.studentName}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {chat.lastMessageTimestamp
                              ? new Date(
                                  chat.lastMessageTimestamp
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {chat.studentEmail}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {chat.lastMessage
                            ? chat.lastMessage
                            : "No messages yet"}
                        </p>
                      </div>

                      {/* Unread Badge (optional - can add logic later) */}
                      <div className="flex flex-col items-center gap-2">
                        <motion.div
                          whileHover={{ rotate: 90 }}
                          className="text-gray-400 group-hover:text-purple-500 transition-colors"
                        >
                          <FaEllipsisV />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat interface - both student and teacher
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl h-[90vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col border border-gray-100"
        >
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 flex justify-between items-center relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute w-32 h-32 bg-white rounded-full -top-10 -left-10"></div>
              <div className="absolute w-40 h-40 bg-white rounded-full -bottom-16 -right-16"></div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              {isTeacher && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setChatId(null);
                    setChattingWith(null);
                    setMessages([]);
                    processedMessageIds.clear();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FaArrowLeft className="text-xl" />
                </motion.button>
              )}

              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {chattingWith?.name ? (
                    chattingWith.name.charAt(0).toUpperCase()
                  ) : (
                    <FaUserCircle className="text-3xl" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>

              {/* User Info */}
              <div>
                <h2 className="font-bold text-xl">
                  {chattingWith ? chattingWith.name : "Chat"}
                </h2>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <FaCircle className="text-green-400 text-xs" />
                  {chattingWith ? "Active now" : ""}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 relative z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors"
              >
                <FaSearch className="text-lg" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-lg" />
              </motion.button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-300 rounded-full filter blur-3xl"></div>
            </div>

            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="text-8xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500">
                  Start the conversation and break the ice!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 relative z-10">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${
                        msg.senderId === user.uid
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="flex items-end gap-2 max-w-[75%]">
                        {msg.senderId !== user.uid && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {chattingWith?.name
                              ? chattingWith.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`relative p-4 rounded-2xl shadow-md ${
                            msg.senderId === user.uid
                              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-none"
                              : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                          }`}
                        >
                          {/* Message Bubble Tail */}
                          <div
                            className={`absolute bottom-0 w-4 h-4 ${
                              msg.senderId === user.uid
                                ? "right-0 translate-x-2 bg-purple-600"
                                : "left-0 -translate-x-2 bg-white border-l border-b border-gray-100"
                            }`}
                            style={{
                              clipPath:
                                msg.senderId === user.uid
                                  ? "polygon(0 0, 100% 0, 0 100%)"
                                  : "polygon(0 0, 100% 100%, 100% 0)",
                            }}
                          ></div>

                          <p className="break-words">{msg.message}</p>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <p
                              className={`text-xs ${
                                msg.senderId === user.uid
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {msg.senderId === user.uid && (
                              <div className="text-xs text-blue-100">✓✓</div>
                            )}
                          </div>
                        </motion.div>

                        {msg.senderId === user.uid && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user?.displayName
                              ? user.displayName.charAt(0).toUpperCase()
                              : "Y"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 mt-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                    {whoIsTyping.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message input */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <form onSubmit={sendMessage} className="flex items-center gap-3">
              {/* Emoji Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
              >
                <FaSmile className="text-xl" />
              </motion.button>

              {/* Attachment Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              >
                <FaPaperclip className="text-xl" />
              </motion.button>

              {/* Input Field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  placeholder="Type your message..."
                  className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              {/* Send Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!message.trim()}
              >
                <FaPaperPlane className="text-xl" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Chats;
