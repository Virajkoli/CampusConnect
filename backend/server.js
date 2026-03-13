const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const cloudinary = require("./cloudinary-config");

dotenv.config();

const admin = require("./firebase-admin");

const app = express();
const server = http.createServer(app);

// Get frontend URL from environment or use localhost as fallback
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = socketIO(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only documents, images, and archives are allowed."
        )
      );
    }
  },
});

// Socket.IO Connection Logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a chat room (student-teacher conversation)
  socket.on("join_chat", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User ${socket.id} joined room: ${chatRoomId}`);
  });

  // Handle message sending
  socket.on("send_message", async (messageData) => {
    try {
      // Store message in Firestore
      const { chatId, message, senderId, receiverId, timestamp } = messageData;

      const messageRef = await admin.firestore().collection("messages").add({
        chatId,
        message,
        senderId,
        receiverId,
        timestamp,
        read: false,
      });

      // Update the chat document with the last message
      await admin.firestore().collection("chats").doc(chatId).update({
        lastMessage: message,
        lastMessageTimestamp: timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Only broadcast to others in the room, not back to sender
      // This prevents duplicate messages since the sender will get updates via Firestore
      socket.to(chatId).emit("receive_message", {
        ...messageData,
        id: messageRef.id,
      });

      // Acknowledge message receipt back to sender
      socket.emit("message_sent", {
        success: true,
        messageId: messageRef.id,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Send error back to sender
      socket.emit("message_error", {
        error: "Failed to send message",
      });
    }
  });

  // Handle typing status
  socket.on("typing", ({ chatId, username }) => {
    socket.to(chatId).emit("typing_indicator", { username, isTyping: true });
  });

  socket.on("stop_typing", ({ chatId, username }) => {
    socket.to(chatId).emit("typing_indicator", { username, isTyping: false });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.post("/verify-admin", async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.admin) {
      res.status(200).send({ message: "Authorized as admin" });
    } else {
      res.status(403).send({ message: "Not authorized" });
    }
  } catch (error) {
    res.status(401).send({ message: "Invalid token", error });
  }
});

app.post("/api/createUser", async (req, res) => {
  const { name, email, password, rollNo, dept, year, semester } = req.body;

  try {
    let existingUser = null;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    if (existingUser) {
      const firestore = admin.firestore();
      const userDoc = await firestore
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userDoc.empty) {
        await firestore
          .collection("users")
          .doc(existingUser.uid)
          .set({
            name,
            email,
            uid: existingUser.uid,
            rollNo,
            rollNumber: rollNo,
            dept,
            year: year || "",
            semester: semester || "",
            role: "Student",
            createdAt: new Date().toISOString(),
          });

        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        await transporter.verify();

        const mailOptions = {
          from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
          to: email,
          subject: "Your CampusConnect Account",
          text: `Hi ${name},\n\nYour account already exists in CampusConnect.\n\n- CampusConnect Team`,
        };

        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({
          message: "User exists. Added to Firestore and notified.",
          uid: existingUser.uid,
        });
      } else {
        return res.status(400).json({
          message: "User already exists in both Firebase Auth and Firestore",
        });
      }
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const firestore = admin.firestore();
    await firestore
      .collection("users")
      .doc(userRecord.uid)
      .set({
        name,
        email,
        uid: userRecord.uid,
        rollNo,
        rollNumber: rollNo,
        dept,
        year: year || "",
        semester: semester || "",
        role: "Student",
      });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Your CampusConnect Account",
      text: `Hi ${name},\n\nYour account has been created.\nEmail: ${email}\nPassword: ${password}\n\n- CampusConnect Team`,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "User created and email sent",
      uid: userRecord.uid,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/createTeacher", async (req, res) => {
  const { name, email, employeeId, dept, assignedCourses } = req.body;

  if (!name || !email || !employeeId || !dept) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    let user;
    let generatedPassword = Math.random().toString(36).slice(-8); // random password
    let isNewUser = false;

    try {
      // check if teacher already exists
      user = await admin.auth().getUserByEmail(email);

      // User exists - update their password so admin knows the new password
      await admin.auth().updateUser(user.uid, {
        password: generatedPassword,
        displayName: name,
      });
      console.log(`Updated existing user ${email} with new password`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        // ✅ create new teacher with random password
        user = await admin.auth().createUser({
          email,
          displayName: name,
          password: generatedPassword,
        });
        isNewUser = true;
        console.log(`Created new user ${email}`);
      } else {
        throw err;
      }
    }

    // ✅ set teacher role
    await admin.auth().setCustomUserClaims(user.uid, { teacher: true });
    console.log(`Set teacher claim for ${email}`);

    // ✅ save to Firestore
    const firestore = admin.firestore();
    await firestore.collection("teachers").doc(user.uid).set({
      name,
      email,
      employeeId,
      dept,
      assignedCourses,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    });

    // ✅ email with credentials
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    const mailText = `Hi ${name},

You have been ${isNewUser ? "added as a teacher" : "updated"} in CampusConnect.

Here are your login credentials:
📧 Email: ${email}
🔐 Password: ${generatedPassword}

Please log in and change your password after first login.

- CampusConnect Team`;

    await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Your CampusConnect Teacher Login",
      text: mailText,
    });

    return res.status(200).json({
      message: isNewUser
        ? "Teacher added and login email sent successfully."
        : "Teacher updated and new credentials sent successfully.",
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/setTeacherRole", async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: "UID is required to set role" });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { teacher: true });
    res.status(200).json({ message: "Teacher role assigned successfully!" });
  } catch (error) {
    console.error("Error setting teacher role:", error);
    res
      .status(500)
      .json({ message: "Failed to set teacher role", error: error.message });
  }
});

app.post("/api/deleteUser", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    await admin.auth().deleteUser(uid);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/test-mail", async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"CampusConnect" <${process.env.EMAIL_USERNAME}>`,
      to: "koliviraj555@gmail.com",
      subject: "Test Email",
      text: "Yeh test email hai from Nodemailer",
    });

    res.send("Test email sent: " + info.messageId);
  } catch (err) {
    res.status(500).send("Error sending test mail: " + err.message);
  }
});

