import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function ClassroomHeatmap({ teacherLocation, points }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);

  const center =
    teacherLocation?.lat && teacherLocation?.lng
      ? [teacherLocation.lat, teacherLocation.lng]
      : [18.5204, 73.8567];

  const safePoints = Array.isArray(points) ? points : [];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView(center, 19);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }

    layer.clearLayers();
    map.setView(center, 19);

    L.circleMarker(center, {
      radius: 9,
      color: "#059669",
      fillColor: "#059669",
      fillOpacity: 0.9,
    }).addTo(layer);

    safePoints.forEach((point) => {
      if (
        Number.isNaN(Number(point?.lat)) ||
        Number.isNaN(Number(point?.lng))
      ) {
        return;
      }

      L.circleMarker([point.lat, point.lng], {
        radius: 8,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.55,
      }).addTo(layer);
    });
  }, [center, safePoints]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
        Live Classroom Heatmap
      </div>
      <div ref={mapRef} className="h-72" />
    </div>
  );
}
