import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import ThreatBadge from '../components/ThreatBadge';
import { History, Trash2, FileText, RefreshCw, AlertCircle } from 'lucide-react';

export const HistoryView = ({ onSelectAssessmentForReport }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/assessments/history');
      setAssessments(res.data);
    } catch (err) {
      setError('Failed to fetch assessment audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete assessment record #${id}?`)) return;
    try {
      await apiClient.delete(`/assessments/${id}`);
      fetchHistory();
    } catch (err) {
      alert('Failed to delete assessment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            Historical Disaster Incident Audits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persistent incident logs, multi-modal sensor snapshots, and risk telemetry records
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <p className="p-8 text-center text-xs text-slate-400">Loading audit history...</p>
        ) : assessments.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">
            No past assessments recorded. Run an assessment on the Dashboard and click "Save Assessment".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Sector Location</th>
                  <th className="p-3.5">Threat Alert</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Weather Snapshot</th>
                  <th className="p-3.5">Visual Hazard</th>
                  <th className="p-3.5">Timestamp (UTC)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {assessments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-400">#{item.id}</td>
                    <td className="p-3.5 font-semibold text-white">
                      {item.location_name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {item.latitude.toFixed(3)}°, {item.longitude.toFixed(3)}°
                      </span>
                    </td>
                    <td className="p-3.5">
                      <ThreatBadge level={item.risk_level} size="sm" />
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      {item.risk_score} / 100
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {item.weather_rainfall || 0} mm rain | {item.weather_wind_speed || 0} km/h wind
                    </td>
                    <td className="p-3.5">
                      {item.detected_disaster ? (
                        <span className="capitalize font-medium text-emerald-400">
                          {item.detected_disaster} ({Math.round((item.image_confidence || 0) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">None attached</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => onSelectAssessmentForReport(item.id)}
                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white rounded text-[11px] font-semibold transition"
                      >
                        Generate SitRep
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
