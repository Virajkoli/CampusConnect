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
  }),
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
      "text/csv",
      "application/csv",
      "text/comma-separated-values",
      "application/vnd.ms-excel",
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

    const fileName = (file.originalname || "").toLowerCase();
    const isCsvByExtension = fileName.endsWith(".csv");

    if (allowedTypes.includes(file.mimetype) || isCsvByExtension) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only documents, images, and archives are allowed.",
        ),
      );
    }
  },
});

const BRANCHES = [
  "Computer Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electronics And TeleCommunication Engineering",
  "Instrumentation Engineering",
];

const YEAR_KEYS = ["1st", "2nd", "3rd", "4th"];

const DEFAULT_SUBJECT_SETS = {
  "Computer Engineering": {
    "1st": [
      "Introduction to Programming",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Data Structures",
      "Algorithms",
      "Computer Networks",
      "Database Systems",
      "Software Engineering",
    ],
    "3rd": [
      "Operating Systems",
      "Database Management",
      "Computer Graphics",
      "Web Development",
      "Mobile App Development",
    ],
    "4th": [
      "Machine Learning",
      "Cloud Computing",
      "Artificial Intelligence",
      "Information Security",
      "Project Management",
    ],
  },
  "Electrical Engineering": {
    "1st": [
      "Basic Electrical",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Circuit Theory",
      "Electromagnetic Fields",
      "Electrical Measurements",
      "Power Systems",
      "Control Systems",
    ],
    "3rd": [
      "Power Electronics",
      "Electrical Machines",
      "Digital Signal Processing",
      "Microprocessors",
      "Renewable Energy",
    ],
    "4th": [
      "High Voltage Engineering",
      "Power System Protection",
      "Electric Drives",
      "Smart Grid",
      "Energy Management",
    ],
  },
  "Civil Engineering": {
    "1st": [
      "Engineering Drawing",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Structural Mechanics",
      "Fluid Mechanics",
      "Surveying",
      "Building Materials",
      "Geology",
    ],
    "3rd": [
      "Design of Structures",
      "Geotechnical Engineering",
      "Transportation Engineering",
      "Water Resources",
      "Environmental Engineering",
    ],
    "4th": [
      "Construction Management",
      "Advanced Structures",
      "Urban Planning",
      "Earthquake Engineering",
      "Project Management",
    ],
  },
  "Mechanical Engineering": {
    "1st": [
      "Engineering Mechanics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Thermodynamics",
      "Fluid Mechanics",
      "Manufacturing Processes",
      "Materials Science",
      "Machine Drawing",
    ],
    "3rd": [
      "Heat Transfer",
      "Machine Design",
      "CAD/CAM",
      "Industrial Engineering",
      "Metrology",
    ],
    "4th": [
      "Robotics",
      "Power Plant Engineering",
      "Automobile Engineering",
      "Refrigeration",
      "Project Management",
    ],
  },
  "Electronics And TeleCommunication Engineering": {
    "1st": [
      "Basic Electronics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Signals and Systems",
      "Digital Electronics",
      "Circuit Theory",
      "Microprocessors",
      "Communication Principles",
    ],
    "3rd": [
      "Communication Systems",
      "Microprocessors",
      "Control Systems",
      "Digital Signal Processing",
      "Antenna Theory",
    ],
    "4th": [
      "VLSI Design",
      "Wireless Communication",
      "Optical Communication",
      "Embedded Systems",
      "Satellite Communication",
    ],
  },
  "Instrumentation Engineering": {
    "1st": [
      "Basic Instrumentation",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Transducers",
      "Signal Conditioning",
      "Control Systems",
      "Digital Electronics",
      "Process Control",
    ],
    "3rd": [
      "Industrial Instrumentation",
      "Microprocessors",
      "Digital Signal Processing",
      "Biomedical Instrumentation",
      "Analytical Instrumentation",
    ],
    "4th": [
      "Advanced Control Systems",
      "VLSI Design",
      "Robotics",
      "IoT Systems",
      "Automation",
    ],
  },
};

