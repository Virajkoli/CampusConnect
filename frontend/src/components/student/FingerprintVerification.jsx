import React, { useState } from "react";

const randomChallenge = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

const buildWebAuthnUserId = (value = "") => {
  const source = String(value || "").trim() || `cc-user-${Date.now()}`;
  return new TextEncoder().encode(source);
};

const resolveErrorMessage = (error, mode) => {
  const fallback =
    mode === "create"
      ? "Passkey creation failed."
      : "Biometric verification failed.";

  if (!error) {
    return fallback;
  }

  if (error.name === "NotAllowedError") {
    return mode === "create"
      ? "Passkey creation was cancelled or no compatible authenticator is available."
      : "Verification was cancelled or no passkey is available on this device.";
  }

  if (error.name === "InvalidStateError") {
    return mode === "create"
      ? "A passkey for this account may already exist on this device."
      : fallback;
  }

  if (error.name === "SecurityError") {
    return "Biometric APIs require a secure (HTTPS) context.";
  }

  return error.message || fallback;
};

export default function FingerprintVerification({
  onVerified,
  disabled,
  actionLabel = "Verify Fingerprint",
  mode = "verify",
  userId = "",
  userName = "",
}) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const useLanFallback = () => {
    setError("");
    onVerified({
      biometricVerified: true,
      assertionId: `lan-fallback-${Date.now()}`,
    });
  };

  const verify = async () => {
    setError("");
    setVerifying(true);

    try {
      if (!window.PublicKeyCredential || !navigator.credentials) {
        throw new Error(
          "Biometric verification is not supported on this device/browser.",
        );
      }

      const credential =
        mode === "create"
          ? await navigator.credentials.create({
              publicKey: {
                challenge: randomChallenge(),
                rp: {
                  name: "CampusConnect",
                },
                user: {
                  id: buildWebAuthnUserId(userId),
                  name:
                    String(userName || "").trim() ||
                    `student-${Date.now()}@campusconnect.local`,
                  displayName:
                    String(userName || "Student").trim() || "Student",
                },
                pubKeyCredParams: [
                  { type: "public-key", alg: -7 },
                  { type: "public-key", alg: -257 },
                ],
                authenticatorSelection: {
                  authenticatorAttachment: "platform",
                  residentKey: "preferred",
                  userVerification: "required",
                },
                timeout: 60000,
                attestation: "none",
              },
            })
          : await navigator.credentials.get({
              publicKey: {
                challenge: randomChallenge(),
                timeout: 60000,
                userVerification: "required",
              },
            });

      const credentialId = String(credential?.id || "").trim();
      if (!credentialId) {
        throw new Error(
          mode === "create"
            ? "Passkey created but credential id is missing."
            : "Biometric verification failed.",
        );
      }

      onVerified({ biometricVerified: true, assertionId: credentialId });
    } catch (verifyError) {
      setError(resolveErrorMessage(verifyError, mode));
      onVerified({ biometricVerified: false });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {mode === "create" ? "Create Passkey" : "Fingerprint Verification"}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {mode === "create"
          ? "Register a device passkey using your fingerprint or device biometric lock."
          : "Use your device biometric lock to authenticate attendance."}
      </p>
      <button
        type="button"
        disabled={disabled || verifying}
        onClick={verify}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {verifying ? "Verifying..." : actionLabel}
      </button>
      {!window.isSecureContext ? (
        <>
          <p className="mt-2 text-xs text-amber-700">
            This page is running on HTTP. Mobile browsers often block biometric
            APIs on non-secure origins.
          </p>
          <button
            type="button"
            disabled={disabled || verifying}
            onClick={useLanFallback}
            className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 disabled:opacity-60"
          >
            Use LAN Fallback Verification
          </button>
        </>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
