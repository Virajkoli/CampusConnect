import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QR_REPEAT_COOLDOWN_MS = 3000;

export default function QRScanner({ onDetected }) {
  const regionIdRef = useRef(
    `qr-region-${Math.random().toString(36).slice(2)}`,
  );
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ raw: "", at: 0 });
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");

  const submitManualInput = () => {
    const raw = String(manualInput || "").trim();
    if (!raw) {
      setError("Enter student UID, PRN, or QR JSON payload.");
      return;
    }

    try {
      const parsed = raw.startsWith("{")
        ? JSON.parse(raw)
        : { studentId: raw, prn: raw };
      if (!parsed.studentId && !parsed.prn) {
        throw new Error("studentId or prn is required.");
      }
      setError("");
      onDetected(parsed);
    } catch (parseError) {
      setError(parseError.message || "Invalid manual input.");
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!window.isSecureContext) {
      setError(
        "Camera scanner requires HTTPS or localhost. Use manual student ID entry below.",
      );
      return () => {
        mounted = false;
      };
    }

    const scanner = new Html5Qrcode(regionIdRef.current);
    scannerRef.current = scanner;

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (!mounted) return;

            const now = Date.now();
            if (
              decodedText === lastScanRef.current.raw &&
              now - lastScanRef.current.at < QR_REPEAT_COOLDOWN_MS
            ) {
              return;
            }
            lastScanRef.current = { raw: decodedText, at: now };

            try {
              const parsed = JSON.parse(decodedText);
              if (!parsed.studentId && !parsed.prn) {
                throw new Error("Invalid student QR payload");
              }
              onDetected(parsed);
            } catch (parseError) {
              setError(parseError.message || "Invalid QR code.");
            }
          },
          () => {},
        );
      } catch (startError) {
        setError(
          startError.message ||
            "Failed to start QR scanner. Use manual student ID entry below.",
        );
      }
    };

    start();

    return () => {
      mounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onDetected]);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="text-sm font-semibold text-emerald-700">
        Scan Student QR
      </h3>
      <div id={regionIdRef.current} className="mt-3" />
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
        <p className="text-xs font-medium text-emerald-700">Manual Fallback</p>
        <p className="mt-1 text-xs text-slate-500">
          Paste student UID or full QR JSON payload if camera scan is blocked.
        </p>
        <textarea
          value={manualInput}
          onChange={(event) => setManualInput(event.target.value)}
          rows={3}
          placeholder="student_uid_or_qr_json"
          className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={submitManualInput}
          className="mt-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          Mark With Manual Entry
        </button>
      </div>
    </div>
  );
}
