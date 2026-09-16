import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  MapPin,
  DollarSign,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  FileCheck,
  Send,
  Clock,
  User,
  Briefcase,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  X,
  FileText,
  Check,
} from 'lucide-react';
import { calculateJobMatch } from '../utils/matchCalculator';

const STAGES = [
  { id: 1, title: 'Personal Info', desc: 'Contact details & mononym' },
  { id: 2, title: 'Experience & Skills', desc: 'Qualifications & notice period' },
  { id: 3, title: 'Resume Review', desc: 'Auto-fetched document' },
  { id: 4, title: 'Review & Submit', desc: 'Final application check' },
];

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Status Check
  const [hasApplied, setHasApplied] = useState(false);
  const [appliedDate, setAppliedDate] = useState(null);

  // AI Match Score state
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(null);

  // MNC Application Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationFeedback, setApplicationFeedback] = useState({ text: '', type: '' });

  // Wizard Form Fields
  const [fullName, setFullName] = useState('');
  const [isSingleName, setIsSingleName] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [candidateLocation, setCandidateLocation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Stage 2 fields
  const [yearsOfExperience, setYearsOfExperience] = useState('1 - 3 years');
  const [noticePeriod, setNoticePeriod] = useState('Immediate / < 15 days');
  const [workPreference, setWorkPreference] = useState('Remote / Flexible');

  // Stage 3 fields (Resume)
  const [resumeSource, setResumeSource] = useState('profile'); // 'profile' | 'upload'
  const [customResumeFile, setCustomResumeFile] = useState(null);
  const [updateProfileWithResume, setUpdateProfileWithResume] = useState(false);

  // Stage 4 fields
  const [coverLetter, setCoverLetter] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch job details & candidate application status
  useEffect(() => {
    let isMounted = true;

    const fetchJobAndApplications = async () => {
      try {
        const jobRes = await apiClient.get(`/jobs/${id}`);
        if (isMounted) {
          if (jobRes.data?.data) {
            setJob(jobRes.data.data);
          } else {
            setError('Job not found.');
          }
        }

        // Fetch candidate applications only if logged in as Candidate
        if (user?.role === 'Candidate') {
          try {
            const appsRes = await apiClient.get('/applications/me');
            if (isMounted && appsRes?.data?.data && Array.isArray(appsRes.data.data)) {
              const existing = appsRes.data.data.find(
                (app) => (app.jobId?._id || app.jobId)?.toString() === id?.toString()
              );
              if (existing) {
                setHasApplied(true);
                setAppliedDate(existing.createdAt);
              }
            }
          } catch (appErr) {
            console.warn('Could not load candidate application history:', appErr);
          }
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load job details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobAndApplications();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  // Lock body scroll while application wizard modal is active
  useEffect(() => {
    if (showWizard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showWizard]);

  // Open and pre-populate wizard from candidate profile (Candidates only)
  const handleOpenWizard = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'Candidate') {
      return;
    }
    setFullName(user?.name || '');
    setIsSingleName(Boolean(user?.isSingleName));
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setCandidateLocation(user?.location || '');
    setResumeSource(user?.resumeUrl ? 'profile' : 'upload');
    setCurrentStage(1);
    setSubmitSuccess(false);
    setApplicationFeedback({ text: '', type: '' });
    setShowWizard(true);
  };

  // Read stored DB fit score from user.jobMatches
  const storedMatch = useMemo(() => {
    if (user?.role === 'Candidate' && Array.isArray(user?.jobMatches)) {
      return user.jobMatches.find(
        (m) => (m.jobId?._id || m.jobId)?.toString() === id?.toString()
      );
    }
    return null;
  }, [user, id]);

  // Dynamic match result (stored DB score prioritized; fallback to calculator)
  const displayMatch = useMemo(() => {
    if (matchData) {
      return {
        score: matchData.matchScore,
        category: matchData.category,
        reason: matchData.reasoning,
        matchedSkills: (user?.skills || []).filter((s) =>
          (job?.skillsRequired || []).some((js) => js.toLowerCase() === s.toLowerCase())
        ),
      };
    }
    if (storedMatch) {
      return {
        score: storedMatch.score,
        category: storedMatch.category,
        reason: storedMatch.reasoning,
        matchedSkills: storedMatch.matchedSkills || [],
      };
    }
    if (job && user?.role === 'Candidate') {
      return calculateJobMatch(job, user);
    }
    return null;
  }, [matchData, storedMatch, job, user]);

  // Request fresh deep-dive Gemini LLM analysis
  const handleDeepAIAnalysis = async () => {
    if (!user || user.role !== 'Candidate') return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      const res = await apiClient.get(`/ai/match/${id}`);
      if (res.data?.data) {
        setMatchData(res.data.data);
        await refreshUser();
      }
    } catch (err) {
      console.error('Error fetching deep AI match:', err);
      setMatchError('Could not refresh AI match at this time.');
    } finally {
      setMatchLoading(false);
    }
  };

  // Stage validation
  const validateStage = () => {
    if (currentStage === 1) {
      if (!fullName.trim()) {
        setApplicationFeedback({ text: 'Please provide your full legal name.', type: 'error' });
        return false;
      }
      if (!email.trim()) {
        setApplicationFeedback({ text: 'Please provide your email address.', type: 'error' });
        return false;
      }
    } else if (currentStage === 3) {
      if (resumeSource === 'profile' && !user?.resumeUrl) {
        setApplicationFeedback({
          text: 'No profile resume found. Please upload a resume for this application.',
          type: 'error',
        });
        return false;
      }
      if (resumeSource === 'upload' && !customResumeFile && !user?.resumeUrl) {
        setApplicationFeedback({
          text: 'Please select a resume file (PDF or DOCX) to proceed.',
          type: 'error',
        });
        return false;
      }
    } else if (currentStage === 4) {
      if (!agreedToTerms) {
        setApplicationFeedback({
          text: 'Please acknowledge that your application details are accurate before submitting.',
          type: 'error',
        });
        return false;
      }
    }
    setApplicationFeedback({ text: '', type: '' });
    return true;
  };

  const handleNextStage = () => {
    if (validateStage()) {
      setCurrentStage((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStage = () => {
    setApplicationFeedback({ text: '', type: '' });
    setCurrentStage((prev) => Math.max(prev - 1, 1));
  };

  // Submit MNC Application
  const handleSubmitApplication = async (e) => {
    e?.preventDefault();
    if (user?.role !== 'Candidate') {
      setApplicationFeedback({
        text: 'Only registered Job Seekers can apply for positions. Applications are restricted for Administrator accounts.',
        type: 'error',
      });
      return;
    }
    if (!validateStage()) return;

    setSubmitting(true);
    setApplicationFeedback({ text: '', type: '' });

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('isSingleName', isSingleName);
    formData.append('phone', phone);
    formData.append('location', candidateLocation);
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('yearsOfExperience', yearsOfExperience);
    formData.append('noticePeriod', noticePeriod);
    formData.append('coverLetter', coverLetter);

    if (resumeSource === 'upload' && customResumeFile) {
      formData.append('resume', customResumeFile);
      if (updateProfileWithResume) {
        formData.append('updateProfileResume', 'true');
      }
    }

    try {
      await apiClient.post(`/applications/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitSuccess(true);
      setHasApplied(true);
      setAppliedDate(new Date().toISOString());
      await refreshUser();
    } catch (err) {
      console.error('Error submitting application:', err);
      setApplicationFeedback({
        text: err.response?.data?.error || 'Failed to submit application. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{error || 'Job not found'}</h2>
        <Link to="/jobs" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Back button */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all jobs
      </Link>

      {/* Main Job Card Header */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-2xl shadow-inner shrink-0">
              {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {job.title}
              </h1>
              <p className="text-lg font-medium text-gray-600 mt-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                {job.company}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
              {job.jobType || 'Full-Time'}
            </span>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                job.status === 'Open'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {job.status}
            </span>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{job.location || 'Remote'}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{job.salary}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Header Button */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            {hasApplied ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Applied on {new Date(appliedDate).toLocaleDateString()}
              </span>
            ) : user?.role === 'Candidate' ? (
              <span>
                {user.resumeUrl ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Profile resume auto-detected and ready
                  </span>
                ) : (
                  'Complete enterprise application flow in 4 steps'
                )}
              </span>
            ) : user?.role === 'Admin' ? (
              <span className="text-xs text-purple-600 font-semibold">
                Viewing listing in administrative audit mode
              </span>
            ) : user?.role === 'Employer' ? (
              <span className="text-xs text-blue-600 font-medium">
                Employers review applicants via Employer Portal
              </span>
            ) : (
              'Sign in as candidate to apply'
            )}
          </div>

          <div>
            {!user ? (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
              >
                Sign In to Apply
              </Link>
            ) : user.role === 'Admin' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-purple-800 font-semibold bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Administrator View • Applications Disabled
              </span>
            ) : user.role === 'Employer' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 font-semibold bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Employer Account • Cannot Apply
              </span>
            ) : hasApplied ? (
              <Link
                to="/candidate"
                className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
              >
                <span>View in Dashboard</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleOpenWizard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl text-sm transition shadow-md shadow-blue-500/25 flex items-center gap-2 transform active:scale-98"
              >
                <Briefcase className="w-4 h-4" />
                <span>Apply Now</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Match Score Module (Candidate Exclusive) */}
      {user?.role === 'Candidate' && displayMatch && (
        <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-purple-50/60 rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">AI Job Fit Evaluation</h2>
                  {storedMatch && (
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Persisted in DB
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Grounded in candidate skills, projects, experience, certificates, and parsed resume
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeepAIAnalysis}
              disabled={matchLoading}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 hover:bg-indigo-50/60 px-3.5 py-1.5 rounded-xl transition shrink-0"
            >
              {matchLoading ? 'Evaluating LLM...' : 'Deep AI Evaluation'}
            </button>
          </div>

          {matchError && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {matchError}
            </div>
          )}

          <div className="bg-white/90 rounded-2xl p-5 sm:p-6 border border-indigo-100/80 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    displayMatch.category === 'Strong Match'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : displayMatch.category === 'Good Match'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {displayMatch.category}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  Match Score: <span className="text-indigo-600">{displayMatch.score}%</span>
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  displayMatch.score >= 75
                    ? 'bg-emerald-500'
                    : displayMatch.score >= 50
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${displayMatch.score}%` }}
              ></div>
            </div>

            {displayMatch.reason && (
              <p className="text-xs text-gray-700 leading-relaxed bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/50">
                {displayMatch.reason}
              </p>
            )}

            {displayMatch.matchedSkills && displayMatch.matchedSkills.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Verified Skills Demonstrated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {displayMatch.matchedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-md"
                    >
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Description & Requirements */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Role Overview & Responsibilities</h2>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line space-y-4">
            {job.description}
          </div>
        </div>

        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Required Skills & Competencies</h2>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gray-50 text-gray-800 border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Apply CTA Card - Candidates & Visitors only */}
      {(!user || user.role === 'Candidate') && !hasApplied && (
        <div className="bg-gradient-to-r from-amber-500 to-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-extrabold">Ready to take the next step?</h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {user?.resumeUrl
                ? 'Your profile resume is auto-attached. Review your details and apply in moments.'
                : 'Complete the enterprise stages to submit your application to ' + job.company + '.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else if (user.role === 'Candidate') {
                handleOpenWizard();
              }
            }}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-3 rounded-2xl text-sm transition shadow-md shrink-0"
          >
            {user ? 'Launch Application' : 'Sign In to Apply'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/*  MULTI-STAGE APPLICATION WIZARD MODAL (Candidate Exclusive) */}
      {/* ========================================================================= */}
      {showWizard &&
        user?.role === 'Candidate' &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowWizard(false);
            }}
          >
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden relative z-10 my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Enterprise Candidate Portal • {job.company}
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 truncate">
                  Application for {job.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Step Indicator */}
            {!submitSuccess && (
              <div className="px-6 py-3.5 bg-white border-b border-gray-100 shrink-0">
                <div className="grid grid-cols-4 gap-2">
                  {STAGES.map((s) => {
                    const isCompleted = currentStage > s.id;
                    const isCurrent = currentStage === s.id;
                    return (
                      <div key={s.id} className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                          </span>
                          <span
                            className={`text-xs font-bold truncate hidden sm:inline ${
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>
                        <div
                          className={`h-1 rounded-full ${
                            isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600' : 'bg-gray-100'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {applicationFeedback.text && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                    applicationFeedback.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{applicationFeedback.text}</span>
                </div>
              )}

              {/* SUCCESS SCREEN */}
              {submitSuccess ? (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-gray-900">Application Submitted!</h4>
                    <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
                      Your complete dossier has been delivered directly to the technical recruitment team at{' '}
                      <span className="font-semibold text-gray-900">{job.company}</span>.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-left max-w-md mx-auto space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Applicant:</span>
                      <span className="font-semibold text-gray-800">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Target Role:</span>
                      <span className="font-semibold text-gray-800">{job.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Document Attached:</span>
                      <span className="font-semibold text-gray-800">
                        {resumeSource === 'profile'
                          ? user?.resumeOriginalName || 'Platform Profile Resume'
                          : customResumeFile?.name || 'Custom Uploaded Resume'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-bold text-emerald-600">Pending Employer Review</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                    >
                      Close Window
                    </button>
                    <Link
                      to="/candidate"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                    >
                      View Applications Dashboard
                    </Link>
                  </div>
                </div>
              ) : currentStage === 1 ? (
                /* ========================================================================= */
                /* STAGE 1: PERSONAL & CONTACT INFORMATION */
                /* ========================================================================= */
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" /> Personal & Contact Details
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Information pre-filled from your platform profile.
                    </p>
                  </div>

                  {/* Single-Name / Mononym Toggle */}
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={isSingleName}
                        onChange={(e) => setIsSingleName(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>I use only a single name (no last name / mononym)</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1 pl-6.5">
                      Enable this if your legal documents feature only a single name. MNC validation will accommodate your single legal name.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isSingleName ? "e.g. Rahul" : "e.g. Jane Doe"}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Current City / Location
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={candidateLocation}
                          onChange={(e) => setCandidateLocation(e.target.value)}
                          placeholder="e.g. New York, NY"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Portfolio / GitHub / LinkedIn
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentStage === 2 ? (
                /* ========================================================================= */
                /* STAGE 2: EXPERIENCE, SKILLS & MNC QUESTIONNAIRE */
                /* ========================================================================= */
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" /> Qualifications & MNC Questionnaire
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Confirming your core competencies and role availability.
                    </p>
                  </div>

                  {/* Skills preview */}
                  <div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Your Profile Skills Matching This Position
                    </span>
                    {user?.skills && user.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                        {user.skills.map((s, idx) => {
                          const isReq = (job.skillsRequired || []).some(
                            (js) => js.toLowerCase() === s.toLowerCase()
                          );
                          return (
                            <span
                              key={idx}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                                isReq
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-white text-gray-700 border border-gray-200'
                              }`}
                            >
                              {isReq ? '★ ' : ''}
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No skills listed in profile.</p>
                    )}
                  </div>

                  {/* MNC Experience Questionnaire */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Total Relevant Experience *
                      </label>
                      <select
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      >
                        <option value="Fresher / < 1 year">Fresher / &lt; 1 year</option>
                        <option value="1 - 3 years">1 - 3 years</option>
                        <option value="3 - 5 years">3 - 5 years</option>
                        <option value="5 - 8 years">5 - 8 years</option>
                        <option value="8+ years">8+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Notice Period / Availability *
                      </label>
                      <select
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      >
                        <option value="Immediate / < 15 days">Immediate / &lt; 15 days</option>
                        <option value="15 - 30 days">15 - 30 days</option>
                        <option value="30 - 60 days">30 - 60 days</option>
                        <option value="60 - 90 days">60 - 90 days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Work Arrangement Preference
                    </label>
                    <select
                      value={workPreference}
                      onChange={(e) => setWorkPreference(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    >
                      <option value="Remote / Flexible">Remote / Flexible</option>
                      <option value="Hybrid (2-3 days office)">Hybrid (2-3 days office)</option>
                      <option value="Onsite / Office">Onsite / Office</option>
                    </select>
                  </div>
                </div>
              ) : currentStage === 3 ? (
                /* ========================================================================= */
                /* STAGE 3: RESUME SELECTION & AUTO-FETCH VERIFICATION */
                /* ========================================================================= */
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" /> Resume Selection
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your master profile resume is pre-selected by default. You can also upload a customized resume.
                    </p>
                  </div>

                  {/* Option 1: Saved Profile Resume (Auto-fetched) */}
                  <label
                    className={`block p-4 rounded-2xl border-2 cursor-pointer transition ${
                      resumeSource === 'profile'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="resumeSource"
                        checked={resumeSource === 'profile'}
                        onChange={() => setResumeSource('profile')}
                        disabled={!user?.resumeUrl}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            Use Platform Profile Resume (Recommended)
                          </span>
                          {user?.resumeUrl && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              Auto-Fetched
                            </span>
                          )}
                        </div>

                        {user?.resumeUrl ? (
                          <div className="mt-2.5 p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate text-xs font-semibold text-gray-800">
                              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span className="truncate">
                                {user?.resumeOriginalName || 'Master_Resume.pdf'}
                              </span>
                            </div>
                            <a
                              href={`http://localhost:5000${user.resumeUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline shrink-0"
                            >
                              <span>Preview PDF</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700 mt-1">
                            No resume on profile yet. Please choose option 2 below to upload.
                          </p>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Upload new resume for this application */}
                  <label
                    className={`block p-4 rounded-2xl border-2 cursor-pointer transition ${
                      resumeSource === 'upload'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="resumeSource"
                        checked={resumeSource === 'upload'}
                        onChange={() => setResumeSource('upload')}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-bold text-gray-900 block">
                          Upload a New / Tailored Resume for this Job
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Attach an updated PDF or DOCX specifically targeted for {job.title}.
                        </p>

                        {resumeSource === 'upload' && (
                          <div className="mt-3 space-y-2">
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-white transition bg-white">
                              <div className="flex flex-col items-center justify-center p-2 text-center">
                                {customResumeFile ? (
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                    <FileCheck className="w-4 h-4" />
                                    <span className="truncate max-w-xs">{customResumeFile.name}</span>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud className="w-5 h-5 text-indigo-500 mb-1" />
                                    <p className="text-xs text-gray-600">
                                      <span className="text-blue-600 font-semibold">Choose file</span> or drop here
                                    </p>
                                    <p className="text-[10px] text-gray-400">PDF, DOC, DOCX up to 5MB</p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => setCustomResumeFile(e.target.files[0])}
                              />
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 pt-1">
                              <input
                                type="checkbox"
                                checked={updateProfileWithResume}
                                onChange={(e) => setUpdateProfileWithResume(e.target.checked)}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                              />
                              <span>Also set this new resume as my platform default profile resume</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                /* ========================================================================= */
                /* STAGE 4: COVER LETTER & FINAL DOSSIER REVIEW */
                /* ========================================================================= */
                <div className="space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600" /> Cover Letter & Final Review
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review your complete application summary before dispatching to hiring managers.
                    </p>
                  </div>

                  {/* Cover Letter Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Candidate Statement / Cover Letter
                    </label>
                    <textarea
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder={`Explain why you are passionate about joining ${job.company} as a ${job.title} and how your experience aligns with their mission...`}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Dossier Summary Card */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2.5">
                    <span className="font-bold text-gray-700 uppercase tracking-wider block text-[11px] border-b border-gray-200 pb-1.5">
                      Application Dossier Summary
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400 block">Candidate Name:</span>
                        <span className="font-semibold text-gray-900">
                          {fullName} {isSingleName ? '(Single-Name / Mononym)' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Contact:</span>
                        <span className="font-semibold text-gray-900">
                          {email} {phone ? `• ${phone}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Experience / Notice:</span>
                        <span className="font-semibold text-gray-900">
                          {yearsOfExperience} • {noticePeriod}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Resume Attached:</span>
                        <span className="font-semibold text-emerald-700">
                          {resumeSource === 'profile'
                            ? `✓ Profile: ${user?.resumeOriginalName || 'Uploaded Resume'}`
                            : `✓ Custom: ${customResumeFile?.name || 'Uploaded File'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledgment */}
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700 pt-1">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>
                      I hereby confirm that all statements provided in this application are accurate and complete.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!submitSuccess && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <button
                  type="button"
                  onClick={currentStage === 1 ? () => setShowWizard(false) : handlePrevStage}
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 transition"
                >
                  {currentStage === 1 ? 'Cancel' : '← Back'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Step {currentStage} of 4</span>
                  {currentStage < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStage}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm"
                    >
                      <span>Next Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Dispatching Application...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobDetails;
