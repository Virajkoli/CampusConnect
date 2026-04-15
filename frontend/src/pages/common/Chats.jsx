import React, { useState, useEffect, useRef, useMemo } from "react";
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
  updateDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaSmile,
  FaPaperclip,
  FaCircle,
  FaUserCircle,
  FaSearch,
  FaEllipsisV,
  FaTimes,
  FaFilePdf,
  FaFileAlt,
  FaMicrophone,
  FaDownload,
  FaPalette,
  FaVideo,
  FaMusic,
  FaReply,
} from "react-icons/fa";

const CHAT_API_BASE = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
)
  .trim()
  .replace(/\/+$/, "");

const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const CHAT_THEME_STORAGE_KEY = "campusconnect-chat-theme";

const allowedChatAttachmentMimeTypes = new Set([
  "application/pdf",
  "text/csv",
  "application/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const allowedChatAttachmentExtensions = new Set([
  "pdf",
  "csv",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "flac",
  "webm",
  "mp4",
  "mov",
  "avi",
  "mkv",
]);

const CHAT_THEMES = {
  light: {
    label: "Light",
    page: "bg-[#eef2f6]",
    panel: "border border-slate-200/80 bg-white",
    header: "border-b border-slate-200 bg-[#f8fafc]",
    messageArea: "bg-[#f7fafc]",
    inputArea: "border-t border-slate-200 bg-white",
    incomingBubble:
      "rounded-bl-md border border-slate-200 bg-white text-slate-800",
    incomingMeta: "text-slate-400",
    iconButton: "text-slate-500 hover:bg-slate-200",
    input:
      "border border-slate-300 bg-slate-50 text-slate-700 focus:border-[#2f87d9] focus:bg-white focus:ring-[#cfe5ff]",
    menu: "border border-slate-200 bg-white",
    menuText: "text-slate-700",
    pendingCard: "border border-slate-200 bg-slate-50",
    modal: "bg-white",
    modalSurface: "bg-slate-100",
    modalBorder: "border-slate-200",
  },
  dark: {
    label: "Dark",
    page: "bg-[#0b1220]",
    panel: "border border-slate-700 bg-[#111827]",
    header: "border-b border-slate-700 bg-[#0f172a]",
    messageArea: "bg-[#0b1324]",
    inputArea: "border-t border-slate-700 bg-[#0f172a]",
    incomingBubble:
      "rounded-bl-md border border-slate-600 bg-[#1e293b] text-slate-100",
    incomingMeta: "text-slate-300",
    iconButton: "text-slate-300 hover:bg-slate-700",
    input:
      "border border-slate-600 bg-[#111827] text-slate-100 focus:border-[#5aa0e8] focus:bg-[#0f172a] focus:ring-[#1c3353]",
    menu: "border border-slate-600 bg-[#111827]",
    menuText: "text-slate-100",
    pendingCard: "border border-slate-700 bg-[#111827]",
    modal: "bg-[#111827]",
    modalSurface: "bg-[#0f172a]",
    modalBorder: "border-slate-700",
  },
  ocean: {
    label: "Ocean",
    page: "bg-[#e8f5ff]",
    panel: "border border-[#bfd6eb] bg-[#f5fbff]",
    header: "border-b border-[#d0e3f5] bg-[#ebf6ff]",
    messageArea: "bg-[#f2f9ff]",
    inputArea: "border-t border-[#d0e3f5] bg-[#f8fcff]",
    incomingBubble:
      "rounded-bl-md border border-[#c9def2] bg-[#ffffff] text-[#17344a]",
    incomingMeta: "text-[#5c7c95]",
    iconButton: "text-[#38617e] hover:bg-[#dbefff]",
    input:
      "border border-[#bfd6eb] bg-white text-[#17344a] focus:border-[#2f87d9] focus:bg-white focus:ring-[#cfe5ff]",
    menu: "border border-[#bfd6eb] bg-white",
    menuText: "text-[#17344a]",
    pendingCard: "border border-[#c9def2] bg-[#eef7ff]",
    modal: "bg-white",
    modalSurface: "bg-[#eef7ff]",
    modalBorder: "border-[#c9def2]",
  },
};

const getInitialChatTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = String(
    window.localStorage.getItem(CHAT_THEME_STORAGE_KEY) || "",
  ).toLowerCase();

  return CHAT_THEMES[savedTheme] ? savedTheme : "light";
};

const getFileExtension = (name = "") => {
  const parts = String(name).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
};

