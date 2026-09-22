import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { FileText, Download, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReportsView = ({ preselectedAssessmentId }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedAssessmentId || '');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await apiClient.get('/assessments/history');
        setAssessments(res.data);
        if (!selectedId && res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load assessments', err);
      }
    };
    fetchAssessments();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      setError('Please select an assessment to generate report.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/reports/generate', {
        assessment_id: parseInt(selectedId),
        additional_notes: operatorNotes || null,
      });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate SitRep.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!report) return;
    try {
      const res = await apiClient.get(`/reports/${report.id}/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'markdown' ? 'text/markdown' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SitRep_Assessment_${report.assessment_id}.${format === 'markdown' ? 'md' : 'json'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-red-500" />
          Disaster Intelligence Situation Reports (SitRep)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated multi-modal crisis decision-support briefing and export engine
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-white">Generate Executive SitRep</h3>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Select Assessment Record
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {assessments.length === 0 ? (
                <option value="">No recorded assessments</option>
              ) : (
                assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} - {a.location_name} [{a.risk_level}] ({new Date(a.created_at).toLocaleDateString()})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Incident Commander Directives (Optional)
            </label>
            <input
              type="text"
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="e.g. Priority dispatch for Sector 4 power generator"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !selectedId}
              className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? 'Synthesizing...' : 'Synthesize Situation Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Report Viewer */}
      {report && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-400">
                Official Incident Command SitRep #{report.id}
              </span>
              <h2 className="text-xl font-black text-white">{report.title}</h2>
              <span className="text-xs text-slate-400">
                Generated: {new Date(report.created_at).toUTCString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload('markdown')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download Markdown (.md)
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            </div>
          </div>

          {/* SitRep Structured Content Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-200 space-y-4 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {report.markdown_content}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
