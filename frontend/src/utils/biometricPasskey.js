const PASSKEY_STORAGE_KEY = "campusconnect_one_time_biometric_passkey";
const PASSKEY_TTL_MS = 2 * 60 * 1000;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

export const createOneTimePasskey = (assertionId) => {
  const normalizedAssertionId = String(assertionId || "").trim();
  if (!normalizedAssertionId) {
    return null;
  }

  const now = Date.now();
  const payload = {
    assertionId: normalizedAssertionId,
    createdAt: now,
    expiresAt: now + PASSKEY_TTL_MS,
  };

  const storage = getStorage();
  if (storage) {
    storage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(payload));
  }

  return payload;
};

export const getOneTimePasskey = () => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(PASSKEY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const expiresAt = Number(parsed?.expiresAt || 0);
    const assertionId = String(parsed?.assertionId || "").trim();

    if (!assertionId || !expiresAt || Date.now() > expiresAt) {
      storage.removeItem(PASSKEY_STORAGE_KEY);
      return null;
    }

    return {
      assertionId,
      createdAt: Number(parsed?.createdAt || 0),
      expiresAt,
    };
  } catch {
    storage.removeItem(PASSKEY_STORAGE_KEY);
    return null;
  }
};

export const clearOneTimePasskey = () => {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(PASSKEY_STORAGE_KEY);
  }
};

export const consumeOneTimePasskey = (assertionId = "") => {
  const current = getOneTimePasskey();
  if (!current) {
    return false;
  }

  const normalizedAssertionId = String(assertionId || "").trim();
  if (normalizedAssertionId && current.assertionId !== normalizedAssertionId) {
    return false;
  }

  clearOneTimePasskey();
  return true;
};
