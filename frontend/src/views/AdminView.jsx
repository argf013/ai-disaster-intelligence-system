import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { UserCheck, Plus, Trash2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminView = () => {
  const [stats, setStats] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');

  // Form for creating a new shelter
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Hyderabad');
  const [latitude, setLatitude] = useState(17.4000);
  const [longitude, setLongitude] = useState(78.4800);
  const [capacity, setCapacity] = useState(500);
  const [phone, setPhone] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, sheltersRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/gis/shelters'),
      ]);
      setStats(statsRes.data);
      setShelters(sheltersRes.data);
    } catch (err) {
      setError('Failed to fetch administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    setActionMsg('');
    setError('');
    try {
      await apiClient.post('/admin/shelters', {
        name,
        region,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        capacity: parseInt(capacity),
        contact_phone: phone || null,
      });
      setName('');
      setPhone('');
      setActionMsg('New emergency shelter registered successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create shelter.');
    }
  };

  const handleDeleteShelter = async (id, sName) => {
    if (!window.confirm(`Delete shelter "${sName}"?`)) return;
    try {
      await apiClient.delete(`/admin/shelters/${id}`);
      setActionMsg(`Shelter "${sName}" removed.`);
      fetchData();
    } catch (err) {
      alert('Failed to delete shelter.');
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('Re-seed prototype database with default shelters and dispatches?')) return;
    try {
      const res = await apiClient.post('/admin/seed-data');
      setActionMsg(res.data.message);
      fetchData();
    } catch (err) {
      alert('Failed to seed database.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-red-500" />
            Administrative Infrastructure Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System health, municipal shelter registry management, and prototype data seeding
          </p>
        </div>

        <button
          onClick={handleSeedData}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Re-seed Prototype Data
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg flex items-center gap-2 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Operators</span>
          <p className="text-2xl font-black text-white mt-1">{stats?.users_count ?? '...'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Audited Assessments</span>
          <p className="text-2xl font-black text-white mt-1">{stats?.assessments_count ?? '...'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Shelters Registered</span>
          <p className="text-2xl font-black text-white mt-1">{stats?.shelters_count ?? '...'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Critical Dispatches</span>
          <p className="text-2xl font-black text-red-400 mt-1">{stats?.critical_dispatches_count ?? '...'}</p>
        </div>
      </div>

      {/* Shelter Registry Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Shelter Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-white">Register Emergency Shelter</h3>

          <form onSubmit={handleCreateShelter} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Shelter Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jubilee Hills Relief Gym"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Region</label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Total Capacity</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Hotline Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-40-XXXX-XXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-semibold flex items-center justify-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Shelter
            </button>
          </form>
        </div>

        {/* Existing Shelters Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="font-bold text-sm text-white">Registered Prototype Shelters</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Region</th>
                  <th className="p-2.5">Coords</th>
                  <th className="p-2.5">Capacity</th>
                  <th className="p-2.5">Phone</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {shelters.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-semibold text-white">{s.name}</td>
                    <td className="p-2.5">{s.region}</td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}
                    </td>
                    <td className="p-2.5">{s.capacity} beds</td>
                    <td className="p-2.5 text-slate-400">{s.contact_phone || '-'}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteShelter(s.id, s.name)}
                        className="text-slate-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
