import React, { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function ClassroomHeatmap({ teacherLocation, points }) {
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

  const center = useMemo(() => {
    const lat = Number(teacherLocation?.lat);
    const lng = Number(teacherLocation?.lng);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }

    return { lat: 18.5204, lng: 73.8567 };
  }, [teacherLocation]);

  const safePoints = useMemo(() => {
    if (!Array.isArray(points)) {
      return [];
    }

    return points
      .map((point) => normalizePoint(point))
      .filter((point) => point !== null);
  }, [points]);

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
    const teacherLayer = teacherLayerRef.current;
    if (!teacherLayer) {
      return;
    }

    teacherLayer.clearLayers();

    L.circleMarker([center.lat, center.lng], {
      radius: 9,
      color: "#059669",
      fillColor: "#059669",
      fillOpacity: 0.9,
    }).addTo(teacherLayer);
  }, [center]);

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
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
        Live Classroom Heatmap
      </div>
      <div ref={mapRef} className="h-72" />
    </div>
  );
}
