import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "@tensorflow/tfjs";

const MODEL_BASE_URL =
  import.meta.env.VITE_FACE_API_MODEL_URL || "/models";

let modelsPromise = null;

const loadModels = async () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE_URL),
    ]);
  }

  return modelsPromise;
};

const stopStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

export default function FaceCameraCapture({
  disabled,
  buttonLabel = "Capture Face",
  onDescriptor,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!videoRef.current) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await loadModels();
        setCameraReady(true);
      } catch (cameraError) {
        setError(cameraError.message || "Unable to access camera.");
      }
    };

    start();

    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const captureFace = async () => {
    if (!videoRef.current) return;

    setCapturing(true);
    setError("");
    try {
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.45,
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!Array.isArray(detections) || detections.length === 0) {
        throw new Error("No face detected. Ensure your face is visible.");
      }

      if (detections.length > 1) {
        throw new Error("Multiple faces detected. Only one face is allowed.");
      }

      const [match] = detections;
      const descriptor = Array.from(match.descriptor || []);
      if (descriptor.length !== 128) {
        throw new Error("Face descriptor extraction failed.");
      }

      onDescriptor?.({ descriptor, livenessPassed: true });
    } catch (captureError) {
      setError(captureError.message || "Face capture failed.");
      onDescriptor?.(null);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Face Camera</p>
      <div className="mx-auto mt-3 aspect-[3/4] w-56 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900 sm:w-64">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
      </div>
      <button
        type="button"
        disabled={disabled || !cameraReady || capturing}
        onClick={captureFace}
        className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {capturing ? "Processing..." : buttonLabel}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      {!window.isSecureContext ? (
        <p className="mt-2 text-xs text-amber-700">
          Use HTTPS for reliable camera and biometric APIs.
        </p>
      ) : null}
    </div>
  );
}
