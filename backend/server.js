const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const crypto = require("crypto");
const cloudinary = require("./cloudinary-config");

dotenv.config();

const admin = require("./firebase-admin");

const app = express();
const server = http.createServer(app);

// Get frontend URL from environment or use localhost as fallback
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DEPLOYED_FRONTEND_URL = "https://campus-connect-ten-theta.vercel.app";

const normalizeOrigin = (value = "") => {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
};

const ALLOWED_ORIGINS = Array.from(
  new Set(
    [
      normalizeOrigin(FRONTEND_URL),
      DEPLOYED_FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://10.231.120.217",
      "http://10.231.120.217:5173",
    ]
      .map(normalizeOrigin)
      .filter(Boolean),
  ),
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(normalizeOrigin(origin));
};

const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

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
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
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
          "Invalid file type. Only documents, images, audio, video, and archives are allowed.",
        ),
      );
    }
  },
});

const resolveChatAttachmentType = (attachment = {}) => {
  const explicitType = String(attachment.type || "").toLowerCase();
  if (["image", "video", "audio", "voice", "document"].includes(explicitType)) {
    return explicitType;
  }

  const mimeType = String(attachment.mimeType || "").toLowerCase();
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
};

const buildChatLastMessage = (textMessage = "", attachment = null) => {
  const trimmedText = String(textMessage || "").trim();
  if (trimmedText) {
    return trimmedText;
  }

  if (!attachment || !attachment.url) {
    return "";
  }

  const type = resolveChatAttachmentType(attachment);
  if (type === "image") {
    return "Image attachment";
  }

  if (type === "video") {
    return "Video attachment";
  }

  if (type === "voice") {
    return "Voice message";
  }

  if (type === "audio") {
    return "Audio attachment";
  }

  const fileName = String(attachment.name || "").trim();
  return fileName ? `Document: ${fileName}` : "Document attachment";
};

const BRANCHES = [
  "Computer Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electronics And TeleCommunication Engineering",
  "Instrumentation Engineering",
];

const YEAR_KEYS = ["1st", "2nd", "3rd", "4th"];
const SEMESTER_KEYS = ["1", "2"];
const JOB_PROFILE_CONFIG = {
  "Permanent Faculty": "PM",
  "Adjunct Faculty": "AD",
  "Visiting Faculty": "VT",
};

const LEGACY_DEFAULT_SUBJECT_SETS = {
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

const splitYearSubjectsBySemester = (subjects = []) => {
  const midpoint = Math.ceil(subjects.length / 2);
  return {
    1: subjects.slice(0, midpoint),
    2: subjects.slice(midpoint),
  };
};

const DEFAULT_SUBJECT_SETS = Object.fromEntries(
  Object.entries(LEGACY_DEFAULT_SUBJECT_SETS).map(([branch, yearsMap]) => {
    const semesterWiseYears = Object.fromEntries(
      Object.entries(yearsMap).map(([year, subjects]) => {
        return [year, splitYearSubjectsBySemester(subjects)];
      }),
    );

    return [branch, semesterWiseYears];
  }),
);

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

const SEMESTER_ALIASES = {
  1: "1",
  1: "1",
  sem1: "1",
  "1sem": "1",
  "1stsem": "1",
  semester1: "1",
  "semester 1": "1",
  first: "1",
  2: "2",
  2: "2",
  sem2: "2",
  "2sem": "2",
  "2ndsem": "2",
  semester2: "2",
  "semester 2": "2",
  second: "2",
};

const JOB_PROFILE_ALIASES = {
  permanent: "Permanent Faculty",
  "permanent faculty": "Permanent Faculty",
  adjunct: "Adjunct Faculty",
  "adjunct faculty": "Adjunct Faculty",
  visiting: "Visiting Faculty",
  "visiting faculty": "Visiting Faculty",
};

const ATTENDANCE_ALLOWED_DISTANCE_METERS = 30;
const ENFORCE_ATTENDANCE_DISTANCE_CHECK =
  String(process.env.ATTENDANCE_DISTANCE_ENFORCEMENT || "false")
    .trim()
    .toLowerCase() === "true";
const ATTENDANCE_WINDOW_SECONDS = 60;
const ATTENDANCE_WINDOW_SLOT_SECONDS = [60, 120, 180, 240, 300, 600];
const FACE_DESCRIPTOR_LENGTH = 128;
const FACE_MATCH_DISTANCE_THRESHOLD = 0.5;
const FACE_CHALLENGE_TTL_MS = 45 * 1000;
const ATTENDANCE_SETTINGS_COLLECTION = "system_settings";
const ATTENDANCE_SETTINGS_DOC_ID = "attendance";
const PASSWORD_RESET_OTP_COLLECTION = "password_reset_otps";
const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_REQUEST_COOLDOWN_MS = 45 * 1000;
const PASSWORD_RESET_OTP_SECRET =
  String(
    process.env.PASSWORD_RESET_OTP_SECRET || "campusconnect-password-reset",
  ).trim() || "campusconnect-password-reset";

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

const normalizeSemester = (value = "") => {
  const key = String(value).trim().toLowerCase().replace(/\s+/g, "");
  if (!key) return "";
  return SEMESTER_ALIASES[key] || "";
};

const normalizeJobProfile = (value = "") => {
  const key = String(value).trim().toLowerCase();
  if (!key) return "";
  return JOB_PROFILE_ALIASES[key] || "";
};

const normalizePhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 10 ? digits : "";
};

const normalizeEmail = (value = "") => {
  const email = String(value || "")
    .trim()
    .toLowerCase();
  return email.includes("@") ? email : "";
};

