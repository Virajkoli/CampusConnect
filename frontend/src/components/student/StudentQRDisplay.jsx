import React, { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function StudentQRDisplay({ studentInfo, studentId, prn }) {
  const normalizedStudent = studentInfo || {
    uid: studentId,
    prn,
  };

  const normalizedPrn =
    normalizedStudent?.prn ||
    normalizedStudent?.rollNo ||
    normalizedStudent?.rollNumber ||
    prn ||
    "";

  const payloadObject = useMemo(() => {
    return {
      studentId: normalizedStudent?.uid || studentId || "",
      prn: normalizedPrn,
      name: normalizedStudent?.name || normalizedStudent?.displayName || "",
      email: normalizedStudent?.email || "",
      department:
        normalizedStudent?.dept || normalizedStudent?.department || "",
      year: normalizedStudent?.year || "",
      semester: normalizedStudent?.semester || "",
      subjects: Array.isArray(normalizedStudent?.subjects)
        ? normalizedStudent.subjects
        : [],
      generatedAt: new Date().toISOString(),
    };
  }, [normalizedStudent, normalizedPrn, studentId]);

  const payload = useMemo(() => JSON.stringify(payloadObject), [payloadObject]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Profile QR Code</h3>
      <p className="mt-1 text-xs text-slate-500">
        Show this QR to your teacher if your biometric device is unavailable.
      </p>
      <div className="mt-4 flex justify-center">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <QRCodeCanvas value={payload} size={180} includeMargin />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-600">
        PRN: {normalizedPrn || "-"}
      </p>
      <p className="mt-1 text-center text-xs text-slate-500 break-all">
        UID: {payloadObject.studentId || "-"}
      </p>
    </div>
  );
}
