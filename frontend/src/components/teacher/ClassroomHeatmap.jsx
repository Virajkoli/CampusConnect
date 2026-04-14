import React, { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function ClassroomHeatmap({
  teacherLocation,
  points,
  onRefresh,
  refreshing = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const teacherLayerRef = useRef(null);
  const pointsLayerRef = useRef(null);

  const normalizePoint = (point) => {
    const lat = Number(point?.lat ?? point?.latitude);
    const lng = Number(point?.lng ?? point?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      studentId: point?.studentId ? String(point.studentId) : "",
    };
  };

  const safePoints = useMemo(() => {
    if (!Array.isArray(points)) {
      return [];
    }

    return points
      .map((point) => normalizePoint(point))
      .filter((point) => point !== null);
  }, [points]);

  const teacherPoint = useMemo(() => {
    const lat = Number(teacherLocation?.lat);
    const lng = Number(teacherLocation?.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  }, [teacherLocation]);

  const center = useMemo(() => {
    if (teacherPoint) {
      return teacherPoint;
    }

    if (safePoints.length > 0) {
      return { lat: safePoints[0].lat, lng: safePoints[0].lng };
    }

    return { lat: 20.5937, lng: 78.9629 };
  }, [teacherPoint, safePoints]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 19);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    teacherLayerRef.current = L.layerGroup().addTo(map);
    pointsLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      teacherLayerRef.current = null;
      pointsLayerRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center]);

  useEffect(() => {
    const teacherLayer = teacherLayerRef.current;
    if (!teacherLayer) {
      return;
    }

    teacherLayer.clearLayers();

    if (!teacherPoint) {
      return;
    }

    L.circleMarker([teacherPoint.lat, teacherPoint.lng], {
      radius: 9,
      color: "#059669",
      fillColor: "#059669",
      fillOpacity: 0.9,
    }).addTo(teacherLayer);
  }, [teacherPoint]);

  useEffect(() => {
    const pointsLayer = pointsLayerRef.current;
    if (!pointsLayer) {
      return;
    }

    pointsLayer.clearLayers();

    safePoints.forEach((point) => {
      L.circleMarker([point.lat, point.lng], {
        radius: 8,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.55,
      }).addTo(pointsLayer);
    });
  }, [safePoints]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="text-sm font-medium text-slate-700">
          Live Classroom Heatmap
        </span>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        ) : null}
      </div>
      <div ref={mapRef} className="h-72" />
    </div>
  );
}