const maskEmailAddress = (email = "") => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return "";
  }

  const [localPart = "", domainPart = ""] = normalizedEmail.split("@");
  if (!localPart || !domainPart) {
    return "";
  }

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] || "*"}*`
      : `${localPart[0]}${"*".repeat(Math.max(1, localPart.length - 2))}${localPart[localPart.length - 1]}`;

  const domainSegments = domainPart.split(".");
  const rootDomain = domainSegments.shift() || "";
  const tld = domainSegments.join(".");
  const maskedRootDomain =
    rootDomain.length <= 2
      ? `${rootDomain[0] || "*"}*`
      : `${rootDomain[0]}${"*".repeat(Math.max(1, rootDomain.length - 2))}${rootDomain[rootDomain.length - 1]}`;

  return `${maskedLocal}@${maskedRootDomain}${tld ? `.${tld}` : ""}`;
};

const buildPasswordResetDocId = (loginKey = "") => {
  return crypto
    .createHash("sha256")
    .update(
      String(loginKey || "")
        .trim()
        .toLowerCase(),
    )
    .digest("hex");
};

const buildPasswordOtpHash = (loginKey, otp) => {
  return crypto
    .createHash("sha256")
    .update(
      `${String(loginKey || "")
        .trim()
        .toLowerCase()}|${String(otp || "").trim()}|${PASSWORD_RESET_OTP_SECRET}`,
    )
    .digest("hex");
};

const buildPasswordResetTokenHash = (loginKey, token) => {
  return crypto
    .createHash("sha256")
    .update(
      `${String(loginKey || "")
        .trim()
        .toLowerCase()}|${String(token || "").trim()}|${PASSWORD_RESET_OTP_SECRET}`,
    )
    .digest("hex");
};

const makeSubjectSetDocId = (branch, year, semester) => {
  return `${branch}_${year}_${semester}`
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();
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

const verifyTeacherFromRequest = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("No authorization token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    throw new Error("No authorization token provided");
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  const teacherDoc = await admin
    .firestore()
    .collection("teachers")
    .doc(decodedToken.uid)
    .get();

  if (!decodedToken.teacher && !teacherDoc.exists) {
    throw new Error("Only teachers are authorized");
  }

  return {
    decodedToken,
    teacherDoc,
  };
};

const verifyStudentFromRequest = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("No authorization token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    throw new Error("No authorization token provided");
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  const firestore = admin.firestore();
  const [userDoc, studentDoc] = await Promise.all([
    firestore.collection("users").doc(decodedToken.uid).get(),
    firestore.collection("students").doc(decodedToken.uid).get(),
  ]);

  const userData = userDoc.exists ? userDoc.data() || {} : {};
  const studentData = studentDoc.exists ? studentDoc.data() || {} : {};
  const role = String(userData.role || "").toLowerCase();

  if (!decodedToken.student && role !== "student" && !studentDoc.exists) {
    throw new Error("Only students are authorized");
  }

  return {
    decodedToken,
    userDoc,
    studentDoc,
    studentData: {
      ...studentData,
      ...userData,
      uid: decodedToken.uid,
    },
  };
};

const getAuthTokenFromRequest = (req) => {
  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader) {
    throw new Error("No authorization token provided");
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    throw new Error("No authorization token provided");
  }

  return token;
};

const getAttendanceSettings = async (firestore) => {
  const settingsDoc = await firestore
    .collection(ATTENDANCE_SETTINGS_COLLECTION)
    .doc(ATTENDANCE_SETTINGS_DOC_ID)
    .get();

  const settings = settingsDoc.exists ? settingsDoc.data() || {} : {};
  return {
    distanceEnforcementDefault:
      typeof settings.distanceEnforcementDefault === "boolean"
        ? settings.distanceEnforcementDefault
        : ENFORCE_ATTENDANCE_DISTANCE_CHECK,
    updatedAt: settings.updatedAt || null,
    updatedBy: String(settings.updatedBy || "").trim(),
  };
};

const shouldEnforceDistanceForSession = (sessionData = {}) => {
  if (typeof sessionData.enforceDistanceCheck === "boolean") {
    return sessionData.enforceDistanceCheck;
  }
  return ENFORCE_ATTENDANCE_DISTANCE_CHECK;
};

const ensureSubjectSetsInitialized = async () => {
  const firestore = admin.firestore();
  const snapshot = await firestore.collection("subjectSets").get();
  const existingIds = new Set(snapshot.docs.map((docSnap) => docSnap.id));

  const batch = firestore.batch();
  let hasWrites = false;
  BRANCHES.forEach((branch) => {
    YEAR_KEYS.forEach((year) => {
      SEMESTER_KEYS.forEach((semester) => {
        const docId = makeSubjectSetDocId(branch, year, semester);
        if (existingIds.has(docId)) return;

        const docRef = firestore.collection("subjectSets").doc(docId);
        batch.set(docRef, {
          branch,
          year,
          semester,
          subjects: DEFAULT_SUBJECT_SETS?.[branch]?.[year]?.[semester] || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        hasWrites = true;
      });
    });
  });

  if (!hasWrites) {
    return;
  }

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
    if (!subjectSetsMap[data.branch][data.year]) {
      subjectSetsMap[data.branch][data.year] = {};
    }

    const semester = normalizeSemester(data.semester) || "1";
    subjectSetsMap[data.branch][data.year][semester] = data.subjects || [];
  });

  return subjectSetsMap;
};

const getAllowedSubjectsForBranchYear = (subjectSetsMap, branch, year) => {
  const semesterWiseSubjects = subjectSetsMap?.[branch]?.[year] || {};
  const sem1 = Array.isArray(semesterWiseSubjects["1"])
    ? semesterWiseSubjects["1"]
    : [];
  const sem2 = Array.isArray(semesterWiseSubjects["2"])
    ? semesterWiseSubjects["2"]
    : [];
  return [...new Set([...sem1, ...sem2].map((s) => String(s).trim()))].filter(
    Boolean,
  );
};

const buildAssignmentsFromLegacyCourses = (
  department,
  assignedCourses = [],
) => {
  const normalizedBranch = normalizeBranch(department || "");
  if (!normalizedBranch || !Array.isArray(assignedCourses)) {
    return [];
  }

  return assignedCourses
    .map((course) => {
      const normalizedYear = normalizeYear(course?.year || "");
      const subjects = Array.isArray(course?.subjects)
        ? [...new Set(course.subjects.map((s) => String(s).trim()))].filter(
            Boolean,
          )
        : [];

      if (!normalizedYear || subjects.length === 0) {
        return null;
      }

      return {
        branch: normalizedBranch,
        year: normalizedYear,
        subjects,
      };
    })
    .filter(Boolean);
};

const normalizeTeacherAssignments = ({
  assignments,
  subjectSetsMap,
  fallbackBranch,
  legacyAssignedCourses,
}) => {
  const rawAssignments = Array.isArray(assignments)
    ? assignments
    : buildAssignmentsFromLegacyCourses(fallbackBranch, legacyAssignedCourses);

  if (!Array.isArray(rawAssignments) || rawAssignments.length === 0) {
    throw new Error("At least one branch/year/subject assignment is required.");
  }

  const seenBranchYear = new Set();
  const normalizedAssignments = rawAssignments.map((item) => {
    const branch = normalizeBranch(
      item?.branch || item?.dept || fallbackBranch,
    );
    const year = normalizeYear(item?.year || "");
    const subjects = Array.isArray(item?.subjects)
      ? [...new Set(item.subjects.map((s) => String(s).trim()))].filter(Boolean)
      : [];

    if (!branch || !year || subjects.length === 0) {
      throw new Error(
        "Each assignment must include a valid branch, year and at least one subject.",
      );
    }

    const branchYearKey = `${branch}__${year}`;
    if (seenBranchYear.has(branchYearKey)) {
      throw new Error(`Duplicate assignment found for ${branch} ${year} year.`);
    }
    seenBranchYear.add(branchYearKey);

    const allowedSubjects = getAllowedSubjectsForBranchYear(
      subjectSetsMap,
      branch,
      year,
    );
    if (allowedSubjects.length === 0) {
      throw new Error(
        `No subject set configured for ${branch} ${year} year. Please configure it first.`,
      );
    }

    const invalidSubjects = subjects.filter(
      (subject) => !allowedSubjects.includes(subject),
    );
    if (invalidSubjects.length > 0) {
      throw new Error(
        `Invalid subjects for ${branch} ${year} year: ${invalidSubjects.join(", ")}`,
      );
    }

    return {
      branch,
      year,
      subjects,
    };
  });

  return normalizedAssignments;
};

const buildLegacyAssignedCourses = (assignments = []) => {
  const byYear = {};

  assignments.forEach((assignment) => {
    if (!byYear[assignment.year]) {
      byYear[assignment.year] = new Set();
    }

    assignment.subjects.forEach((subject) => {
      byYear[assignment.year].add(subject);
    });
  });

  return Object.entries(byYear).map(([year, subjectsSet]) => ({
    year,
    subjects: Array.from(subjectsSet),
  }));
};

const getAssignmentSummaryFields = (assignments = []) => {
  const assignedBranches = [
    ...new Set(assignments.map((assignment) => assignment.branch)),
  ];
  const assignedYears = [
    ...new Set(assignments.map((assignment) => assignment.year)),
  ];
  const assignedSubjects = [
    ...new Set(assignments.flatMap((assignment) => assignment.subjects || [])),
  ];

  return {
    assignedBranches,
    assignedYears,
    assignedSubjects,
  };
};

const generateTeacherId = async (firestore, jobProfile) => {
  const normalizedProfile = normalizeJobProfile(jobProfile);
  const prefix = JOB_PROFILE_CONFIG[normalizedProfile];

  if (!prefix) {
    throw new Error("Invalid job profile for teacher ID generation.");
  }

  const snapshot = await firestore.collection("teachers").get();
  let maxSequence = 0;

  snapshot.docs.forEach((docSnap) => {
    const teacherData = docSnap.data();
    const candidateId = String(
      teacherData.teacherId || teacherData.employeeId || "",
    ).trim();

    if (!candidateId.startsWith(prefix)) {
      return;
    }

    const sequencePart = candidateId.slice(prefix.length);
    const parsedSequence = Number.parseInt(sequencePart, 10);
    if (!Number.isNaN(parsedSequence)) {
      maxSequence = Math.max(maxSequence, parsedSequence);
    }
  });

  const nextSequence = String(maxSequence + 1).padStart(2, "0");
  return `${prefix}${nextSequence}`;
};

const parseTimeToMinutes = (timeValue = "") => {
  const normalized = String(timeValue || "").trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return Number.NaN;

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.NaN;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return Number.NaN;

  return hour * 60 + minute;
};

const isTimeRangeOverlapping = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

const makeSubjectId = (subjectName = "") => {
  return String(subjectName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const normalizeDeviceId = (deviceId = "") => {
  return String(deviceId || "")
    .trim()
    .toLowerCase();
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const haversineDistanceMeters = (pointA, pointB) => {
  const lat1 = Number(pointA?.lat);
  const lon1 = Number(pointA?.lng);
  const lat2 = Number(pointB?.lat);
  const lon2 = Number(pointB?.lng);

  if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) {
    return Number.POSITIVE_INFINITY;
  }

  const R = 6371000;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeFaceDescriptor = (descriptor = []) => {
  if (!Array.isArray(descriptor)) {
    return [];
  }

  const normalized = descriptor
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (normalized.length !== FACE_DESCRIPTOR_LENGTH) {
    return [];
  }

  return normalized;
};

const euclideanDistance = (leftDescriptor = [], rightDescriptor = []) => {
  if (
    !Array.isArray(leftDescriptor) ||
    !Array.isArray(rightDescriptor) ||
    leftDescriptor.length !== rightDescriptor.length ||
    leftDescriptor.length === 0
  ) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let i = 0; i < leftDescriptor.length; i += 1) {
    sum += (leftDescriptor[i] - rightDescriptor[i]) ** 2;
  }

  return Math.sqrt(sum);
};

const buildFaceConfidenceScore = (distance) => {
  if (!Number.isFinite(distance)) return 0;
  const score = Math.max(0, 1 - distance / FACE_MATCH_DISTANCE_THRESHOLD);
  return Number(score.toFixed(4));
};

const normalizeSubjectValues = (subjects = []) => {
  return (Array.isArray(subjects) ? subjects : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
};

const subjectMatches = (subjectName, subjectId, candidate) => {
  const normalizedCandidate = String(candidate || "").trim();
  if (!normalizedCandidate) return false;

  return (
    normalizedCandidate.toLowerCase() ===
      String(subjectName || "").toLowerCase() ||
    makeSubjectId(normalizedCandidate) === String(subjectId || "")
  );
};

const studentBelongsToSession = (studentData, sessionData) => {
  const studentBranch = normalizeBranch(
    studentData?.dept || studentData?.department || "",
  );
  const studentYear = normalizeYear(studentData?.year || "");
  const studentSemester = normalizeSemester(studentData?.semester || "");
  const studentSubjects = normalizeSubjectValues(studentData?.subjects);

  if (!studentBranch || !studentYear) {
    return false;
  }

  const branchOk = studentBranch === normalizeBranch(sessionData?.branch || "");
  const yearOk = studentYear === normalizeYear(sessionData?.year || "");
  const semesterValue = normalizeSemester(sessionData?.semester || "");
  const semesterOk =
    !semesterValue || !studentSemester || studentSemester === semesterValue;

  if (!branchOk || !yearOk || !semesterOk) {
    return false;
  }

  return studentSubjects.some((subject) =>
    subjectMatches(
      sessionData?.subjectName || "",
      sessionData?.subjectId || "",
      subject,
    ),
  );
};

const getStudentProfileByUid = async (firestore, uid) => {
  const [userDoc, studentDoc] = await Promise.all([
    firestore.collection("users").doc(uid).get(),
    firestore.collection("students").doc(uid).get(),
  ]);

  if (!userDoc.exists && !studentDoc.exists) {
    return null;
  }

  return {
    uid,
    ...(studentDoc.exists ? studentDoc.data() || {} : {}),
    ...(userDoc.exists ? userDoc.data() || {} : {}),
  };
};

const findStudentByStudentIdOrPrn = async (firestore, { studentId, prn }) => {
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedPrnInput = normalizePrn(prn || "");

  if (normalizedStudentId) {
    const byId = await getStudentProfileByUid(firestore, normalizedStudentId);
    if (byId) {
      return byId;
    }
  }

  const prnCandidates = [];
  if (normalizedPrnInput) {
    prnCandidates.push(normalizedPrnInput);
  }

  if (normalizedStudentId) {
    const maybePrn = normalizePrn(normalizedStudentId);
    if (maybePrn && !prnCandidates.includes(maybePrn)) {
      prnCandidates.push(maybePrn);
    }
  }

  if (prnCandidates.length === 0) {
    return null;
  }

  for (const prnCandidate of prnCandidates) {
    const lookups = await Promise.all([
      firestore
        .collection("users")
        .where("rollNo", "==", prnCandidate)
        .limit(1)
        .get(),
      firestore
        .collection("users")
        .where("rollNumber", "==", prnCandidate)
        .limit(1)
        .get(),
      firestore
        .collection("users")
        .where("prn", "==", prnCandidate)
        .limit(1)
        .get(),
      firestore
        .collection("students")
        .where("rollNo", "==", prnCandidate)
        .limit(1)
        .get(),
      firestore
        .collection("students")
        .where("rollNumber", "==", prnCandidate)
        .limit(1)
        .get(),
      firestore
        .collection("students")
        .where("prn", "==", prnCandidate)
        .limit(1)
        .get(),
    ]);

    for (const snapshot of lookups) {
      if (snapshot.empty) continue;

      const docSnap = snapshot.docs[0];
      const data = docSnap.data() || {};
      const resolvedUid = String(data.uid || docSnap.id || "").trim();
      if (!resolvedUid) continue;

      const studentProfile = await getStudentProfileByUid(
        firestore,
        resolvedUid,
      );
      if (studentProfile) {
        return studentProfile;
      }
    }
  }

  return null;
};

const getSessionEnrolledStudents = async (firestore, sessionData) => {
  const branch = normalizeBranch(sessionData?.branch || "");
  const year = normalizeYear(sessionData?.year || "");
  const semester = normalizeSemester(sessionData?.semester || "");
  const merged = new Map();

  const absorbDoc = (docSnap) => {
    const data = docSnap.data() || {};
    const uid = data.uid || docSnap.id;
    if (!uid) return;

    const existing = merged.get(uid) || { uid };
    merged.set(uid, {
      ...existing,
      ...data,
      uid,
    });
  };

  const fetchClassScopedCandidates = async () => {
    if (!branch || !year) {
      return [];
    }

    const queryConfig = [
      { collection: "students", branchField: "dept" },
      { collection: "students", branchField: "department" },
      { collection: "users", branchField: "dept", role: "Student" },
      { collection: "users", branchField: "department", role: "Student" },
    ];

    const tasks = queryConfig.map(async ({ collection, branchField, role }) => {
      try {
        let queryRef = firestore
          .collection(collection)
          .where(branchField, "==", branch)
          .where("year", "==", year);

        if (role) {
          queryRef = queryRef.where("role", "==", role);
        }

        if (semester) {
          queryRef = queryRef.where("semester", "==", semester);
        }

        return await queryRef.get();
      } catch {
        return null;
      }
    });

    const snapshots = await Promise.all(tasks);
    return snapshots.filter(Boolean);
  };

  const classScopedSnapshots = await fetchClassScopedCandidates();
  if (classScopedSnapshots.length > 0) {
    classScopedSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach(absorbDoc);
    });
  }

  if (merged.size === 0) {
    const [usersSnapshot, studentsSnapshot] = await Promise.all([
      firestore.collection("users").where("role", "==", "Student").get(),
      firestore.collection("students").get(),
    ]);

    usersSnapshot.docs.forEach(absorbDoc);
    studentsSnapshot.docs.forEach(absorbDoc);
  }

  return Array.from(merged.values()).filter((student) =>
    studentBelongsToSession(student, sessionData),
  );
};

const getSessionStudentIds = (sessionData = {}) => {
  const ids = [
    ...(Array.isArray(sessionData.enrolledStudentIds)
      ? sessionData.enrolledStudentIds
      : []),
    ...(Array.isArray(sessionData.presentStudentIds)
      ? sessionData.presentStudentIds
      : []),
    ...(Array.isArray(sessionData.absentStudentIds)
      ? sessionData.absentStudentIds
      : []),
    ...(Array.isArray(sessionData.presentStudents)
      ? sessionData.presentStudents.map((student) => student.studentId)
      : []),
    ...(Array.isArray(sessionData.absentStudents)
      ? sessionData.absentStudents.map((student) => student.studentId)
      : []),
  ];

  return Array.from(
    new Set(
      ids.map((studentId) => String(studentId || "").trim()).filter(Boolean),
    ),
  );
};

const getSessionPresentStudentIds = async (
  firestore,
  sessionData,
  sessionId,
  recordsCache,
) => {
  const explicit = Array.from(
    new Set(
      [
        ...(Array.isArray(sessionData.presentStudentIds)
          ? sessionData.presentStudentIds
          : []),
        ...(Array.isArray(sessionData.presentStudents)
          ? sessionData.presentStudents.map((student) => student.studentId)
          : []),
      ]
        .map((studentId) => String(studentId || "").trim())
        .filter(Boolean),
    ),
  );

  if (explicit.length > 0) {
    return explicit;
  }

  if (!sessionId) {
    return [];
  }

  if (recordsCache.has(sessionId)) {
    return recordsCache.get(sessionId);
  }

  const recordsSnapshot = await firestore
    .collection("attendance_records")
    .where("sessionId", "==", sessionId)
    .get();

  const ids = Array.from(
    new Set(
      recordsSnapshot.docs
        .map((docSnap) => String(docSnap.data()?.studentId || "").trim())
        .filter(Boolean),
    ),
  );

  recordsCache.set(sessionId, ids);
  return ids;
};

const buildSubjectAttendanceIndex = async (firestore, subjectId) => {
  const sessionsSnapshot = await firestore
    .collection("attendance_sessions")
    .where("subjectId", "==", subjectId)
    .where("status", "==", "ended")
    .get();

  const sessions = sessionsSnapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort(
      (a, b) =>
        Number(a.startTimeMs || toMillis(a.startTime) || 0) -
        Number(b.startTimeMs || toMillis(b.startTime) || 0),
    );

  const attendanceByStudentId = new Map();
  const recordsCache = new Map();

  for (const session of sessions) {
    const sessionId = String(session.sessionId || session.id || "").trim();
    const enrolledIds = getSessionStudentIds(session);
    const presentIds = await getSessionPresentStudentIds(
      firestore,
      session,
      sessionId,
      recordsCache,
    );
    const presentSet = new Set(presentIds);
    const targetStudentIds = Array.from(
      new Set([...(enrolledIds.length > 0 ? enrolledIds : []), ...presentIds]),
    );

    if (targetStudentIds.length === 0) {
      continue;
    }

    targetStudentIds.forEach((studentId) => {
      const current = attendanceByStudentId.get(studentId) || {
        totalClasses: 0,
        attendedClasses: 0,
      };

      attendanceByStudentId.set(studentId, {
        totalClasses: current.totalClasses + 1,
        attendedClasses:
          current.attendedClasses + (presentSet.has(studentId) ? 1 : 0),
      });
    });
  }

  return {
    sessions,
    attendanceByStudentId,
  };
};

const syncTeacherStudentMappings = async ({
  firestore,
  teacherUid,
  teacherId,
  teacherName,
  assignments,
}) => {
  const existingMappingsSnapshot = await firestore
    .collection("teacherStudentMappings")
    .where("teacherUid", "==", teacherUid)
    .get();

  const deleteOps = [];
  existingMappingsSnapshot.docs.forEach((docSnap) => {
    deleteOps.push({ type: "delete", ref: docSnap.ref });
  });

  const [studentsSnapshot, usersSnapshot] = await Promise.all([
    firestore.collection("students").get(),
    firestore.collection("users").where("role", "==", "Student").get(),
  ]);
  const studentRecords = new Map();

  const absorbStudentRecord = (docSnap) => {
    const data = docSnap.data() || {};
    const uid = data.uid || docSnap.id;
    if (!uid) return;

    const current = studentRecords.get(uid) || {};
    studentRecords.set(uid, {
      ...current,
      ...data,
      uid,
    });
  };

  studentsSnapshot.docs.forEach(absorbStudentRecord);
  usersSnapshot.docs.forEach(absorbStudentRecord);
  const createOps = [];

  Array.from(studentRecords.values()).forEach((studentData) => {
    const studentBranch = normalizeBranch(
      studentData.dept || studentData.department || "",
    );
    const studentYear = normalizeYear(studentData.year || "");
    const studentSubjects = Array.isArray(studentData.subjects)
      ? studentData.subjects
          .map((subject) => String(subject).trim())
          .filter(Boolean)
      : [];

    if (!studentBranch || !studentYear || studentSubjects.length === 0) {
      return;
    }

    assignments.forEach((assignment) => {
      if (
        assignment.branch !== studentBranch ||
        assignment.year !== studentYear
      ) {
        return;
      }

      const matchedSubjects = assignment.subjects.filter((subject) =>
        studentSubjects.includes(subject),
      );

      if (matchedSubjects.length === 0) {
        return;
      }

      const mappingDocId =
        `${teacherUid}_${studentData.uid}_${assignment.branch}_${assignment.year}`
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();

      createOps.push({
        type: "set",
        ref: firestore.collection("teacherStudentMappings").doc(mappingDocId),
        payload: {
          teacherUid,
          teacherId,
          teacherName,
          studentUid: studentData.uid,
          studentName: studentData.name || "",
          studentPrn:
            studentData.prn ||
            studentData.rollNo ||
            studentData.rollNumber ||
            "",
          branch: assignment.branch,
          year: assignment.year,
          subjects: matchedSubjects,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    });
  });

  const allOps = [...deleteOps, ...createOps];
  if (allOps.length === 0) {
    return;
  }

  let batch = firestore.batch();
  let opCount = 0;

  const commitBatch = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = firestore.batch();
    opCount = 0;
  };

  for (const operation of allOps) {
    if (operation.type === "delete") {
      batch.delete(operation.ref);
    }
    if (operation.type === "set") {
      batch.set(operation.ref, operation.payload);
    }

    opCount += 1;
    if (opCount >= 400) {
      await commitBatch();
    }
  }

  await commitBatch();
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
    semester: headers.findIndex(
      (h) => h === "semester" || h === "sem" || h === "term",
    ),
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
    const semester =
      idx.semester >= 0 ? normalizeSemester(columns[idx.semester] || "") : "";
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
    if (!semester) validationErrors.push("Missing/invalid semester");
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
      semester,
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
    const semesterMatch = line.match(
      /\b(sem(?:ester)?\s*[12]|[12](?:st|nd)?\s*sem(?:ester)?)\b/i,
    );

    const detectedBranch = BRANCHES.find((b) =>
      lower.includes(b.toLowerCase()),
    );

    if (!phoneMatch && !prnMatch && !detectedBranch) {
      continue;
    }

    const branch = detectedBranch || normalizeBranch(line);
    const year = normalizeYear(yearMatch ? yearMatch[1] : "");
    const semester = normalizeSemester(semesterMatch ? semesterMatch[0] : "");
    const phone = normalizePhone(phoneMatch ? phoneMatch[0] : "");
    const prn = (prnMatch ? prnMatch[0] : "").toUpperCase();

    let name = line;
    if (prn) name = name.replace(prn, " ");
    if (phone) name = name.replace(phone, " ");
    if (yearMatch) name = name.replace(yearMatch[0], " ");
    if (semesterMatch) name = name.replace(semesterMatch[0], " ");
    if (branch) name = name.replace(branch, " ");
    if (emailMatch) name = name.replace(emailMatch[0], " ");
    name = name.replace(/\s{2,}/g, " ").trim();

    parsed.push({
      name,
      prn,
      phone,
      branch,
      year,
      semester,
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
    if (!entry.semester) validationErrors.push("Missing/invalid semester");

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

const normalizeAcademicCalendarCategory = (value = "", fallback = "") => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  const source =
    raw ||
    String(fallback || "")
      .trim()
      .toLowerCase();

  if (!source) return "academic";
  if (source.includes("exam")) return "exam";
  if (
    source.includes("holiday") ||
    source.includes("vacation") ||
    source.includes("break")
  ) {
    return "holiday";
  }
  if (
    source.includes("event") ||
    source.includes("activity") ||
    source.includes("workshop") ||
    source.includes("seminar")
  ) {
    return "event";
  }
  return "academic";
};

const getAcademicColorByCategory = (category = "academic") => {
  const palette = {
    academic: "blue",
    exam: "red",
    event: "cyan",
    holiday: "green",
  };
  return palette[category] || "blue";
};

const getAcademicIconByCategory = (category = "academic") => {
  const icons = {
    academic: "graduation",
    exam: "clipboard",
    event: "flask",
    holiday: "umbrella",
  };
  return icons[category] || "calendar";
};

const MONTH_INDEX = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const ACADEMIC_ROW_DATE_SEGMENT_PATTERN =
  /(\d{1,2}\s*(?:-|–|to)\s*\d{1,2}\s*[A-Za-z]{3,12}[.,]?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,12}[.,]?\s*(?:-|–|to)\s*\d{1,2}\s+[A-Za-z]{3,12}[.,]?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,12}[.,]?\s*\d{4}\s*(?:-|–|to)\s*\d{1,2}\s+[A-Za-z]{3,12}[.,]?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,12}[.,]?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}(?:\s*(?:-|–|to)\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})?)/i;

const toIsoDate = (dateObj) => {
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return "";
  }

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseAcademicDateValue = (value = "", fallbackYear = 0) => {
  const raw = String(value || "")
    .replace(/[,]/g, " ")
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return "";
  }

  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const parsedYear = Number(dmy[3]);
    const year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    return toIsoDate(new Date(year, month, day));
  }

  const dayMonthYear = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,12})\s*(\d{4})?$/);
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const monthToken = String(dayMonthYear[2] || "").toLowerCase();
    const monthIndex = MONTH_INDEX[monthToken];
    const year = Number(dayMonthYear[3] || fallbackYear || 0);
    if (Number.isInteger(monthIndex) && year > 0) {
      return toIsoDate(new Date(year, monthIndex, day));
    }
  }

  const parsed = new Date(raw);
  return toIsoDate(parsed);
};

const resolveAcademicDateRange = (dateSlots = "") => {
  const raw = String(dateSlots || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return { startDate: "", endDate: "" };
  }

  const fullTextRange = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3,12})\s*(\d{4})\s*(?:-|–|to)\s*(\d{1,2})\s+([A-Za-z]{3,12})\s*(\d{4})$/i,
  );
  if (fullTextRange) {
    const startDate = parseAcademicDateValue(
      `${fullTextRange[1]} ${fullTextRange[2]} ${fullTextRange[3]}`,
    );
    const endDate = parseAcademicDateValue(
      `${fullTextRange[4]} ${fullTextRange[5]} ${fullTextRange[6]}`,
    );
    return {
      startDate,
      endDate: endDate || startDate,
    };
  }

  const twoMonthOneYearRange = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3,12})\s*(?:-|–|to)\s*(\d{1,2})\s+([A-Za-z]{3,12})\s*(\d{4})$/i,
  );
  if (twoMonthOneYearRange) {
    const year = Number(twoMonthOneYearRange[5]);
    const startDate = parseAcademicDateValue(
      `${twoMonthOneYearRange[1]} ${twoMonthOneYearRange[2]} ${year}`,
      year,
    );
    const endDate = parseAcademicDateValue(
      `${twoMonthOneYearRange[3]} ${twoMonthOneYearRange[4]} ${year}`,
      year,
    );
    return {
      startDate,
      endDate: endDate || startDate,
    };
  }

  const sameMonthRange = raw.match(
    /^(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s+([A-Za-z]{3,12})\s*(\d{4})$/i,
  );
  if (sameMonthRange) {
    const year = Number(sameMonthRange[4]);
    const startDate = parseAcademicDateValue(
      `${sameMonthRange[1]} ${sameMonthRange[3]} ${year}`,
      year,
    );
    const endDate = parseAcademicDateValue(
      `${sameMonthRange[2]} ${sameMonthRange[3]} ${year}`,
      year,
    );
    return {
      startDate,
      endDate: endDate || startDate,
    };
  }

  const numericRange = raw.match(
    /^(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s*(?:-|–|to)\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})$/i,
  );
  if (numericRange) {
    const startDate = parseAcademicDateValue(numericRange[1]);
    const endDate = parseAcademicDateValue(numericRange[2]);
    return {
      startDate,
      endDate: endDate || startDate,
    };
  }

  const segmentedCandidate = raw.match(ACADEMIC_ROW_DATE_SEGMENT_PATTERN);
  if (segmentedCandidate?.[1]) {
    const firstSegment = String(segmentedCandidate[1]).trim();
    if (firstSegment && firstSegment.toLowerCase() !== raw.toLowerCase()) {
      return resolveAcademicDateRange(firstSegment);
    }
  }

  const singleDate = parseAcademicDateValue(raw);
  return {
    startDate: singleDate,
    endDate: singleDate,
  };
};

const ACADEMIC_RESPONSIBILITY_PATTERN =
  /(Dean\s*\([^)]*\)\s*and\s*HoD|Dean\s*\([^)]*\)|Office\s*and\s*HoD|Course\s*Teacher\s*and\s*Coordinator|HoD\s*and\s*CoE|Dean\s*\(S\.A\.\)|Dean|HoD|CoE|Course\s*Teacher|Coordinator|Office)/i;

const ACADEMIC_HOLIDAY_SIDEBAR_KEYWORDS = [
  "public holidays",
  "rescheduled date for academics",
  "important points to be noted",
  "time-table",
  "audit points",
  "republic day",
  "shivaji maharaj jayanti",
  "holi",
  "gudi padwa",
  "ramzan",
  "ram navami",
  "mahavir jayanti",
  "good friday",
  "ambedkar jayanti",
];

const ACADEMIC_HOLIDAY_NAME_HINT_PATTERN =
  /(republic|jayanti|holi|gudi|ramzan|ram\s*navami|good\s*friday|public\s*holiday|id)/i;

const ACADEMIC_RESCHEDULE_HINT_PATTERN =
  /(rescheduled|time-?table|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;

const normalizeAcademicResponsibility = (value = "") => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return "--";
  }

  const roleMatch = raw.match(ACADEMIC_RESPONSIBILITY_PATTERN);
  if (roleMatch?.[0]) {
    return String(roleMatch[0]).trim();
  }

  const firstDateIndex = raw.search(/\b\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}\b/);
  if (firstDateIndex > 0) {
    const left = raw.slice(0, firstDateIndex).trim();
    return left || "--";
  }

  return raw;
};

const isAcademicHolidaySidebarLine = (value = "") => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return false;
  }

  const lower = raw.toLowerCase();
  if (
    ACADEMIC_HOLIDAY_SIDEBAR_KEYWORDS.some((keyword) => lower.includes(keyword))
  ) {
    const hasMainResponsibility = ACADEMIC_RESPONSIBILITY_PATTERN.test(raw);
    const hasMainActivityHint =
      /(semester|admission|selection|mse|ese|submission|meeting|vacation|internship|re-?exam|commencement|festival|gathering)/i.test(
        raw,
      );

    if (hasMainResponsibility || hasMainActivityHint) {
      return false;
    }

    return true;
  }

  if (
    /^\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}/i.test(raw) &&
    /\(.*\)/.test(raw) &&
    !ACADEMIC_RESPONSIBILITY_PATTERN.test(raw)
  ) {
    return true;
  }

  return false;
};

const extractAcademicDateTokens = (value = "") => {
  const raw = String(value || "");
  return Array.from(
    raw.matchAll(/\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}(?:\s*\([^)]*\))?/gi),
  )
    .map((match) => String(match[0] || "").trim())
    .filter(Boolean);
};

const extractAcademicHolidayName = (value = "") => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";

  const bracket = raw.match(/\(([^)]+)\)/);
  if (bracket?.[1] && ACADEMIC_HOLIDAY_NAME_HINT_PATTERN.test(bracket[1])) {
    return String(bracket[1]).trim();
  }

  const withoutDate = raw
    .replace(/\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}/i, "")
    .replace(/[()]/g, "")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .trim();
  if (withoutDate) {
    return withoutDate;
  }

  return "Public Holiday";
};

const normalizeAcademicRescheduledDate = (value = "") => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw || /^[-–—_]{2,}$/.test(raw)) {
    return "";
  }

  return raw;
};

const buildAcademicHolidayEntry = ({
  holidayCell = "",
  rescheduledCell = "",
  sourceLine = "",
}) => {
  const holidayRaw = String(holidayCell || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!holidayRaw) {
    return null;
  }

  const holidayTokens = extractAcademicDateTokens(holidayRaw);
  const holidayToken = holidayTokens[0] || "";
  const startDate = parseAcademicDateValue(holidayToken || holidayRaw);
  const holidayName = extractAcademicHolidayName(holidayRaw);

  if (!holidayName || !startDate) {
    return null;
  }

  const dateSlots =
    holidayToken
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/\s+/g, " ")
      .trim() || holidayRaw;

  const rescheduled = normalizeAcademicRescheduledDate(rescheduledCell);

  return {
    activity: holidayName,
    dateSlots,
    startDate,
    endDate: startDate,
    responsibility: rescheduled ? `Rescheduled: ${rescheduled}` : "--",
    rescheduledDateForAcademics: rescheduled,
    category: "holiday",
    color: "green",
    icon: "umbrella",
    sourceLine,
    validationErrors: [],
  };
};

const parseAcademicHolidaysFromCsv = (csvText) => {
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

  const headers = parseCsvLine(lines[0], delimiter).map((header) =>
    String(header || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim(),
  );

  const holidayIndex = headers.findIndex(
    (header) =>
      header === "publicholidays" ||
      header === "publicholiday" ||
      header === "holiday" ||
      header.includes("publicholidays"),
  );
  const rescheduledIndex = headers.findIndex(
    (header) =>
      header === "rescheduleddateforacademics" ||
      header === "rescheduleddate" ||
      header.includes("rescheduled"),
  );

  const parsed = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i], delimiter);
    const holidayCell =
      holidayIndex >= 0 ? String(columns[holidayIndex] || "").trim() : "";
    const rescheduledCell =
      rescheduledIndex >= 0
        ? String(columns[rescheduledIndex] || "").trim()
        : "";

    const fallbackHolidayCell =
      !holidayCell && columns.length >= 1
        ? String(columns[0] || "").trim()
        : holidayCell;

    const entry = buildAcademicHolidayEntry({
      holidayCell: fallbackHolidayCell,
      rescheduledCell,
      sourceLine: lines[i],
    });

    if (!entry) {
      continue;
    }

    const key = `${entry.activity.toLowerCase()}|${entry.startDate}|${String(
      entry.rescheduledDateForAcademics || "",
    ).toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    parsed.push(entry);
  }

  return parsed;
};

const parseAcademicHolidaysFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) =>
      String(line || "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const parsed = [];
  const seen = new Set();
  let inHolidaySection = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (lower.includes("important points to be noted")) {
      inHolidaySection = false;
      break;
    }

    if (
      lower.includes("public holidays") ||
      lower.includes("rescheduled date for academics")
    ) {
      inHolidaySection = true;
      continue;
    }

    const dateTokens = extractAcademicDateTokens(line);
    if (!dateTokens.length) {
      continue;
    }

    const looksHolidayRow =
      inHolidaySection || ACADEMIC_HOLIDAY_NAME_HINT_PATTERN.test(lower);
    if (!looksHolidayRow) {
      continue;
    }

    let holidayCell = "";
    let rescheduledCell = "";

    const tableSplit = line
      .split(/\||\t+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (tableSplit.length >= 2) {
      holidayCell = tableSplit[0] || "";
      rescheduledCell = tableSplit.slice(1).join(" ");
    } else {
      holidayCell = dateTokens[0] || "";
      if (dateTokens.length >= 2) {
        rescheduledCell = dateTokens[1];
      } else if (/^[-–—_]{2,}$/.test(line)) {
        rescheduledCell = "--";
      } else {
        const nextLine = String(lines[i + 1] || "").trim();
        if (
          nextLine &&
          (ACADEMIC_RESCHEDULE_HINT_PATTERN.test(nextLine) ||
            /^[-–—_]{2,}$/.test(nextLine))
        ) {
          rescheduledCell = nextLine;
          i += 1;
        }
      }
    }

    const entry = buildAcademicHolidayEntry({
      holidayCell,
      rescheduledCell,
      sourceLine: line,
    });

    if (!entry) {
      continue;
    }

    const key = `${entry.activity.toLowerCase()}|${entry.startDate}|${String(
      entry.rescheduledDateForAcademics || "",
    ).toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    parsed.push(entry);
  }

  return parsed;
};

const parseAcademicCalendarFromCsv = (csvText) => {
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
  const headers = parseCsvLine(lines[0], delimiter).map((header) =>
    header.toLowerCase().replace(/\s+/g, "").trim(),
  );

  const idx = {
    activity: headers.findIndex(
      (h) => h === "activity" || h === "title" || h === "event",
    ),
    dateSlots: headers.findIndex(
      (h) => h === "dateslots" || h === "date" || h === "dates",
    ),
    startDate: headers.findIndex((h) => h === "startdate" || h === "fromdate"),
    endDate: headers.findIndex((h) => h === "enddate" || h === "todate"),
    responsibility: headers.findIndex(
      (h) => h === "responsibility" || h === "owner",
    ),
    category: headers.findIndex((h) => h === "category" || h === "type"),
    color: headers.findIndex((h) => h === "color"),
    icon: headers.findIndex((h) => h === "icon"),
  };

  const parsed = [];

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i], delimiter);
    const activity =
      idx.activity >= 0 ? String(columns[idx.activity] || "").trim() : "";
    const dateSlots =
      idx.dateSlots >= 0 ? String(columns[idx.dateSlots] || "").trim() : "";
    const responsibility =
      idx.responsibility >= 0
        ? String(columns[idx.responsibility] || "").trim()
        : "";

    if (!activity && !dateSlots) {
      continue;
    }

    if (
      isAcademicHolidaySidebarLine(`${activity} ${dateSlots} ${responsibility}`)
    ) {
      continue;
    }

    const rangeFromSlots = resolveAcademicDateRange(dateSlots);
    const startDateRaw =
      idx.startDate >= 0 ? String(columns[idx.startDate] || "").trim() : "";
    const endDateRaw =
      idx.endDate >= 0 ? String(columns[idx.endDate] || "").trim() : "";

    const startDate =
      parseAcademicDateValue(startDateRaw) || rangeFromSlots.startDate;
    const endDate =
      parseAcademicDateValue(endDateRaw) || rangeFromSlots.endDate;

    const category = normalizeAcademicCalendarCategory(
      idx.category >= 0 ? columns[idx.category] : "",
      activity,
    );
    const color =
      idx.color >= 0
        ? String(columns[idx.color] || "")
            .trim()
            .toLowerCase()
        : "";
    const icon =
      idx.icon >= 0
        ? String(columns[idx.icon] || "")
            .trim()
            .toLowerCase()
        : "";

    const normalizedResponsibility = normalizeAcademicResponsibility(
      responsibility || "--",
    );

    parsed.push({
      activity,
      dateSlots,
      startDate,
      endDate: endDate || startDate,
      responsibility: normalizedResponsibility,
      category,
      color: color || getAcademicColorByCategory(category),
      icon: icon || getAcademicIconByCategory(category),
      sourceLine: lines[i],
      validationErrors: [
        ...(!activity ? ["Missing activity"] : []),
        ...(!dateSlots ? ["Missing date slots"] : []),
        ...(!startDate ? ["Unable to parse start date"] : []),
      ],
    });
  }

  return parsed;
};

const parseAcademicCalendarFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const parsed = [];
  const seen = new Set();
  let pendingActivity = "";

  for (const line of lines) {
    if (isAcademicHolidaySidebarLine(line)) {
      pendingActivity = "";
      continue;
    }

    const lower = line.toLowerCase();
    if (
      lower.includes("activity") &&
      lower.includes("date") &&
      lower.includes("respons")
    ) {
      continue;
    }

    let activity = "";
    let dateSlots = "";
    let responsibility = "--";

    const tableSplit = line
      .split(/\||\t+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (tableSplit.length >= 3) {
      activity = tableSplit[0] || "";
      dateSlots = tableSplit[1] || "";
      responsibility = normalizeAcademicResponsibility(
        tableSplit.slice(2).join(" "),
      );
    } else {
      const dateMatch = line.match(ACADEMIC_ROW_DATE_SEGMENT_PATTERN);
      if (!dateMatch) {
        if (!ACADEMIC_RESPONSIBILITY_PATTERN.test(line) && line.length >= 18) {
          pendingActivity = `${pendingActivity} ${line}`.trim();
        }
        continue;
      }

      dateSlots = String(dateMatch[1] || "").trim();
      const splitIndex = line.indexOf(dateSlots);
      const left = line
        .slice(0, splitIndex)
        .replace(/[\s:,-]+$/, "")
        .trim();
      const right = line
        .slice(splitIndex + dateSlots.length)
        .replace(/^[\s:,-]+/, "")
        .trim();

      activity = left || "";
      responsibility = normalizeAcademicResponsibility(right || "--");
    }

    activity = activity.replace(/^\d+[.)-]\s*/, "").trim();

    if (!activity && pendingActivity) {
      activity = pendingActivity;
    } else if (pendingActivity) {
      const looksLikeWrappedContinuation =
        activity.length < 70 || /^[a-z(]/.test(activity);
      if (looksLikeWrappedContinuation) {
        activity = `${pendingActivity} ${activity}`.replace(/\s+/g, " ").trim();
      }
    }
    pendingActivity = "";

    if (!activity && !dateSlots) {
      continue;
    }

    if (
      isAcademicHolidaySidebarLine(`${activity} ${dateSlots} ${responsibility}`)
    ) {
      continue;
    }

    if (/^\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}/i.test(activity)) {
      continue;
    }

    const range = resolveAcademicDateRange(dateSlots);
    const category = normalizeAcademicCalendarCategory("", activity);
    const normalizedResponsibility =
      normalizeAcademicResponsibility(responsibility);

    const key = `${activity.toLowerCase()}|${range.startDate}|${range.endDate}|${normalizedResponsibility.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    parsed.push({
      activity,
      dateSlots,
      startDate: range.startDate,
      endDate: range.endDate || range.startDate,
      responsibility: normalizedResponsibility,
      category,
      color: getAcademicColorByCategory(category),
      icon: getAcademicIconByCategory(category),
      sourceLine: line,
      validationErrors: [
        ...(!activity ? ["Missing activity"] : []),
        ...(!dateSlots ? ["Missing date slots"] : []),
        ...(!range.startDate ? ["Unable to parse start date"] : []),
      ],
    });
  }

  return parsed;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
];

const EXAM_TIMETABLE_FAST_GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
];

