import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "../../firebase";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMapPin,
  FiSend,
  FiThumbsUp,
} from "react-icons/fi";

const API_BASE = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

const getMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const formatDateTime = (value) => {
  const millis = getMillis(value);
  if (!millis) return "Just now";
  return new Date(millis).toLocaleString();
};

const formatRelativeTime = (value) => {
  const millis = getMillis(value);
  if (!millis) return "just now";

  const diffMs = Date.now() - millis;
  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(millis).toLocaleDateString();
};

const formatFileSize = (size = 0) => {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageType = (media = {}) => String(media?.type || "") === "image";
const isVideoType = (media = {}) => String(media?.type || "") === "video";

const buildMapEmbedUrl = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "";
  }

  const delta = 0.005;
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

function FixItBoard({ role = "student", displayName = "" }) {
  const [user] = useAuthState(auth);

  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationPoint, setLocationPoint] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [mediaType, setMediaType] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [openComplaints, setOpenComplaints] = useState([]);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [actionBusyId, setActionBusyId] = useState("");

  const canResolve = role === "teacher" || role === "admin";

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  useEffect(() => {
    const complaintsQuery = query(
      collection(firestore, "fixitComplaints"),
      orderBy("createdAt", "desc"),
      limit(240),
    );

    const unsubscribe = onSnapshot(
      complaintsQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));

        const openRows = [];
        const resolvedRows = [];
        rows.forEach((row) => {
          if (String(row.status || "open") === "resolved") {
            resolvedRows.push(row);
          } else {
            openRows.push(row);
          }
        });

        resolvedRows.sort((a, b) => {
          const resolvedDiff = getMillis(b.resolvedAt) - getMillis(a.resolvedAt);
          if (resolvedDiff !== 0) return resolvedDiff;
          return getMillis(b.createdAt) - getMillis(a.createdAt);
        });

        setOpenComplaints(openRows);
        setResolvedComplaints(resolvedRows.slice(0, 80));
      },
      (snapshotError) => {
        console.error(
          "FixIt complaints subscribe error:",
          snapshotError,
        );
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const prioritizedOpenComplaints = useMemo(() => {
    return [...openComplaints].sort((a, b) => {
      const votesDiff = Number(b.upvotesCount || 0) - Number(a.upvotesCount || 0);
      if (votesDiff !== 0) return votesDiff;
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });
  }, [openComplaints]);

  const topPriorityId = prioritizedOpenComplaints[0]?.id || "";

  const clearComposer = () => {
    setDescription("");
    setLocationText("");
    setLocationPoint(null);
    setError("");
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl("");
    }
    setMediaFile(null);
    setMediaType("");
  };

  const handleMediaSelect = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) return;

    if (selectedFile.size > MAX_MEDIA_SIZE_BYTES) {
      setError("Media file exceeds 10MB limit.");
      return;
    }

    const mimeType = String(selectedFile.type || "").toLowerCase();
    const type = mimeType.startsWith("video/")
      ? "video"
      : mimeType.startsWith("image/")
        ? "image"
        : "";

    if (!type) {
      setError("Only image or video files are allowed for FixIt posts.");
      return;
    }

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    setError("");
    setMediaFile(selectedFile);
    setMediaType(type);
    setMediaPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device/browser.");
      return;
    }

    setGeoLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords?.latitude);
        const lng = Number(position.coords?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setError("Could not read coordinates from device location.");
          setGeoLoading(false);
          return;
        }

        setLocationPoint({ lat, lng });
        if (!locationText.trim()) {
          setLocationText(`Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
        }
        setGeoLoading(false);
      },
      (geoError) => {
        console.error("FixIt geolocation error:", geoError);
        setError("Unable to capture location. Please allow location permission.");
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const uploadMedia = async (file, type) => {
    if (!file || !user) return null;

    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("attachmentType", type);

    const response = await axios.post(`${API_BASE}/api/upload-fixit-media`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.media || null;
  };

  const submitComplaint = async (event) => {
    event.preventDefault();

    if (!user) {
      setError("You need to be logged in to post a complaint.");
      return;
    }

    const trimmedDescription = description.trim();
    const trimmedLocationText = locationText.trim();

    if (!trimmedDescription) {
      setError("Description is required.");
      return;
    }

    if (!trimmedLocationText) {
      setError("Location is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const uploadedMedia = mediaFile
        ? await uploadMedia(mediaFile, mediaType || "image")
        : null;

      await addDoc(collection(firestore, "fixitComplaints"), {
        status: "open",
        description: trimmedDescription,
        locationText: trimmedLocationText,
        locationLat: Number(locationPoint?.lat) || null,
        locationLng: Number(locationPoint?.lng) || null,
        media: uploadedMedia,
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        createdByName: displayName || user.displayName || "Campus User",
        createdByRole: role,
        upvotesCount: 0,
        upvotedBy: [],
      });

      clearComposer();
    } catch (submitError) {
      console.error("FixIt submit error:", submitError);
      setError(submitError?.response?.data?.message || "Failed to post complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUpvote = async (complaint) => {
    if (!user || !complaint?.id || actionBusyId) return;

    setActionBusyId(complaint.id);
    try {
      const complaintRef = doc(firestore, "fixitComplaints", complaint.id);
      await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(complaintRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data() || {};
        const currentVoters = Array.isArray(data.upvotedBy) ? data.upvotedBy : [];
        const alreadyUpvoted = currentVoters.includes(user.uid);
        const nextVoters = alreadyUpvoted
          ? currentVoters.filter((uid) => uid !== user.uid)
          : [...currentVoters, user.uid];

        transaction.update(complaintRef, {
          upvotedBy: nextVoters,
          upvotesCount: nextVoters.length,
        });
      });
    } catch (voteError) {
      console.error("FixIt upvote error:", voteError);
    } finally {
      setActionBusyId("");
    }
  };

  const markResolved = async (complaint) => {
    if (!canResolve || !user || !complaint?.id || actionBusyId) return;

    setActionBusyId(complaint.id);
    try {
      await updateDoc(doc(firestore, "fixitComplaints", complaint.id), {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedByUid: user.uid,
        resolvedByName: displayName || user.displayName || "Resolver",
        resolvedByRole: role,
      });
    } catch (resolveError) {
      console.error("FixIt resolve error:", resolveError);
    } finally {
      setActionBusyId("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FiAlertCircle className="h-5 w-5 text-[#2f87d9]" />
          <h2 className="text-xl font-semibold text-slate-800">FixIt Board</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Report campus issues with details, location, and optional media. Upvote
          important posts so critical problems rise to priority.
        </p>
      </div>

      <form
        onSubmit={submitComplaint}
        className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6"
      >
        <h3 className="text-lg font-semibold text-slate-800">Post an issue</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Issue Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue clearly..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(event) => setLocationText(event.target.value)}
              placeholder="Building, floor, room, landmark..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              required
            />
            <button
              type="button"
              onClick={captureCurrentLocation}
              disabled={geoLoading}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {geoLoading ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiMapPin className="h-3.5 w-3.5" />} 
              Use current location
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Image / Video (optional)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
            {mediaFile ? (
              <p className="mt-2 text-xs text-slate-500">
                {mediaFile.name} • {formatFileSize(mediaFile.size)}
              </p>
            ) : null}
          </div>
        </div>

        {locationPoint ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <iframe
              title="FixIt selected location"
              src={buildMapEmbedUrl(locationPoint.lat, locationPoint.lng)}
              className="h-48 w-full border-0"
              loading="lazy"
            />
          </div>
        ) : null}

        {mediaPreviewUrl ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {mediaType === "video" ? (
              <video
                src={mediaPreviewUrl}
                controls
                className="max-h-72 w-full rounded-lg bg-black"
              />
            ) : (
              <img
                src={mediaPreviewUrl}
                alt="FixIt preview"
                className="max-h-72 w-full rounded-lg object-cover"
              />
            )}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
            Post Complaint
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-800">Open Issues</h3>
          <span className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-semibold text-[#1f6fb7]">
            {prioritizedOpenComplaints.length} active
          </span>
        </div>

        {prioritizedOpenComplaints.length === 0 ? (
          <p className="text-sm text-slate-500">No active complaints right now.</p>
        ) : (
          <div className="space-y-4">
            {prioritizedOpenComplaints.map((item) => {
              const votes = Number(item.upvotesCount || 0);
              const voters = Array.isArray(item.upvotedBy) ? item.upvotedBy : [];
              const isUpvoted = user ? voters.includes(user.uid) : false;
              const isTopPriority = item.id === topPriorityId;
              const cardMedia = item.media || null;

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${
                    isTopPriority
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.createdByName || "Campus User"}
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                          {item.createdByRole || "user"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(item.createdAt)} • {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    {isTopPriority ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        Priority #1
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    {item.description || "No description provided."}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    <FiMapPin className="h-3.5 w-3.5" />
                    {item.locationText || "Location not specified"}
                  </div>

                  {Number.isFinite(Number(item.locationLat)) &&
                  Number.isFinite(Number(item.locationLng)) ? (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${item.locationLat}&mlon=${item.locationLng}#map=18/${item.locationLat}/${item.locationLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 inline-flex items-center gap-1 rounded-lg bg-[#e9f2ff] px-2.5 py-1 text-xs font-medium text-[#1f6fb7]"
                    >
                      Open map pin
                    </a>
                  ) : null}

                  {cardMedia ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {isImageType(cardMedia) ? (
                        <img
                          src={cardMedia.url}
                          alt={cardMedia.name || "Issue media"}
                          className="max-h-80 w-full object-cover"
                        />
                      ) : isVideoType(cardMedia) ? (
                        <video
                          src={cardMedia.url}
                          controls
                          className="max-h-80 w-full bg-black"
                        />
                      ) : null}
                      <div className="px-3 py-2 text-xs text-slate-500">
                        {cardMedia.name || "Media"}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleUpvote(item)}
                      disabled={!user || actionBusyId === item.id}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        isUpvoted
                          ? "border-[#2f87d9] bg-[#e9f2ff] text-[#1f6fb7]"
                          : "border-slate-300 text-slate-700"
                      }`}
                    >
                      <FiThumbsUp className="h-3.5 w-3.5" />
                      Upvote ({votes})
                    </button>

                    {canResolve ? (
                      <button
                        type="button"
                        onClick={() => markResolved(item)}
                        disabled={actionBusyId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {actionBusyId === item.id ? (
                          <FiLoader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FiCheckCircle className="h-3.5 w-3.5" />
                        )}
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Teachers/Admins resolve issues
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FiClock className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-800">Resolved Issues</h3>
        </div>

        {resolvedComplaints.length === 0 ? (
          <p className="text-sm text-slate-500">No resolved issues yet.</p>
        ) : (
          <div className="space-y-2">
            {resolvedComplaints.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {item.description || "Issue resolved"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.locationText || "Location not specified"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Posted by {item.createdByName || "Campus User"} • Resolved by{" "}
                  {item.resolvedByName || "Staff"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Resolved {formatRelativeTime(item.resolvedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FixItBoard;