const BRANCH_ALIASES = {
  computer: "Computer Engineering",
  "computer engineering": "Computer Engineering",
  electrical: "Electrical Engineering",
  "electrical engineering": "Electrical Engineering",
  civil: "Civil Engineering",
  "civil engineering": "Civil Engineering",
  mechanical: "Mechanical Engineering",
  "mechanical engineering": "Mechanical Engineering",
  entc: "Electronics And TeleCommunication Engineering",
  electronics: "Electronics And TeleCommunication Engineering",
  "electronics and telecommunication":
    "Electronics And TeleCommunication Engineering",
  "electronics and telecommunication engineering":
    "Electronics And TeleCommunication Engineering",
  instrumentation: "Instrumentation Engineering",
  "instrumentation engineering": "Instrumentation Engineering",
};

const YEAR_ALIASES = {
  1: "1st",
  "1st": "1st",
  first: "1st",
  2: "2nd",
  "2nd": "2nd",
  second: "2nd",
  3: "3rd",
  "3rd": "3rd",
  third: "3rd",
  4: "4th",
  "4th": "4th",
  fourth: "4th",
};

const createMailTransporter = () => {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const normalizeBranch = (value = "") => {
  const key = String(value).trim().toLowerCase();
  if (!key) return "";
  return BRANCH_ALIASES[key] || "";
};

const normalizeYear = (value = "") => {
  const key = String(value).trim().toLowerCase();
  if (!key) return "";
  return YEAR_ALIASES[key] || "";
};

const normalizePhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 10 ? digits : "";
};

const makeSubjectSetDocId = (branch, year) => {
  return `${branch}_${year}`.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
};

const verifyAdminFromRequest = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("No authorization token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  if (decodedToken.admin) {
    return decodedToken;
  }

  const adminDoc = await admin
    .firestore()
    .collection("admins")
    .doc(decodedToken.uid)
    .get();
  if (!adminDoc.exists) {
    throw new Error("Only admins are authorized");
  }

  return decodedToken;
};

