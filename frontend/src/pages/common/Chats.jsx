import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "../../firebase";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const commonEmojis = [
    "😀",
    "😂",
    "😊",
    "😍",
    "🤝",
    "👍",
    "🙏",
    "🎯",
    "📚",
    "📝",
    "✅",
    "🚀",
    "😅",
    "🤔",
    "👏",
    "🎉",
  ];

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

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
              "Teacher not found. They may have been removed from the system.",
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
            where("teacherId", "==", teacherId),
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
            orderBy("timestamp", "asc"),
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
            },
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
            where("teacherId", "==", user.uid),
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
                    doc(firestore, "users", chatData.studentId),
                  );

                  if (studentDoc.exists()) {
                    studentName = studentDoc.data().name || "Unknown Student";
                    studentEmail = studentDoc.data().email || "No email";
                  } else {
                    // Try students collection as fallback
                    const studentsDoc = await getDoc(
                      doc(firestore, "students", chatData.studentId),
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
            },
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
      orderBy("timestamp", "asc"),
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
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#eef2f6] px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4 h-12 w-12 rounded-full border-4 border-[#2f87d9] border-t-transparent"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 text-sm font-medium text-slate-700 sm:text-base"
        >
          Loading your conversations...
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-2 rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f6fb7]"
        >
          Retry Connection
        </motion.button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#eef2f6] p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-4 text-5xl"
        >
          😔
        </motion.div>
        <div className="mb-5 max-w-md text-center text-sm font-medium text-red-600 sm:text-base">
          {error}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/discussions")}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          ← Back to Teachers
        </motion.button>
      </div>
    );
  }

  // Teacher view - show list of chats
  if (isTeacher && !chatId) {
    return (
      <div className="min-h-screen bg-[#eef2f6] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/teacher-dashboard")}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
          >
            <FaArrowLeft className="text-sm" />
            Back to Dashboard
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <h1 className="mb-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
              💬 Student Messages
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">
              Manage your conversations with students
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
              />
            </div>
          </motion.div>

          {chats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-14 text-center"
            >
              <div className="mb-4 text-6xl">💌</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-700">
                No Messages Yet
              </h3>
              <p className="text-sm text-slate-500">
                Students will appear here when they message you
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {chats.map((chat, index) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleChatSelect(chat)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#bfdbfe] hover:bg-slate-50 sm:p-4"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f87d9] text-base font-semibold text-white sm:h-12 sm:w-12 sm:text-lg">
                          {chat.studentName
                            ? chat.studentName.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"></div>
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between">
                          <h3 className="text-base font-semibold text-slate-800 transition-colors group-hover:text-[#2f87d9]">
                            {chat.studentName}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {chat.lastMessageTimestamp
                              ? new Date(
                                  chat.lastMessageTimestamp,
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="mb-1 text-xs text-slate-500 sm:text-sm">
                          {chat.studentEmail}
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-600 sm:text-sm">
                          {chat.lastMessage
                            ? chat.lastMessage
                            : "No messages yet"}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <motion.div
                          whileHover={{ rotate: 90 }}
                          className="text-slate-400 transition-colors group-hover:text-[#2f87d9]"
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
    <div className="min-h-screen bg-[#eef2f6] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto h-[86vh] max-w-6xl sm:h-[88vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8fafc] px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isTeacher) {
                    setChatId(null);
                    setChattingWith(null);
                    setMessages([]);
                    processedMessageIds.clear();
                    return;
                  }

                  navigate("/discussions");
                }}
                className="rounded-full p-2 text-slate-600 transition hover:bg-slate-200"
              >
                <FaArrowLeft className="text-base" />
              </motion.button>

              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f87d9] text-base font-semibold text-white sm:h-11 sm:w-11 sm:text-lg">
                  {chattingWith?.name ? (
                    chattingWith.name.charAt(0).toUpperCase()
                  ) : (
                    <FaUserCircle className="text-xl" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                  {chattingWith ? chattingWith.name : "Chat"}
                </h2>
                <p className="flex items-center gap-1 text-xs text-slate-500 sm:text-sm">
                  <FaCircle className="text-[10px] text-emerald-500" />
                  {chattingWith ? "Active now" : ""}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <FaSearch className="text-sm" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <FaEllipsisV className="text-sm" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#f7fafc] px-3 py-3 sm:px-4 sm:py-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center text-center"
              >
                <div className="mb-3 text-5xl">💬</div>
                <h3 className="mb-1 text-xl font-semibold text-slate-700">
                  No messages yet
                </h3>
                <p className="text-sm text-slate-500">
                  Start the conversation and break the ice!
                </p>
              </motion.div>
            ) : (
              <div className="relative z-10 space-y-2.5 sm:space-y-3">
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
                      <div className="flex max-w-[86%] items-end gap-1.5 sm:max-w-[78%]">
                        {msg.senderId !== user.uid && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
                            {chattingWith?.name
                              ? chattingWith.name.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`relative rounded-2xl px-3 py-2.5 shadow-sm ${
                            msg.senderId === user.uid
                              ? "rounded-br-md bg-[#2f87d9] text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <p className="break-words text-sm">{msg.message}</p>
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <p
                              className={`text-[10px] ${
                                msg.senderId === user.uid
                                  ? "text-blue-100"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {msg.senderId === user.uid && (
                              <div className="text-[10px] text-blue-100">
                                ✓✓
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {msg.senderId === user.uid && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2f87d9] text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
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
                  className="mt-3 flex items-center gap-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-[10px] sm:h-8 sm:w-8 sm:text-xs">
                    {whoIsTyping.charAt(0).toUpperCase()}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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

          <div className="border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#2f87d9]"
              >
                <FaSmile className="text-base" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#2f87d9]"
              >
                <FaPaperclip className="text-base" />
              </motion.button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  placeholder="Type your message..."
                  className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-[#2f87d9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                  required
                />

                {showEmojiPicker ? (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-12 left-0 z-20 w-[248px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  >
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setMessage((prev) => `${prev}${emoji}`);
                            setShowEmojiPicker(false);
                          }}
                          className="rounded-md p-1.5 text-lg transition hover:bg-slate-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-[#2f87d9] p-2.5 text-white transition hover:bg-[#1f6fb7] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!message.trim()}
              >
                <FaPaperPlane className="text-sm" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Chats;
