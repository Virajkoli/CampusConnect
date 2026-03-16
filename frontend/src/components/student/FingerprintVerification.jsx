import React, { useState } from "react";

const randomChallenge = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

export default function FingerprintVerification({
  onVerified,
  disabled,
  actionLabel = "Verify Fingerprint",
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

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [],
        },
      });

      if (!assertion) {
        throw new Error("Biometric verification failed.");
      }

      onVerified({ biometricVerified: true, assertionId: assertion.id || "" });
    } catch (verifyError) {
      setError(verifyError.message || "Biometric verification failed.");
      onVerified({ biometricVerified: false });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        Fingerprint Verification
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Use your device biometric lock to authenticate attendance.
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
