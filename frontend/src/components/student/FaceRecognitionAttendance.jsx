import React, { useState } from "react";
import FaceCameraCapture from "./FaceCameraCapture";

export default function FaceRecognitionAttendance({
  disabled,
  onVerified,
  ready,
}) {
  const [status, setStatus] = useState("");

  const handleDescriptor = (payload) => {
    if (!payload?.descriptor) {
      setStatus("Face verification failed. Please retry.");
      onVerified?.(null);
      return;
    }

    setStatus("Face verified locally. You can now mark attendance.");
    onVerified?.({
      descriptor: payload.descriptor,
      livenessPassed: Boolean(payload.livenessPassed),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Face Verification</h3>
      <p className="mt-1 text-xs text-slate-500">
        Capture your face to verify identity before marking attendance.
      </p>
      <FaceCameraCapture
        disabled={disabled}
        buttonLabel="Verify Face"
        onDescriptor={handleDescriptor}
      />
      {ready ? (
        <p className="mt-2 text-xs text-emerald-700">
          Face verification completed for this session.
        </p>
      ) : null}
      {status ? <p className="mt-2 text-xs text-slate-600">{status}</p> : null}
    </div>
  );
}