app.get("/api/subjects", async (req, res) => {
  const { department, year } = req.query;

  if (!department || !year) {
    return res
      .status(400)
      .json({ message: "Department and year are required." });
  }

  try {
    const subjectsList = {
      "Computer Engineering": {
        "1st": ["Introduction to Programming", "Mathematics I"],
        "2nd": ["Data Structures", "Algorithms"],
        "3rd": ["Operating Systems", "Database Management"],
        "4th": ["Machine Learning", "Cloud Computing"],
      },
      "Electronics And TeleCommunication Engineering": {
        "1st": ["Basic Electronics", "Mathematics I"],
        "2nd": ["Signals and Systems", "Digital Electronics"],
        "3rd": ["Communication Systems", "Microprocessors"],
        "4th": ["VLSI Design", "Embedded Systems"],
      },
      // Add other departments and their subjects here
    };

    const subjects = subjectsList[department]?.[year] || [];
    res.status(200).json({ subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subjects.", error: error.message });
  }
});

// Profile Picture Upload Endpoint (no auth required for simplicity)
app.post("/api/upload-profile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "campus-connect/profiles",
          resource_type: "image",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    // Return the uploaded file URL
    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Failed to upload image",
      error: error.message,
    });
  }
});

// Cloudinary File Upload Endpoint
app.post("/api/upload-material", upload.single("file"), async (req, res) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user has teacher claim (optional, can be removed for testing)
    // if (!decodedToken.teacher) {
    //   return res.status(403).json({ message: "Only teachers can upload materials" });
    // }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get file info
    const { title, description, category, department, subject } = req.body;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "campus-connect/materials",
          resource_type: "auto", // Automatically detect file type
          public_id: `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, "_")}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    // Return the uploaded file info
    res.status(200).json({
      success: true,
      fileURL: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileSize: uploadResult.bytes,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
});

// Delete file from Cloudinary
app.delete("/api/delete-material/:publicId", async (req, res) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    await admin.auth().verifyIdToken(token);

    const { publicId } = req.params;
    const decodedPublicId = decodeURIComponent(publicId);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(decodedPublicId);

    res.status(200).json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Failed to delete file",
      error: error.message,
    });
  }
});

// ============================================
// EXAM TIMETABLE OCR ENDPOINTS
// ============================================

// Upload exam timetable PDF and extract text
app.post(
  "/api/upload-exam-timetable",
  upload.single("file"),
  async (req, res) => {
    try {
      // Verify user is authenticated and is admin
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ message: "No authorization token provided" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Check if user is admin
      const adminDoc = await admin
        .firestore()
        .collection("admins")
        .doc(decodedToken.uid)
        .get();
      if (!adminDoc.exists) {
        return res
          .status(403)
          .json({ message: "Only admins can upload exam timetables" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { year, branch } = req.body;
      if (!year || !branch) {
        return res
          .status(400)
          .json({ message: "Year and branch are required" });
      }

      // For PDF files, extract text using pdf-parse
      let extractedText = "";

      if (req.file.mimetype === "application/pdf") {
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text;
      } else if (req.file.mimetype.startsWith("image/")) {
        // For images, we'll use Tesseract.js
        const Tesseract = require("tesseract.js");
        const result = await Tesseract.recognize(req.file.buffer, "eng");
        extractedText = result.data.text;
      } else {
        return res
          .status(400)
          .json({ message: "Only PDF and image files are supported" });
      }

      // Upload the original file to Cloudinary for reference
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect/exam-timetables",
            resource_type: "auto",
            public_id: `exam-timetable-${year}-${branch}-${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      res.status(200).json({
        success: true,
        extractedText,
        fileURL: uploadResult.secure_url,
        message: "File uploaded and text extracted successfully",
      });
    } catch (error) {
      console.error("Exam timetable upload error:", error);
      res.status(500).json({
        message: "Failed to process exam timetable",
        error: error.message,
      });
    }
  }
);

