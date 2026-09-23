import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Layers, UploadCloud, ArrowRight, AlertTriangle, AlertCircle, Shield, Navigation, Users } from 'lucide-react';

export const DamageAssessmentView = ({ onUseInAssessment, currentLocation, onNavigateToShelters }) => {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [transferred, setTransferred] = useState(false);
  const [error, setError] = useState('');
  const [nearestShelter, setNearestShelter] = useState(null);

  useEffect(() => {
    const lat = currentLocation?.latitude || 17.3850;
    const lon = currentLocation?.longitude || 78.4867;
    apiClient
      .get(`/gis/nearest?lat=${lat}&lon=${lon}`)
      .then((res) => setNearestShelter(res.data))
      .catch((err) => console.error('Failed to load nearest shelter in DamageAssessment', err));
  }, [currentLocation]);

  const handleBeforeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBeforeFile(file);
      setBeforePreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAfterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAfterFile(file);
      setAfterPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAssessDamage = async () => {
    if (!beforeFile || !afterFile) {
      setError('Please provide both pre-disaster and post-disaster images.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('before_file', beforeFile);
      formData.append('after_file', afterFile);

      const res = await apiClient.post('/vision/damage-assessment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Damage assessment computation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-red-500" />
          Pre/Post Disaster Surface Damage Comparison
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          OpenCV optical difference matrix, structural delta scoring, and false-color JET colormap heatmap
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dual Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Disaster Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 1: Baseline / Pre-Disaster
          </span>
          <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer transition relative min-h-[220px] flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleBeforeChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {beforePreview ? (
              <img
                src={beforePreview}
                alt="Before"
                className="max-h-48 rounded-lg object-contain shadow"
              />
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
                <span className="text-xs font-semibold text-slate-300 block">
                  Upload Baseline Aerial Tile (Before)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Post-Disaster Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step 2: Impact / Post-Disaster
          </span>
          <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer transition relative min-h-[220px] flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleAfterChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {afterPreview ? (
              <img
                src={afterPreview}
                alt="After"
                className="max-h-48 rounded-lg object-contain shadow"
              />
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
                <span className="text-xs font-semibold text-slate-300 block">
                  Upload Post-Disaster Aerial Tile (After)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleAssessDamage}
          disabled={loading || !beforeFile || !afterFile}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition"
        >
          <Layers className="w-4 h-4" />
          {loading ? 'Processing Matrix Delta...' : 'Calculate Surface Damage Delta'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Change Magnitude
              </span>
              <h3 className="text-2xl font-black text-white">{result.change_score}% Surface Delta</h3>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-950 text-red-300 border border-red-500/40">
                {result.damage_level}
              </span>
            </div>
          </div>

          {/* 3-Way Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs font-bold text-slate-300 block mb-2">Pre-Event Baseline</span>
              <img
                src={beforePreview}
                alt="Before"
                className="w-full h-48 object-cover rounded shadow"
              />
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs font-bold text-slate-300 block mb-2">Post-Event Imagery</span>
              <img
                src={afterPreview}
                alt="After"
                className="w-full h-48 object-cover rounded shadow"
              />
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-xs font-bold text-red-400 block mb-2">
                OpenCV Difference Heatmap
              </span>
              <img
                src={result.heatmap_url}
                alt="Heatmap"
                className="w-full h-48 object-cover rounded shadow border border-red-500/40"
              />
            </div>
          </div>

          {/* Automated Nearest Refuge Recommendation */}
          {nearestShelter && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Designated Refuge ({currentLocation?.name || 'Active Sector'})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200 border border-emerald-500/40">
                  {nearestShelter.distance_km} km away
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-white">{nearestShelter.shelter.name}</h5>
                  <p className="text-[11px] text-slate-300">
                    {nearestShelter.shelter.address ? `${nearestShelter.shelter.address} • ` : ''}
                    Capacity: <b className="text-emerald-400">{nearestShelter.available_capacity}</b> / {nearestShelter.shelter.capacity} beds available
                  </p>
                </div>
                {onNavigateToShelters && (
                  <button
                    type="button"
                    onClick={onNavigateToShelters}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    View Evacuation Map
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action: Transfer to Disaster Assessment */}
          {onUseInAssessment && (
            <div className="pt-3 border-t border-slate-800 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  onUseInAssessment({
                    change_score: result.change_score,
                    damage_level: result.damage_level,
                    heatmap_url: result.heatmap_url,
                  });
                  setTransferred(true);
                }}
                className={`w-full max-w-md py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow ${
                  transferred
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
                }`}
              >
                {transferred ? '✓ Transferred to Assessment & Dashboard' : 'Use in Disaster Assessment'}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Carries OpenCV surface change delta and heatmap into the integrated assessment &amp; SitRep report.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DamageAssessmentView;
