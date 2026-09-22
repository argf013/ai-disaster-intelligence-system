import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import LeafletMap from '../components/LeafletMap';
import { MapPin, Home, Phone, Users, Navigation } from 'lucide-react';

export const ShelterMapView = () => {
  const [shelters, setShelters] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [incidentLat, setIncidentLat] = useState(17.3850);
  const [incidentLon, setIncidentLon] = useState(78.4867);
  const [nearestResult, setNearestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSheltersAndNearest = async (lat, lon, region = '') => {
    setLoading(true);
    try {
      const shelterUrl = region ? `/gis/shelters?region=${region}` : '/gis/shelters';
      const nearestUrl = region
        ? `/gis/nearest?lat=${lat}&lon=${lon}&region=${region}`
        : `/gis/nearest?lat=${lat}&lon=${lon}`;

      const [sRes, nRes] = await Promise.all([
        apiClient.get(shelterUrl),
        apiClient.get(nearestUrl),
      ]);
      setShelters(sRes.data);
      setNearestResult(nRes.data);
    } catch (err) {
      console.error('Failed to load GIS shelters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheltersAndNearest(incidentLat, incidentLon, selectedRegion);
  }, [selectedRegion]);

  const handleRecalculate = (e) => {
    e.preventDefault();
    fetchSheltersAndNearest(incidentLat, incidentLon, selectedRegion);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-500" />
            GIS Evacuation Logistics & Prototype Shelter Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Geodesic distance calculation, capacity monitoring, and nearest shelter routing
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold uppercase">Region Filter:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
          >
            <option value="">All Prototype Regions</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Miami">Miami</option>
            <option value="Manila">Manila</option>
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
            incidentName="Target Hazard Epicenter"
            shelters={shelters}
            nearestShelterId={nearestResult?.shelter?.id}
            routeCoordinates={nearestResult?.route_coordinates}
            height="480px"
          />

          {/* Coordinate Adjustment Toolbar */}
          <form onSubmit={handleRecalculate} className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Hazard Pin:</span>
            <input
              type="number"
              step="0.0001"
              value={incidentLat}
              onChange={(e) => setIncidentLat(parseFloat(e.target.value))}
              placeholder="Latitude"
              className="w-28 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
            />
            <input
              type="number"
              step="0.0001"
              value={incidentLon}
              onChange={(e) => setIncidentLon(parseFloat(e.target.value))}
              placeholder="Longitude"
              className="w-28 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              Re-route
            </button>
          </form>
        </div>

        {/* Shelter List and Recommended Detail Card */}
        <div className="space-y-4">
          {nearestResult && (
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Optimal Refuge Recommendation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200 border border-emerald-500/40">
                  {nearestResult.distance_km} km
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{nearestResult.shelter.name}</h3>
              <p className="text-xs text-slate-300">
                Region: <b>{nearestResult.shelter.region}</b>
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
                  <b>{nearestResult.available_capacity} beds</b>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-blue-400" /> Direct Hotline:
                  </span>
                  <b>{nearestResult.shelter.contact_phone || 'Civil Defense'}</b>
                </div>
              </div>
            </div>
          )}

          {/* All Shelters List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 max-h-[380px] overflow-y-auto">
            <h4 className="text-xs font-bold uppercase text-slate-400">Regional Registered Shelters</h4>
            <div className="space-y-2">
              {shelters.map((s) => {
                const isNearest = s.id === nearestResult?.shelter?.id;
                const avail = Math.max(0, s.capacity - (s.current_occupancy || 0));
                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isNearest
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-white">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-slate-400">{s.region}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Capacity: {s.capacity}</span>
                      <span className="text-emerald-400">Avail: {avail}</span>
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
