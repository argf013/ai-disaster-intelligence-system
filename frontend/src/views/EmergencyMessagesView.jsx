import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  MessageSquareWarning,
  Send,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const EmergencyMessagesView = ({ onUseInAssessment }) => {
  const [feed, setFeed] = useState([]);
  const [customText, setCustomText] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classifiedResult, setClassifiedResult] = useState(null);
  const [transferred, setTransferred] = useState(false);
  const [error, setError] = useState('');

  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const url = urgencyFilter ? `/social/feed?urgency=${urgencyFilter}` : '/social/feed';
      const res = await apiClient.get(url);
      setFeed(res.data);
    } catch (err) {
      console.error('Failed to load emergency dispatches', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [urgencyFilter]);

  const handleClassifyOnly = async () => {
    if (!customText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post('/social/classify-custom', { text: customText });
      setClassifiedResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Classification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitToFeed = async (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/social/create', { text: customText });
      setCustomText('');
      setClassifiedResult(null);
      fetchFeed();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (level) => {
    const norm = (level || 'LOW').toUpperCase();
    const colors = {
      CRITICAL: 'bg-red-950 text-red-300 border-red-500/50',
      HIGH: 'bg-orange-950 text-orange-300 border-orange-500/50',
      MEDIUM: 'bg-amber-950 text-amber-300 border-amber-500/50',
      LOW: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[norm]}`}>
        {norm}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-red-500" />
          Social Media & Citizen Emergency NLP Intelligence
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Zero-Shot textual emergency categorization and prioritization powered by BART (Large MNLI)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Text Ingestion Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-white">Live NLP Dispatch Triage</h3>
          <p className="text-xs text-slate-400">
            Submit citizen reports, tweets, or emergency dispatches to test zero-shot NLP triage.
          </p>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <textarea
            rows="4"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. Water is rising up to the first floor on Station Road. Elderly residents stranded without power!"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleClassifyOnly}
              disabled={submitting || !customText.trim()}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Test BART Model
            </button>
            <button
              type="button"
              onClick={handleSubmitToFeed}
              disabled={submitting || !customText.trim()}
              className="py-2 px-3 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow transition"
            >
              <Send className="w-3.5 h-3.5" />
              Inject to Feed
            </button>
          </div>

          {classifiedResult && (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Triage Result</span>
                {getUrgencyBadge(classifiedResult.urgency_level)}
              </div>
              <h4 className="text-sm font-bold text-white capitalize">
                {classifiedResult.classification}
              </h4>
              <div className="text-xs text-slate-400">
                Confidence: <span className="font-mono text-emerald-400 font-bold">{classifiedResult.confidence}</span>
              </div>

              {/* Action: Transfer to Disaster Assessment */}
              {onUseInAssessment && (
                <div className="pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      onUseInAssessment({
                        text: classifiedResult.text,
                        classification: classifiedResult.classification,
                        confidence: classifiedResult.confidence,
                        urgency_level: classifiedResult.urgency_level,
                      });
                      setTransferred(true);
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow ${
                      transferred
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {transferred ? '✓ Transferred to Assessment & Dashboard' : 'Use in Disaster Assessment'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Injects this citizen dispatch into the multi-modal assessment &amp; SitRep report.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prototype Emergency Stream */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Simulated Emergency Dispatch Stream</h3>
              <span className="text-[11px] text-slate-400">
                Filtered citizen SOS dispatches categorized by severity
              </span>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setUrgencyFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    urgencyFilter === lvl
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lvl || 'ALL'}
                </button>
              ))}
            </div>
          </div>

          {loadingFeed ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading emergency stream...</p>
          ) : feed.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No dispatches matching filter.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-blue-400 font-semibold">
                      {dispatch.author_handle || '@anonymous'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-slate-300 font-medium">
                        {dispatch.classification || 'Unclassified'}
                      </span>
                      {getUrgencyBadge(dispatch.urgency_level)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    "{dispatch.post_text}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispatch.created_at).toLocaleTimeString()}
                    </span>
                    <span>NLP Confidence: {dispatch.confidence || '0.90'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyMessagesView;