const ensureSubjectSetsInitialized = async () => {
  const firestore = admin.firestore();
  const snapshot = await firestore.collection("subjectSets").limit(1).get();
  if (!snapshot.empty) return;

  const batch = firestore.batch();
  BRANCHES.forEach((branch) => {
    YEAR_KEYS.forEach((year) => {
      const docRef = firestore
        .collection("subjectSets")
        .doc(makeSubjectSetDocId(branch, year));
      batch.set(docRef, {
        branch,
        year,
        subjects: DEFAULT_SUBJECT_SETS?.[branch]?.[year] || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });
  await batch.commit();
};

const getSubjectSetsMap = async () => {
  await ensureSubjectSetsInitialized();

  const subjectSetsMap = {};
  const firestore = admin.firestore();
  const snapshot = await firestore.collection("subjectSets").get();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (!subjectSetsMap[data.branch]) {
      subjectSetsMap[data.branch] = {};
    }
    subjectSetsMap[data.branch][data.year] = data.subjects || [];
  });

  return subjectSetsMap;
};

const isCsvFile = (file) => {
  const csvMimeTypes = [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
  ];
  const byMime = csvMimeTypes.includes(file.mimetype || "");
  const byName = (file.originalname || "").toLowerCase().endsWith(".csv");
  return byMime || byName;
};

const extractTextFromUploadedFile = async (file) => {
  if (isCsvFile(file)) {
    return file.buffer.toString("utf-8");
  }

  if (file.mimetype === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(file.buffer);
    return pdfData.text || "";
  }

  if (file.mimetype.startsWith("image/")) {
    const Tesseract = require("tesseract.js");
    const result = await Tesseract.recognize(file.buffer, "eng");
    return result.data.text || "";
  }

  throw new Error("Only PDF and image files are supported");
};

const parseCsvLine = (line, delimiter) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseStudentsFromCsv = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const delimiter = lines[0].includes(";")
    ? ";"
    : lines[0].includes("\t")
      ? "\t"
      : ",";
  const headers = parseCsvLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/\s+/g, "").trim(),
  );

  const idx = {
    name: headers.findIndex((h) => h === "name" || h === "studentname"),
    prn: headers.findIndex(
      (h) => h === "prn" || h === "rollno" || h === "rollnumber",
    ),
    phone: headers.findIndex(
      (h) =>
        h === "mobile" ||
        h === "mobileno" ||
        h === "phone" ||
        h === "phonenumber",
    ),
    branch: headers.findIndex(
      (h) => h === "branch" || h === "department" || h === "dept",
    ),
    year: headers.findIndex((h) => h === "year" || h === "academicyear"),
    email: headers.findIndex((h) => h === "email" || h === "contactemail"),
  };

  const parsed = [];
  const seenPrn = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i], delimiter);
    const name = idx.name >= 0 ? String(columns[idx.name] || "").trim() : "";
    const prn =
      idx.prn >= 0
        ? String(columns[idx.prn] || "")
            .trim()
            .toUpperCase()
        : "";
    const phone =
      idx.phone >= 0 ? normalizePhone(columns[idx.phone] || "") : "";
    const branch =
      idx.branch >= 0 ? normalizeBranch(columns[idx.branch] || "") : "";
    const year = idx.year >= 0 ? normalizeYear(columns[idx.year] || "") : "";
    const email =
      idx.email >= 0
        ? String(columns[idx.email] || "")
            .trim()
            .toLowerCase()
        : "";

    const validationErrors = [];
    if (!name) validationErrors.push("Missing name");
    if (!prn) validationErrors.push("Missing PRN");
    if (!phone) validationErrors.push("Missing/invalid phone");
    if (!branch) validationErrors.push("Missing/invalid branch");
    if (!year) validationErrors.push("Missing/invalid year");
    if (prn && seenPrn.has(prn)) validationErrors.push("Duplicate PRN in file");

    if (prn) {
      seenPrn.add(prn);
    }

    parsed.push({
      name,
      prn,
      phone,
      branch,
      year,
      email,
      sourceLine: lines[i],
      validationErrors,
    });
  }

  return parsed;
};

const parseStudentsFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes("name") &&
      lower.includes("prn") &&
      (lower.includes("mobile") || lower.includes("phone"))
    ) {
      continue;
    }

    const phoneMatch = line.match(/\b\d{10}\b/);
    const prnMatch = line.match(/\b[A-Za-z0-9]{8,20}\b/);
    const emailMatch = line.match(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    );

    const yearMatch = line.match(
      /\b(1st|2nd|3rd|4th|first|second|third|fourth|1|2|3|4)\b/i,
    );

    const detectedBranch = BRANCHES.find((b) =>
      lower.includes(b.toLowerCase()),
    );

    if (!phoneMatch && !prnMatch && !detectedBranch) {
      continue;
    }

    const branch = detectedBranch || normalizeBranch(line);
    const year = normalizeYear(yearMatch ? yearMatch[1] : "");
    const phone = normalizePhone(phoneMatch ? phoneMatch[0] : "");
    const prn = (prnMatch ? prnMatch[0] : "").toUpperCase();

    let name = line;
    if (prn) name = name.replace(prn, " ");
    if (phone) name = name.replace(phone, " ");
    if (yearMatch) name = name.replace(yearMatch[0], " ");
    if (branch) name = name.replace(branch, " ");
    if (emailMatch) name = name.replace(emailMatch[0], " ");
    name = name.replace(/\s{2,}/g, " ").trim();

    parsed.push({
      name,
      prn,
      phone,
      branch,
      year,
      email: emailMatch ? emailMatch[0].toLowerCase() : "",
      sourceLine: line,
    });
  }

  const seenPrn = new Set();
  return parsed.map((entry) => {
    const validationErrors = [];
    if (!entry.name) validationErrors.push("Missing name");
    if (!entry.prn) validationErrors.push("Missing PRN");
    if (!entry.phone) validationErrors.push("Missing/invalid phone");
    if (!entry.branch) validationErrors.push("Missing/invalid branch");
    if (!entry.year) validationErrors.push("Missing/invalid year");

    if (entry.prn) {
      if (seenPrn.has(entry.prn)) {
        validationErrors.push("Duplicate PRN in file");
      }
      seenPrn.add(entry.prn);
    }

    return {
      ...entry,
      validationErrors,
    };
  });
};

