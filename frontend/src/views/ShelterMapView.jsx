import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import LeafletMap from '../components/LeafletMap';
import { MapPin, Home, Phone, Users, Navigation, RefreshCw, CheckCircle2, Shield } from 'lucide-react';

export const ShelterMapView = ({ currentLocation, setCurrentLocation }) => {
  const [presets, setPresets] = useState([]);
  const [selectedSector, setSelectedSector] = useState(
    currentLocation?.name || 'Hyderabad (Flood Zone)'
  );
  const [incidentLat, setIncidentLat] = useState(currentLocation?.latitude || 17.3850);
  const [incidentLon, setIncidentLon] = useState(currentLocation?.longitude || 78.4867);
  const [shelters, setShelters] = useState([]);
  const [nearestResult, setNearestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all presets from backend
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await apiClient.get('/weather/presets');
        setPresets(res.data);
        if (currentLocation?.name) {
          setSelectedSector(currentLocation.name);
          setIncidentLat(currentLocation.latitude);
          setIncidentLon(currentLocation.longitude);
        } else if (res.data.length > 0) {
          setSelectedSector(res.data[0].name);
          setIncidentLat(res.data[0].latitude);
          setIncidentLon(res.data[0].longitude);
        }
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    };
    fetchPresets();
  }, []);

  // Fetch shelters and nearest calculation automatically
  const fetchSheltersAndNearest = async (lat, lon) => {
    setLoading(true);
    try {
      const [sRes, nRes] = await Promise.all([
        apiClient.get('/gis/shelters'),
        apiClient.get(`/gis/nearest?lat=${lat}&lon=${lon}`),
      ]);
      setShelters(sRes.data);
      setNearestResult(nRes.data);
    } catch (err) {
      console.error('Failed to load GIS shelters', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync if currentLocation prop updates from other views (e.g. Dashboard)
  useEffect(() => {
    if (currentLocation && currentLocation.name) {
      setSelectedSector(currentLocation.name);
      setIncidentLat(currentLocation.latitude);
      setIncidentLon(currentLocation.longitude);
      fetchSheltersAndNearest(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation]);

  const handleSectorChange = (e) => {
    const sectorName = e.target.value;
    setSelectedSector(sectorName);
    const found = presets.find((p) => p.name === sectorName);
    if (found) {
      setIncidentLat(found.latitude);
      setIncidentLon(found.longitude);
      if (setCurrentLocation) {
        setCurrentLocation(found);
      }
      fetchSheltersAndNearest(found.latitude, found.longitude);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sector Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-500" />
            GIS Evacuation Logistics &amp; Municipal Shelter Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geodesic distance calculation, capacity monitoring, and automated nearest refuge routing
          </p>
        </div>

        {/* Dynamic Sector Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold uppercase whitespace-nowrap">
            Operational Sector:
          </label>
          <select
            value={selectedSector}
            onChange={handleSectorChange}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 font-medium"
          >
            {presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <LeafletMap
            center={[incidentLat, incidentLon]}
            zoom={12}
            incidentLocation={[incidentLat, incidentLon]}
            incidentName={`Hazard Epicenter: ${selectedSector}`}
            shelters={shelters}
            nearestShelterId={nearestResult?.shelter?.id}
            routeCoordinates={nearestResult?.route_coordinates}
            height="480px"
          />

          {/* Automated Coordinate Telemetry Strip (Read-Only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-slate-400 uppercase text-[10px]">Active Coordinates:</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
                {Number(incidentLat).toFixed(4)}° N, {Number(incidentLon).toFixed(4)}° E
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" /> Automated Geodesic Routing
              </span>
            </div>

            <button
              onClick={() => fetchSheltersAndNearest(incidentLat, incidentLon)}
              disabled={loading}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh GIS Routing
            </button>
          </div>
        </div>

        {/* Shelter List and Recommended Detail Card */}
        <div className="space-y-4">
          {nearestResult && (
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Optimal Refuge Recommendation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200 border border-emerald-500/40">
                  {nearestResult.distance_km} km away
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{nearestResult.shelter.name}</h3>
              <p className="text-xs text-slate-300">
                Region / City: <b>{nearestResult.shelter.region}</b>
              </p>
              {nearestResult.shelter.address && (
                <p className="text-[11px] text-slate-400 mt-1">
                  📍 {nearestResult.shelter.address}
                </p>
              )}
              <div className="space-y-1.5 text-xs border-t border-emerald-900/60 pt-3">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Available Capacity:
                  </span>
                  <b>{nearestResult.available_capacity} / {nearestResult.shelter.capacity} beds</b>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-blue-400" /> Direct Hotline:
                  </span>
                  <b>{nearestResult.shelter.contact_phone || 'Civil Defense / 112'}</b>
                </div>
              </div>
            </div>
          )}

          {/* All Shelters List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 max-h-[380px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-400">Municipal Shelter Network</h4>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                {shelters.length} Facilities Active
              </span>
            </div>
            <div className="space-y-2">
              {shelters.map((s) => {
                const isNearest = s.id === nearestResult?.shelter?.id;
                const avail = Math.max(0, s.capacity - (s.current_occupancy || 0));
                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isNearest
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-white">
                      <span className="flex items-center gap-1">
                        {isNearest && <span className="text-emerald-400">⭐</span>}
                        {s.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">{s.region}</span>
                    </div>
                    {s.address && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.address}</p>
                    )}
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Total: {s.capacity}</span>
                      <span className={avail > 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                        Available: {avail}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterMapView;