const isImageMimeType = (mimeType = "") =>
  String(mimeType).toLowerCase().startsWith("image/");

const isVideoMimeType = (mimeType = "") =>
  String(mimeType).toLowerCase().startsWith("video/");

const isAudioMimeType = (mimeType = "") =>
  String(mimeType).toLowerCase().startsWith("audio/");

const isAllowedChatAttachment = (file) => {
  if (!file) {
    return false;
  }

  const mimeType = String(file.type || "").toLowerCase();
  if (
    isImageMimeType(mimeType) ||
    allowedChatAttachmentMimeTypes.has(mimeType)
  ) {
    return true;
  }

  const extension = getFileExtension(file.name || "");
  return allowedChatAttachmentExtensions.has(extension);
};

const formatFileSize = (size = 0) => {
  const bytes = Number(size) || 0;
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageAttachment = (attachment = {}) => {
  if (!attachment) {
    return false;
  }

  const type = String(attachment.type || "").toLowerCase();
  const mimeType = String(attachment.mimeType || "").toLowerCase();
  return type === "image" || isImageMimeType(mimeType);
};

const isVideoAttachment = (attachment = {}) => {
  if (!attachment) {
    return false;
  }

  const type = String(attachment.type || "").toLowerCase();
  const mimeType = String(attachment.mimeType || "").toLowerCase();
  return type === "video" || isVideoMimeType(mimeType);
};

const isAudioAttachment = (attachment = {}) => {
  if (!attachment) {
    return false;
  }

  const type = String(attachment.type || "").toLowerCase();
  const mimeType = String(attachment.mimeType || "").toLowerCase();
  return type === "audio" || type === "voice" || isAudioMimeType(mimeType);
};

const isVoiceAttachment = (attachment = {}) =>
  String(attachment?.type || "").toLowerCase() === "voice";

const isPdfAttachment = (attachment = {}) => {
  if (!attachment) {
    return false;
  }

  const mimeType = String(attachment.mimeType || "").toLowerCase();
  const extension = getFileExtension(attachment.name || "");
  const format = String(attachment.format || "").toLowerCase();
  return (
    mimeType === "application/pdf" || extension === "pdf" || format === "pdf"
  );
};

const buildDocumentViewerUrl = (attachment = {}) => {
  const sourceUrl = String(attachment?.url || "").trim();
  if (!sourceUrl) {
    return "";
  }

  if (isPdfAttachment(attachment)) {
    return sourceUrl;
  }

  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
    sourceUrl,
  )}`;
};

const buildAttachmentDownloadUrl = (attachment = {}) => {
  const sourceUrl = String(attachment?.url || "").trim();
  if (!sourceUrl) {
    return "";
  }

  if (sourceUrl.includes("/upload/")) {
    return sourceUrl.replace("/upload/", "/upload/fl_attachment/");
  }

  return sourceUrl;
};

const getChatLastMessagePreview = (textMessage = "", attachment = null) => {
  const trimmedText = String(textMessage || "").trim();
  if (trimmedText) {
    return trimmedText;
  }

  if (!attachment) {
    return "";
  }

  if (isImageAttachment(attachment)) {
    return "Image attachment";
  }

  if (isVideoAttachment(attachment)) {
    return "Video attachment";
  }

  if (isVoiceAttachment(attachment)) {
    return "Voice message";
  }

  if (isAudioAttachment(attachment)) {
    return "Audio attachment";
  }

  const fileName = String(attachment.name || "").trim();
  return fileName ? `Document: ${fileName}` : "Document attachment";
};

const truncatePreviewText = (value = "", maxLength = 140) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
};

const getReplyAttachmentFallback = (replyTo = {}) => {
  const attachmentName = String(replyTo.attachmentName || "").trim();
  if (attachmentName) {
    return attachmentName;
  }

  const attachmentType = String(replyTo.attachmentType || "")
    .trim()
    .toLowerCase();
  if (attachmentType === "image") return "Image attachment";
  if (attachmentType === "video") return "Video attachment";
  if (attachmentType === "voice") return "Voice message";
  if (attachmentType === "audio") return "Audio attachment";
  return "Attachment";
};

const getReplyPreviewText = (replyTo = {}) => {
  const messageText = String(replyTo.message || "").trim();
  if (messageText) {
    return truncatePreviewText(messageText, 120);
  }

  return truncatePreviewText(getReplyAttachmentFallback(replyTo), 120);
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderHighlightedText = (text = "", query = "", highlightClass = "") => {
  const value = String(text || "");
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery) {
    return value;
  }

  const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const queryLower = normalizedQuery.toLowerCase();

  return value.split(regex).map((segment, index) => {
    const isMatch = segment.toLowerCase() === queryLower;
    if (!isMatch) {
      return (
        <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>
      );
    }

    return (
      <mark
        key={`${segment}-${index}`}
        className={`rounded px-0.5 ${highlightClass}`}
      >
        {segment}
      </mark>
    );
  });
};

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  if (typeof timestamp === "object" && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
  const chatMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState(null);
  const [viewerLoadError, setViewerLoadError] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [chatTheme, setChatTheme] = useState(getInitialChatTheme);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDurationSec, setVoiceDurationSec] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const voiceDurationRef = useRef(0);

  const themeStyles = CHAT_THEMES[chatTheme] || CHAT_THEMES.light;

  const filteredChats = useMemo(() => {
    const queryToken = String(chatSearchQuery || "")
      .trim()
      .toLowerCase();
    if (!queryToken) {
      return chats;
    }

    return chats.filter((chat) => {
      const studentName = String(chat.studentName || "").toLowerCase();
      const studentEmail = String(chat.studentEmail || "").toLowerCase();
      const lastMessage = String(chat.lastMessage || "").toLowerCase();
      return (
        studentName.includes(queryToken) ||
        studentEmail.includes(queryToken) ||
        lastMessage.includes(queryToken)
      );
    });
  }, [chats, chatSearchQuery]);

  const filteredMessages = useMemo(() => {
    const queryToken = String(messageSearchQuery || "")
      .trim()
      .toLowerCase();
    if (!queryToken) {
      return messages;
    }

    return messages.filter((msg) => {
      const text = String(msg.message || "").toLowerCase();
      const attachmentName = String(msg.attachment?.name || "").toLowerCase();
      return text.includes(queryToken) || attachmentName.includes(queryToken);
    });
  }, [messages, messageSearchQuery]);

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

  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl);
      }
    };
  }, [pendingAttachment]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setViewerAttachment(null);
        setShowChatMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showChatMenu &&
        chatMenuRef.current &&
        !chatMenuRef.current.contains(event.target)
      ) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChatMenu]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_THEME_STORAGE_KEY, chatTheme);
    }
  }, [chatTheme]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

      socket.on("message_error", (payload) => {
        const errorMessage =
          payload?.error || "Failed to send message. Please try again.";
        alert(errorMessage);
      });

      return () => {
        console.log("Leaving chat room:", chatId);
        socket.off("receive_message");
        socket.off("typing_indicator");
        socket.off("message_sent");
        socket.off("message_error");
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
    setReplyingTo(null);
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

  const clearPendingAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
  };

  const cleanupRecordingResources = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const startVoiceRecording = async () => {
    if (isRecordingVoice) {
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      alert("Voice recording is not supported on this browser.");
      return;
    }

    try {
      clearPendingAttachment();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      recordingStreamRef.current = stream;

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
      ];

      const selectedMimeType = preferredMimeTypes.find((mimeType) => {
        try {
          return MediaRecorder.isTypeSupported(mimeType);
        } catch {
          return false;
        }
      });

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      recordingChunksRef.current = [];
      voiceDurationRef.current = 0;
      setVoiceDurationSec(0);
      setIsRecordingVoice(true);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("Voice recording error:", event?.error || event);
        alert("Voice recording failed. Please try again.");
        setIsRecordingVoice(false);
        cleanupRecordingResources();
      };

      recorder.onstop = () => {
        try {
          const recordingMimeType =
            recorder.mimeType || selectedMimeType || "audio/webm";
          const recordingBlob = new Blob(recordingChunksRef.current, {
            type: recordingMimeType,
          });

          if (!recordingBlob.size) {
            alert("No audio captured. Please try recording again.");
            return;
          }

          const extension = recordingMimeType.includes("mp4")
            ? "m4a"
            : recordingMimeType.includes("ogg")
              ? "ogg"
              : "webm";

          const fileName = `voice-note-${Date.now()}.${extension}`;
          const voiceFile = new File([recordingBlob], fileName, {
            type: recordingMimeType,
          });

          clearPendingAttachment();
          setPendingAttachment({
            file: voiceFile,
            name: fileName,
            mimeType: recordingMimeType,
            size: recordingBlob.size,
            type: "voice",
            previewUrl: URL.createObjectURL(recordingBlob),
            durationSec: voiceDurationRef.current,
          });
        } catch (recordingError) {
          console.error("Voice recording finalize error:", recordingError);
          alert("Failed to prepare voice message.");
        } finally {
          setIsRecordingVoice(false);
          cleanupRecordingResources();
          recordingChunksRef.current = [];
        }
      };

      recorder.start(250);
      recordingTimerRef.current = setInterval(() => {
        voiceDurationRef.current += 1;
        setVoiceDurationSec(voiceDurationRef.current);
      }, 1000);
    } catch (error) {
      console.error("Unable to start voice recording:", error);
      alert("Microphone access denied or unavailable.");
      setIsRecordingVoice(false);
      cleanupRecordingResources();
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAttachmentSelection = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!isAllowedChatAttachment(selectedFile)) {
      alert(
        "Only supported images, documents, audio, and video files can be sent.",
      );
      return;
    }

    if (selectedFile.size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
      alert("File exceeds the 10MB upload limit.");
      return;
    }

    clearPendingAttachment();

    const mimeType = selectedFile.type || "application/octet-stream";
    const previewUrl =
      isImageMimeType(mimeType) || isAudioMimeType(mimeType)
        ? URL.createObjectURL(selectedFile)
        : "";

    let attachmentType = "document";
    if (isImageMimeType(mimeType)) {
      attachmentType = "image";
    } else if (isVideoMimeType(mimeType)) {
      attachmentType = "video";
    } else if (isAudioMimeType(mimeType)) {
      attachmentType = "audio";
    }

    setPendingAttachment({
      file: selectedFile,
      name: selectedFile.name || "attachment",
      mimeType,
      size: selectedFile.size || 0,
      type: attachmentType,
      previewUrl,
      durationSec: 0,
    });
  };

  const uploadChatAttachment = async (attachmentPayload) => {
    const sourceFile = attachmentPayload?.file;
    if (!sourceFile || !user) {
      throw new Error("No attachment file selected");
    }

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", sourceFile);

    if (attachmentPayload?.type) {
      formData.append("attachmentType", attachmentPayload.type);
    }

    if (Number(attachmentPayload?.durationSec) > 0) {
      formData.append("durationSec", String(attachmentPayload.durationSec));
    }

    const response = await axios.post(
      `${CHAT_API_BASE}/api/upload-chat-attachment`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const uploadedAttachment = response?.data?.attachment;
    if (!uploadedAttachment?.url) {
      throw new Error("Attachment upload failed");
    }

    return uploadedAttachment;
  };

  const handleReplySelection = (sourceMessage) => {
    if (!sourceMessage?.id || !user?.uid) {
      return;
    }

    setReplyingTo({
      messageId: String(sourceMessage.id || "").trim(),
      senderId: String(sourceMessage.senderId || "").trim(),
      senderName:
        sourceMessage.senderId === user.uid
          ? "You"
          : String(chattingWith?.name || "Contact"),
      message: truncatePreviewText(String(sourceMessage.message || ""), 280),
      attachmentName: String(sourceMessage.attachment?.name || "").trim(),
      attachmentType: String(sourceMessage.attachment?.type || "")
        .trim()
        .toLowerCase(),
    });
  };

  // Handle sending a message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!chatId || !user) return;

    if (isRecordingVoice) {
      alert("Stop voice recording before sending.");
      return;
    }

    const trimmedMessage = String(message || "").trim();
    if (!trimmedMessage && !pendingAttachment) {
      return;
    }

    const receiverId = isTeacher ? chattingWith?.id : teacherId;
    if (!receiverId) {
      alert("Unable to determine chat recipient.");
      return;
    }

    try {
      setIsUploadingAttachment(true);

      let uploadedAttachment = null;
      if (pendingAttachment?.file) {
        uploadedAttachment = await uploadChatAttachment(pendingAttachment);
      }

      const timestamp = new Date().toISOString();
      const newMessage = {
        chatId,
        senderId: user.uid,
        receiverId,
        message: trimmedMessage,
        attachment: uploadedAttachment,
        replyTo: replyingTo || null,
        timestamp,
        read: false,
      };

      if (socket && socket.connected) {
        socket.emit("send_message", newMessage);
        console.log("Message sent through socket:", newMessage);
      } else {
        // Fallback for when socket is not available
        console.error("Socket not available, trying direct Firestore save");
        await addDoc(collection(firestore, "messages"), newMessage);
        await updateDoc(doc(firestore, "chats", chatId), {
          lastMessage: getChatLastMessagePreview(
            trimmedMessage,
            uploadedAttachment,
          ),
          lastMessageTimestamp: timestamp,
          updatedAt: serverTimestamp(),
        });
      }

      setMessage("");
      setReplyingTo(null);
      clearPendingAttachment();
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err?.message || "Failed to send message. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
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
      <div
        className={`min-h-screen px-3 py-5 sm:px-5 sm:py-7 lg:px-8 ${themeStyles.page}`}
      >
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
                value={chatSearchQuery}
                onChange={(event) => setChatSearchQuery(event.target.value)}
                placeholder="Search conversations..."
                className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 ${themeStyles.input}`}
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
          ) : filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-14 text-center"
            >
              <div className="mb-4 text-5xl">🔎</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-700">
                No matching conversation
              </h3>
              <p className="text-sm text-slate-500">
                Try a different keyword for name, email, or message text.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {filteredChats.map((chat, index) => (
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
    <div
      className={`h-[calc(100vh-4rem)] overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 ${themeStyles.page}`}
    >
      <div className="mx-auto h-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex h-full flex-col overflow-hidden rounded-2xl shadow-sm sm:rounded-3xl ${themeStyles.panel}`}
        >
          <div
            className={`relative z-40 flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 ${themeStyles.header}`}
          >
            <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isTeacher) {
                    setChatId(null);
                    setChattingWith(null);
                    setMessages([]);
                    setReplyingTo(null);
                    processedMessageIds.clear();
                    return;
                  }

                  navigate("/discussions");
                }}
                className={`rounded-full p-2 transition ${themeStyles.iconButton}`}
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
                <h2
                  className={`text-base font-semibold sm:text-lg ${themeStyles.menuText}`}
                >
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
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowMessageSearch((previous) => {
                    const next = !previous;
                    if (!next) {
                      setMessageSearchQuery("");
                    }
                    return next;
                  });
                }}
                className={`rounded-full p-2 transition ${themeStyles.iconButton}`}
              >
                <FaSearch className="text-sm" />
              </motion.button>

              <div ref={chatMenuRef} className="relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowChatMenu((previous) => !previous)}
                  className={`rounded-full p-2 transition ${themeStyles.iconButton}`}
                >
                  <FaEllipsisV className="text-sm" />
                </motion.button>

                {showChatMenu ? (
                  <div
                    className={`absolute right-0 top-11 z-[70] w-56 rounded-xl p-2 shadow-lg ${themeStyles.menu}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMessageSearch(true);
                        setShowChatMenu(false);
                      }}
                      className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${themeStyles.menuText}`}
                    >
                      <FaSearch className="text-xs" />
                      Search in chat
                    </button>

                    <p className="mt-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Theme
                    </p>

                    <div className="mt-1 space-y-1">
                      {Object.entries(CHAT_THEMES).map(([themeKey, theme]) => (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => {
                            setChatTheme(themeKey);
                            setShowChatMenu(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${themeStyles.menuText}`}
                        >
                          <span className="flex items-center gap-2">
                            <FaPalette className="text-xs" />
                            {theme.label}
                          </span>
                          {chatTheme === themeKey ? (
                            <span className="text-xs font-semibold text-[#2f87d9]">
                              Active
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {showMessageSearch ? (
            <div
              className={`relative z-30 px-3 pb-2 sm:px-4 ${themeStyles.header}`}
            >
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(event) =>
                    setMessageSearchQuery(event.target.value)
                  }
                  placeholder="Search messages and attachments..."
                  className={`w-full rounded-xl py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 ${themeStyles.input}`}
                />
                {messageSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setMessageSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Clear message search"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            className={`flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 ${themeStyles.messageArea}`}
          >
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
            ) : filteredMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center text-center"
              >
                <div className="mb-3 text-5xl">🔍</div>
                <h3 className="mb-1 text-xl font-semibold text-slate-700">
                  No matching messages
                </h3>
                <p className="text-sm text-slate-500">
                  Try another keyword or clear the chat search.
                </p>
              </motion.div>
            ) : (
              <div className="relative z-10 space-y-2.5 sm:space-y-3">
                <AnimatePresence>
                  {filteredMessages.map((msg, index) => {
                    const isOwnMessage = msg.senderId === user.uid;
                    const attachment = msg.attachment || null;
                    const replyPreviewText = msg.replyTo
                      ? getReplyPreviewText(msg.replyTo)
                      : "";
                    const imageAttachment = isImageAttachment(attachment);
                    const videoAttachment = isVideoAttachment(attachment);
                    const audioAttachment = isAudioAttachment(attachment);
                    const voiceAttachment = isVoiceAttachment(attachment);
                    const attachmentDownloadUrl =
                      buildAttachmentDownloadUrl(attachment);
                    const highlightClass = isOwnMessage
                      ? "bg-white/30 text-white"
                      : "bg-yellow-200 text-slate-900";

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="flex max-w-[86%] items-end gap-1.5 sm:max-w-[78%]">
                          {!isOwnMessage && (
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
                              {chattingWith?.name
                                ? chattingWith.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                          )}

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={`relative rounded-2xl px-3 py-2.5 shadow-sm ${
                              isOwnMessage
                                ? "rounded-br-md bg-[#2f87d9] text-white"
                                : themeStyles.incomingBubble
                            }`}
                          >
                            {msg.replyTo ? (
                              <div
                                className={`mb-2 rounded-lg border-l-2 px-2 py-1 ${
                                  isOwnMessage
                                    ? "border-white/55 bg-white/15"
                                    : "border-[#2f87d9]/50 bg-[#eef6ff]"
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                                    isOwnMessage
                                      ? "text-blue-100"
                                      : "text-[#1f6fb7]"
                                  }`}
                                >
                                  Reply to {msg.replyTo.senderName || "Message"}
                                </p>
                                <p
                                  className={`mt-0.5 line-clamp-2 text-[11px] ${
                                    isOwnMessage
                                      ? "text-blue-50"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {replyPreviewText}
                                </p>
                              </div>
                            ) : null}

                            {attachment ? (
                              imageAttachment ? (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerLoadError(false);
                                      setViewerAttachment(attachment);
                                    }}
                                    className="block w-full"
                                  >
                                    <img
                                      src={attachment.url}
                                      alt={
                                        attachment.name || "Image attachment"
                                      }
                                      className="max-h-60 w-full rounded-lg object-cover sm:max-h-72"
                                      loading="lazy"
                                    />
                                  </button>

                                  {attachmentDownloadUrl ? (
                                    <a
                                      href={attachmentDownloadUrl}
                                      download={attachment.name || "image"}
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
                                    >
                                      <FaDownload className="text-[10px]" />
                                      Save
                                    </a>
                                  ) : null}
                                </div>
                              ) : videoAttachment ? (
                                <div className="space-y-2">
                                  <video
                                    controls
                                    preload="metadata"
                                    src={attachment.url}
                                    className="max-h-72 w-full rounded-lg bg-black"
                                  />
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold sm:text-sm">
                                        {attachment.name || "Video"}
                                      </p>
                                      <p
                                        className={`text-[10px] ${
                                          isOwnMessage
                                            ? "text-blue-100"
                                            : themeStyles.incomingMeta
                                        }`}
                                      >
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                    {attachmentDownloadUrl ? (
                                      <a
                                        href={attachmentDownloadUrl}
                                        download={attachment.name || "video"}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                                          isOwnMessage
                                            ? "border-white/40 bg-white/15 text-white hover:bg-white/20"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <FaDownload className="text-[10px]" />
                                        Save
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              ) : audioAttachment ? (
                                <div
                                  className={`rounded-xl border px-2.5 py-2 ${
                                    isOwnMessage
                                      ? "border-white/35 bg-white/20"
                                      : "border-slate-200 bg-slate-50"
                                  }`}
                                >
                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold sm:text-sm">
                                      <FaMusic className="text-xs" />
                                      {voiceAttachment
                                        ? "Voice message"
                                        : "Audio"}
                                    </span>
                                    <span
                                      className={`text-[10px] ${
                                        isOwnMessage
                                          ? "text-blue-100"
                                          : themeStyles.incomingMeta
                                      }`}
                                    >
                                      {attachment.durationSec
                                        ? formatDuration(attachment.durationSec)
                                        : formatFileSize(attachment.size)}
                                    </span>
                                  </div>

                                  <audio
                                    controls
                                    preload="metadata"
                                    src={attachment.url}
                                    className="w-full"
                                  />

                                  <div className="mt-1.5 flex items-center justify-between gap-2">
                                    <p
                                      className={`min-w-0 truncate text-[10px] ${
                                        isOwnMessage
                                          ? "text-blue-100"
                                          : themeStyles.incomingMeta
                                      }`}
                                    >
                                      {attachment.name || "Audio file"}
                                    </p>
                                    {attachmentDownloadUrl ? (
                                      <a
                                        href={attachmentDownloadUrl}
                                        download={attachment.name || "audio"}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                                          isOwnMessage
                                            ? "border-white/40 bg-white/15 text-white hover:bg-white/20"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <FaDownload className="text-[10px]" />
                                        Save
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left ${
                                    isOwnMessage
                                      ? "border-white/35 bg-white/20 text-white"
                                      : "border-slate-200 bg-slate-50 text-slate-800"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerLoadError(false);
                                      setViewerAttachment(attachment);
                                    }}
                                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  >
                                    {isPdfAttachment(attachment) ? (
                                      <FaFilePdf className="h-6 w-6 flex-shrink-0" />
                                    ) : (
                                      <FaFileAlt className="h-6 w-6 flex-shrink-0" />
                                    )}
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-xs font-semibold sm:text-sm">
                                        {renderHighlightedText(
                                          attachment.name || "Document",
                                          messageSearchQuery,
                                          highlightClass,
                                        )}
                                      </span>
                                      <span
                                        className={`block text-[10px] ${
                                          isOwnMessage
                                            ? "text-blue-100"
                                            : themeStyles.incomingMeta
                                        }`}
                                      >
                                        {formatFileSize(attachment.size)}
                                      </span>
                                    </span>
                                  </button>

                                  {attachmentDownloadUrl ? (
                                    <a
                                      href={attachmentDownloadUrl}
                                      download={attachment.name || "document"}
                                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                                        isOwnMessage
                                          ? "border-white/40 bg-white/15 text-white hover:bg-white/20"
                                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      <FaDownload className="text-[10px]" />
                                      Save
                                    </a>
                                  ) : null}
                                </div>
                              )
                            ) : null}

                            {msg.message ? (
                              <p
                                className={`break-words text-sm ${
                                  attachment ? "mt-2" : ""
                                }`}
                              >
                                {renderHighlightedText(
                                  msg.message,
                                  messageSearchQuery,
                                  highlightClass,
                                )}
                              </p>
                            ) : null}

                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleReplySelection(msg)}
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                                  isOwnMessage
                                    ? "text-blue-50 hover:bg-white/15"
                                    : "text-[#1f6fb7] hover:bg-[#e9f2ff]"
                                }`}
                                aria-label="Reply to this message"
                              >
                                <FaReply className="text-[9px]" />
                                Reply
                              </button>

                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-[10px] ${
                                    isOwnMessage
                                      ? "text-blue-100"
                                      : themeStyles.incomingMeta
                                  }`}
                                >
                                  {formatMessageTime(msg.timestamp)}
                                </p>
                                {isOwnMessage && (
                                  <div className="text-[10px] text-blue-100">
                                    ✓✓
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {isOwnMessage && (
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2f87d9] text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
                              {user?.displayName
                                ? user.displayName.charAt(0).toUpperCase()
                                : "Y"}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
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
                  <div
                    className={`rounded-2xl border px-3 py-2 shadow-sm ${themeStyles.menu}`}
                  >
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

          <div
            className={`px-3 py-2.5 sm:px-4 sm:py-3 ${themeStyles.inputArea}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
              onChange={handleAttachmentSelection}
            />

            {isRecordingVoice ? (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-red-300 bg-red-50 px-2.5 py-2 text-red-700">
                <p className="inline-flex items-center gap-2 text-xs font-semibold sm:text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  Recording voice message ({formatDuration(voiceDurationSec)})
                </p>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700"
                >
                  Stop
                </button>
              </div>
            ) : null}

            {replyingTo ? (
              <div
                className={`mb-2 flex items-start gap-2 rounded-xl px-2.5 py-2 ${themeStyles.pendingCard}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#2f87d9]">
                    Replying to {replyingTo.senderName || "Message"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-600">
                    {getReplyPreviewText(replyingTo)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-200"
                  aria-label="Cancel reply"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ) : null}

            {pendingAttachment ? (
              <div
                className={`mb-2 flex items-center gap-2 rounded-xl px-2.5 py-2 ${themeStyles.pendingCard}`}
              >
                {pendingAttachment.type === "image" &&
                pendingAttachment.previewUrl ? (
                  <img
                    src={pendingAttachment.previewUrl}
                    alt={pendingAttachment.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : pendingAttachment.type === "video" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2f87d9]">
                    <FaVideo className="text-lg" />
                  </div>
                ) : pendingAttachment.type === "audio" ||
                  pendingAttachment.type === "voice" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2f87d9]">
                    <FaMusic className="text-lg" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#2f87d9]">
                    <FaFileAlt className="text-lg" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                    {pendingAttachment.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {pendingAttachment.type === "voice" &&
                    pendingAttachment.durationSec
                      ? `${formatDuration(pendingAttachment.durationSec)} • ${formatFileSize(
                          pendingAttachment.size,
                        )}`
                      : formatFileSize(pendingAttachment.size)}
                  </p>
                </div>
                {pendingAttachment.type === "audio" ||
                pendingAttachment.type === "voice" ? (
                  <audio
                    controls
                    preload="metadata"
                    src={pendingAttachment.previewUrl || ""}
                    className="max-w-[180px]"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={clearPendingAttachment}
                  className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-200"
                  aria-label="Remove selected attachment"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ) : null}

            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`rounded-full p-2 transition hover:text-[#2f87d9] ${themeStyles.iconButton}`}
              >
                <FaSmile className="text-base" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                disabled={isRecordingVoice}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-full p-2 transition hover:text-[#2f87d9] disabled:opacity-50 ${themeStyles.iconButton}`}
                aria-label="Attach image, video, audio, or document"
              >
                <FaPaperclip className="text-base" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                disabled={isUploadingAttachment}
                onClick={() => {
                  if (isRecordingVoice) {
                    stopVoiceRecording();
                    return;
                  }

                  startVoiceRecording();
                }}
                className={`rounded-full p-2 transition hover:text-[#2f87d9] disabled:opacity-50 ${
                  isRecordingVoice
                    ? "bg-red-100 text-red-600"
                    : themeStyles.iconButton
                }`}
                aria-label={
                  isRecordingVoice
                    ? "Stop voice recording"
                    : "Start voice recording"
                }
              >
                <FaMicrophone className="text-base" />
              </motion.button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  placeholder="Type your message..."
                  className={`w-full rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${themeStyles.input}`}
                  disabled={isUploadingAttachment || isRecordingVoice}
                />

                {showEmojiPicker ? (
                  <div
                    ref={emojiPickerRef}
                    className={`absolute bottom-12 left-0 z-20 w-[248px] rounded-xl p-2 shadow-lg ${themeStyles.menu}`}
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f87d9] text-white transition hover:bg-[#1f6fb7] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  (!message.trim() && !pendingAttachment) ||
                  isUploadingAttachment ||
                  isRecordingVoice
                }
              >
                {isUploadingAttachment ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <FaPaperPlane className="text-sm" />
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {viewerAttachment ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewerAttachment(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl ${themeStyles.modal}`}
            >
              <div
                className={`flex items-center justify-between border-b px-4 py-3 ${themeStyles.modalBorder}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 sm:text-base">
                    {viewerAttachment.name || "Attachment"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(viewerAttachment.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {buildAttachmentDownloadUrl(viewerAttachment) ? (
                    <a
                      href={buildAttachmentDownloadUrl(viewerAttachment)}
                      download={viewerAttachment.name || "attachment"}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <FaDownload className="text-[10px]" />
                      Download
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setViewerAttachment(null)}
                    className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                    aria-label="Close attachment viewer"
                  >
                    <FaTimes className="text-base" />
                  </button>
                </div>
              </div>

              <div
                className={`max-h-[78vh] overflow-auto p-3 sm:p-4 ${themeStyles.modalSurface}`}
              >
                {isImageAttachment(viewerAttachment) ? (
                  <img
                    src={viewerAttachment.url}
                    alt={viewerAttachment.name || "Chat image"}
                    className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain"
                  />
                ) : isVideoAttachment(viewerAttachment) ? (
                  <video
                    controls
                    preload="metadata"
                    src={viewerAttachment.url}
                    className="mx-auto max-h-[72vh] w-full rounded-xl bg-black"
                  />
                ) : isAudioAttachment(viewerAttachment) ? (
                  <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-5 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      {isVoiceAttachment(viewerAttachment)
                        ? "Voice message"
                        : "Audio attachment"}
                    </p>
                    <audio
                      controls
                      preload="metadata"
                      src={viewerAttachment.url}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <>
                    <div className="h-[72vh] rounded-xl bg-white p-1">
                      <iframe
                        title={viewerAttachment.name || "Document preview"}
                        src={buildDocumentViewerUrl(viewerAttachment)}
                        className="h-full w-full rounded-lg border border-slate-200"
                        onError={() => setViewerLoadError(true)}
                      />
                    </div>

                    {viewerLoadError ? (
                      <p className="mt-2 text-xs text-red-600">
                        Preview could not be loaded. Use the Download button to
                        save this file.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Chats;
