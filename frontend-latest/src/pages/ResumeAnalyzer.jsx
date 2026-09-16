import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import {
  Sparkles,
  UploadCloud,
  FileCheck,
  History,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const res = await apiClient.get('/ai/detailed-history');
      setHistoryData(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching resume history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume to analyze.');
      return;
    }

    setError('');
    setLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription.trim());
    }

    try {
      const res = await apiClient.post('/ai/analyze-resume-detailed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(err.response?.data?.error || 'Failed to complete resume analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    if (item.state?.result) {
      setAnalysis(item.state.result);
      if (item.state.jobDescription) {
        setJobDescription(item.state.jobDescription);
      }
      setShowHistory(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in py-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Gemini AI ATS Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Deep Resume Analyzer
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-3 leading-relaxed">
          Receive unfiltered, recruiter-grade ATS feedback. Upload your resume and optionally paste a job description to discover precisely how to tailor your experience.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:shadow-sm transition"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>View Previous Analyses</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-gray-900 font-bold text-sm mb-2">Resume PDF</label>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-indigo-200 rounded-2xl cursor-pointer bg-indigo-50/40 hover:bg-indigo-50/70 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {file ? (
                    <>
                      <FileCheck className="w-9 h-9 text-green-600 mb-2" />
                      <p className="text-sm font-bold text-gray-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Click to replace file</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-9 h-9 text-indigo-500 mb-2" />
                      <p className="text-sm font-semibold text-indigo-700">Choose PDF resume</p>
                      <p className="text-xs text-gray-500 mt-1">or drag & drop (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-900 font-bold text-sm">Target Job Description</label>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
              </div>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here to check tailored role fit and missing keywords..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running LangGraph Scorer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze My Resume</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Results Display */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Parsing & Scoring Resume</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Extracting PDF telemetry, comparing keywords against industry benchmarks, and formulating feedback...
                </p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6 animate-fade-in">
              {/* Score card */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">ATS Readiness Score</span>
                  <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Overall Profile Health</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {analysis.overallScore >= 80
                      ? 'Exceptional match for technical recruiter screens.'
                      : analysis.overallScore >= 60
                      ? 'Solid foundation with key optimization opportunities.'
                      : 'Requires structural revisions to pass automated filters.'}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={`w-28 h-28 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${
                      analysis.overallScore >= 80
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : analysis.overallScore >= 60
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                    }`}
                  >
                    <span className="text-3xl font-black">{analysis.overallScore}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">/ 100</span>
                  </div>
                </div>
              </div>

              {/* What is Perfect */}
              {analysis.perfect && analysis.perfect.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <span>What's Working Exceptionally Well</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 pl-7 list-disc">
                    {analysis.perfect.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What is Wrong / Needs Fix */}
              {analysis.wrong && analysis.wrong.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>Mistakes & Areas for Improvement</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 pl-7 list-disc">
                    {analysis.wrong.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What is Missing */}
              {analysis.missing && analysis.missing.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Missing Keywords & Experience Gaps</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1 pl-7">
                    {analysis.missing.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-50 text-amber-900 border border-amber-200 text-xs px-3 py-1 rounded-lg font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Recruiter Analysis */}
              {analysis.detailedAnalysis && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>Comprehensive Recruiter Evaluation</span>
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {analysis.detailedAnalysis}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Analysis Loaded</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Upload your resume PDF in the panel to generate a detailed diagnostic, or choose a scan from your history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Modal / Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Your Resume Scans</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {historyLoading ? (
                <div className="text-center py-10 text-sm text-gray-500">Loading history records...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                  No previous scans recorded yet.
                </div>
              ) : (
                historyData.map((item) => {
                  const score = item.state?.result?.overallScore || 0;
                  return (
                    <div
                      key={item._id}
                      className="p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              score >= 80
                                ? 'bg-green-100 text-green-800'
                                : score >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Score: {score}/100
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {item.state?.jobDescription
                            ? `Tailored to: ${item.state.jobDescription.slice(0, 70)}...`
                            : 'General Resume Scorer'}
                        </p>
                      </div>

                      <button
                        onClick={() => loadFromHistory(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;

