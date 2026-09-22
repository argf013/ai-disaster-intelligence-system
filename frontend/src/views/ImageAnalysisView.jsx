import React, { useState } from 'react';
import apiClient from '../api/client';
import ThreatBadge from '../components/ThreatBadge';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Crosshair,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const ImageAnalysisView = ({ onUseInAssessment }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState('annotated'); // 'raw' or 'annotated'
  const [transferred, setTransferred] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError('Please select or upload an image first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiClient.post('/vision/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setViewMode('annotated');
    } catch (err) {
      setError(err.response?.data?.detail || 'Image analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-red-500" />
          Multi-Model Aerial Vision: CLIP &amp; YOLO11 Detection
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Integrates OpenAI CLIP (Zero-Shot Disaster Classification) &amp; Ultralytics YOLO11 (Visible Object Detection)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Upload Incident Imagery</h3>
            {result && result.annotated_image_url && (
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    viewMode === 'raw' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Raw Photo
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    viewMode === 'annotated' ? 'bg-red-600 text-white' : 'text-slate-400'
                  }`}
                >
                  YOLO11 Bounding Boxes
                </button>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer transition relative min-h-[260px] flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {result && viewMode === 'annotated' && result.annotated_image_url ? (
              <img
                src={result.annotated_image_url}
                alt="YOLO11 Annotated"
                className="max-h-72 mx-auto rounded-lg object-contain shadow border border-red-500/40"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-72 mx-auto rounded-lg object-contain shadow"
              />
            ) : (
              <div className="space-y-2 py-8">
                <UploadCloud className="w-12 h-12 text-slate-500 mx-auto" />
                <span className="text-sm font-semibold text-slate-300 block">
                  Drag &amp; drop aerial or drone photograph here
                </span>
                <span className="text-xs text-slate-500 block">PNG, JPG, or WEBP supported</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleClassify}
            disabled={loading || !selectedFile}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow transition"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Running CLIP & YOLO11 Vision Models...' : 'Execute Multi-Model Vision Analysis'}
          </button>
        </div>

        {/* Inference Results Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <h3 className="font-bold text-sm text-white">Visual Intelligence Diagnostics</h3>

          {!result ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-slate-800 rounded-xl">
              <ImageIcon className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs">No analysis performed yet. Upload an aerial image to evaluate.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. CLIP Primary Classification */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    CLIP Detected Hazard Type
                  </span>
                  <h4 className="text-xl font-black text-white uppercase mt-0.5">
                    {result.top_disaster}
                  </h4>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Confidence: {(result.top_confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <ThreatBadge level={result.severity} size="md" />
                </div>
              </div>

              {/* 2. YOLO11 Object Detection Findings */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    YOLO11 Detected Objects ({result.yolo_object_count})
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    Ultralytics YOLO11
                  </span>
                </div>

                {result.yolo_objects?.length === 0 ? (
                  <p className="text-xs text-slate-500">No objects detected above confidence threshold.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.yolo_objects.map((obj, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <b className="capitalize">{obj.name}</b>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. CLIP Candidate Label Probabilities */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase mb-2.5">
                  CLIP Hazard Category Probabilities
                </h4>
                <div className="space-y-2">
                  {result.all_scores?.map((item) => {
                    const pct = (item.score * 100).toFixed(1);
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-slate-300">{item.label}</span>
                          <span className="font-mono text-slate-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              item.label === result.top_disaster ? 'bg-red-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action: Transfer to Disaster Assessment */}
              {onUseInAssessment && (
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onUseInAssessment({
                        disaster_type: result.top_disaster,
                        image_confidence: result.top_confidence,
                        image_severity: result.severity,
                        yolo_objects: result.yolo_objects,
                        annotated_image_url: result.annotated_image_url,
                      });
                      setTransferred(true);
                    }}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow ${
                      transferred
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {transferred ? 'Transferred to Assessment & Dashboard' : 'Use in Disaster Assessment'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Carries CLIP hazard classification and YOLO11 objects into the integrated assessment &amp; map.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisView;
