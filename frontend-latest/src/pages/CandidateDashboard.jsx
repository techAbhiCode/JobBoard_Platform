import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Sparkles,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  MapPin,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const CandidateDashboard = () => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'profile'
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Profile Form state
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Quick Resume Scorer & Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [appRes, profRes] = await Promise.all([
          apiClient.get('/applications/me'),
          apiClient.get('/profile'),
        ]);

        if (isMounted) {
          setApplications(appRes.data?.data || []);
          if (profRes.data?.data) {
            const p = profRes.data.data;
            setAbout(p.about || '');
            setSkills(p.skills ? p.skills.join(', ') : '');
          }
        }

        // Fetch AI analysis asynchronously with try/catch
        try {
          const analysisRes = await apiClient.get('/ai/my-analysis');
          if (isMounted && analysisRes?.data?.data) {
            setAiAnalysis(analysisRes.data.data);
          }
        } catch (analysisErr) {
          console.warn('AI analysis not found or not yet generated:', analysisErr);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) {
          setAppsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await apiClient.put('/profile', {
        about,
        skills: skillsArray,
      });

      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      await refreshUser();
    } catch (err) {
      console.error('Error saving profile:', err);
      setProfileMessage({
        text: err.response?.data?.error || 'Failed to update profile.',
        type: 'error',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleQuickResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeUploading(true);
    setProfileMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiClient.post('/ai/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) {
        setAiAnalysis(res.data.data);
        setProfileMessage({
          text: 'Resume updated & AI analysis refreshed successfully!',
          type: 'success',
        });
        await refreshUser();
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      setProfileMessage({
        text: err.response?.data?.error || 'Failed to analyze resume.',
        type: 'error',
      });
    } finally {
      setResumeUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Dashboard Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Candidate Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'applications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            My Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Profile & Resume
          </button>
        </div>
      </div>

      {profileMessage.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-start gap-3 ${
            profileMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {profileMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{profileMessage.text}</span>
        </div>
      )}

      {/* TAB 1: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {appsLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-28"></div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No applications submitted yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Browse open positions and apply with your tailored resume.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
              >
                <span>Find Jobs Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {app.jobId?.title || 'Position Title'}
                      </h3>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        {app.jobId?.company || 'Company'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {app.jobId?.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {app.coverLetter && (
                      <p className="text-xs text-gray-600 line-clamp-1 pt-1 italic">
                        "{app.coverLetter}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.jobId?._id && (
                      <Link
                        to={`/jobs/${app.jobId._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition"
                      >
                        <span>View Job</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFILE & RESUME */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900">Career Information</h2>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition w-fit"
              >
                <span>Full Profile (Projects & Certs)</span> →
              </Link>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-gray-800 text-sm font-semibold mb-1.5">Professional Summary / About</label>
                <textarea
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Passionate Full-Stack Developer with 4+ years of experience building scalable applications..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-semibold mb-1.5">
                  Core Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, Tailwind CSS, MongoDB, AWS"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  These skills are used by our AI to compute compatibility scores for job postings.
                </p>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-sm shadow-blue-500/20"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Quick Resume Upload & AI Score Widget */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Resume Health</h3>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Upload your latest PDF resume to update your default application document and refresh your AI profile score.
              </p>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-2xl cursor-pointer bg-indigo-50/30 hover:bg-indigo-50/60 transition">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <UploadCloud className="w-8 h-8 text-indigo-500 mb-1" />
                  <p className="text-xs font-semibold text-indigo-700">
                    {resumeUploading ? 'Analyzing Resume...' : 'Upload new PDF'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF format only</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  disabled={resumeUploading}
                  className="hidden"
                  onChange={handleQuickResumeUpload}
                />
              </label>

              {aiAnalysis && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Profile Score</span>
                    <span className="text-2xl font-black text-indigo-600">
                      {aiAnalysis.overallScore}/100
                    </span>
                  </div>

                  {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-gray-700">Top Strengths:</p>
                      <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                        {aiAnalysis.strengths.slice(0, 2).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link
                    to="/resume-analyzer"
                    className="block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-2"
                  >
                    Open Deep Resume Analyzer →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