const buildStudentPassword = (name, phone, prn) => {
  const compactName = String(name || "student")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 8);
  return `${compactName}${phone}${String(prn || "").toLowerCase()}`;
};

const makeStudentAuthEmail = (prn) => {
  return `${String(prn).toLowerCase()}@campusconnect.student`;
};

const getPrnFromRecord = (data = {}) => {
  return (data.rollNo || data.rollNumber || data.prn || "")
    .toString()
    .trim()
    .toUpperCase();
};

const buildExistingStudentIndex = async (firestore) => {
  const usersSnapshot = await firestore.collection("users").get();
  const studentsSnapshot = await firestore.collection("students").get();

  const byPrn = new Map();

  usersSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const prn = getPrnFromRecord(data);
    if (!prn) return;

    const current = byPrn.get(prn) || { prn };
    byPrn.set(prn, {
      ...current,
      uid: current.uid || data.uid || docSnap.id,
      email: current.email || data.email || "",
      userDocId: docSnap.id,
    });
  });

  studentsSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const prn = getPrnFromRecord(data);
    if (!prn) return;

    const current = byPrn.get(prn) || { prn };
    byPrn.set(prn, {
      ...current,
      uid: current.uid || data.uid || docSnap.id,
      email: current.email || data.email || "",
      studentDocId: docSnap.id,
    });
  });

  return byPrn;
};

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
    const subjectSetsMap = await getSubjectSetsMap();
    const subjects = subjectSetsMap[department]?.[year] || [];
    res.status(200).json({ subjects });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch subjects.", error: error.message });
  }
});

