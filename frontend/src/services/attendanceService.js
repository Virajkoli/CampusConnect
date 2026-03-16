import { auth } from "../firebase";

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

const resolveApiBase = () => {
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

const API_BASE = resolveApiBase();

const fetchWithNetworkHint = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(
      `Unable to reach backend at ${API_BASE}. Ensure backend server is running and update VITE_API_URL if needed.`,
    );
  }
};

const authHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in.");
  }

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const parseResponse = async (response) => {
  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || "Request failed." };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}${response.statusText ? ` (${response.statusText})` : ""}.`,
    );
  }
  return data;
};

export const registerStudentDevice = async (deviceId) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/register-device`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ deviceId }),
    },
  );

  return parseResponse(response);
};

export const startAttendanceSession = async (payload) => {
  const response = await fetchWithNetworkHint(`${API_BASE}/attendance/start`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const getTeacherAttendanceLectures = async () => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/teacher/lectures`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getActiveAttendanceSessions = async () => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/sessions/active`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getActiveSessionBySubject = async (subjectId) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/session/${encodeURIComponent(subjectId)}`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const markAttendance = async (payload) => {
  const response = await fetchWithNetworkHint(`${API_BASE}/attendance/mark`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const markAttendanceByTeacher = async (payload) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/mark-by-teacher`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
};

export const endAttendanceSession = async (sessionId) => {
  const response = await fetchWithNetworkHint(`${API_BASE}/attendance/end`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ sessionId }),
  });

  return parseResponse(response);
};

export const getStudentAttendance = async (studentId) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/student/${encodeURIComponent(studentId)}`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getAttendanceAnalytics = async (subjectId) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/analytics/${encodeURIComponent(subjectId)}`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getAttendanceSessionRecords = async (sessionId) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/session/${encodeURIComponent(sessionId)}/records`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getTeacherAttendanceSessionHistory = async (limit = 30) => {
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/teacher/sessions/history?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const getTeacherSubjectAttendanceStudents = async (
  subjectId,
  subjectName = "",
) => {
  const query = subjectName
    ? `?subjectName=${encodeURIComponent(String(subjectName))}`
    : "";
  const response = await fetchWithNetworkHint(
    `${API_BASE}/attendance/teacher/subject/${encodeURIComponent(subjectId)}/students${query}`,
    {
      method: "GET",
      headers: await authHeaders(),
    },
  );

  return parseResponse(response);
};

export const ensureTrustedDevice = async () => {
  const key = "campusconnect_device_id";
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`;
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
};