const EXAM_REMINDER_ENABLED =
  String(process.env.ENABLE_EXAM_REMINDER_NOTIFICATIONS || "true")
    .trim()
    .toLowerCase() !== "false";
const EXAM_REMINDER_INTERVAL_MS = Math.max(
  5 * 60 * 1000,
  Number(process.env.EXAM_REMINDER_INTERVAL_MS || 60 * 60 * 1000),
);

const GEMINI_TRANSIENT_STATUS_CODES = new Set([429, 500, 503, 504]);

const EXAM_TIMETABLE_DAY_PATTERN =
  /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i;
const EXAM_TIMETABLE_DATE_PATTERN = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
const EXAM_TIMETABLE_TIME_PATTERN =
  /(\d{1,2}:\d{2}\s*(?:am|pm)?\s*(?:to|-|–)\s*\d{1,2}:\d{2}\s*(?:am|pm)?)/i;
const EXAM_TIMETABLE_COURSE_PATTERN =
  /^([A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2})\s*[-–—:]\s*(.+)$/i;
const EXAM_TIMETABLE_COURSE_SPLIT_PATTERN =
  /(?=[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:])/g;
const EXAM_TIMETABLE_BRANCH_PREFIX_PATTERN =
  /^(Civil|Computer|Electrical|E\s*&\s*T\s*&\s*C|E&TC|Instrumentation|Mechanical|Information\s+Technology|IT)\b\s*(.*)$/i;

const EXAM_TIMETABLE_BRANCH_VALUES = [
  "Civil",
  "Computer",
  "Electrical",
  "E&TC",
  "Instrumentation",
  "Mechanical",
  "Information Technology",
];

const normalizeGeminiModelName = (value = "") => {
  return String(value || "")
    .trim()
    .replace(/^models\//i, "");
};

const buildGeminiModelCandidates = (additional = []) => {
  const seen = new Set();
  const ordered = [];

  [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS, ...additional].forEach((item) => {
    const normalized = normalizeGeminiModelName(item);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    ordered.push(normalized);
  });

  return ordered;
};

const getGeminiApiKeyFromRequest = (req) => {
  const headerKey = String(
    req.headers["x-gemini-api-key"] || req.headers["x-gemini-key"] || "",
  ).trim();

  const bodyKey =
    typeof req.body?.geminiApiKey === "string"
      ? req.body.geminiApiKey.trim()
      : "";

  const envKey = String(
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "",
  ).trim();

  return headerKey || bodyKey || envKey;
};

const fetchGeminiSupportedModels = async (apiKey = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {
        method: "GET",
      },
    );

    const rawResponse = await response.text();
    if (!response.ok) {
      return [];
    }

    const payload = JSON.parse(rawResponse);
    const models = Array.isArray(payload?.models) ? payload.models : [];

    return models
      .filter((model) => {
        const methods = Array.isArray(model?.supportedGenerationMethods)
          ? model.supportedGenerationMethods
          : [];
        return methods.includes("generateContent");
      })
      .map((model) => normalizeGeminiModelName(model?.name || ""))
      .filter(Boolean);
  } catch {
    return [];
  }
};

const waitForMs = async (durationMs = 0) => {
  const safeDuration = Math.max(0, Number(durationMs) || 0);
  return new Promise((resolve) => {
    setTimeout(resolve, safeDuration);
  });
};

const buildExamGeminiModelCandidates = (additional = []) => {
  const seen = new Set();
  const ordered = [];

  [
    process.env.GEMINI_EXAM_MODEL || "",
    ...EXAM_TIMETABLE_FAST_GEMINI_MODELS,
    ...buildGeminiModelCandidates(),
    ...additional,
  ].forEach((item) => {
    const normalized = normalizeGeminiModelName(item);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    ordered.push(normalized);
  });

  return ordered;
};

const extractJsonObjectFromText = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const withoutFence = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    // Continue to brace-based extraction.
  }

  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = withoutFence.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
};

const normalizeGeminiAcademicEntries = (entries = []) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  entries.forEach((entry) => {
    const row = entry && typeof entry === "object" ? entry : {};
    const activity = String(
      row.activity || row.title || row.event || row.name || "",
    )
      .replace(/\s+/g, " ")
      .trim();
    const dateSlots = String(
      row.dateSlots || row.date || row.dateRange || row.slots || "",
    )
      .replace(/\s+/g, " ")
      .trim();

    const rangeFromSlots = resolveAcademicDateRange(dateSlots);
    const startDate =
      parseAcademicDateValue(row.startDate || row.start || "") ||
      rangeFromSlots.startDate;
    const endDate =
      parseAcademicDateValue(row.endDate || row.end || "") ||
      rangeFromSlots.endDate ||
      startDate;

    if (!activity || !startDate) {
      return;
    }

    const responsibility = normalizeAcademicResponsibility(
      row.responsibility || row.owner || "--",
    );
    const category = normalizeAcademicCalendarCategory(
      row.category || "",
      activity,
    );
    const color =
      String(row.color || "")
        .trim()
        .toLowerCase() || getAcademicColorByCategory(category);
    const icon =
      String(row.icon || "")
        .trim()
        .toLowerCase() || getAcademicIconByCategory(category);

    const key = `${activity.toLowerCase()}|${startDate}|${endDate}|${responsibility.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    normalized.push({
      activity,
      dateSlots: dateSlots || startDate,
      startDate,
      endDate,
      responsibility,
      category,
      color,
      icon,
      sourceLine: "gemini",
      validationErrors: [],
    });
  });

  return normalized;
};

const normalizeGeminiHolidayEntries = (entries = []) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  entries.forEach((entry) => {
    const row = entry && typeof entry === "object" ? entry : {};

    const rawDateSlots = String(
      row.dateSlots || row.holidayDate || row.date || row.dateRange || "",
    )
      .replace(/\s+/g, " ")
      .trim();

    const activityRaw = String(
      row.activity || row.holiday || row.holidayName || row.name || "",
    )
      .replace(/\s+/g, " ")
      .trim();

    const activity =
      activityRaw || extractAcademicHolidayName(`${rawDateSlots}`) || "";

    const rangeFromSlots = resolveAcademicDateRange(rawDateSlots);
    const startDate =
      parseAcademicDateValue(row.startDate || row.date || "") ||
      rangeFromSlots.startDate;
    const endDate =
      parseAcademicDateValue(row.endDate || "") ||
      rangeFromSlots.endDate ||
      startDate;

    if (!activity || !startDate) {
      return;
    }

    const rescheduledDateForAcademics = normalizeAcademicRescheduledDate(
      row.rescheduledDateForAcademics ||
        row.rescheduledDate ||
        row.rescheduled ||
        row.rescheduledForAcademics ||
        "",
    );

    const responsibility = rescheduledDateForAcademics
      ? `Rescheduled: ${rescheduledDateForAcademics}`
      : normalizeAcademicResponsibility(row.responsibility || "--");

    const key = `${activity.toLowerCase()}|${startDate}|${rescheduledDateForAcademics.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    normalized.push({
      activity,
      dateSlots: rawDateSlots || startDate,
      startDate,
      endDate,
      responsibility,
      rescheduledDateForAcademics,
      category: "holiday",
      color: "green",
      icon: "umbrella",
      sourceLine: "gemini",
      validationErrors: [],
    });
  });

  return normalized;
};

const parseAcademicCalendarWithGemini = async ({
  file,
  extractedText = "",
  apiKey = "",
}) => {
  const prompt = [
    "You are parsing an institute academic calendar document.",
    "The document has two independent sections that must not be mixed:",
    "1) Main table: Activity | Date/Slots | Responsibility",
    "2) Right-side table: Public Holidays | Rescheduled Date for Academics",
    "Return strict JSON object with exactly this shape:",
    "{",
    '  "entries": [',
    "    {",
    '      "activity": "",',
    '      "dateSlots": "",',
    '      "startDate": "YYYY-MM-DD",',
    '      "endDate": "YYYY-MM-DD",',
    '      "responsibility": "",',
    '      "category": "academic",',
    '      "color": "blue",',
    '      "icon": "graduation"',
    "    }",
    "  ],",
    '  "holidayEntries": [',
    "    {",
    '      "activity": "",',
    '      "dateSlots": "",',
    '      "startDate": "YYYY-MM-DD",',
    '      "endDate": "YYYY-MM-DD",',
    '      "rescheduledDateForAcademics": "",',
    '      "responsibility": "",',
    '      "category": "holiday",',
    '      "color": "green",',
    '      "icon": "umbrella"',
    "    }",
    "  ]",
    "}",
    "Rules:",
    "- Do not include any markdown or explanation outside JSON.",
    "- Keep only main-table rows inside entries.",
    "- Keep only public-holiday rows inside holidayEntries.",
    "- For missing rescheduled date use empty string.",
    "- Preserve full dateSlots text as seen in the document.",
  ].join("\n");

  const parts = [{ text: prompt }];

  if (file?.buffer?.length) {
    parts.push({
      inline_data: {
        mime_type: file.mimetype || "application/octet-stream",
        data: file.buffer.toString("base64"),
      },
    });
  }

  if (extractedText) {
    parts.push({
      text: `Fallback extracted text (can be noisy):\n${String(extractedText || "").slice(0, 30000)}`,
    });
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const triedModels = new Set();
  let lastFailure = "";

  const tryModels = async (models = []) => {
    for (const candidate of models) {
      const modelName = normalizeGeminiModelName(candidate);
      if (!modelName || triedModels.has(modelName)) {
        continue;
      }
      triedModels.add(modelName);

      let response;
      let rawResponse = "";

      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: requestBody,
          },
        );
        rawResponse = await response.text();
      } catch (error) {
        lastFailure = `Model ${modelName}: ${error.message}`;
        continue;
      }

      if (!response.ok) {
        lastFailure = `Model ${modelName} failed with ${response.status}: ${rawResponse.slice(0, 240)}`;
        continue;
      }

      let payload = {};
      try {
        payload = JSON.parse(rawResponse);
      } catch {
        lastFailure = `Model ${modelName}: non-JSON payload`;
        continue;
      }

      const modelText = (payload?.candidates || [])
        .flatMap((candidateItem) => candidateItem?.content?.parts || [])
        .map((part) => String(part?.text || ""))
        .join("\n")
        .trim();

      if (!modelText) {
        lastFailure = `Model ${modelName}: empty content`;
        continue;
      }

      const structured = extractJsonObjectFromText(modelText);
      if (!structured || typeof structured !== "object") {
        lastFailure = `Model ${modelName}: invalid structured JSON`;
        continue;
      }

      return {
        entries: normalizeGeminiAcademicEntries(structured.entries),
        holidayEntries: normalizeGeminiHolidayEntries(
          structured.holidayEntries,
        ),
      };
    }

    return null;
  };

  let parsed = await tryModels(buildGeminiModelCandidates());
  if (!parsed) {
    const discoveredModels = await fetchGeminiSupportedModels(apiKey);
    if (discoveredModels.length > 0) {
      parsed = await tryModels(buildGeminiModelCandidates(discoveredModels));
    }
  }

  if (!parsed) {
    const tried = Array.from(triedModels).join(", ");
    throw new Error(
      `Gemini request failed for available models [${tried}]. ${lastFailure}`,
    );
  }

  return parsed;
};

const normalizeExamTimetableBranchName = (branchRaw = "") => {
  const value = String(branchRaw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!value) return "";
  if (value === "it" || value.includes("information")) {
    return "Information Technology";
  }
  if (value.includes("civil")) return "Civil";
  if (value.includes("computer")) return "Computer";
  if (value.includes("electrical")) return "Electrical";
  if (value.includes("instrument")) return "Instrumentation";
  if (value.includes("mechanical")) return "Mechanical";
  if (
    value.includes("e&tc") ||
    value.includes("entc") ||
    value.includes("e & t & c") ||
    value.includes("electronics")
  ) {
    return "E&TC";
  }

  return String(branchRaw || "").trim();
};

const parseExamTimetableDate = (rawDate = "") => {
  const originalValue = String(rawDate || "").trim();
  if (!originalValue) {
    return null;
  }

  const matchedDate =
    originalValue.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/) ||
    originalValue.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/);

  const normalizedValue = matchedDate
    ? matchedDate[1]
    : originalValue.replace(/,/g, " ");

  const dmyMatch = normalizedValue.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/,
  );
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const yearValue = Number(dmyMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    return new Date(year, month, day);
  }

  const ymdMatch = normalizedValue.match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/,
  );
  if (ymdMatch) {
    return new Date(
      Number(ymdMatch[1]),
      Number(ymdMatch[2]) - 1,
      Number(ymdMatch[3]),
    );
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeExamReminderYearToken = (value = "") =>
  String(value || "").replace(/[^0-9]/g, "");

const toDayStart = (value) => {
  const current = value instanceof Date ? new Date(value) : new Date(value);
  current.setHours(0, 0, 0, 0);
  return current;
};

const formatExamReminderDisplayDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatExamReminderLocalDateISO = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const findNextActiveExamDate = async (firestore) => {
  const snapshot = await firestore.collection("examTimetable").get();
  const todayStart = toDayStart(new Date());

  let nextDate = null;
  snapshot.docs.forEach((docSnap) => {
    const exam = docSnap.data() || {};
    if (exam.isActive === false) {
      return;
    }

    const parsed = parseExamTimetableDate(exam.date || "");
    if (!parsed) {
      return;
    }

    const examStart = toDayStart(parsed);
    if (examStart < todayStart) {
      return;
    }

    if (!nextDate || examStart < nextDate) {
      nextDate = examStart;
    }
  });

  return nextDate;
};

const buildExamReminderMessage = ({
  yearLabel = "",
  displayDate = "",
  rows = [],
}) => {
  const groupedByBranch = new Map();

  rows.forEach((row) => {
    const branchName =
      String(row.branch || "All Branches").trim() || "All Branches";
    if (!groupedByBranch.has(branchName)) {
      groupedByBranch.set(branchName, []);
    }
    groupedByBranch.get(branchName).push(row);
  });

  const segments = [];
  segments.push(
    `Reminder: ${yearLabel || "Selected"} Year exam(s) are scheduled for tomorrow (${displayDate}).`,
  );
  segments.push(
    "Please be present before reporting time with valid college ID.",
  );
  segments.push("");
  segments.push("Exam Details:");

  Array.from(groupedByBranch.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([branchName, branchRows]) => {
      segments.push(`- ${branchName}:`);

      branchRows
        .slice()
        .sort((left, right) => {
          const leftTime = getExamTimeStartMinutes(left.time || "");
          const rightTime = getExamTimeStartMinutes(right.time || "");
          if (leftTime !== rightTime) {
            return leftTime - rightTime;
          }

          return String(left.courseCode || "").localeCompare(
            String(right.courseCode || ""),
          );
        })
        .forEach((exam) => {
          segments.push(
            `  • ${String(exam.time || "").trim() || "Time TBA"} | ${String(exam.courseCode || "").trim()} - ${String(exam.courseName || "").trim()}`,
          );
        });
    });

  return segments.join("\n");
};

const createTomorrowExamReminderAnnouncements = async (options = {}) => {
  if (!EXAM_REMINDER_ENABLED) {
    return { createdCount: 0, skippedCount: 0, reason: "disabled" };
  }

  const firestore = admin.firestore();
  const now = new Date();
  const todayStart = toDayStart(now);
  const targetDateISO = String(options.targetDateISO || "").trim();

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  let reminderDayStart = tomorrowStart;
  if (targetDateISO) {
    const parsedTargetDate = parseExamTimetableDate(targetDateISO);
    if (!parsedTargetDate) {
      throw new Error("Invalid targetDateISO. Use DD-MM-YYYY or YYYY-MM-DD.");
    }

    reminderDayStart = toDayStart(parsedTargetDate);
  }

  const dayAfterTomorrowStart = new Date(reminderDayStart);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 1);

  const reminderDateIso = formatExamReminderLocalDateISO(reminderDayStart);

  const [examSnapshot, existingReminderSnapshot] = await Promise.all([
    firestore.collection("examTimetable").get(),
    firestore
      .collection("announcements")
      .where("reminderType", "==", "exam-day-1")
      .where("reminderDateISO", "==", reminderDateIso)
      .get(),
  ]);

  const existingYearKeys = new Set(
    existingReminderSnapshot.docs.map((docSnap) => {
      const payload = docSnap.data() || {};
      return normalizeExamReminderYearToken(
        payload.reminderYear || payload.year || "",
      );
    }),
  );

  const examsByYear = new Map();

  examSnapshot.docs.forEach((docSnap) => {
    const exam = docSnap.data() || {};
    if (exam.isActive === false) {
      return;
    }

    const parsedDate = parseExamTimetableDate(exam.date || "");
    if (!parsedDate) {
      return;
    }

    if (parsedDate < reminderDayStart || parsedDate >= dayAfterTomorrowStart) {
      return;
    }

    const yearLabel = String(exam.year || "").trim();
    const yearToken = normalizeExamReminderYearToken(yearLabel);
    if (!yearToken) {
      return;
    }

    if (!examsByYear.has(yearToken)) {
      examsByYear.set(yearToken, {
        yearLabel,
        rows: [],
      });
    }

    examsByYear.get(yearToken).rows.push({
      branch: exam.branch || "",
      time: exam.time || "",
      courseCode: exam.courseCode || "",
      courseName: exam.courseName || "",
    });
  });

  if (examsByYear.size === 0) {
    return {
      createdCount: 0,
      skippedCount: 0,
      reason: targetDateISO ? "no-exams-on-target-date" : "no-exams-tomorrow",
      reminderDateISO: reminderDateIso,
    };
  }

  const batch = firestore.batch();
  let createdCount = 0;
  let skippedCount = 0;

  examsByYear.forEach((group, yearToken) => {
    if (existingYearKeys.has(yearToken)) {
      skippedCount += 1;
      return;
    }

    const displayDate = formatExamReminderDisplayDate(reminderDayStart);
    const title = `Exam Reminder: ${group.yearLabel || `${yearToken}th`} Year (${displayDate})`;
    const message = buildExamReminderMessage({
      yearLabel: group.yearLabel || `${yearToken}th`,
      displayDate,
      rows: group.rows,
    });

    const reminderKey = `exam-reminder-${reminderDateIso}-${yearToken}`;
    const docRef = firestore.collection("announcements").doc();
    batch.set(docRef, {
      title,
      message,
      type: "academic",
      active: true,
      readBy: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reminderType: "exam-day-1",
      reminderDateISO: reminderDateIso,
      reminderYear: group.yearLabel || `${yearToken}th`,
      reminderYearToken: yearToken,
      reminderKey,
      audience: ["student", "teacher"],
      source: "examReminderScheduler",
    });

    createdCount += 1;
  });

  if (createdCount > 0) {
    await batch.commit();
  }

  return {
    createdCount,
    skippedCount,
    reason: targetDateISO ? "ok-target-date" : "ok",
    reminderDateISO: reminderDateIso,
  };
};

const normalizeExamTimetableDate = (rawDate = "") => {
  const parsed = parseExamTimetableDate(rawDate);
  if (!parsed) {
    return String(rawDate || "").trim();
  }

  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = String(parsed.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
};

const getExamTimetableWeekdayFromDate = (rawDate = "") => {
  const parsed = parseExamTimetableDate(rawDate);
  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", { weekday: "long" });
};

const formatExamTimetableTimePoint = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) {
    return normalized;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = String(match[3] || "").toLowerCase();
  return `${hour}:${minute}${meridiem ? ` ${meridiem}` : ""}`;
};

