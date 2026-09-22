import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const LeafletMap = ({
  center = [17.3850, 78.4867],
  zoom = 12,
  incidentLocation = null,
  incidentName = 'Disaster Epicenter',
  shelters = [],
  nearestShelterId = null,
  routeCoordinates = null,
  height = '400px',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. Plot incident / user location
    if (incidentLocation && incidentLocation[0] && incidentLocation[1]) {
      const incidentIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="width: 32px; height: 32px; background: rgba(239, 68, 68, 0.4); border-radius: 50%; position: absolute; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 20px; height: 20px; background: #ef4444; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
          </div>
        `,
        iconSize: null,
      });

      const incidentMarker = L.marker(incidentLocation, { icon: incidentIcon }).addTo(group);
      incidentMarker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
          <b style="color: #dc2626; font-size: 14px;">⚠️ ${incidentName}</b><br>
          <span style="font-size: 12px;">Coordinates: ${incidentLocation[0].toFixed(4)}, ${incidentLocation[1].toFixed(4)}</span>
        </div>
      `);
    }

    // 2. Plot shelters
    shelters.forEach((s) => {
      const isNearest = s.id === nearestShelterId;
      const availableCap = Math.max(0, s.capacity - (s.current_occupancy || 0));

      const shelterIcon = L.divIcon({
        className: 'custom-shelter-marker',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${isNearest ? '#059669' : '#1d4ed8'};
            color: white;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
            letter-spacing: 0.2px;
          ">
            <span style="font-size: 12px;">${isNearest ? '⭐' : '🏠'}</span>
            <span>${s.name}</span>
          </div>
        `,
        iconSize: null,
      });

      const marker = L.marker([s.latitude, s.longitude], { icon: shelterIcon }).addTo(group);
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
          <b style="font-size: 14px; color: ${isNearest ? '#059669' : '#1d4ed8'};">
            ${isNearest ? '⭐ RECOMMENDED SHELTER' : 'EMERGENCY SHELTER'}
          </b><br>
          <b>${s.name}</b><br>
          <span style="font-size: 12px; color: #64748b;">Region: ${s.region}</span><br>
          <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;">
          <span style="font-size: 12px;"><b>Capacity:</b> ${s.capacity} people</span><br>
          <span style="font-size: 12px;"><b>Available:</b> ${availableCap} beds</span><br>
          <span style="font-size: 12px;"><b>Hotline:</b> ${s.contact_phone || 'N/A'}</span>
        </div>
      `);
    });

    // 3. Draw evacuation line
    if (routeCoordinates && routeCoordinates.length >= 2) {
      L.polyline(routeCoordinates, {
        color: '#10b981',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9,
      }).addTo(group);
    }
  }, [incidentLocation, incidentName, shelters, nearestShelterId, routeCoordinates]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      className="border border-slate-700 shadow-lg z-0"
    />
  );
};

export default LeafletMap;
