const PASSKEY_STORAGE_KEY = "campusconnect_one_time_biometric_passkey";

const normalizeUid = (value = "") => String(value || "").trim();

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
};

export const createOneTimePasskey = (assertionId, ownerUid = "") => {
  const normalizedAssertionId = String(assertionId || "").trim();
  if (!normalizedAssertionId) {
    return null;
  }

  const now = Date.now();
  const payload = {
    assertionId: normalizedAssertionId,
    createdAt: now,
    ownerUid: normalizeUid(ownerUid),
  };

  const storage = getStorage();
  if (storage) {
    storage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(payload));
  }

  return payload;
};

export const getOneTimePasskey = (ownerUid = "") => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const normalizedOwnerUid = normalizeUid(ownerUid);

  const raw = storage.getItem(PASSKEY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const assertionId = String(parsed?.assertionId || "").trim();
    const storedOwnerUid = normalizeUid(parsed?.ownerUid || "");

    if (!assertionId) {
      storage.removeItem(PASSKEY_STORAGE_KEY);
      return null;
    }

    if (
      normalizedOwnerUid &&
      storedOwnerUid &&
      storedOwnerUid !== normalizedOwnerUid
    ) {
      return null;
    }

    if (normalizedOwnerUid && !storedOwnerUid) {
      const migrated = {
        assertionId,
        createdAt: Number(parsed?.createdAt || 0),
        ownerUid: normalizedOwnerUid,
      };
      storage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return {
      assertionId,
      createdAt: Number(parsed?.createdAt || 0),
      ownerUid: storedOwnerUid,
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

export const consumeOneTimePasskey = (assertionId = "", ownerUid = "") => {
  const current = getOneTimePasskey(ownerUid);
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