const normalizeExamTimetableTime = (timeRaw = "") => {
  const normalized = String(timeRaw || "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const timeTokens = normalized.match(/\d{1,2}:\d{2}\s*(?:am|pm)?/gi) || [];
  if (timeTokens.length >= 2) {
    return `${formatExamTimetableTimePoint(timeTokens[0])} to ${formatExamTimetableTimePoint(timeTokens[1])}`;
  }

  return normalized;
};

const normalizeExamTimetableCourseCode = (value = "") => {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
};

const normalizeExamTimetableCourseName = (value = "") => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const getExamTimeStartMinutes = (timeRange = "") => {
  const token = String(timeRange || "")
    .trim()
    .match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);

  if (!token) {
    return Number.POSITIVE_INFINITY;
  }

  let hours = Number.parseInt(token[1], 10);
  const minutes = Number.parseInt(token[2], 10);
  const meridiem = String(token[3] || "").toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
};

const normalizeGeminiExamTimetableEntries = (
  entries = [],
  selectedYear = "",
) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  entries.forEach((entry) => {
    const row = entry && typeof entry === "object" ? entry : {};

    const combinedCourse = String(
      row.course || row.subject || row.title || row.subjectTitle || "",
    ).trim();
    const combinedCourseMatch = combinedCourse.match(
      EXAM_TIMETABLE_COURSE_PATTERN,
    );

    const date = normalizeExamTimetableDate(
      row.date || row.examDate || row.dateSlots || row.dateSlot || "",
    );
    const time = normalizeExamTimetableTime(
      row.time || row.slot || row.examTime || row.timeSlot || "",
    );
    const branch = normalizeExamTimetableBranchName(
      row.branch || row.department || row.dept || "",
    );

    const courseCode = normalizeExamTimetableCourseCode(
      row.courseCode ||
        row.code ||
        row.subjectCode ||
        (combinedCourseMatch ? combinedCourseMatch[1] : ""),
    );
    const courseName = normalizeExamTimetableCourseName(
      row.courseName ||
        row.subjectName ||
        (combinedCourseMatch ? combinedCourseMatch[2] : combinedCourse),
    );

    if (!date || !time || !branch || !courseCode || !courseName) {
      return;
    }

    if (!EXAM_TIMETABLE_BRANCH_VALUES.includes(branch)) {
      return;
    }

    const day =
      String(row.day || row.weekday || "").trim() ||
      getExamTimetableWeekdayFromDate(date);

    const key = `${date}|${time}|${branch.toLowerCase()}|${courseCode}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    normalized.push({
      day,
      date,
      time,
      branch,
      courseCode,
      courseName,
      duration: "3 hours",
      year: String(selectedYear || row.year || "").trim(),
    });
  });

  normalized.sort((left, right) => {
    const leftDate = parseExamTimetableDate(left.date || "");
    const rightDate = parseExamTimetableDate(right.date || "");
    const leftMs = leftDate ? leftDate.getTime() : Number.POSITIVE_INFINITY;
    const rightMs = rightDate ? rightDate.getTime() : Number.POSITIVE_INFINITY;

    if (leftMs !== rightMs) {
      return leftMs - rightMs;
    }

    const leftTime = getExamTimeStartMinutes(left.time || "");
    const rightTime = getExamTimeStartMinutes(right.time || "");
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    const branchCompare = String(left.branch || "").localeCompare(
      String(right.branch || ""),
    );
    if (branchCompare !== 0) {
      return branchCompare;
    }

    return String(left.courseCode || "").localeCompare(
      String(right.courseCode || ""),
    );
  });

  return normalized;
};

const parseExamTimetableFromText = (text = "", selectedYear = "") => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const exams = [];
  let currentDay = "";
  let currentDate = "";
  let currentTime = "";
  let currentBranch = "";

  lines.forEach((line) => {
    const dayMatch = line.match(EXAM_TIMETABLE_DAY_PATTERN);
    const dateMatch = line.match(EXAM_TIMETABLE_DATE_PATTERN);
    const timeMatch = line.match(EXAM_TIMETABLE_TIME_PATTERN);

    if (dayMatch || dateMatch || timeMatch) {
      if (dayMatch) {
        currentDay = String(dayMatch[1] || "").trim();
      }
      if (dateMatch) {
        currentDate = normalizeExamTimetableDate(dateMatch[1]);
      }
      if (timeMatch) {
        currentTime = normalizeExamTimetableTime(timeMatch[1]);
      }

      if (dateMatch || timeMatch) {
        currentBranch = "";
      }

      if (!line.match(/[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:]/)) {
        return;
      }
    }

    let remaining = line;
    const branchMatch = line.match(EXAM_TIMETABLE_BRANCH_PREFIX_PATTERN);
    if (branchMatch) {
      currentBranch = normalizeExamTimetableBranchName(branchMatch[1]);
      remaining = String(branchMatch[2] || "").trim();
    }

    if (
      !remaining ||
      !/[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:]/.test(remaining)
    ) {
      return;
    }

    if (!currentDate || !currentTime) {
      return;
    }

    const courseSegments = remaining
      .split(EXAM_TIMETABLE_COURSE_SPLIT_PATTERN)
      .map((segment) => segment.trim())
      .filter(Boolean);

    courseSegments.forEach((segment) => {
      const courseMatch = segment.match(EXAM_TIMETABLE_COURSE_PATTERN);
      if (!courseMatch) {
        return;
      }

      const code = normalizeExamTimetableCourseCode(courseMatch[1]);
      const name = normalizeExamTimetableCourseName(courseMatch[2]);
      const branch = normalizeExamTimetableBranchName(currentBranch);
      if (!code || !name || !branch) {
        return;
      }

      exams.push({
        day: currentDay || getExamTimetableWeekdayFromDate(currentDate),
        date: currentDate,
        time: currentTime,
        branch,
        courseCode: code,
        courseName: name,
        duration: "3 hours",
        year: selectedYear,
      });
    });
  });

  return normalizeGeminiExamTimetableEntries(exams, selectedYear);
};

const parseExamTimetableWithGemini = async ({
  file,
  extractedText = "",
  apiKey = "",
  selectedYear = "",
}) => {
  const prompt = [
    "You are parsing a year-wise engineering exam timetable.",
    "A single date/time slot can contain multiple branch rows and multiple subjects.",
    "Return strict JSON only with this shape:",
    "{",
    '  "exams": [',
    "    {",
    '      "day": "",',
    '      "date": "DD-MM-YYYY",',
    '      "time": "2:00 pm to 5:00 pm",',
    '      "branch": "",',
    '      "courseCode": "",',
    '      "courseName": ""',
    "    }",
    "  ]",
    "}",
    "Rules:",
    "- Branch must be one of: Civil, Computer, Electrical, E&TC, Instrumentation, Mechanical, Information Technology.",
    "- If one branch line contains multiple subjects, create one exams row per subject.",
    "- Keep exam time exactly as a clear range string.",
    "- Do not include markdown, comments, or additional keys.",
  ].join("\n");

  const parts = [{ text: prompt }];

  if (file?.buffer?.length) {
    parts.push({
      inline_data: {
        mime_type: file.mimetype || "application/octet-stream",
        data: file.buffer.toString("base64"),
      },
    });
  }

  if (extractedText) {
    parts.push({
      text: `OCR extracted text (fallback context):\n${String(extractedText || "").slice(0, 30000)}`,
    });
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const triedModels = new Set();
  let lastFailure = "";

  const tryModels = async (models = []) => {
    for (const candidate of models) {
      const modelName = normalizeGeminiModelName(candidate);
      if (!modelName || triedModels.has(modelName)) {
        continue;
      }
      triedModels.add(modelName);

      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response;
        let rawResponse = "";

        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: requestBody,
            },
          );
          rawResponse = await response.text();
        } catch (error) {
          lastFailure = `Model ${modelName}: ${error.message}`;

          if (attempt < maxAttempts) {
            await waitForMs(300 * attempt);
            continue;
          }

          break;
        }

        if (!response.ok) {
          lastFailure = `Model ${modelName} failed with ${response.status}: ${rawResponse.slice(0, 220)}`;

          if (
            GEMINI_TRANSIENT_STATUS_CODES.has(Number(response.status)) &&
            attempt < maxAttempts
          ) {
            await waitForMs(350 * attempt);
            continue;
          }

          break;
        }

        let payload = {};
        try {
          payload = JSON.parse(rawResponse);
        } catch {
          lastFailure = `Model ${modelName}: non-JSON payload`;
          break;
        }

        const modelText = (payload?.candidates || [])
          .flatMap((candidateItem) => candidateItem?.content?.parts || [])
          .map((part) => String(part?.text || ""))
          .join("\n")
          .trim();

        if (!modelText) {
          lastFailure = `Model ${modelName}: empty content`;
          break;
        }

        const structured = extractJsonObjectFromText(modelText);
        if (!structured || typeof structured !== "object") {
          lastFailure = `Model ${modelName}: invalid structured JSON`;
          break;
        }

        const entries = Array.isArray(structured.exams)
          ? structured.exams
          : Array.isArray(structured.entries)
            ? structured.entries
            : [];

        const normalized = normalizeGeminiExamTimetableEntries(
          entries,
          selectedYear,
        );
        if (normalized.length > 0) {
          return normalized;
        }

        lastFailure = `Model ${modelName}: parsed 0 valid exam rows`;
        break;
      }
    }

    return null;
  };

  let parsed = await tryModels(buildExamGeminiModelCandidates());

  if (!parsed) {
    const discoveredModels = await fetchGeminiSupportedModels(apiKey);
    if (discoveredModels.length > 0) {
      const discoveredPreferred = discoveredModels.filter((modelName) =>
        /flash/i.test(modelName),
      );
      const discoveredOthers = discoveredModels.filter(
        (modelName) => !/flash/i.test(modelName),
      );

      parsed = await tryModels(
        buildExamGeminiModelCandidates([
          ...discoveredPreferred,
          ...discoveredOthers,
        ]),
      );
    }
  }

  if (!parsed) {
    const tried = Array.from(triedModels).join(", ");
    throw new Error(
      `Gemini exam timetable parse failed for models [${tried}]. ${lastFailure}`,
    );
  }

  return parsed;
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

const normalizeTeacherLoginId = (value = "") => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (!raw) {
    return "";
  }

  if (raw.includes("@")) {
    return raw;
  }

  return `${raw}@campusconnect.teacher`;
};

const findTeacherByLoginIdentifier = async (
  firestore,
  loginIdentifier = "",
) => {
  const normalizedInput = String(loginIdentifier || "")
    .trim()
    .toLowerCase();

  if (!normalizedInput) {
    return null;
  }

  const normalizedLoginId = normalizeTeacherLoginId(normalizedInput);
  let teacherSnapshot = await firestore
    .collection("teachers")
    .where("loginId", "==", normalizedLoginId)
    .limit(1)
    .get();

  if (teacherSnapshot.empty && normalizedInput.includes("@")) {
    teacherSnapshot = await firestore
      .collection("teachers")
      .where("authEmail", "==", normalizedInput)
      .limit(1)
      .get();
  }

  if (teacherSnapshot.empty) {
    const localTeacherId = normalizedInput.includes("@")
      ? normalizedInput.split("@")[0].toUpperCase()
      : normalizedInput.toUpperCase();

    teacherSnapshot = await firestore
      .collection("teachers")
      .where("teacherId", "==", localTeacherId)
      .limit(1)
      .get();
  }

  if (teacherSnapshot.empty) {
    return null;
  }

  const teacherDoc = teacherSnapshot.docs[0];
  const teacherData = teacherDoc.data() || {};
  const authEmail =
    normalizeEmail(teacherData.authEmail) ||
    normalizeEmail(teacherData.loginId) ||
    normalizeTeacherLoginId(
      teacherData.teacherId || teacherData.employeeId || normalizedInput,
    );

  return {
    uid: teacherDoc.id,
    teacherData,
    authEmail,
    loginId: normalizeTeacherLoginId(
      teacherData.loginId ||
        teacherData.teacherId ||
        teacherData.employeeId ||
        normalizedInput,
    ),
  };
};

const resolveLoginIdentityForPasswordReset = async (loginIdentifier = "") => {
  const normalizedInput = String(loginIdentifier || "")
    .trim()
    .toLowerCase();

  if (!normalizedInput) {
    return null;
  }

  const firestore = admin.firestore();

  if (!normalizedInput.includes("@")) {
    const teacherMatch = await findTeacherByLoginIdentifier(
      firestore,
      normalizedInput,
    );

    if (teacherMatch) {
      const personalEmail =
        normalizeEmail(teacherMatch.teacherData.contactEmail) ||
        normalizeEmail(teacherMatch.teacherData.email) ||
        normalizeEmail(teacherMatch.authEmail);

      if (!personalEmail) {
        return null;
      }

      return {
        uid: teacherMatch.uid,
        role: "teacher",
        loginId: normalizedInput,
        authEmail: normalizeEmail(teacherMatch.authEmail),
        personalEmail,
        displayName: String(
          teacherMatch.teacherData.name ||
            teacherMatch.teacherData.fullName ||
            teacherMatch.teacherData.displayName ||
            "",
        ).trim(),
      };
    }

    const normalizedRoll = normalizePrn(normalizedInput);
    if (normalizedRoll) {
      let studentSnapshot = await firestore
        .collection("students")
        .where("loginId", "==", normalizedRoll)
        .limit(1)
        .get();

      if (studentSnapshot.empty) {
        studentSnapshot = await firestore
          .collection("students")
          .where("prn", "==", normalizedRoll)
          .limit(1)
          .get();
      }

      if (studentSnapshot.empty) {
        studentSnapshot = await firestore
          .collection("students")
          .where("rollNo", "==", normalizedRoll)
          .limit(1)
          .get();
      }

      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        const studentData = studentDoc.data() || {};
        const uid = String(studentData.uid || studentDoc.id).trim();

        let authEmail = normalizeEmail(studentData.email);
        if (!authEmail && uid) {
          try {
            const authUser = await admin.auth().getUser(uid);
            authEmail = normalizeEmail(authUser.email);
          } catch (authError) {
            authEmail = "";
          }
        }

        const personalEmail =
          normalizeEmail(studentData.contactEmail) ||
          normalizeEmail(studentData.personalEmail) ||
          normalizeEmail(studentData.email) ||
          authEmail;

        if (uid && authEmail && personalEmail) {
          return {
            uid,
            role: "student",
            loginId: normalizedInput,
            authEmail,
            personalEmail,
            displayName: String(studentData.name || "").trim(),
          };
        }
      }
    }
  }

  const authEmailInput = normalizeEmail(normalizedInput);
  if (!authEmailInput) {
    return null;
  }

  let userRecord = null;
  try {
    userRecord = await admin.auth().getUserByEmail(authEmailInput);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!userRecord) {
    const teacherMatch = await findTeacherByLoginIdentifier(
      firestore,
      authEmailInput,
    );

    if (!teacherMatch) {
      return null;
    }

    const personalEmail =
      normalizeEmail(teacherMatch.teacherData.contactEmail) ||
      normalizeEmail(teacherMatch.teacherData.email) ||
      normalizeEmail(teacherMatch.authEmail);

    if (!personalEmail) {
      return null;
    }

    return {
      uid: teacherMatch.uid,
      role: "teacher",
      loginId: authEmailInput,
      authEmail: normalizeEmail(teacherMatch.authEmail) || authEmailInput,
      personalEmail,
      displayName: String(
        teacherMatch.teacherData.name ||
          teacherMatch.teacherData.fullName ||
          teacherMatch.teacherData.displayName ||
          "",
      ).trim(),
    };
  }

  const uid = userRecord.uid;
  const authEmail = normalizeEmail(userRecord.email) || authEmailInput;

  const [teacherDoc, studentDoc, userDoc] = await Promise.all([
    firestore.collection("teachers").doc(uid).get(),
    firestore.collection("students").doc(uid).get(),
    firestore.collection("users").doc(uid).get(),
  ]);

  let role = "admin";
  let displayName = String(userRecord.displayName || "").trim();
  let personalEmail = authEmail;

  if (teacherDoc.exists) {
    const teacherData = teacherDoc.data() || {};
    role = "teacher";
    personalEmail =
      normalizeEmail(teacherData.contactEmail) ||
      normalizeEmail(teacherData.email) ||
      authEmail;
    displayName = String(
      teacherData.name ||
        teacherData.fullName ||
        teacherData.displayName ||
        displayName,
    ).trim();
  } else if (studentDoc.exists || userDoc.exists) {
    const studentData = studentDoc.exists ? studentDoc.data() || {} : {};
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    role = "student";
    personalEmail =
      normalizeEmail(userData.contactEmail) ||
      normalizeEmail(studentData.contactEmail) ||
      normalizeEmail(userData.personalEmail) ||
      normalizeEmail(studentData.personalEmail) ||
      normalizeEmail(userData.email) ||
      normalizeEmail(studentData.email) ||
      authEmail;
    displayName = String(
      userData.name || studentData.name || displayName,
    ).trim();
  }

  return {
    uid,
    role,
    loginId: authEmailInput,
    authEmail,
    personalEmail: normalizeEmail(personalEmail) || authEmail,
    displayName,
  };
};

const getPrnFromRecord = (data = {}) => {
  return (data.rollNo || data.rollNumber || data.prn || "")
    .toString()
    .trim()
    .toUpperCase();
};

const normalizePrn = (value = "") => {
  return String(value || "")
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

const attendanceSessionJoinedStudents = new Map();

const getAttendanceSessionJoinMap = (sessionId) => {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) {
    return null;
  }

  if (!attendanceSessionJoinedStudents.has(normalizedSessionId)) {
    attendanceSessionJoinedStudents.set(normalizedSessionId, new Map());
  }

  return attendanceSessionJoinedStudents.get(normalizedSessionId);
};

const getAttendanceJoinedStudentsList = (sessionId) => {
  const joinMap = getAttendanceSessionJoinMap(sessionId);
  if (!joinMap) {
    return [];
  }

  return Array.from(joinMap.values()).sort(
    (a, b) => toMillis(b.joinTimestamp) - toMillis(a.joinTimestamp),
  );
};

// Socket.IO Connection Logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a chat room (student-teacher conversation)
  socket.on("join_chat", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User ${socket.id} joined room: ${chatRoomId}`);
  });

  socket.on("join_attendance_session", async (sessionPayload) => {
    const normalizedSessionId = String(
      typeof sessionPayload === "string"
        ? sessionPayload
        : sessionPayload?.sessionId || "",
    ).trim();
    const candidateLocation = {
      lat: Number(sessionPayload?.studentLocation?.lat),
      lng: Number(sessionPayload?.studentLocation?.lng),
    };
    const hasStudentLocation =
      !Number.isNaN(candidateLocation.lat) &&
      !Number.isNaN(candidateLocation.lng);
    const roomId = `attendance_${normalizedSessionId}`;
    if (!normalizedSessionId) {
      return;
    }

    socket.join(roomId);
    console.log(`User ${socket.id} joined attendance room: ${roomId}`);

    const joinedSnapshot = getAttendanceJoinedStudentsList(normalizedSessionId);
    socket.emit("attendance-joined-students-snapshot", {
      sessionId: normalizedSessionId,
      students: joinedSnapshot,
    });

    const connectedUserId = String(
      socket.handshake?.query?.userId || "",
    ).trim();
    if (!connectedUserId) {
      return;
    }

    try {
      const firestore = admin.firestore();
      const studentProfile = await getStudentProfileByUid(
        firestore,
        connectedUserId,
      );
      if (!studentProfile) {
        return;
      }

      const roleValue = String(studentProfile.role || "").toLowerCase();
      if (roleValue && roleValue !== "student") {
        return;
      }

      const joinMap = getAttendanceSessionJoinMap(normalizedSessionId);
      if (!joinMap) {
        return;
      }

      const existingJoinedPayload = joinMap.get(connectedUserId) || null;

      const joinedPayload = {
        sessionId: normalizedSessionId,
        studentId: connectedUserId,
        studentName:
          studentProfile.name || studentProfile.displayName || "Student",
        prn: getPrnFromRecord(studentProfile),
        joinTimestamp:
          existingJoinedPayload?.joinTimestamp || new Date().toISOString(),
        lat: hasStudentLocation
          ? candidateLocation.lat
          : (existingJoinedPayload?.lat ?? null),
        lng: hasStudentLocation
          ? candidateLocation.lng
          : (existingJoinedPayload?.lng ?? null),
      };

      joinMap.set(connectedUserId, joinedPayload);
      io.to(roomId).emit("attendance-student-joined", joinedPayload);
      io.to(roomId).emit("attendance-joined-students-snapshot", {
        sessionId: normalizedSessionId,
        students: getAttendanceJoinedStudentsList(normalizedSessionId),
      });

      if (hasStudentLocation) {
        io.to(roomId).emit("attendance-heatmap-updated", {
          sessionId: normalizedSessionId,
          lat: candidateLocation.lat,
          lng: candidateLocation.lng,
          studentId: connectedUserId,
        });
      }
    } catch (error) {
      console.error("Attendance join tracking error:", error.message);
    }
  });

  socket.on("leave_attendance_session", (sessionPayload) => {
    const normalizedSessionId = String(
      typeof sessionPayload === "string"
        ? sessionPayload
        : sessionPayload?.sessionId || "",
    ).trim();

    if (!normalizedSessionId) {
      return;
    }

    const roomId = `attendance_${normalizedSessionId}`;
    socket.leave(roomId);

    const connectedUserId = String(
      socket.handshake?.query?.userId || "",
    ).trim();
    if (!connectedUserId) {
      return;
    }

    const joinMap = getAttendanceSessionJoinMap(normalizedSessionId);
    if (!joinMap) {
      return;
    }

    const removed = joinMap.delete(connectedUserId);
    if (!removed) {
      return;
    }

    io.to(roomId).emit("attendance-joined-students-snapshot", {
      sessionId: normalizedSessionId,
      students: getAttendanceJoinedStudentsList(normalizedSessionId),
    });
  });

  // Handle message sending
  socket.on("send_message", async (messageData) => {
    try {
      // Store message in Firestore
      const {
        chatId,
        message,
        senderId,
        receiverId,
        timestamp,
        attachment,
        replyTo,
      } = messageData;

      const normalizedMessage = String(message || "").trim();
      const normalizedTimestamp =
        String(timestamp || "").trim() || new Date().toISOString();
      const hasAttachment = Boolean(attachment?.url);

      if (
        !chatId ||
        !senderId ||
        !receiverId ||
        (!normalizedMessage && !hasAttachment)
      ) {
        socket.emit("message_error", {
          error: "Message text or attachment is required",
        });
        return;
      }

      const normalizedAttachment = hasAttachment
        ? {
            url: String(attachment.url || "").trim(),
            publicId: String(attachment.publicId || "").trim(),
            name: String(attachment.name || "").trim() || "attachment",
            mimeType:
              String(attachment.mimeType || "").trim() ||
              "application/octet-stream",
            type: resolveChatAttachmentType(attachment),
            size: Number(attachment.size) || 0,
            format: String(attachment.format || "").trim(),
            resourceType: String(attachment.resourceType || "").trim() || "raw",
            durationSec: Number(attachment.durationSec) || 0,
          }
        : null;

      const normalizedReplyToCandidate =
        replyTo && typeof replyTo === "object"
          ? {
              messageId: String(replyTo.messageId || "").trim(),
              senderId: String(replyTo.senderId || "").trim(),
              senderName: String(replyTo.senderName || "").trim(),
              message: String(replyTo.message || "")
                .trim()
                .slice(0, 500),
              attachmentName: String(replyTo.attachmentName || "").trim(),
              attachmentType: String(replyTo.attachmentType || "")
                .trim()
                .toLowerCase(),
            }
          : null;

      const normalizedReplyTo =
        normalizedReplyToCandidate?.messageId &&
        normalizedReplyToCandidate?.senderId
          ? normalizedReplyToCandidate
          : null;

      const messageRef = await admin.firestore().collection("messages").add({
        chatId,
        message: normalizedMessage,
        attachment: normalizedAttachment,
        replyTo: normalizedReplyTo,
        senderId,
        receiverId,
        timestamp: normalizedTimestamp,
        read: false,
      });

      const lastMessageText = buildChatLastMessage(
        normalizedMessage,
        normalizedAttachment,
      );

      // Update the chat document with the last message
      await admin.firestore().collection("chats").doc(chatId).update({
        lastMessage: lastMessageText,
        lastMessageTimestamp: normalizedTimestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Only broadcast to others in the room, not back to sender
      // This prevents duplicate messages since the sender will get updates via Firestore
      socket.to(chatId).emit("receive_message", {
        ...messageData,
        message: normalizedMessage,
        attachment: normalizedAttachment,
        replyTo: normalizedReplyTo,
        timestamp: normalizedTimestamp,
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
  try {
    const firestore = admin.firestore();
    const fullName = String(req.body.fullName || req.body.name || "").trim();
    const contactEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const jobProfile = normalizeJobProfile(req.body.jobProfile || "");
    const department = normalizeBranch(
      req.body.department || req.body.dept || "",
    );
    const mobile = normalizePhone(req.body.mobile || req.body.phone || "");

    if (!fullName || !contactEmail || !jobProfile || !department || !mobile) {
      return res.status(400).json({
        message:
          "Full Name, Email, Mobile, Job Profile and Department are required fields.",
      });
    }

    const subjectSetsMap = await getSubjectSetsMap();
    const assignments = normalizeTeacherAssignments({
      assignments: req.body.assignments,
      subjectSetsMap,
      fallbackBranch: department,
      legacyAssignedCourses: req.body.assignedCourses,
    });
    const assignmentSummary = getAssignmentSummaryFields(assignments);

    let user;
    let isNewUser = false;
    const generatedPassword = Math.random().toString(36).slice(-8);

    let existingTeacherDoc = null;
    const byContactEmailSnapshot = await firestore
      .collection("teachers")
      .where("contactEmail", "==", contactEmail)
      .limit(1)
      .get();

    if (!byContactEmailSnapshot.empty) {
      existingTeacherDoc = byContactEmailSnapshot.docs[0];
    } else {
      const byLegacyEmailSnapshot = await firestore
        .collection("teachers")
        .where("email", "==", contactEmail)
        .limit(1)
        .get();
      if (!byLegacyEmailSnapshot.empty) {
        existingTeacherDoc = byLegacyEmailSnapshot.docs[0];
      }
    }

    const existingTeacherData = existingTeacherDoc
      ? existingTeacherDoc.data()
      : {};
    const existingTeacherUid = existingTeacherDoc ? existingTeacherDoc.id : "";

    const previousProfile = normalizeJobProfile(
      existingTeacherData.jobProfile || "",
    );
    const shouldRegenerateId =
      !existingTeacherData.employeeId ||
      (previousProfile && previousProfile !== jobProfile);
    const employeeId = shouldRegenerateId
      ? await generateTeacherId(firestore, jobProfile)
      : existingTeacherData.employeeId;
    const loginId = normalizeTeacherLoginId(employeeId);
    const authEmail = loginId;

    try {
      if (existingTeacherUid) {
        user = await admin.auth().getUser(existingTeacherUid);
      } else {
        user = await admin.auth().getUserByEmail(authEmail);
      }

      await admin.auth().updateUser(user.uid, {
        email: authEmail,
        password: generatedPassword,
        displayName: fullName,
      });
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        user = await admin.auth().createUser({
          email: authEmail,
          displayName: fullName,
          password: generatedPassword,
        });
        isNewUser = true;
      } else {
        throw err;
      }
    }

    await admin.auth().setCustomUserClaims(user.uid, { teacher: true });

    const teacherPayload = {
      uid: user.uid,
      name: fullName,
      fullName,
      displayName: fullName,
      email: contactEmail,
      jobProfile,
      employeeId,
      teacherId: employeeId,
      loginId,
      authEmail,
      contactEmail,
      mobile,
      phone: mobile,
      dept: department,
      department,
      assignments,
      ...assignmentSummary,
      assignedCourses: buildLegacyAssignedCourses(assignments),
      updatedAt: new Date().toISOString(),
      createdAt: existingTeacherData.createdAt || new Date().toISOString(),
    };

    await firestore.collection("teachers").doc(user.uid).set(teacherPayload, {
      merge: true,
    });

    await syncTeacherStudentMappings({
      firestore,
      teacherUid: user.uid,
      teacherId: employeeId,
      teacherName: fullName,
      assignments,
    });

    const transporter = createMailTransporter();
    await transporter.verify();

    const mailText = `Hi ${fullName},

You have been ${isNewUser ? "added as a teacher" : "updated"} in CampusConnect.

Teacher ID: ${employeeId}
  Login ID: ${loginId}
Job Profile: ${jobProfile}
  Login Email: ${authEmail}
Password: ${generatedPassword}

Please log in and change your password after first login.

- CampusConnect Team`;

    await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: contactEmail,
      subject: "Your CampusConnect Teacher Login",
      text: mailText,
    });

    return res.status(200).json({
      message: isNewUser
        ? "Teacher added and login email sent successfully."
        : "Teacher updated and new credentials sent successfully.",
      teacher: {
        uid: user.uid,
        employeeId,
        teacherId: employeeId,
        loginId,
        jobProfile,
      },
      credentials: {
        loginId,
        authEmail,
        password: generatedPassword,
      },
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/teachers/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ message: "Teacher UID is required." });
    }

    const firestore = admin.firestore();
    const teacherDocRef = firestore.collection("teachers").doc(uid);
    const teacherDoc = await teacherDocRef.get();

    if (!teacherDoc.exists) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const existingTeacherData = teacherDoc.data();
    const fullName = String(
      req.body.fullName || req.body.name || existingTeacherData.name || "",
    ).trim();
    const contactEmail = String(
      req.body.email ||
        existingTeacherData.contactEmail ||
        existingTeacherData.email ||
        "",
    )
      .trim()
      .toLowerCase();
    const jobProfile = normalizeJobProfile(
      req.body.jobProfile || existingTeacherData.jobProfile || "",
    );
    const department = normalizeBranch(
      req.body.department ||
        req.body.dept ||
        existingTeacherData.department ||
        existingTeacherData.dept ||
        "",
    );
    const mobile = normalizePhone(
      req.body.mobile ||
        req.body.phone ||
        existingTeacherData.mobile ||
        existingTeacherData.phone ||
        "",
    );

    if (!fullName || !contactEmail || !jobProfile || !department || !mobile) {
      return res.status(400).json({
        message:
          "Full Name, Email, Mobile, Job Profile and Department are required fields.",
      });
    }

    const subjectSetsMap = await getSubjectSetsMap();
    const assignments = normalizeTeacherAssignments({
      assignments: req.body.assignments,
      subjectSetsMap,
      fallbackBranch: department,
      legacyAssignedCourses:
        req.body.assignedCourses || existingTeacherData.assignedCourses,
    });
    const assignmentSummary = getAssignmentSummaryFields(assignments);

    const previousProfile = normalizeJobProfile(
      existingTeacherData.jobProfile || "",
    );
    const shouldRegenerateId =
      !existingTeacherData.employeeId || previousProfile !== jobProfile;
    const employeeId = shouldRegenerateId
      ? await generateTeacherId(firestore, jobProfile)
      : existingTeacherData.employeeId;
    const loginId = normalizeTeacherLoginId(employeeId);
    const authEmail = loginId;

    const updatePayload = {
      uid,
      name: fullName,
      fullName,
      displayName: fullName,
      email: contactEmail,
      jobProfile,
      employeeId,
      teacherId: employeeId,
      loginId,
      authEmail,
      contactEmail,
      mobile,
      phone: mobile,
      dept: department,
      department,
      assignments,
      ...assignmentSummary,
      assignedCourses: buildLegacyAssignedCourses(assignments),
      updatedAt: new Date().toISOString(),
    };

    await teacherDocRef.set(updatePayload, { merge: true });

    await syncTeacherStudentMappings({
      firestore,
      teacherUid: uid,
      teacherId: employeeId,
      teacherName: fullName,
      assignments,
    });

    try {
      await admin.auth().updateUser(uid, {
        displayName: fullName,
        email: authEmail,
      });
      await admin.auth().setCustomUserClaims(uid, { teacher: true });
    } catch (authError) {
      console.error("Teacher auth update warning:", authError.message);
    }

    return res.status(200).json({
      message: "Teacher updated successfully.",
      teacher: {
        uid,
        employeeId,
        teacherId: employeeId,
        loginId,
        jobProfile,
      },
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
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

app.get("/api/resolve-teacher-login/:loginId", async (req, res) => {
  try {
    const loginId = String(req.params.loginId || "").trim();
    if (!loginId) {
      return res.status(400).json({ message: "Login ID is required." });
    }

    const firestore = admin.firestore();
    const teacherMatch = await findTeacherByLoginIdentifier(firestore, loginId);
    if (!teacherMatch) {
      return res.status(404).json({ message: "Teacher login ID not found." });
    }

    const teacherData = teacherMatch.teacherData || {};
    const resolvedEmail =
      normalizeEmail(teacherData.authEmail) ||
      normalizeEmail(teacherData.email) ||
      normalizeEmail(teacherData.contactEmail) ||
      normalizeEmail(teacherMatch.authEmail) ||
      "";

    if (!resolvedEmail) {
      return res.status(404).json({ message: "Teacher auth email not found." });
    }

    return res.status(200).json({
      success: true,
      loginId: teacherMatch.loginId,
      email: resolvedEmail,
    });
  } catch (error) {
    console.error("Error resolving teacher login:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/password-otp/request", async (req, res) => {
  const loginId = String(req.body.loginId || "").trim();
  if (!loginId) {
    return res.status(400).json({ message: "Login ID is required." });
  }

  const genericMessage =
    "If the login ID exists, an OTP has been sent to the registered personal email.";

  try {
    const identity = await resolveLoginIdentityForPasswordReset(loginId);
    if (!identity || !identity.uid || !identity.authEmail) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const firestore = admin.firestore();
    const docId = buildPasswordResetDocId(identity.authEmail);
    const otpDocRef = firestore
      .collection(PASSWORD_RESET_OTP_COLLECTION)
      .doc(docId);
    const otpDoc = await otpDocRef.get();

    const now = Date.now();
    const existingData = otpDoc.exists ? otpDoc.data() || {} : {};
    const lastRequestedAt = Number(existingData.requestedAt || 0);
    if (
      lastRequestedAt > 0 &&
      now - lastRequestedAt < PASSWORD_RESET_REQUEST_COOLDOWN_MS
    ) {
      const waitSeconds = Math.ceil(
        (PASSWORD_RESET_REQUEST_COOLDOWN_MS - (now - lastRequestedAt)) / 1000,
      );
      return res.status(429).json({
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`,
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = buildPasswordOtpHash(identity.authEmail, otp);
    const otpExpiresAt = now + PASSWORD_RESET_OTP_TTL_MS;

    await otpDocRef.set(
      {
        uid: identity.uid,
        role: identity.role,
        authEmail: identity.authEmail,
        personalEmail: identity.personalEmail,
        otpHash,
        otpExpiresAt,
        requestedAt: now,
        attempts: 0,
        resetTokenHash: "",
        resetTokenExpiresAt: 0,
        verifiedAt: 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    const recipientEmail =
      normalizeEmail(identity.personalEmail) ||
      normalizeEmail(identity.authEmail);

    if (!recipientEmail) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const transporter = createMailTransporter();
    await transporter.verify();
    await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
      to: recipientEmail,
      subject: "CampusConnect Password Reset OTP",
      text: `Hi ${identity.displayName || "there"},\n\nYour OTP for CampusConnect password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.\nIf you did not request this, please ignore this message.\n\n- CampusConnect Team`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered personal email.",
      loginId,
      maskedEmail: maskEmailAddress(recipientEmail),
    });
  } catch (error) {
    console.error("Password OTP request error:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/password-otp/verify", async (req, res) => {
  const loginId = String(req.body.loginId || "").trim();
  const otp = String(req.body.otp || "")
    .trim()
    .replace(/\s+/g, "");

  if (!loginId || !/^\d{6}$/.test(otp)) {
    return res
      .status(400)
      .json({ message: "Valid login ID and 6-digit OTP are required." });
  }

  try {
    const identity = await resolveLoginIdentityForPasswordReset(loginId);
    if (!identity || !identity.authEmail) {
      return res.status(400).json({ message: "Invalid login ID or OTP." });
    }

    const firestore = admin.firestore();
    const docId = buildPasswordResetDocId(identity.authEmail);
    const otpDocRef = firestore
      .collection(PASSWORD_RESET_OTP_COLLECTION)
      .doc(docId);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: "OTP not found. Request again." });
    }

    const otpData = otpDoc.data() || {};
    const now = Date.now();

    if (Number(otpData.otpExpiresAt || 0) < now) {
      await otpDocRef.delete();
      return res.status(400).json({ message: "OTP expired. Request again." });
    }

    const attempts = Number(otpData.attempts || 0);
    if (attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      await otpDocRef.delete();
      return res.status(429).json({
        message: "Too many incorrect OTP attempts. Request a new OTP.",
      });
    }

    const expectedHash = buildPasswordOtpHash(identity.authEmail, otp);
    if (expectedHash !== otpData.otpHash) {
      const nextAttempts = attempts + 1;

      if (nextAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
        await otpDocRef.delete();
      } else {
        await otpDocRef.set(
          {
            attempts: nextAttempts,
            lastAttemptAt: now,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }

      return res.status(400).json({ message: "Invalid OTP." });
    }

    const resetToken = crypto.randomBytes(24).toString("hex");
    await otpDocRef.set(
      {
        otpHash: "",
        attempts: 0,
        verifiedAt: now,
        resetTokenHash: buildPasswordResetTokenHash(
          identity.authEmail,
          resetToken,
        ),
        resetTokenExpiresAt: now + PASSWORD_RESET_RESET_TOKEN_TTL_MS,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
      loginId,
      maskedEmail: maskEmailAddress(identity.personalEmail),
    });
  } catch (error) {
    console.error("Password OTP verify error:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/password-otp/reset", async (req, res) => {
  const loginId = String(req.body.loginId || "").trim();
  const resetToken = String(req.body.resetToken || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!loginId || !resetToken || !newPassword) {
    return res.status(400).json({
      message: "Login ID, reset token, and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }

  try {
    const identity = await resolveLoginIdentityForPasswordReset(loginId);
    if (!identity || !identity.uid || !identity.authEmail) {
      return res.status(400).json({ message: "Invalid reset request." });
    }

    const firestore = admin.firestore();
    const docId = buildPasswordResetDocId(identity.authEmail);
    const otpDocRef = firestore
      .collection(PASSWORD_RESET_OTP_COLLECTION)
      .doc(docId);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: "Reset session expired." });
    }

    const otpData = otpDoc.data() || {};
    const now = Date.now();
    const expectedResetHash = buildPasswordResetTokenHash(
      identity.authEmail,
      resetToken,
    );

    if (
      !otpData.resetTokenHash ||
      expectedResetHash !== otpData.resetTokenHash ||
      Number(otpData.resetTokenExpiresAt || 0) < now
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset session." });
    }

    await admin.auth().updateUser(identity.uid, {
      password: newPassword,
    });

    await otpDocRef.delete();

    const recipientEmail =
      normalizeEmail(identity.personalEmail) ||
      normalizeEmail(identity.authEmail);

    if (recipientEmail) {
      try {
        const transporter = createMailTransporter();
        await transporter.verify();
        await transporter.sendMail({
          from: `"Campus Connect" <${process.env.EMAIL_USERNAME}>`,
          to: recipientEmail,
          subject: "CampusConnect Password Changed",
          text: `Hi ${identity.displayName || "there"},\n\nYour CampusConnect password was changed successfully.\nIf this was not you, contact your administrator immediately.\n\n- CampusConnect Team`,
        });
      } catch (mailError) {
        console.error("Password reset confirmation email failed:", mailError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/attendance/register-device", async (req, res) => {
  try {
    const { decodedToken } = await verifyStudentFromRequest(req);
    const deviceId = normalizeDeviceId(req.body.deviceId || "");
    if (!deviceId) {
      return res.status(400).json({ message: "deviceId is required." });
    }

    const firestore = admin.firestore();
    await firestore.collection("student_devices").doc(decodedToken.uid).set(
      {
        studentId: decodedToken.uid,
        deviceId,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Trusted device registered." });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/face/me", async (req, res) => {
  try {
    const { decodedToken } = await verifyStudentFromRequest(req);
    const firestore = admin.firestore();
    const faceDoc = await firestore
      .collection("student_faces")
      .doc(decodedToken.uid)
      .get();

    if (!faceDoc.exists) {
      return res.status(200).json({
        success: true,
        registered: false,
      });
    }

    const data = faceDoc.data() || {};
    return res.status(200).json({
      success: true,
      registered: true,
      modelVersion: String(data.modelVersion || "face-api-v1"),
      descriptorLength: Array.isArray(data.descriptor)
        ? data.descriptor.length
        : 0,
      updatedAt: data.updatedAt || null,
      registeredAt: data.registeredAt || null,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/face/challenge", async (req, res) => {
  try {
    const { decodedToken } = await verifyStudentFromRequest(req);
    const studentId = decodedToken.uid;
    const sessionId = String(req.body.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const firestore = admin.firestore();
    const sessionDoc = await firestore
      .collection("attendance_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const challengeRef = firestore
      .collection("attendance_face_challenges")
      .doc();
    const nowMs = Date.now();
    const expiresAtMs = nowMs + FACE_CHALLENGE_TTL_MS;

    await challengeRef.set({
      challengeId: challengeRef.id,
      sessionId,
      studentId,
      challenge: crypto.randomBytes(24).toString("hex"),
      createdAtMs: nowMs,
      expiresAtMs,
      used: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      success: true,
      challengeId: challengeRef.id,
      expiresAtMs,
      ttlSeconds: Math.floor(FACE_CHALLENGE_TTL_MS / 1000),
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/face/register", async (req, res) => {
  try {
    const { decodedToken } = await verifyStudentFromRequest(req);
    const studentId = decodedToken.uid;
    const payloadStudentId = String(req.body.studentId || "").trim();
    if (payloadStudentId && payloadStudentId !== studentId) {
      return res.status(403).json({ message: "studentId mismatch." });
    }

    const descriptor = normalizeFaceDescriptor(req.body.descriptor);
    if (descriptor.length !== FACE_DESCRIPTOR_LENGTH) {
      return res.status(400).json({
        message: `descriptor must contain ${FACE_DESCRIPTOR_LENGTH} numeric values.`,
      });
    }

    const modelVersion = String(req.body.modelVersion || "face-api-v1").trim();
    const firestore = admin.firestore();

    const existingDoc = await firestore
      .collection("student_faces")
      .doc(studentId)
      .get();

    await firestore
      .collection("student_faces")
      .doc(studentId)
      .set(
        {
          studentId,
          descriptor,
          modelVersion,
          registeredAt: existingDoc.exists
            ? existingDoc.data()?.registeredAt ||
              admin.firestore.FieldValue.serverTimestamp()
            : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return res.status(201).json({
      success: true,
      message: existingDoc.exists
        ? "Face profile updated successfully."
        : "Face profile registered successfully.",
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/settings", async (req, res) => {
  try {
    const token = getAuthTokenFromRequest(req);
    await admin.auth().verifyIdToken(token);

    const firestore = admin.firestore();
    const settings = await getAttendanceSettings(firestore);
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    const status = /token/i.test(error.message) ? 401 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.put("/attendance/settings", async (req, res) => {
  try {
    const decodedToken = await verifyAdminFromRequest(req);
    const distanceEnforcementDefault = req.body?.distanceEnforcementDefault;

    if (typeof distanceEnforcementDefault !== "boolean") {
      return res.status(400).json({
        message: "distanceEnforcementDefault must be a boolean value.",
      });
    }

    const firestore = admin.firestore();
    await firestore
      .collection(ATTENDANCE_SETTINGS_COLLECTION)
      .doc(ATTENDANCE_SETTINGS_DOC_ID)
      .set(
        {
          distanceEnforcementDefault,
          updatedBy: decodedToken.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return res.status(200).json({
      success: true,
      message: "Attendance settings updated successfully.",
      settings: {
        distanceEnforcementDefault,
      },
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/start", async (req, res) => {
  try {
    const { decodedToken, teacherDoc } = await verifyTeacherFromRequest(req);
    const teacherData = teacherDoc.exists ? teacherDoc.data() || {} : {};
    const firestore = admin.firestore();
    const attendanceSettings = await getAttendanceSettings(firestore);

    const lectureIdInput = String(req.body.lectureId || "").trim();
    const date = String(req.body.date || new Date().toISOString().slice(0, 10));
    const subjectNameInput = String(req.body.subjectName || "").trim();
    const subjectIdInput = String(req.body.subjectId || "").trim();
    const branchInput = normalizeBranch(req.body.branch || "");
    const yearInput = normalizeYear(req.body.year || "");
    const semesterInput = normalizeSemester(req.body.semester || "");
    const requestedWindowSeconds = Number(req.body.attendanceWindowSeconds);
    const teacherLocationCandidate = {
      lat: Number(req.body?.teacherLocation?.lat),
      lng: Number(req.body?.teacherLocation?.lng),
    };
    const hasValidTeacherLocation =
      !Number.isNaN(teacherLocationCandidate.lat) &&
      !Number.isNaN(teacherLocationCandidate.lng);
    const enforceDistanceCheck =
      typeof req.body.enforceDistanceCheck === "boolean"
        ? req.body.enforceDistanceCheck
        : attendanceSettings.distanceEnforcementDefault;
    const teacherLocation = hasValidTeacherLocation
      ? teacherLocationCandidate
      : null;

    const attendanceWindowSeconds = ATTENDANCE_WINDOW_SLOT_SECONDS.includes(
      requestedWindowSeconds,
    )
      ? requestedWindowSeconds
      : ATTENDANCE_WINDOW_SECONDS;

    if (enforceDistanceCheck && !teacherLocation) {
      return res
        .status(400)
        .json({ message: "Valid teacher location is required." });
    }

    let resolvedBranch = "";
    let resolvedYear = "";
    let resolvedSemester = "";
    let subjectName = "";
    let subjectId = "";
    let lectureDay = "";
    let lectureStartTime = "";
    let lectureEndTime = "";

    if (lectureIdInput) {
      const lectureDoc = await firestore
        .collection("timetables")
        .doc(lectureIdInput)
        .get();

      if (!lectureDoc.exists) {
        return res.status(404).json({ message: "Selected lecture not found." });
      }

      const lectureData = lectureDoc.data() || {};
      if (String(lectureData.teacherId || "") !== decodedToken.uid) {
        return res.status(403).json({
          message:
            "You can only start attendance for your own timetable lectures.",
        });
      }

      subjectName = String(
        lectureData.subjectName || lectureData.subject || "",
      ).trim();
      subjectId = String(
        lectureData.subjectId || makeSubjectId(subjectName),
      ).trim();
      resolvedBranch = normalizeBranch(
        lectureData.branch || lectureData.dept || "",
      );
      resolvedYear = normalizeYear(lectureData.year || "");
      resolvedSemester = normalizeSemester(lectureData.semester || "");
      lectureDay = String(lectureData.day || "").trim();
      lectureStartTime = String(lectureData.startTime || "").trim();
      lectureEndTime = String(lectureData.endTime || "").trim();

      if (!subjectName || !subjectId || !resolvedBranch || !resolvedYear) {
        return res.status(400).json({
          message: "Selected lecture has incomplete subject/class metadata.",
        });
      }
    }

    if (!lectureIdInput) {
      const assignments = Array.isArray(teacherData.assignments)
        ? teacherData.assignments
        : [];
      if (assignments.length === 0) {
        return res
          .status(403)
          .json({ message: "Teacher has no active subject assignments." });
      }

      const matchingAssignments = assignments.filter((assignment) => {
        const assignmentBranch = normalizeBranch(
          assignment.branch || assignment.dept || "",
        );
        const assignmentYear = normalizeYear(assignment.year || "");
        const assignmentSubjects = normalizeSubjectValues(assignment.subjects);

        const branchOk = !branchInput || assignmentBranch === branchInput;
        const yearOk = !yearInput || assignmentYear === yearInput;

        const subjectOk = assignmentSubjects.some((subject) =>
          subjectMatches(subjectNameInput, subjectIdInput, subject),
        );

        return branchOk && yearOk && subjectOk;
      });

      if (matchingAssignments.length === 0) {
        return res.status(403).json({
          message: "Teacher is not assigned to this subject/class combination.",
        });
      }

      if (matchingAssignments.length > 1 && (!branchInput || !yearInput)) {
        return res.status(400).json({
          message:
            "Multiple class assignments found for this subject. Include branch and year.",
        });
      }

      const assignment = matchingAssignments[0];
      resolvedBranch = normalizeBranch(
        assignment.branch || assignment.dept || "",
      );
      resolvedYear = normalizeYear(assignment.year || "");
      resolvedSemester =
        semesterInput || normalizeSemester(assignment.semester || "");

      const assignmentSubjects = normalizeSubjectValues(assignment.subjects);
      const matchedSubject =
        assignmentSubjects.find((subject) =>
          subjectMatches(subjectNameInput, subjectIdInput, subject),
        ) || subjectNameInput;

      subjectName = String(matchedSubject || "").trim();
      subjectId = subjectIdInput || makeSubjectId(subjectName);
      if (!subjectName || !subjectId) {
        return res
          .status(400)
          .json({ message: "subjectName/subjectId is required." });
      }
    }

    const sameDateSessionsSnapshot = await firestore
      .collection("attendance_sessions")
      .where("teacherId", "==", decodedToken.uid)
      .where("date", "==", date)
      .get();

    const sameDateSessions = sameDateSessionsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const matchingSession = sameDateSessions.find((session) => {
      const sameLectureId =
        lectureIdInput &&
        String(session.lectureId || "").trim() === lectureIdInput;

      if (sameLectureId) {
        return true;
      }

      if (lectureIdInput && String(session.lectureId || "").trim()) {
        return false;
      }

      const sameSubject = String(session.subjectId || "").trim() === subjectId;
      if (!sameSubject) {
        return false;
      }

      const sameDay = lectureDay
        ? String(session.day || "")
            .trim()
            .toLowerCase() === lectureDay.toLowerCase()
        : true;
      const sameStart = lectureStartTime
        ? String(session.lectureStartTime || "").trim() === lectureStartTime
        : true;
      const sameEnd = lectureEndTime
        ? String(session.lectureEndTime || "").trim() === lectureEndTime
        : true;

      return sameDay && sameStart && sameEnd;
    });

    if (matchingSession) {
      const normalizedStatus = String(matchingSession.status || "")
        .trim()
        .toLowerCase();

      if (normalizedStatus === "active") {
        return res.status(200).json({
          success: true,
          message: "Active attendance session already exists.",
          sessionId: matchingSession.id,
          session: matchingSession,
        });
      }

      return res.status(409).json({
        message:
          "Attendance for this lecture and date is already taken. Open Past Attendance Sessions to view/export it.",
        existingSession: matchingSession,
      });
    }

    const sessionRef = firestore.collection("attendance_sessions").doc();
    const nowMs = Date.now();

    const payload = {
      sessionId: sessionRef.id,
      teacherId: decodedToken.uid,
      teacherName:
        teacherData.fullName ||
        teacherData.name ||
        decodedToken.name ||
        "Teacher",
      subjectId,
      subjectName,
      date,
      branch: resolvedBranch,
      year: resolvedYear,
      semester: resolvedSemester || "",
      lectureId: lectureIdInput || "",
      day: lectureDay || "",
      lectureStartTime,
      lectureEndTime,
      status: "active",
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      startTimeMs: nowMs,
      allowedDistanceMeters: ATTENDANCE_ALLOWED_DISTANCE_METERS,
      attendanceWindowSeconds,
      enforceDistanceCheck,
      teacherLocation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const enrolledStudents = await getSessionEnrolledStudents(
      firestore,
      payload,
    );
    const enrolledStudentIds = enrolledStudents
      .map((student) => String(student.uid || "").trim())
      .filter(Boolean);

    await sessionRef.set({
      ...payload,
      enrolledStudentsCount: enrolledStudentIds.length,
      enrolledStudentIds,
    });

    attendanceSessionJoinedStudents.set(sessionRef.id, new Map());

    const responseSession = {
      ...payload,
      startTime: new Date(nowMs).toISOString(),
      enrolledStudentsCount: enrolledStudentIds.length,
      enrolledStudentIds,
    };

    io.emit("attendance-session-started", responseSession);
    io.to(`attendance_${sessionRef.id}`).emit(
      "attendance-session-started",
      responseSession,
    );

    return res.status(201).json({
      success: true,
      message: "Attendance session started successfully.",
      sessionId: sessionRef.id,
      session: responseSession,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/teacher/lectures", async (req, res) => {
  try {
    const { decodedToken } = await verifyTeacherFromRequest(req);
    const firestore = admin.firestore();

    const snapshot = await firestore
      .collection("timetables")
      .where("teacherId", "==", decodedToken.uid)
      .get();

    const lectures = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => {
        const dayOrder = {
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
          Sunday: 7,
        };

        const dayA = dayOrder[String(a.day || "")] || 99;
        const dayB = dayOrder[String(b.day || "")] || 99;
        if (dayA !== dayB) return dayA - dayB;

        return String(a.startTime || "").localeCompare(
          String(b.startTime || ""),
        );
      });

    return res.status(200).json({ success: true, lectures });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/sessions/active", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firestore = admin.firestore();

    const snapshot = await firestore
      .collection("attendance_sessions")
      .where("status", "==", "active")
      .get();

    let sessions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    if (!decodedToken.teacher && !decodedToken.admin) {
      const studentData = await getStudentProfileByUid(
        firestore,
        decodedToken.uid,
      );
      if (!studentData) {
        return res.status(200).json({ success: true, sessions: [] });
      }

      sessions = sessions.filter((session) =>
        studentBelongsToSession(studentData, session),
      );
    }

    sessions.sort(
      (a, b) => Number(b.startTimeMs || 0) - Number(a.startTimeMs || 0),
    );

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    const status = /token/i.test(error.message) ? 401 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/session/:subjectId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const subjectId = String(req.params.subjectId || "").trim();
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    const firestore = admin.firestore();
    const activeSessionsSnapshot = await firestore
      .collection("attendance_sessions")
      .where("subjectId", "==", subjectId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (activeSessionsSnapshot.empty) {
      return res.status(200).json({ success: true, session: null });
    }

    const sessionDoc = activeSessionsSnapshot.docs[0];
    const sessionData = sessionDoc.data() || {};
    const session = { id: sessionDoc.id, ...sessionData };

    if (!decodedToken.teacher) {
      const studentData = await getStudentProfileByUid(
        firestore,
        decodedToken.uid,
      );
      if (!studentData || !studentBelongsToSession(studentData, session)) {
        return res.status(200).json({ success: true, session: null });
      }
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    const status = /token/i.test(error.message) ? 401 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/mark", async (req, res) => {
  try {
    const { decodedToken, studentData } = await verifyStudentFromRequest(req);
    const studentId = decodedToken.uid;
    const payloadStudentId = String(req.body.studentId || "").trim();
    if (payloadStudentId && payloadStudentId !== studentId) {
      return res.status(403).json({ message: "studentId mismatch." });
    }

    const sessionId = String(req.body.sessionId || "").trim();
    const deviceId = normalizeDeviceId(req.body.deviceId || "");
    const biometricVerified = Boolean(req.body.biometricVerified);
    const biometricAssertionId = String(
      req.body.biometricAssertionId || req.body.assertionId || "",
    ).trim();
    const studentLocation = {
      lat: Number(req.body?.studentLocation?.lat),
      lng: Number(req.body?.studentLocation?.lng),
    };

    if (!sessionId || !deviceId) {
      return res
        .status(400)
        .json({ message: "sessionId and deviceId are required." });
    }

    if (!biometricVerified || !biometricAssertionId) {
      return res
        .status(403)
        .json({ message: "Biometric verification is required." });
    }

    if (
      Number.isNaN(studentLocation.lat) ||
      Number.isNaN(studentLocation.lng)
    ) {
      return res
        .status(400)
        .json({ message: "Valid student location is required." });
    }

    const firestore = admin.firestore();
    const [sessionDoc, deviceDoc] = await Promise.all([
      firestore.collection("attendance_sessions").doc(sessionId).get(),
      firestore.collection("student_devices").doc(studentId).get(),
    ]);

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    if (sessionData.status !== "active") {
      return res
        .status(400)
        .json({ message: "Attendance session has already ended." });
    }

    if (!deviceDoc.exists) {
      return res.status(403).json({
        message: "Trusted device not registered for this student.",
        code: "DEVICE_NOT_REGISTERED",
      });
    }

    const trustedDevice = normalizeDeviceId(deviceDoc.data()?.deviceId || "");
    if (trustedDevice !== deviceId) {
      return res.status(403).json({
        message: "Device verification failed.",
        code: "DEVICE_MISMATCH",
      });
    }

    if (!studentBelongsToSession(studentData, sessionData)) {
      return res
        .status(403)
        .json({ message: "Student is not enrolled for this session subject." });
    }

    const startMs =
      Number(sessionData.startTimeMs) || toMillis(sessionData.startTime);
    const nowMs = Date.now();
    const maxWindowMs =
      (Number(sessionData.attendanceWindowSeconds) ||
        ATTENDANCE_WINDOW_SECONDS) * 1000;

    if (!startMs || nowMs - startMs > maxWindowMs) {
      return res
        .status(403)
        .json({ message: "Attendance time window has expired." });
    }

    const distance = haversineDistanceMeters(
      studentLocation,
      sessionData.teacherLocation || {},
    );
    const allowedDistance =
      Number(sessionData.allowedDistanceMeters) ||
      ATTENDANCE_ALLOWED_DISTANCE_METERS;
    const enforceDistanceCheck = shouldEnforceDistanceForSession(sessionData);
    if (enforceDistanceCheck && !Number.isFinite(distance)) {
      return res.status(403).json({
        message:
          "Teacher location is unavailable for this session. Ask teacher to restart attendance with location enabled.",
      });
    }
    if (enforceDistanceCheck && distance > allowedDistance) {
      return res.status(403).json({
        message: `Location verification failed. You must be within ${allowedDistance} meters.`,
      });
    }

    const duplicateSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .where("studentId", "==", studentId)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return res
        .status(409)
        .json({ message: "Attendance already marked for this session." });
    }

    const recordRef = firestore.collection("attendance_records").doc();
    const studentName =
      studentData.name ||
      studentData.displayName ||
      decodedToken.name ||
      "Student";
    const studentPrn = getPrnFromRecord(studentData);
    const recordPayload = {
      recordId: recordRef.id,
      sessionId,
      studentId,
      studentName,
      prn: studentPrn,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      latitude: studentLocation.lat,
      longitude: studentLocation.lng,
      method: "biometric",
      biometricAssertionId,
      deviceId,
      distanceMeters: Number.isFinite(distance)
        ? Number(distance.toFixed(2))
        : null,
    };

    await recordRef.set(recordPayload);

    const eventPayload = {
      ...recordPayload,
      timestamp: new Date(nowMs).toISOString(),
    };

    io.to(`attendance_${sessionId}`).emit("attendance-recorded", eventPayload);
    io.to(`attendance_${sessionId}`).emit("attendance-heatmap-updated", {
      lat: studentLocation.lat,
      lng: studentLocation.lng,
      studentId,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      record: eventPayload,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/mark-face", async (req, res) => {
  try {
    const { decodedToken, studentData } = await verifyStudentFromRequest(req);
    const studentId = decodedToken.uid;
    const payloadStudentId = String(req.body.studentId || "").trim();
    if (payloadStudentId && payloadStudentId !== studentId) {
      return res.status(403).json({ message: "studentId mismatch." });
    }

    const sessionId = String(req.body.sessionId || "").trim();
    const challengeId = String(req.body.challengeId || "").trim();
    const deviceId = normalizeDeviceId(req.body.deviceId || "");
    const descriptor = normalizeFaceDescriptor(req.body.descriptor);
    const livenessPassed = Boolean(req.body.livenessPassed);
    const studentLocation = {
      lat: Number(req.body?.studentLocation?.lat),
      lng: Number(req.body?.studentLocation?.lng),
    };

    if (!sessionId || !deviceId || !challengeId) {
      return res.status(400).json({
        message: "sessionId, deviceId, and challengeId are required.",
      });
    }

    if (descriptor.length !== FACE_DESCRIPTOR_LENGTH) {
      return res.status(400).json({
        message: `descriptor must contain ${FACE_DESCRIPTOR_LENGTH} numeric values.`,
      });
    }

    if (
      Number.isNaN(studentLocation.lat) ||
      Number.isNaN(studentLocation.lng)
    ) {
      return res
        .status(400)
        .json({ message: "Valid student location is required." });
    }

    if (!livenessPassed) {
      return res.status(403).json({ message: "Face liveness check failed." });
    }

    const firestore = admin.firestore();

    const [sessionDoc, deviceDoc, faceDoc, challengeDoc] = await Promise.all([
      firestore.collection("attendance_sessions").doc(sessionId).get(),
      firestore.collection("student_devices").doc(studentId).get(),
      firestore.collection("student_faces").doc(studentId).get(),
      firestore.collection("attendance_face_challenges").doc(challengeId).get(),
    ]);

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    if (sessionData.status !== "active") {
      return res
        .status(400)
        .json({ message: "Attendance session has already ended." });
    }

    if (!deviceDoc.exists) {
      return res.status(403).json({
        message: "Trusted device not registered for this student.",
        code: "DEVICE_NOT_REGISTERED",
      });
    }

    const trustedDevice = normalizeDeviceId(deviceDoc.data()?.deviceId || "");
    if (trustedDevice !== deviceId) {
      return res.status(403).json({
        message: "Device verification failed.",
        code: "DEVICE_MISMATCH",
      });
    }

    if (!studentBelongsToSession(studentData, sessionData)) {
      return res
        .status(403)
        .json({ message: "Student is not enrolled for this session subject." });
    }

    const startMs =
      Number(sessionData.startTimeMs) || toMillis(sessionData.startTime);
    const nowMs = Date.now();
    const maxWindowMs =
      (Number(sessionData.attendanceWindowSeconds) ||
        ATTENDANCE_WINDOW_SECONDS) * 1000;

    if (!startMs || nowMs - startMs > maxWindowMs) {
      return res
        .status(403)
        .json({ message: "Attendance time window has expired." });
    }

    const distance = haversineDistanceMeters(
      studentLocation,
      sessionData.teacherLocation || {},
    );
    const allowedDistance =
      Number(sessionData.allowedDistanceMeters) ||
      ATTENDANCE_ALLOWED_DISTANCE_METERS;
    const enforceDistanceCheck = shouldEnforceDistanceForSession(sessionData);
    if (enforceDistanceCheck && !Number.isFinite(distance)) {
      return res.status(403).json({
        message:
          "Teacher location is unavailable for this session. Ask teacher to restart attendance with location enabled.",
      });
    }
    if (enforceDistanceCheck && distance > allowedDistance) {
      return res.status(403).json({
        message: `Location verification failed. You must be within ${allowedDistance} meters.`,
      });
    }

    const duplicateSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .where("studentId", "==", studentId)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return res
        .status(409)
        .json({ message: "Attendance already marked for this session." });
    }

    if (!faceDoc.exists) {
      return res.status(403).json({
        message:
          "No registered face profile found. Please complete face registration first.",
      });
    }

    const challengeData = challengeDoc.exists
      ? challengeDoc.data() || {}
      : null;
    if (!challengeData) {
      return res.status(403).json({ message: "Invalid face challenge." });
    }
    if (Boolean(challengeData.used)) {
      return res.status(403).json({ message: "Face challenge already used." });
    }
    if (String(challengeData.studentId || "") !== studentId) {
      return res
        .status(403)
        .json({ message: "Face challenge student mismatch." });
    }
    if (String(challengeData.sessionId || "") !== sessionId) {
      return res
        .status(403)
        .json({ message: "Face challenge session mismatch." });
    }

    const expiresAtMs = Number(challengeData.expiresAtMs || 0);
    if (!expiresAtMs || Date.now() > expiresAtMs) {
      return res.status(403).json({ message: "Face challenge expired." });
    }

    const storedDescriptor = normalizeFaceDescriptor(
      faceDoc.data()?.descriptor,
    );
    if (storedDescriptor.length !== FACE_DESCRIPTOR_LENGTH) {
      return res.status(500).json({
        message: "Registered face profile is invalid. Please register again.",
      });
    }

    const distanceScore = euclideanDistance(descriptor, storedDescriptor);
    if (distanceScore >= FACE_MATCH_DISTANCE_THRESHOLD) {
      return res.status(403).json({
        message: "Face verification failed.",
        faceDistance: Number(distanceScore.toFixed(4)),
      });
    }

    await firestore
      .collection("attendance_face_challenges")
      .doc(challengeId)
      .set(
        {
          used: true,
          usedAtMs: Date.now(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    const recordRef = firestore.collection("attendance_records").doc();
    const studentName =
      studentData.name ||
      studentData.displayName ||
      decodedToken.name ||
      "Student";
    const studentPrn = getPrnFromRecord(studentData);
    const recordPayload = {
      recordId: recordRef.id,
      sessionId,
      studentId,
      studentName,
      prn: studentPrn,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      latitude: studentLocation.lat,
      longitude: studentLocation.lng,
      method: "face_recognition",
      confidenceScore: buildFaceConfidenceScore(distanceScore),
      faceDistance: Number(distanceScore.toFixed(4)),
      modelVersion: String(faceDoc.data()?.modelVersion || "face-api-v1"),
      livenessPassed: true,
      deviceId,
      distanceMeters: Number.isFinite(distance)
        ? Number(distance.toFixed(2))
        : null,
      challengeId,
    };

    await recordRef.set(recordPayload);

    const eventPayload = {
      ...recordPayload,
      timestamp: new Date(nowMs).toISOString(),
    };

    io.to(`attendance_${sessionId}`).emit("attendance-recorded", eventPayload);
    io.to(`attendance_${sessionId}`).emit("attendance-heatmap-updated", {
      lat: studentLocation.lat,
      lng: studentLocation.lng,
      studentId,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully using face recognition.",
      record: eventPayload,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/mark-by-teacher", async (req, res) => {
  try {
    const { decodedToken } = await verifyTeacherFromRequest(req);
    const sessionId = String(req.body.sessionId || "").trim();
    const studentIdInput = String(req.body.studentId || "").trim();
    const prnInput = normalizePrn(req.body.prn || "");

    if (!sessionId || (!studentIdInput && !prnInput)) {
      return res.status(400).json({
        message: "sessionId and either studentId or prn are required.",
      });
    }

    const firestore = admin.firestore();
    const sessionDoc = await firestore
      .collection("attendance_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    if (String(sessionData.teacherId || "") !== decodedToken.uid) {
      return res
        .status(403)
        .json({ message: "Only session owner can scan student QR." });
    }

    if (sessionData.status !== "active") {
      return res
        .status(400)
        .json({ message: "Attendance session has already ended." });
    }

    const studentData = await findStudentByStudentIdOrPrn(firestore, {
      studentId: studentIdInput,
      prn: prnInput,
    });
    const studentId = String(studentData?.uid || "").trim();

    if (!studentData || !studentId) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (!studentData || !studentBelongsToSession(studentData, sessionData)) {
      return res
        .status(403)
        .json({ message: "Student is not enrolled for this session subject." });
    }

    const duplicateSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .where("studentId", "==", studentId)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return res
        .status(409)
        .json({ message: "Attendance already marked for this student." });
    }

    const recordId = `${sessionId}_${studentId}`.replace(
      /[^a-zA-Z0-9_-]+/g,
      "_",
    );
    const recordRef = firestore.collection("attendance_records").doc(recordId);
    const nowMs = Date.now();
    const recordPayload = {
      recordId: recordRef.id,
      sessionId,
      studentId,
      studentName: studentData.name || studentData.displayName || "Student",
      prn: getPrnFromRecord(studentData),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      latitude: null,
      longitude: null,
      method: "teacher_scan",
      scannedBy: decodedToken.uid,
    };

    try {
      await recordRef.create(recordPayload);
    } catch (createError) {
      const alreadyExists =
        Number(createError?.code) === 6 ||
        /already exists/i.test(String(createError?.message || ""));
      if (alreadyExists) {
        return res
          .status(409)
          .json({ message: "Attendance already marked for this student." });
      }
      throw createError;
    }

    const eventPayload = {
      ...recordPayload,
      timestamp: new Date(nowMs).toISOString(),
    };

    io.to(`attendance_${sessionId}`).emit("attendance-recorded", eventPayload);

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully by teacher scan.",
      record: eventPayload,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/attendance/end", async (req, res) => {
  try {
    const { decodedToken } = await verifyTeacherFromRequest(req);
    const sessionId = String(req.body.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const firestore = admin.firestore();
    const sessionRef = firestore
      .collection("attendance_sessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    if (String(sessionData.teacherId || "") !== decodedToken.uid) {
      return res
        .status(403)
        .json({ message: "Only session owner can end session." });
    }

    if (sessionData.status === "ended") {
      return res
        .status(200)
        .json({ success: true, message: "Session is already ended." });
    }

    const recordsSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .get();

    const attendanceRecords = recordsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const presentStudentIds = new Set(
      attendanceRecords
        .map((record) => String(record.studentId || "").trim())
        .filter(Boolean),
    );

    let enrolledStudentIds = Array.isArray(sessionData.enrolledStudentIds)
      ? sessionData.enrolledStudentIds
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      : [];

    if (enrolledStudentIds.length === 0) {
      const enrolledStudents = await getSessionEnrolledStudents(
        firestore,
        sessionData,
      );
      enrolledStudentIds = enrolledStudents
        .map((student) => String(student.uid || "").trim())
        .filter(Boolean);
    }

    const nowMs = Date.now();
    const enrolledStudentsCount = enrolledStudentIds.length;
    const presentCount = presentStudentIds.size;
    const absentStudentIds = enrolledStudentIds.filter(
      (studentId) => !presentStudentIds.has(studentId),
    );

    const studentProfilePairs = await Promise.all(
      enrolledStudentIds.map(async (studentId) => {
        const profile = await getStudentProfileByUid(firestore, studentId);
        return [studentId, profile];
      }),
    );
    const studentProfilesById = new Map(studentProfilePairs);

    const attendanceByStudentId = new Map();
    attendanceRecords.forEach((record) => {
      const studentId = String(record.studentId || "").trim();
      if (!studentId || attendanceByStudentId.has(studentId)) {
        return;
      }
      attendanceByStudentId.set(studentId, record);
    });

    const toStudentSummary = (studentId) => {
      const profile = studentProfilesById.get(studentId) || {};
      const record = attendanceByStudentId.get(studentId) || {};
      return {
        studentId,
        studentName:
          record.studentName ||
          profile.name ||
          profile.displayName ||
          "Student",
        prn: record.prn || getPrnFromRecord(profile) || "",
      };
    };

    const presentStudents = Array.from(presentStudentIds).map(toStudentSummary);
    const absentStudents = absentStudentIds.map(toStudentSummary);

    const currentRate = enrolledStudentsCount
      ? Number(((presentCount / enrolledStudentsCount) * 100).toFixed(2))
      : 0;

    await sessionRef.set(
      {
        status: "ended",
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        endTimeMs: nowMs,
        presentCount,
        enrolledStudentsCount,
        enrolledStudentIds,
        absentStudentIds,
        presentStudents,
        absentStudents,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const sessionEndedPayload = {
      sessionId,
      status: "ended",
      presentCount,
      enrolledStudentsCount,
      absentCount: absentStudentIds.length,
      presentStudentIds: Array.from(presentStudentIds),
      absentStudentIds,
      presentStudents,
      absentStudents,
      endTime: new Date(nowMs).toISOString(),
    };

    io.emit("attendance-session-ended", sessionEndedPayload);
    io.to(`attendance_${sessionId}`).emit(
      "attendance-session-ended",
      sessionEndedPayload,
    );

    res.status(200).json({
      success: true,
      message: "Attendance session ended successfully.",
      session: {
        ...sessionEndedPayload,
        subjectId: sessionData.subjectId || "",
        subjectName: sessionData.subjectName || "",
        date: sessionData.date || "",
      },
    });

    attendanceSessionJoinedStudents.delete(sessionId);

    (async () => {
      for (const studentId of enrolledStudentIds) {
        if (!studentId) continue;

        const docId = `${studentId}_${sessionData.subjectId}`;
        const attendanceRef = firestore
          .collection("student_attendance")
          .doc(docId);

        await attendanceRef.set(
          {
            studentId,
            subjectId: sessionData.subjectId,
            subjectName: sessionData.subjectName || "",
            totalClasses: admin.firestore.FieldValue.increment(1),
            attendedClasses: admin.firestore.FieldValue.increment(
              presentStudentIds.has(studentId) ? 1 : 0,
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      const statsDocId = `${sessionData.subjectId}_${sessionData.teacherId}`;
      const statsRef = firestore
        .collection("subject_attendance_stats")
        .doc(statsDocId);

      await statsRef.set(
        {
          subjectId: sessionData.subjectId,
          subjectName: sessionData.subjectName || "",
          teacherId: sessionData.teacherId,
          totalClasses: admin.firestore.FieldValue.increment(1),
          cumulativeAttendanceRate:
            admin.firestore.FieldValue.increment(currentRate),
          lastAttendanceRate: currentRate,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    })().catch((error) => {
      console.error("Deferred attendance rollup failed:", error);
    });

    return;
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/session/:sessionId/records", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const sessionId = String(req.params.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const firestore = admin.firestore();
    const sessionDoc = await firestore
      .collection("attendance_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    const isTeacherOwner =
      decodedToken.teacher &&
      String(sessionData.teacherId || "") === String(decodedToken.uid || "");
    const isAdmin = Boolean(decodedToken.admin);
    if (!isTeacherOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const recordsSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .get();

    const records = recordsSnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

    return res.status(200).json({
      success: true,
      session: {
        id: sessionDoc.id,
        ...sessionData,
        presentStudentIds: Array.isArray(sessionData.presentStudentIds)
          ? sessionData.presentStudentIds
          : [],
        absentStudentIds: Array.isArray(sessionData.absentStudentIds)
          ? sessionData.absentStudentIds
          : [],
        presentStudents: Array.isArray(sessionData.presentStudents)
          ? sessionData.presentStudents
          : [],
        absentStudents: Array.isArray(sessionData.absentStudents)
          ? sessionData.absentStudents
          : [],
        joinedStudents: getAttendanceJoinedStudentsList(sessionId),
      },
      records,
    });
  } catch (error) {
    const status = /token/i.test(error.message) ? 401 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.delete("/attendance/session/:sessionId", async (req, res) => {
  try {
    const { decodedToken } = await verifyTeacherFromRequest(req);
    const sessionId = String(req.params.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const firestore = admin.firestore();
    const sessionRef = firestore
      .collection("attendance_sessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    const sessionData = sessionDoc.data() || {};
    if (String(sessionData.teacherId || "") !== decodedToken.uid) {
      return res
        .status(403)
        .json({ message: "Only session owner can delete this session." });
    }

    if (String(sessionData.status || "").toLowerCase() !== "ended") {
      return res.status(400).json({
        message: "Only ended attendance sessions can be deleted from history.",
      });
    }

    const recordsSnapshot = await firestore
      .collection("attendance_records")
      .where("sessionId", "==", sessionId)
      .get();

    const attendanceRecords = recordsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const presentStudentIds = new Set(
      (Array.isArray(sessionData.presentStudentIds)
        ? sessionData.presentStudentIds
        : attendanceRecords.map((record) => record.studentId)
      )
        .map((studentId) => String(studentId || "").trim())
        .filter(Boolean),
    );

    const enrolledStudentIds = Array.from(
      new Set(
        [
          ...(Array.isArray(sessionData.enrolledStudentIds)
            ? sessionData.enrolledStudentIds
            : []),
          ...(Array.isArray(sessionData.presentStudentIds)
            ? sessionData.presentStudentIds
            : []),
          ...(Array.isArray(sessionData.absentStudentIds)
            ? sessionData.absentStudentIds
            : []),
          ...(Array.isArray(sessionData.presentStudents)
            ? sessionData.presentStudents.map((student) => student.studentId)
            : []),
          ...(Array.isArray(sessionData.absentStudents)
            ? sessionData.absentStudents.map((student) => student.studentId)
            : []),
          ...attendanceRecords.map((record) => record.studentId),
        ]
          .map((studentId) => String(studentId || "").trim())
          .filter(Boolean),
      ),
    );

    if (sessionData.subjectId) {
      for (const studentId of enrolledStudentIds) {
        const attendanceRef = firestore
          .collection("student_attendance")
          .doc(`${studentId}_${sessionData.subjectId}`);

        await firestore.runTransaction(async (transaction) => {
          const attendanceDoc = await transaction.get(attendanceRef);
          if (!attendanceDoc.exists) {
            return;
          }

          const attendanceData = attendanceDoc.data() || {};
          const currentTotal = Number(attendanceData.totalClasses || 0);
          const currentAttended = Number(attendanceData.attendedClasses || 0);
          const nextTotal = Math.max(currentTotal - 1, 0);
          const nextAttended = Math.max(
            currentAttended - (presentStudentIds.has(studentId) ? 1 : 0),
            0,
          );

          transaction.set(
            attendanceRef,
            {
              totalClasses: nextTotal,
              attendedClasses: nextAttended,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        });
      }

      const statsDocId = `${sessionData.subjectId}_${sessionData.teacherId}`;
      const statsRef = firestore
        .collection("subject_attendance_stats")
        .doc(statsDocId);
      const enrolledCount = Number(
        sessionData.enrolledStudentsCount || enrolledStudentIds.length || 0,
      );
      const presentCount = Number(sessionData.presentCount || 0);
      const rateDelta = enrolledCount
        ? Number(((presentCount / enrolledCount) * 100).toFixed(2))
        : 0;

      await firestore.runTransaction(async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        if (!statsDoc.exists) {
          return;
        }

        const statsData = statsDoc.data() || {};
        const nextTotalClasses = Math.max(
          Number(statsData.totalClasses || 0) - 1,
          0,
        );
        const nextCumulativeRate = Math.max(
          Number(statsData.cumulativeAttendanceRate || 0) - rateDelta,
          0,
        );

        transaction.set(
          statsRef,
          {
            totalClasses: nextTotalClasses,
            cumulativeAttendanceRate: Number(nextCumulativeRate.toFixed(2)),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
    }

    const recordRefs = recordsSnapshot.docs.map((docSnap) => docSnap.ref);
    const batchSize = 400;

    for (let index = 0; index < recordRefs.length; index += batchSize) {
      const batch = firestore.batch();
      recordRefs.slice(index, index + batchSize).forEach((recordRef) => {
        batch.delete(recordRef);
      });
      await batch.commit();
    }

    await sessionRef.delete();
    attendanceSessionJoinedStudents.delete(sessionId);

    return res.status(200).json({
      success: true,
      message: "Attendance session deleted successfully.",
      deletedSessionId: sessionId,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/teacher/sessions/history", async (req, res) => {
  try {
    const { decodedToken } = await verifyTeacherFromRequest(req);
    const limitRaw = Number(req.query.limit);
    const historyLimit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
      : 30;

    const firestore = admin.firestore();
    const sessionsSnapshot = await firestore
      .collection("attendance_sessions")
      .where("teacherId", "==", decodedToken.uid)
      .where("status", "==", "ended")
      .get();

    const sessions = sessionsSnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort(
        (a, b) =>
          Number(b.endTimeMs || b.startTimeMs || 0) -
          Number(a.endTimeMs || a.startTimeMs || 0),
      )
      .slice(0, historyLimit);

    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const sessionId = String(session.sessionId || session.id || "").trim();
        const recordsSnapshot = await firestore
          .collection("attendance_records")
          .where("sessionId", "==", sessionId)
          .get();

        const records = recordsSnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

        const presentStudentIds = new Set(
          records
            .map((record) => String(record.studentId || "").trim())
            .filter(Boolean),
        );
        const enrolledStudentIds = Array.isArray(session.enrolledStudentIds)
          ? session.enrolledStudentIds
              .map((id) => String(id || "").trim())
              .filter(Boolean)
          : [];
        const absentStudentIds = enrolledStudentIds.filter(
          (id) => !presentStudentIds.has(id),
        );

        const presentStudents = Array.isArray(session.presentStudents)
          ? session.presentStudents
          : records.map((record) => ({
              studentId: String(record.studentId || "").trim(),
              studentName: record.studentName || "Student",
              prn: record.prn || "",
            }));

        const absentStudents = Array.isArray(session.absentStudents)
          ? session.absentStudents
          : absentStudentIds.map((studentId) => ({
              studentId,
              studentName: "",
              prn: "",
            }));

        return {
          ...session,
          sessionId,
          records,
          presentCount: Number(session.presentCount || records.length || 0),
          enrolledStudentsCount: Number(
            session.enrolledStudentsCount || enrolledStudentIds.length || 0,
          ),
          absentCount: absentStudentIds.length,
          absentStudentIds,
          presentStudents,
          absentStudents,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      sessions: sessionsWithDetails,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/teacher/subject/:subjectId/students", async (req, res) => {
  try {
    const { teacherDoc } = await verifyTeacherFromRequest(req);
    const subjectId = String(req.params.subjectId || "").trim();
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    const teacherData = teacherDoc.exists ? teacherDoc.data() || {} : {};
    const assignments = Array.isArray(teacherData.assignments)
      ? teacherData.assignments
      : [];

    const relevantAssignments = assignments
      .map((assignment) => {
        const subjects = normalizeSubjectValues(assignment.subjects);
        const matchedSubjects = subjects.filter(
          (subject) => makeSubjectId(subject) === subjectId,
        );

        if (matchedSubjects.length === 0) {
          return null;
        }

        return {
          branch: normalizeBranch(
            assignment.branch || assignment.dept || assignment.department || "",
          ),
          year: normalizeYear(assignment.year || ""),
          semester: normalizeSemester(assignment.semester || ""),
          matchedSubjects,
        };
      })
      .filter(Boolean)
      .filter((assignment) => assignment.branch && assignment.year);

    if (relevantAssignments.length === 0) {
      return res.status(403).json({
        message: "Teacher is not assigned to this subject.",
      });
    }

    const firestore = admin.firestore();
    const rosterMap = new Map();

    for (const assignment of relevantAssignments) {
      for (const subjectName of assignment.matchedSubjects) {
        const candidates = await getSessionEnrolledStudents(firestore, {
          branch: assignment.branch,
          year: assignment.year,
          semester: assignment.semester,
          subjectId,
          subjectName,
        });

        candidates.forEach((student) => {
          const studentId = String(student.uid || "").trim();
          if (!studentId || rosterMap.has(studentId)) {
            return;
          }

          rosterMap.set(studentId, {
            studentId,
            studentName: student.name || student.displayName || "Student",
            prn: getPrnFromRecord(student),
            branch:
              student.dept || student.department || assignment.branch || "",
            year: student.year || assignment.year || "",
            semester: student.semester || assignment.semester || "",
          });
        });
      }
    }

    const { attendanceByStudentId } = await buildSubjectAttendanceIndex(
      firestore,
      subjectId,
    );

    const students = Array.from(rosterMap.values())
      .map((student) => {
        const attendance = attendanceByStudentId.get(student.studentId) || {
          totalClasses: 0,
          attendedClasses: 0,
        };
        const attendancePercentage = attendance.totalClasses
          ? Number(
              (
                (attendance.attendedClasses / attendance.totalClasses) *
                100
              ).toFixed(2),
            )
          : 0;

        return {
          ...student,
          totalClasses: attendance.totalClasses,
          attendedClasses: attendance.attendedClasses,
          attendancePercentage,
        };
      })
      .sort((a, b) =>
        String(a.studentName || "").localeCompare(String(b.studentName || "")),
      );

    return res.status(200).json({
      success: true,
      subject: {
        subjectId,
        subjectName:
          relevantAssignments[0]?.matchedSubjects?.[0] ||
          req.query.subjectName ||
          subjectId,
      },
      totalStudents: students.length,
      students,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/student/:studentId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }

    if (
      !decodedToken.admin &&
      !decodedToken.teacher &&
      decodedToken.uid !== studentId
    ) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const firestore = admin.firestore();
    const studentProfile = await getStudentProfileByUid(firestore, studentId);
    const subjectNameById = new Map();

    normalizeSubjectValues(studentProfile?.subjects).forEach((subjectName) => {
      const id = makeSubjectId(subjectName);
      if (!id || subjectNameById.has(id)) {
        return;
      }
      subjectNameById.set(id, subjectName);
    });

    const existingSnapshot = await firestore
      .collection("student_attendance")
      .where("studentId", "==", studentId)
      .get();

    existingSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const subjectId = String(data.subjectId || "").trim();
      if (!subjectId) {
        return;
      }

      if (!subjectNameById.has(subjectId)) {
        const subjectName = String(data.subjectName || "").trim();
        subjectNameById.set(subjectId, subjectName || subjectId);
      }
    });

    const records = [];
    for (const [subjectId, subjectName] of subjectNameById.entries()) {
      const { attendanceByStudentId } = await buildSubjectAttendanceIndex(
        firestore,
        subjectId,
      );
      const attendance = attendanceByStudentId.get(studentId) || {
        totalClasses: 0,
        attendedClasses: 0,
      };
      const totalClasses = Number(attendance.totalClasses || 0);
      const attendedClasses = Number(attendance.attendedClasses || 0);
      const percentage = totalClasses
        ? Number(((attendedClasses / totalClasses) * 100).toFixed(2))
        : 0;

      records.push({
        id: `${studentId}_${subjectId}`,
        studentId,
        subjectId,
        subjectName: subjectName || subjectId,
        totalClasses,
        attendedClasses,
        percentage,
      });
    }

    return res.status(200).json({ success: true, attendance: records });
  } catch (error) {
    const status = /token/i.test(error.message) ? 401 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/attendance/analytics/:subjectId", async (req, res) => {
  try {
    const { decodedToken, teacherDoc } = await verifyTeacherFromRequest(req);
    const subjectId = String(req.params.subjectId || "").trim();
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    const teacherData = teacherDoc.exists ? teacherDoc.data() || {} : {};
    const assignments = Array.isArray(teacherData.assignments)
      ? teacherData.assignments
      : [];
    const isAssigned = assignments.some((assignment) =>
      normalizeSubjectValues(assignment.subjects).some(
        (subject) => makeSubjectId(subject) === subjectId,
      ),
    );

    if (!isAssigned) {
      return res.status(403).json({
        message: "Teacher is not assigned to this subject.",
      });
    }

    const firestore = admin.firestore();
    const sessionsSnapshot = await firestore
      .collection("attendance_sessions")
      .where("teacherId", "==", decodedToken.uid)
      .where("subjectId", "==", subjectId)
      .where("status", "==", "ended")
      .get();

    const sessions = sessionsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    sessions.sort((a, b) => toMillis(a.startTime) - toMillis(b.startTime));

    const weeklyCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyTrend = [];
    let totalRate = 0;

    for (const session of sessions) {
      let presentCount = Number(session.presentCount || 0);
      let enrolledCount = Number(session.enrolledStudentsCount || 0);

      if (!Number.isFinite(presentCount)) {
        presentCount = 0;
      }
      if (!Number.isFinite(enrolledCount)) {
        enrolledCount = 0;
      }

      if (!enrolledCount) {
        if (Array.isArray(session.enrolledStudentIds)) {
          enrolledCount = session.enrolledStudentIds.length;
        } else {
          const enrolledStudents = await getSessionEnrolledStudents(
            firestore,
            session,
          );
          enrolledCount = enrolledStudents.length;
        }
      }

      if (!presentCount && (session.sessionId || session.id)) {
        const sessionRecords = await firestore
          .collection("attendance_records")
          .where("sessionId", "==", session.sessionId || session.id)
          .get();
        presentCount = sessionRecords.size;
      }

      const attendanceRate = enrolledCount
        ? Number(((presentCount / enrolledCount) * 100).toFixed(2))
        : 0;

      totalRate += attendanceRate;

      const sessionStartMs =
        Number(session.startTimeMs) || toMillis(session.startTime);
      if (sessionStartMs >= weeklyCutoff) {
        weeklyTrend.push({
          date:
            session.date || new Date(sessionStartMs).toISOString().slice(0, 10),
          attendanceRate,
          presentStudents: presentCount,
          totalStudents: enrolledCount,
        });
      }
    }

    const studentAttendanceSnapshot = await firestore
      .collection("student_attendance")
      .where("subjectId", "==", subjectId)
      .get();

    const atRiskBase = studentAttendanceSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const totalClasses = Number(data.totalClasses || 0);
        const attendedClasses = Number(data.attendedClasses || 0);
        const percentage = totalClasses
          ? Number(((attendedClasses / totalClasses) * 100).toFixed(2))
          : 0;

        return { id: docSnap.id, ...data, percentage };
      })
      .filter((entry) => Number(entry.percentage || 0) < 75)
      .sort((a, b) => Number(a.percentage || 0) - Number(b.percentage || 0));

    const atRiskStudents = await Promise.all(
      atRiskBase.map(async (entry) => {
        const studentId = String(entry.studentId || "").trim();
        if (!studentId) {
          return {
            ...entry,
            studentName: entry.studentName || "",
            prn: entry.prn || "",
          };
        }

        const profile = await getStudentProfileByUid(firestore, studentId);
        return {
          ...entry,
          studentName:
            entry.studentName || profile?.name || profile?.displayName || "",
          prn: entry.prn || getPrnFromRecord(profile || {}) || "",
        };
      }),
    );

    const classAttendanceRate = sessions.length
      ? Number((totalRate / sessions.length).toFixed(2))
      : 0;

    const statsDocId = `${subjectId}_${decodedToken.uid}`;
    const statsDoc = await firestore
      .collection("subject_attendance_stats")
      .doc(statsDocId)
      .get();
    const summaryData = statsDoc.exists ? statsDoc.data() || {} : {};
    const summaryTotalClasses = Number(
      summaryData.totalClasses || sessions.length || 0,
    );
    const summaryCumulativeRate = Number(summaryData.cumulativeAttendanceRate);
    const summaryAverageFromCumulative =
      Number.isFinite(summaryCumulativeRate) && summaryTotalClasses > 0
        ? Number((summaryCumulativeRate / summaryTotalClasses).toFixed(2))
        : null;

    const subjectSummary = {
      subjectId,
      ...summaryData,
      totalClasses: summaryTotalClasses,
      averageAttendance:
        summaryAverageFromCumulative ??
        Number(summaryData.averageAttendance || classAttendanceRate || 0),
      lastUpdated: summaryData.lastUpdated || null,
    };

    return res.status(200).json({
      success: true,
      analytics: {
        subjectId,
        totalSessions: sessions.length,
        classAttendanceRate,
        studentsAtRisk: atRiskStudents,
        weeklyTrend,
        summary: subjectSummary,
      },
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.post("/timetable/add-lecture", async (req, res) => {
  try {
    const { decodedToken, teacherDoc } = await verifyTeacherFromRequest(req);

    const teacherData = teacherDoc.exists ? teacherDoc.data() || {} : {};
    const teacherId = decodedToken.uid;

    const branch = normalizeBranch(req.body.branch || "");
    const year = normalizeYear(req.body.year || "");
    const semester = normalizeSemester(req.body.semester || "");
    const day = String(req.body.day || "").trim();
    const startTime = String(req.body.startTime || "").trim();
    const endTime = String(req.body.endTime || "").trim();
    const subjectName = String(
      req.body.subjectName || req.body.subject || "",
    ).trim();

    if (
      !branch ||
      !year ||
      !semester ||
      !day ||
      !startTime ||
      !endTime ||
      !subjectName
    ) {
      return res.status(400).json({
        message:
          "Branch, year, semester, day, startTime, endTime and subjectName are required.",
      });
    }

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        message:
          "Day must be one of Monday, Tuesday, Wednesday, Thursday or Friday.",
      });
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      return res
        .status(400)
        .json({ message: "Invalid startTime/endTime format." });
    }
    if (startMinutes >= endMinutes) {
      return res
        .status(400)
        .json({ message: "endTime must be after startTime." });
    }

    const subjectSetsMap = await getSubjectSetsMap();
    const semesterSubjects = subjectSetsMap?.[branch]?.[year]?.[semester] || [];
    if (!semesterSubjects.includes(subjectName)) {
      return res.status(400).json({
        message:
          "Selected subject is not part of the configured subject set for branch/year/semester.",
      });
    }

    const teacherAssignments = Array.isArray(teacherData.assignments)
      ? teacherData.assignments
      : [];
    const assignment = teacherAssignments.find(
      (item) =>
        normalizeBranch(item?.branch || item?.dept || "") === branch &&
        normalizeYear(item?.year || "") === year,
    );

    if (!assignment || !Array.isArray(assignment.subjects)) {
      return res.status(403).json({
        message: "Teacher is not assigned to the selected branch/year.",
      });
    }

    if (!assignment.subjects.includes(subjectName)) {
      return res.status(403).json({
        message: "Teacher is not authorized for the selected subject.",
      });
    }

    const firestore = admin.firestore();

    const classSnapshot = await firestore
      .collection("timetables")
      .where("branch", "==", branch)
      .where("year", "==", year)
      .where("semester", "==", semester)
      .where("day", "==", day)
      .get();

    for (const docSnap of classSnapshot.docs) {
      const existing = docSnap.data() || {};
      const existingStart = parseTimeToMinutes(existing.startTime || "");
      const existingEnd = parseTimeToMinutes(existing.endTime || "");

      if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) {
        continue;
      }

      if (
        isTimeRangeOverlapping(
          startMinutes,
          endMinutes,
          existingStart,
          existingEnd,
        )
      ) {
        return res.status(409).json({
          message:
            "Lecture overlap detected. This branch/year/semester slot is already occupied.",
          conflictLecture: {
            lectureId: existing.lectureId || docSnap.id,
            subjectName: existing.subjectName || existing.subject || "",
            teacherName: existing.teacherName || "",
            day: existing.day || day,
            startTime: existing.startTime || "",
            endTime: existing.endTime || "",
          },
        });
      }
    }

    const teacherDaySnapshot = await firestore
      .collection("timetables")
      .where("teacherId", "==", teacherId)
      .where("day", "==", day)
      .get();

    for (const docSnap of teacherDaySnapshot.docs) {
      const existing = docSnap.data() || {};
      const existingStart = parseTimeToMinutes(existing.startTime || "");
      const existingEnd = parseTimeToMinutes(existing.endTime || "");

      if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) {
        continue;
      }

      if (
        isTimeRangeOverlapping(
          startMinutes,
          endMinutes,
          existingStart,
          existingEnd,
        )
      ) {
        return res.status(409).json({
          message: "Teacher has another lecture overlapping this slot.",
          conflictLecture: {
            lectureId: existing.lectureId || docSnap.id,
            branch: existing.branch || "",
            year: existing.year || "",
            semester: existing.semester || "",
            day: existing.day || day,
            startTime: existing.startTime || "",
            endTime: existing.endTime || "",
          },
        });
      }
    }

    const lectureRef = firestore.collection("timetables").doc();
    const lectureId = lectureRef.id;
    const teacherName =
      teacherData.fullName ||
      teacherData.name ||
      decodedToken.name ||
      "Teacher";

    const payload = {
      lectureId,
      subjectId: makeSubjectId(subjectName),
      subjectName,
      teacherId,
      teacherName,
      branch,
      year,
      semester,
      day,
      startTime,
      endTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await lectureRef.set(payload);

    return res.status(201).json({
      success: true,
      message: "Lecture added successfully.",
      lecture: payload,
    });
  } catch (error) {
    const status = /authorized|token/i.test(error.message) ? 403 : 500;
    return res.status(status).json({ message: error.message });
  }
});

app.get("/timetable/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = String(req.params.teacherId || "").trim();
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required." });
    }

    const dayFilter = String(req.query.day || "").trim();
    const firestore = admin.firestore();

    let queryRef = firestore
      .collection("timetables")
      .where("teacherId", "==", teacherId);

    if (dayFilter) {
      queryRef = queryRef.where("day", "==", dayFilter);
    }

    const snapshot = await queryRef.get();
    const lectures = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => {
        const dayOrder = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const dayDiff =
          dayOrder.indexOf(a.day || "") - dayOrder.indexOf(b.day || "");
        if (dayDiff !== 0) return dayDiff;
        return String(a.startTime || "").localeCompare(
          String(b.startTime || ""),
        );
      });

    return res.status(200).json({ success: true, lectures });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/timetable/:branch/:year/:semester", async (req, res) => {
  try {
    const branch = normalizeBranch(req.params.branch || "");
    const year = normalizeYear(req.params.year || "");
    const semester = normalizeSemester(req.params.semester || "");

    if (!branch || !year || !semester) {
      return res.status(400).json({
        message: "Valid branch, year and semester are required.",
      });
    }

    const firestore = admin.firestore();
    const snapshot = await firestore
      .collection("timetables")
      .where("branch", "==", branch)
      .where("year", "==", year)
      .where("semester", "==", semester)
      .get();

    const lectures = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a, b) => {
        const dayOrder = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const dayDiff =
          dayOrder.indexOf(a.day || "") - dayOrder.indexOf(b.day || "");
        if (dayDiff !== 0) return dayDiff;
        return String(a.startTime || "").localeCompare(
          String(b.startTime || ""),
        );
      });

    return res.status(200).json({ success: true, lectures });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
  const { department, year, semester } = req.query;

  if (!department || !year) {
    return res
      .status(400)
      .json({ message: "Department and year are required." });
  }

  try {
    const subjectSetsMap = await getSubjectSetsMap();
    const normalizedSemester = normalizeSemester(semester || "");
    const subjectsForYear = subjectSetsMap[department]?.[year] || {};
    const subjects = normalizedSemester
      ? subjectsForYear?.[normalizedSemester] || []
      : [...(subjectsForYear?.["1"] || []), ...(subjectsForYear?.["2"] || [])];
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

    const { branch, year, semester, subjects } = req.body;
    const normalizedBranch = normalizeBranch(branch);
    const normalizedYear = normalizeYear(year);
    const normalizedSemester = normalizeSemester(semester);
    const cleanedSubjects = Array.isArray(subjects)
      ? subjects.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (
      !normalizedBranch ||
      !normalizedYear ||
      !normalizedSemester ||
      cleanedSubjects.length === 0
    ) {
      return res.status(400).json({
        message: "Branch, year, semester and at least one subject are required",
      });
    }

    const docId = makeSubjectSetDocId(
      normalizedBranch,
      normalizedYear,
      normalizedSemester,
    );
    await admin.firestore().collection("subjectSets").doc(docId).set(
      {
        branch: normalizedBranch,
        year: normalizedYear,
        semester: normalizedSemester,
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

app.post(
  "/api/admin/parse-academic-calendar",
  upload.single("file"),
  async (req, res) => {
    try {
      await verifyAdminFromRequest(req);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const extractedText = await extractTextFromUploadedFile(req.file);
      const isCsv = isCsvFile(req.file);
      const geminiApiKey = getGeminiApiKeyFromRequest(req);

      let entries = [];
      let holidayEntries = [];
      let structuredBy = "legacy";

      if (!isCsv && geminiApiKey) {
        try {
          const geminiStructured = await parseAcademicCalendarWithGemini({
            file: req.file,
            extractedText,
            apiKey: geminiApiKey,
          });

          entries = geminiStructured.entries;
          holidayEntries = geminiStructured.holidayEntries;
          structuredBy = "gemini";
        } catch (geminiError) {
          console.error(
            "Gemini academic calendar parsing failed:",
            geminiError,
          );
        }
      }

      if (entries.length === 0) {
        entries = isCsv
          ? parseAcademicCalendarFromCsv(extractedText)
          : parseAcademicCalendarFromText(extractedText);
      }

      if (holidayEntries.length === 0) {
        holidayEntries = isCsv
          ? parseAcademicHolidaysFromCsv(extractedText)
          : parseAcademicHolidaysFromText(extractedText);
      }

      return res.status(200).json({
        success: true,
        extractedText,
        entries,
        holidayEntries,
        structuredBy,
      });
    } catch (error) {
      const status = /authorized|token/i.test(error.message) ? 403 : 500;
      return res.status(status).json({ message: error.message });
    }
  },
);

app.post(
  "/api/admin/upload-academic-calendar-pdf",
  upload.single("file"),
  async (req, res) => {
    try {
      const decodedToken = await verifyAdminFromRequest(req);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ message: "Only PDF files are supported" });
      }

      const academicYear =
        String(req.body.academicYear || "")
          .trim()
          .replace(/\s+/g, " ") || "General";

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect/academic-calendar-pdfs",
            resource_type: "auto",
            public_id: `academic-calendar-${academicYear.replace(/\s+/g, "-")}-${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      const firestore = admin.firestore();
      const existingSnapshot = await firestore
        .collection("academic_calendar_files")
        .where("academicYear", "==", academicYear)
        .where("active", "==", true)
        .get();

      if (!existingSnapshot.empty) {
        const deactivateBatch = firestore.batch();
        existingSnapshot.docs.forEach((docSnap) => {
          deactivateBatch.set(
            docSnap.ref,
            {
              active: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        });
        await deactivateBatch.commit();
      }

      const fileRef = firestore.collection("academic_calendar_files").doc();
      const payload = {
        id: fileRef.id,
        academicYear,
        fileName: req.file.originalname || "academic-calendar.pdf",
        fileURL: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        mimeType: req.file.mimetype,
        sizeBytes: Number(req.file.size || 0),
        active: true,
        uploadedBy: decodedToken.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await fileRef.set(payload);

      return res.status(201).json({
        success: true,
        message: "Academic calendar PDF uploaded successfully",
        file: {
          ...payload,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    } catch (error) {
      const status = /authorized|token/i.test(error.message) ? 403 : 500;
      return res.status(status).json({ message: error.message });
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
      const semester = normalizeSemester(rawEntry.semester || "");
      const contactEmail = String(rawEntry.email || "")
        .trim()
        .toLowerCase();

      const rowErrors = [];
      if (!name) rowErrors.push("Missing name");
      if (!prn) rowErrors.push("Missing PRN");
      if (!phone) rowErrors.push("Missing/invalid mobile number");
      if (!branch) rowErrors.push("Missing/invalid branch");
      if (!year) rowErrors.push("Missing/invalid year");
      if (!semester) rowErrors.push("Missing/invalid semester");
      if (prn && inBatchPrns.has(prn))
        rowErrors.push("Duplicate PRN in upload");

      const subjects = subjectSets?.[branch]?.[year]?.[semester] || [];
      if (subjects.length === 0) {
        rowErrors.push("No subject set configured for branch/year/semester");
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
          semester,
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
          semester,
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
              semester,
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
            semester,
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

app.post("/api/admin/bulk-update-student-academics", async (req, res) => {
  try {
    await verifyAdminFromRequest(req);

    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No update rows provided" });
    }

    const firestore = admin.firestore();
    const subjectSets = await getSubjectSetsMap();
    const existingByPrn = await buildExistingStudentIndex(firestore);

    const updatedEntries = [];
    const notFoundEntries = [];
    const failedEntries = [];

    for (const rawUpdate of updates) {
      const prn = String(rawUpdate.prn || "")
        .trim()
        .toUpperCase();
      const inputYear = normalizeYear(rawUpdate.year || "");
      const inputSemester = normalizeSemester(rawUpdate.semester || "");

      if (!prn) {
        failedEntries.push({
          prn: "",
          reason: "Missing PRN",
        });
        continue;
      }

      if (!existingByPrn.has(prn)) {
        notFoundEntries.push({ prn, reason: "Student not found" });
        continue;
      }

      try {
        const existing = existingByPrn.get(prn);
        const targetUid =
          existing.uid || existing.userDocId || existing.studentDocId || "";

        let currentUserData = {};
        let currentStudentData = {};

        if (existing.userDocId || targetUid) {
          const userDoc = await firestore
            .collection("users")
            .doc(existing.userDocId || targetUid)
            .get();
          currentUserData = userDoc.exists ? userDoc.data() : {};
        }

        if (existing.studentDocId || targetUid) {
          const studentDoc = await firestore
            .collection("students")
            .doc(existing.studentDocId || targetUid)
            .get();
          currentStudentData = studentDoc.exists ? studentDoc.data() : {};
        }

        const mergedData = { ...currentStudentData, ...currentUserData };
        const branch = normalizeBranch(
          mergedData.dept || mergedData.department || rawUpdate.branch || "",
        );
        const year = inputYear || normalizeYear(mergedData.year || "");
        const semester =
          inputSemester || normalizeSemester(mergedData.semester || "");

        if (!branch || !year || !semester) {
          failedEntries.push({
            prn,
            reason: "Missing branch/year/semester to update",
          });
          continue;
        }

        const subjects = subjectSets?.[branch]?.[year]?.[semester] || [];
        if (subjects.length === 0) {
          failedEntries.push({
            prn,
            reason: "No subject set configured for branch/year/semester",
          });
          continue;
        }

        const academicUpdatePayload = {
          year,
          semester,
          dept: branch,
          department: branch,
          subjects,
          updatedAt: new Date().toISOString(),
          onboardingSource: "bulk_academic_update",
        };

        if (existing.userDocId || targetUid) {
          await firestore
            .collection("users")
            .doc(existing.userDocId || targetUid)
            .set(academicUpdatePayload, { merge: true });
        }

        if (existing.studentDocId || targetUid) {
          await firestore
            .collection("students")
            .doc(existing.studentDocId || targetUid)
            .set(academicUpdatePayload, { merge: true });
        }

        updatedEntries.push({
          prn,
          year,
          semester,
          branch,
          subjectCount: subjects.length,
        });
      } catch (rowError) {
        failedEntries.push({
          prn,
          reason: rowError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalRows: updates.length,
        updatedCount: updatedEntries.length,
        notFoundCount: notFoundEntries.length,
        failedCount: failedEntries.length,
        updatedEntries,
        notFoundEntries,
        failedEntries,
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

app.post(
  "/api/upload-chat-attachment",
  upload.single("file"),
  async (req, res) => {
    try {
      const authHeader = String(req.headers.authorization || "").trim();
      if (!authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "No authorization token provided" });
      }

      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const decodedToken = await admin.auth().verifyIdToken(token);

      if (!decodedToken?.uid) {
        return res.status(401).json({ message: "Invalid authorization token" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const safeOriginalName = String(req.file.originalname || "attachment")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
      const baseName = safeOriginalName.replace(/\.[^.]+$/, "") || "attachment";

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect/chats",
            resource_type: "auto",
            public_id: `${decodedToken.uid}_${Date.now()}_${baseName}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(req.file.buffer);
      });

      const explicitType = String(req.body?.attachmentType || "")
        .trim()
        .toLowerCase();
      const normalizedMimeType = String(req.file.mimetype || "").toLowerCase();

      let attachmentType = "document";
      if (
        ["voice", "audio", "video", "image", "document"].includes(explicitType)
      ) {
        attachmentType = explicitType;
      } else if (normalizedMimeType.startsWith("image/")) {
        attachmentType = "image";
      } else if (normalizedMimeType.startsWith("video/")) {
        attachmentType = "video";
      } else if (normalizedMimeType.startsWith("audio/")) {
        attachmentType = "audio";
      }

      const durationSec = Number(req.body?.durationSec || 0) || 0;

      return res.status(200).json({
        success: true,
        attachment: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          name: req.file.originalname || "attachment",
          mimeType: req.file.mimetype || "application/octet-stream",
          size: Number(req.file.size) || Number(uploadResult.bytes) || 0,
          type: attachmentType,
          format: uploadResult.format || "",
          resourceType: uploadResult.resource_type || "raw",
          durationSec,
        },
      });
    } catch (error) {
      console.error("Chat attachment upload error:", error);
      return res.status(500).json({
        message: "Failed to upload chat attachment",
        error: error.message,
      });
    }
  },
);

app.post("/api/upload-fixit-media", upload.single("file"), async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || "").trim();
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken?.uid) {
      return res.status(401).json({ message: "Invalid authorization token" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const normalizedMimeType = String(req.file.mimetype || "").toLowerCase();
    const explicitType = String(req.body?.attachmentType || "")
      .trim()
      .toLowerCase();

    let mediaType = "";
    if (explicitType === "image" || explicitType === "video") {
      mediaType = explicitType;
    } else if (normalizedMimeType.startsWith("image/")) {
      mediaType = "image";
    } else if (normalizedMimeType.startsWith("video/")) {
      mediaType = "video";
    }

    if (!mediaType) {
      return res
        .status(400)
        .json({ message: "Only image and video files are supported." });
    }

    const safeOriginalName = String(req.file.originalname || "fixit_media")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const baseName = safeOriginalName.replace(/\.[^.]+$/, "") || "fixit_media";

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "campus-connect/fixit",
          resource_type: "auto",
          public_id: `${decodedToken.uid}_${Date.now()}_${baseName}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      media: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        name: req.file.originalname || "media",
        mimeType: req.file.mimetype || "application/octet-stream",
        size: Number(req.file.size) || Number(uploadResult.bytes) || 0,
        type: mediaType,
        format: uploadResult.format || "",
        resourceType: uploadResult.resource_type || "raw",
      },
    });
  } catch (error) {
    console.error("FixIt media upload error:", error);
    return res.status(500).json({
      message: "Failed to upload FixIt media",
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

      const { year } = req.body;
      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      const isSupportedFile =
        req.file.mimetype === "application/pdf" ||
        req.file.mimetype.startsWith("image/");
      if (!isSupportedFile) {
        return res
          .status(400)
          .json({ message: "Only PDF and image files are supported" });
      }

      const extractedText = await extractTextFromUploadedFile(req.file);
      const geminiApiKey = getGeminiApiKeyFromRequest(req);

      let parsedExams = [];
      let structuredBy = "legacy";

      if (geminiApiKey) {
        try {
          parsedExams = await parseExamTimetableWithGemini({
            file: req.file,
            extractedText,
            apiKey: geminiApiKey,
            selectedYear: year,
          });

          if (parsedExams.length > 0) {
            structuredBy = "gemini";
          }
        } catch (geminiError) {
          console.warn(
            `Gemini exam timetable parsing failed, using text fallback parser: ${geminiError.message}`,
          );
        }
      }

      if (parsedExams.length === 0) {
        parsedExams = parseExamTimetableFromText(extractedText, year);
      }

      // Upload the original file to Cloudinary for reference
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect/exam-timetables",
            resource_type: "auto",
            public_id: `exam-timetable-${String(year || "year").replace(/\s+/g, "-")}-${Date.now()}`,
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
        parsedExams,
        structuredBy,
        fileURL: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: req.file.originalname,
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

    const { exams, year, replaceExisting = false } = req.body;

    if (!exams || !Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({ message: "No exam data provided" });
    }

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const firestore = admin.firestore();

    if (replaceExisting) {
      const sameYearSnapshot = await firestore
        .collection("examTimetable")
        .where("year", "==", year)
        .get();

      if (!sameYearSnapshot.empty) {
        const deactivateBatch = firestore.batch();
        sameYearSnapshot.docs.forEach((docSnap) => {
          deactivateBatch.set(
            docSnap.ref,
            {
              isActive: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        });
        await deactivateBatch.commit();
      }
    }

    // Fetch existing exams to check for duplicates
    const existingSnapshot = await firestore.collection("examTimetable").get();
    const existingExams = existingSnapshot.docs
      .map((docSnap) => docSnap.data() || {})
      .filter((entry) => entry.isActive !== false);

    // Create a Set of existing exam keys for fast lookup
    const existingKeys = new Set(
      existingExams.map(
        (e) =>
          `${String(e.date || "").trim()}|${String(e.courseCode || "")
            .trim()
            .toUpperCase()}|${String(e.year || "").trim()}|${String(e.branch || "").trim()}`,
      ),
    );

    // Filter out duplicates
    const newExams = exams.filter((exam) => {
      const examYear = exam.year || year;
      const examBranch = exam.branch || "";
      const key = `${String(exam.date || "").trim()}|${String(
        exam.courseCode || "",
      )
        .trim()
        .toUpperCase()}|${String(examYear || "").trim()}|${String(examBranch || "").trim()}`;
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
        branch: exam.branch || "",
        isActive: true,
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
      if (data.isActive === false) {
        return;
      }
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

// Upload and persist official year-wise exam timetable PDF
app.post(
  "/api/upload-exam-timetable-pdf",
  upload.single("file"),
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ message: "No authorization token provided" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      const adminDoc = await admin
        .firestore()
        .collection("admins")
        .doc(decodedToken.uid)
        .get();
      if (!adminDoc.exists) {
        return res
          .status(403)
          .json({ message: "Only admins can upload exam timetable PDFs" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ message: "Only PDF files are supported" });
      }

      const { year } = req.body;
      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "campus-connect/exam-timetable-pdfs",
            resource_type: "auto",
            public_id: `exam-timetable-pdf-${String(year || "year").replace(/\s+/g, "-")}-${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      const firestore = admin.firestore();
      const existingSnapshot = await firestore
        .collection("exam_timetable_files")
        .where("year", "==", year)
        .where("active", "==", true)
        .get();

      if (!existingSnapshot.empty) {
        const deactivateBatch = firestore.batch();
        existingSnapshot.docs.forEach((docSnap) => {
          deactivateBatch.set(
            docSnap.ref,
            {
              active: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        });
        await deactivateBatch.commit();
      }

      const fileRef = firestore.collection("exam_timetable_files").doc();
      const payload = {
        id: fileRef.id,
        year,
        fileName: req.file.originalname || "exam-timetable.pdf",
        fileURL: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        mimeType: req.file.mimetype,
        sizeBytes: Number(req.file.size || 0),
        active: true,
        uploadedBy: decodedToken.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await fileRef.set(payload);

      return res.status(201).json({
        success: true,
        message: "Exam timetable PDF uploaded successfully",
        file: {
          ...payload,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    } catch (error) {
      console.error("Exam timetable PDF upload error:", error);
      return res.status(500).json({
        message: "Failed to upload exam timetable PDF",
        error: error.message,
      });
    }
  },
);

app.post("/api/notifications/exam-reminders/trigger", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const adminDoc = await admin
      .firestore()
      .collection("admins")
      .doc(decodedToken.uid)
      .get();
    if (!adminDoc.exists) {
      return res.status(403).json({
        message: "Only admins can trigger exam reminders",
      });
    }

    const requestedTargetDateISO = String(req.body?.targetDateISO || "").trim();
    const useNextExamDate = Boolean(req.body?.useNextExamDate);

    let targetDateISO = requestedTargetDateISO;
    if (!targetDateISO && useNextExamDate) {
      const nextDate = await findNextActiveExamDate(admin.firestore());
      if (nextDate) {
        targetDateISO = formatExamReminderLocalDateISO(nextDate);
      }
    }

    const result = await createTomorrowExamReminderAnnouncements({
      targetDateISO,
    });

    return res.status(200).json({
      success: true,
      message: "Exam reminder trigger completed",
      mode: targetDateISO ? "target-date" : "tomorrow",
      targetDateISO: targetDateISO || null,
      ...result,
    });
  } catch (error) {
    console.error("Exam reminder trigger failed:", error);
    return res.status(500).json({
      message: "Failed to trigger exam reminders",
      error: error.message,
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Uploaded file exceeds the 10MB limit",
      });
    }

    return res.status(400).json({
      message: error.message || "File upload failed",
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      message:
        "Request payload is too large. Reduce the batch size and try again.",
    });
  }

  if (error?.name === "SyntaxError" && error?.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }

  if (error) {
    console.error("Unhandled server error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }

  return next();
});

const PORT = process.env.PORT || 5000;

let examReminderJobRunning = false;
const runExamReminderJob = async () => {
  if (examReminderJobRunning) {
    return;
  }

  examReminderJobRunning = true;
  try {
    const result = await createTomorrowExamReminderAnnouncements();
    if ((result?.createdCount || 0) > 0) {
      console.log(
        `Exam reminder job: created ${result.createdCount} reminder announcement(s) for ${result.reminderDateISO || "tomorrow"}`,
      );
    }
  } catch (error) {
    console.error("Exam reminder job failed:", error.message);
  } finally {
    examReminderJobRunning = false;
  }
};

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  if (EXAM_REMINDER_ENABLED) {
    runExamReminderJob();
    setInterval(runExamReminderJob, EXAM_REMINDER_INTERVAL_MS);
    console.log(
      `Exam reminder scheduler enabled (interval ${Math.round(EXAM_REMINDER_INTERVAL_MS / 1000)}s)`,
    );
  } else {
    console.log("Exam reminder scheduler disabled by configuration.");
  }
});