app.get("/api/admin/subject-sets", async (req, res) => {
  try {
    await verifyAdminFromRequest(req);
    const subjectSets = await getSubjectSetsMap();
    res.status(200).json({ success: true, subjectSets });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
});

app.put("/api/admin/subject-sets", async (req, res) => {
  try {
    await verifyAdminFromRequest(req);

    const { branch, year, subjects } = req.body;
    const normalizedBranch = normalizeBranch(branch);
    const normalizedYear = normalizeYear(year);
    const cleanedSubjects = Array.isArray(subjects)
      ? subjects.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (!normalizedBranch || !normalizedYear || cleanedSubjects.length === 0) {
      return res.status(400).json({
        message: "Branch, year and at least one subject are required",
      });
    }

    const docId = makeSubjectSetDocId(normalizedBranch, normalizedYear);
    await admin.firestore().collection("subjectSets").doc(docId).set(
      {
        branch: normalizedBranch,
        year: normalizedYear,
        subjects: cleanedSubjects,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const subjectSets = await getSubjectSetsMap();
    res.status(200).json({
      success: true,
      message: "Subject set updated successfully",
      subjectSets,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
});

app.post(
  "/api/admin/parse-student-onboarding",
  upload.single("file"),
  async (req, res) => {
    try {
      await verifyAdminFromRequest(req);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const extractedText = await extractTextFromUploadedFile(req.file);
      const entries = isCsvFile(req.file)
        ? parseStudentsFromCsv(extractedText)
        : parseStudentsFromText(extractedText);

      res.status(200).json({
        success: true,
        extractedText,
        entries,
      });
    } catch (error) {
      const status = /authorized|token/i.test(error.message) ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  },
);

app.post("/api/admin/precheck-student-onboarding", async (req, res) => {
  try {
    await verifyAdminFromRequest(req);

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No student entries provided" });
    }

    const firestore = admin.firestore();
    const existingByPrn = await buildExistingStudentIndex(firestore);

    const inFilePrn = new Set();
    const duplicateInDb = [];
    const duplicateInFile = [];

    students.forEach((rawEntry) => {
      const prn = String(rawEntry.prn || "")
        .trim()
        .toUpperCase();
      const name = String(rawEntry.name || "").trim();

      if (!prn) return;

      if (inFilePrn.has(prn)) {
        duplicateInFile.push({ prn, name });
      }
      inFilePrn.add(prn);

      if (existingByPrn.has(prn)) {
        const existing = existingByPrn.get(prn);
        duplicateInDb.push({
          prn,
          name,
          existingUid: existing.uid || "",
          existingEmail: existing.email || "",
        });
      }
    });

    res.status(200).json({
      success: true,
      precheck: {
        totalRows: students.length,
        duplicateDbCount: duplicateInDb.length,
        duplicateFileCount: duplicateInFile.length,
        duplicateInDb,
        duplicateInFile,
      },
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
});

app.post("/api/admin/bulk-onboard-students", async (req, res) => {
  try {
    await verifyAdminFromRequest(req);

    const { students, duplicateStrategy = "skip" } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No student entries provided" });
    }

    if (!["skip", "update"].includes(duplicateStrategy)) {
      return res.status(400).json({
        message: "Invalid duplicate strategy. Use 'skip' or 'update'.",
      });
    }

    const firestore = admin.firestore();
    const subjectSets = await getSubjectSetsMap();
    const existingByPrn = await buildExistingStudentIndex(firestore);

    const inBatchPrns = new Set();
    const failedEntries = [];
    const createdEntries = [];
    const skippedExistingEntries = [];
    const updatedEntries = [];
    const manualCredentialEntries = [];
    let credentialsSentCount = 0;

    for (const rawEntry of students) {
      const name = String(rawEntry.name || "").trim();
      const prn = String(rawEntry.prn || "")
        .trim()
        .toUpperCase();
      const phone = normalizePhone(rawEntry.phone || "");
      const branch = normalizeBranch(rawEntry.branch || "");
      const year = normalizeYear(rawEntry.year || "");
      const contactEmail = String(rawEntry.email || "")
        .trim()
        .toLowerCase();

      const rowErrors = [];
      if (!name) rowErrors.push("Missing name");
      if (!prn) rowErrors.push("Missing PRN");
      if (!phone) rowErrors.push("Missing/invalid mobile number");
      if (!branch) rowErrors.push("Missing/invalid branch");
      if (!year) rowErrors.push("Missing/invalid year");
      if (prn && inBatchPrns.has(prn))
        rowErrors.push("Duplicate PRN in upload");

      const subjects = subjectSets?.[branch]?.[year] || [];
      if (subjects.length === 0) {
        rowErrors.push("No subject set configured for branch/year");
      }

      if (rowErrors.length > 0) {
        failedEntries.push({ name, prn, reason: rowErrors.join(", ") });
        continue;
      }

      inBatchPrns.add(prn);
      const authEmail = makeStudentAuthEmail(prn);
      const password = buildStudentPassword(name, phone, prn);

      if (existingByPrn.has(prn)) {
        const existing = existingByPrn.get(prn);

        if (duplicateStrategy === "skip") {
          skippedExistingEntries.push({
            name,
            prn,
            reason: "Already enrolled (PRN exists)",
            existingUid: existing.uid || "",
            existingEmail: existing.email || "",
          });
          continue;
        }

        const mergedPayload = {
          name,
          prn,
          rollNo: prn,
          rollNumber: prn,
          phone,
          mobile: phone,
          dept: branch,
          department: branch,
          year,
          subjects,
          role: "Student",
          contactEmail: contactEmail || "",
          onboardingSource: "bulk_upload_update",
          updatedAt: new Date().toISOString(),
        };

        const targetUid =
          existing.uid || existing.userDocId || existing.studentDocId;
        const keepEmail = existing.email || "";
        if (keepEmail) {
          mergedPayload.email = keepEmail;
        }
        if (targetUid) {
          mergedPayload.uid = targetUid;
        }

        if (existing.userDocId || targetUid) {
          await firestore
            .collection("users")
            .doc(existing.userDocId || targetUid)
            .set(mergedPayload, { merge: true });
        }

        if (existing.studentDocId || targetUid) {
          await firestore
            .collection("students")
            .doc(existing.studentDocId || targetUid)
            .set(mergedPayload, { merge: true });
        }

        updatedEntries.push({
          name,
          prn,
          existingUid: existing.uid || "",
          existingEmail: existing.email || "",
        });
        continue;
      }

      try {
        const existingAuthUser = await admin
          .auth()
          .getUserByEmail(authEmail)
          .catch((e) => {
            if (e.code === "auth/user-not-found") return null;
            throw e;
          });

        if (existingAuthUser) {
          failedEntries.push({
            name,
            prn,
            reason: "Duplicate PRN (auth account already exists)",
          });
          continue;
        }

        const userRecord = await admin.auth().createUser({
          email: authEmail,
          password,
          displayName: name,
        });

        const studentPayload = {
          uid: userRecord.uid,
          name,
          email: authEmail,
          loginId: prn,
          prn,
          rollNo: prn,
          rollNumber: prn,
          phone,
          mobile: phone,
          dept: branch,
          department: branch,
          year,
          subjects,
          role: "Student",
          contactEmail: contactEmail || "",
          onboardingSource: "bulk_upload",
          createdAt: new Date().toISOString(),
        };

        await firestore
          .collection("users")
          .doc(userRecord.uid)
          .set(studentPayload);
        await firestore
          .collection("students")
          .doc(userRecord.uid)
          .set(studentPayload, { merge: true });

        if (contactEmail) {
          try {
            const transporter = createMailTransporter();
            await transporter.verify();
            await transporter.sendMail({
              from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
              to: contactEmail,
              subject: "CampusConnect Student Login Credentials",
              text: `Hi ${name},\n\nYour CampusConnect account is ready.\nLogin ID: ${prn}\nSystem Email: ${authEmail}\nPassword: ${password}\n\nPlease change your password after first login.`,
            });
            credentialsSentCount += 1;
          } catch (mailError) {
            console.error("Credential email failed:", mailError.message);
            manualCredentialEntries.push({
              name,
              prn,
              phone,
              branch,
              year,
              contactEmail,
              loginId: prn,
              systemEmail: authEmail,
              password,
              reason: `Email delivery failed: ${mailError.message}`,
            });
          }
        } else {
          manualCredentialEntries.push({
            name,
            prn,
            phone,
            branch,
            year,
            contactEmail: "",
            loginId: prn,
            systemEmail: authEmail,
            password,
            reason: "Contact email missing in uploaded data",
          });
        }

        createdEntries.push({
          uid: userRecord.uid,
          name,
          prn,
          email: authEmail,
        });
        existingByPrn.set(prn, {
          prn,
          uid: userRecord.uid,
          email: authEmail,
          userDocId: userRecord.uid,
          studentDocId: userRecord.uid,
        });
      } catch (createError) {
        failedEntries.push({
          name,
          prn,
          reason: createError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalProcessed: students.length,
        createdCount: createdEntries.length,
        updatedCount: updatedEntries.length,
        skippedExistingCount: skippedExistingEntries.length,
        failedCount: failedEntries.length,
        credentialsSentCount,
        manualCredentialCount: manualCredentialEntries.length,
        createdEntries,
        updatedEntries,
        skippedExistingEntries,
        failedEntries,
        manualCredentialEntries,
        duplicateStrategy,
      },
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    res.status(status).json({ message: error.message });
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
        },
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
        },
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
          },
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
  },
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
        (e) => `${e.date}|${e.courseCode}|${e.year}|${e.branch}`,
      ),
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