// Clear all exam timetable data for a specific year/branch
app.delete("/api/clear-exam-timetable", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user is admin
    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();
    if (!adminDoc.exists) {
      return res
        .status(403)
        .json({ message: "Only admins can clear exam timetables" });
    }

    const { year, branch, clearAll } = req.body;

    const firestore = admin.firestore();
    let query = firestore.collection("examTimetable");

    if (!clearAll) {
      if (year) query = query.where("year", "==", year);
      if (branch) query = query.where("branch", "==", branch);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res
        .status(200)
        .json({ message: "No exam timetable data to clear", deletedCount: 0 });
    }

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `Cleared ${snapshot.size} exam timetable entries`,
      deletedCount: snapshot.size,
    });
  } catch (error) {
    console.error("Clear exam timetable error:", error);
    res.status(500).json({
      message: "Failed to clear exam timetable",
      error: error.message,
    });
  }
});

// Save parsed exam timetable data (with duplicate prevention)
app.post("/api/save-exam-timetable", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user is admin
    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();
    if (!adminDoc.exists) {
      return res
        .status(403)
        .json({ message: "Only admins can save exam timetables" });
    }

    const { exams, year, branch } = req.body;

    if (!exams || !Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({ message: "No exam data provided" });
    }

    const firestore = admin.firestore();

    // Fetch existing exams to check for duplicates
    const existingSnapshot = await firestore.collection("examTimetable").get();
    const existingExams = existingSnapshot.docs.map((doc) => doc.data());

    // Create a Set of existing exam keys for fast lookup
    const existingKeys = new Set(
      existingExams.map(
        (e) => `${e.date}|${e.courseCode}|${e.year}|${e.branch}`
      )
    );

    // Filter out duplicates
    const newExams = exams.filter((exam) => {
      const examYear = exam.year || year;
      const examBranch = exam.branch || branch;
      const key = `${exam.date}|${exam.courseCode}|${examYear}|${examBranch}`;
      return !existingKeys.has(key);
    });

    if (newExams.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All exams already exist. No new entries added.",
        savedCount: 0,
        skippedCount: exams.length,
      });
    }

    const batch = firestore.batch();

    newExams.forEach((exam) => {
      const docRef = firestore.collection("examTimetable").doc();
      batch.set(docRef, {
        ...exam,
        year: exam.year || year,
        branch: exam.branch || branch,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    const skippedCount = exams.length - newExams.length;
    res.status(200).json({
      success: true,
      message: `Saved ${newExams.length} exam entries${
        skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ""
      }`,
      savedCount: newExams.length,
      skippedCount: skippedCount,
    });
  } catch (error) {
    console.error("Save exam timetable error:", error);
    res.status(500).json({
      message: "Failed to save exam timetable",
      error: error.message,
    });
  }
});

// Remove duplicate exams from database
app.delete("/api/remove-duplicate-exams", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user is admin
    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();
    if (!adminDoc.exists) {
      return res
        .status(403)
        .json({ message: "Only admins can remove duplicate exams" });
    }

    const firestore = admin.firestore();
    const snapshot = await firestore.collection("examTimetable").get();

    // Group exams by unique key
    const examGroups = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const key = `${data.date}|${data.courseCode}|${data.year}|${data.branch}`;
      if (!examGroups[key]) {
        examGroups[key] = [];
      }
      examGroups[key].push(doc.id);
    });

    // Find duplicates (keep first, delete rest)
    const idsToDelete = [];
    Object.values(examGroups).forEach((ids) => {
      if (ids.length > 1) {
        // Keep the first one, delete the rest
        idsToDelete.push(...ids.slice(1));
      }
    });

    if (idsToDelete.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No duplicates found",
        deletedCount: 0,
      });
    }

    // Delete duplicates in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deletedCount = 0;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = firestore.batch();
      const batchIds = idsToDelete.slice(i, i + batchSize);
      batchIds.forEach((id) => {
        batch.delete(firestore.collection("examTimetable").doc(id));
      });
      await batch.commit();
      deletedCount += batchIds.length;
    }

    res.status(200).json({
      success: true,
      message: `Removed ${deletedCount} duplicate exam entries`,
      deletedCount: deletedCount,
    });
  } catch (error) {
    console.error("Remove duplicates error:", error);
    res.status(500).json({
      message: "Failed to remove duplicates",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
