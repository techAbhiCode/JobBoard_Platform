import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Briefcase,
  Code,
  FolderGit2,
  Award,
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Sparkles,
  Phone,
  MapPin,
  Eye,
  Edit3,
  Calendar,
  Building,
} from 'lucide-react';

const COMMON_SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React.js', 'Node.js', 'Express.js',
  'Python', 'FastAPI', 'Django', 'MongoDB', 'PostgreSQL',
  'Tailwind CSS', 'Next.js', 'Docker', 'AWS', 'Git', 'GraphQL', 'REST APIs', 'Redis'
];

const Profile = () => {
  const { user, refreshUser } = useAuth();

  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Profile Fields
  const [isSingleName, setIsSingleName] = useState(false);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // Modal / Inline Add States
  const [showAddExp, setShowAddExp] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '', description: '' });

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProj, setNewProj] = useState({ title: '', link: '', description: '' });

  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', date: '', link: '' });

  // Resume Upload & AI Analysis State
  const [resumeUploading, setResumeUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profRes = await apiClient.get('/profile');
        if (isMounted && profRes.data?.data) {
          const p = profRes.data.data;
          setIsSingleName(Boolean(p.isSingleName));
          setPhone(p.phone || '');
          setLocation(p.location || '');
          setAbout(p.about || '');
          setSkills(Array.isArray(p.skills) ? p.skills : []);
          setExperience(Array.isArray(p.experience) ? p.experience : []);
          setProjects(Array.isArray(p.projects) ? p.projects : []);
          setCertificates(Array.isArray(p.certificates) ? p.certificates : []);
        }

        try {
          const analysisRes = await apiClient.get('/ai/my-analysis');
          if (isMounted && analysisRes?.data?.data) {
            setAiAnalysis(analysisRes.data.data);
          }
        } catch (analysisErr) {
          console.warn('AI analysis profile cache not available:', analysisErr);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate Profile Completeness Percentage
  const calculateCompleteness = () => {
    let score = 0;
    if (about.trim().length > 20) score += 20;
    if (skills.length > 0) score += Math.min(skills.length * 4, 20);
    if (experience.length > 0) score += 20;
    if (projects.length > 0) score += 20;
    if (certificates.length > 0) score += 10;
    if (user?.resumeUrl) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  // Save all profile data to backend
  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await apiClient.put('/profile', {
        about,
        skills,
        experience,
        projects,
        certificates,
        isSingleName,
        phone,
        location,
      });

      setMessage({ text: 'Profile saved successfully! Job match scores have been recalculated and stored in database.', type: 'success' });
      await refreshUser();
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage({
        text: err.response?.data?.error || 'Failed to save profile changes.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Skill Handlers
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Experience Handlers
  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.company || !newExp.role || !newExp.duration) return;
    setExperience((prev) => [...prev, { ...newExp }]);
    setNewExp({ company: '', role: '', duration: '', description: '' });
    setShowAddExp(false);
  };

  const handleRemoveExperience = (index) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // Project Handlers
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProj.title) return;
    setProjects((prev) => [...prev, { ...newProj }]);
    setNewProj({ title: '', link: '', description: '' });
    setShowAddProject(false);
  };

  const handleRemoveProject = (index) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  // Certificate Handlers
  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (!newCert.title || !newCert.issuer) return;
    setCertificates((prev) => [...prev, { ...newCert }]);
    setNewCert({ title: '', issuer: '', date: '', link: '' });
    setShowAddCert(false);
  };

  const handleRemoveCertificate = (index) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
  };

  // Resume Upload Handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeUploading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiClient.post('/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) {
        setMessage({
          text: 'Resume uploaded and saved to profile! Fit scores for open jobs have been updated in your database.',
          type: 'success',
        });
        await refreshUser();
        // Also load updated analysis if available
        try {
          const analysisRes = await apiClient.get('/ai/my-analysis');
          if (analysisRes.data?.data) {
            setAiAnalysis(analysisRes.data.data);
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      setMessage({
        text: err.response?.data?.error || 'Failed to upload resume.',
        type: 'error',
      });
    } finally {
      setResumeUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-blue-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{user?.name}</h1>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View / Edit Mode Toggle */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  mode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  mode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs sm:text-sm transition shadow-sm shadow-blue-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Profile & Match Readiness
            </span>
            <span className={completeness >= 80 ? 'text-green-600' : 'text-amber-600'}>
              {completeness}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 0: PERSONAL & CONTACT INFORMATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Personal & Contact Details</h2>
          </div>
          {isSingleName && (
            <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full border border-purple-100">
              Single-Name (Mononym)
            </span>
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={isSingleName}
                  onChange={(e) => setIsSingleName(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>I use only a single name (no last name / mononym)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 pl-6.5">
                Enable this if you have a single legal name. Application forms and MNC validations will not require a last name.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Current City & Country
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <span className="text-xs text-gray-400 block mb-0.5">Name Format</span>
              <span className="font-semibold text-gray-900">
                {isSingleName ? `${user?.name} (Mononym / Single Name)` : user?.name || 'Standard'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <span className="text-xs text-gray-400 block mb-0.5">Phone</span>
              <span className="font-semibold text-gray-900">{phone || 'Not specified'}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <span className="text-xs text-gray-400 block mb-0.5">Location</span>
              <span className="font-semibold text-gray-900">{location || 'Not specified'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ABOUT / BIO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Professional Summary</h2>
        </div>

        {mode === 'edit' ? (
          <div>
            <textarea
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Write a concise overview of your engineering background, favorite tech stack, and what drives you..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {about || 'No summary provided yet. Switch to Editor mode to add your professional bio.'}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: SKILLS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Technical & Soft Skills</h2>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {skills.length} skills listed
          </span>
        </div>

        {/* Skills Chips */}
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No skills listed yet.</p>
          ) : (
            skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              >
                <span>{skill}</span>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-blue-400 hover:text-red-600 p-0.5"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {/* Skill Add Input (Edit Mode) */}
        {mode === 'edit' && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new skill (e.g. Next.js, PyTorch, GraphQL)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition"
              >
                Add Skill
              </button>
            </div>

            {/* Quick suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Suggested skills to add:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="text-[11px] bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: WORK EXPERIENCE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
          </div>
          {mode === 'edit' && !showAddExp && (
            <button
              type="button"
              onClick={() => setShowAddExp(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Experience
            </button>
          )}
        </div>

        {/* Add Experience Form */}
        {showAddExp && (
          <form onSubmit={handleAddExperience} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900">New Experience Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Engineer"
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jan 2024 - Present, or June 2023 - May 2025"
                  value={newExp.duration}
                  onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Key Responsibilities & Impact</label>
                <textarea
                  rows={3}
                  placeholder="Describe your role, accomplishments, and technologies used..."
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExp(false)}
                className="text-xs px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Add Entry
              </button>
            </div>
          </form>
        )}

        {/* Experience Items */}
        <div className="space-y-4">
          {experience.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No experience records added yet.</p>
          ) : (
            experience.map((exp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/40 space-y-2 relative group"
              >
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                    title="Remove experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pr-6">
                  <h3 className="text-base font-bold text-gray-900">{exp.role}</h3>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {exp.duration}
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {exp.company}
                </p>
                {exp.description && (
                  <p className="text-xs text-gray-700 leading-relaxed pt-1 whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: PROJECTS PORTFOLIO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Featured Projects</h2>
          </div>
          {mode === 'edit' && !showAddProject && (
            <button
              type="button"
              onClick={() => setShowAddProject(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          )}
        </div>

        {/* Add Project Form */}
        {showAddProject && (
          <form onSubmit={handleAddProject} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900">New Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriSync IoT Dashboard"
                  value={newProj.title}
                  onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Project / GitHub Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={newProj.link}
                  onChange={(e) => setNewProj({ ...newProj, link: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Project Description & Tech Stack</label>
                <textarea
                  rows={3}
                  placeholder="Overview of the application, architecture, features, and key technologies used..."
                  value={newProj.description}
                  onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="text-xs px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Add Project
              </button>
            </div>
          </form>
        )}

        {/* Project Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.length === 0 ? (
            <p className="text-xs text-gray-400 italic md:col-span-2">No projects added yet.</p>
          ) : (
            projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/40 space-y-2 relative group"
              >
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                    title="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2 pr-6">
                  <h3 className="text-sm font-bold text-gray-900">{proj.title}</h3>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {proj.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: CERTIFICATES & CREDENTIALS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Certifications & Licenses</h2>
          </div>
          {mode === 'edit' && !showAddCert && (
            <button
              type="button"
              onClick={() => setShowAddCert(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certificate
            </button>
          )}
        </div>

        {/* Add Certificate Form */}
        {showAddCert && (
          <form onSubmit={handleAddCertificate} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-900">New Certificate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issuing Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services, Meta, Coursera"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date / Year</label>
                <input
                  type="text"
                  placeholder="e.g. March 2025"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Credential URL or ID (Optional)</label>
                <input
                  type="url"
                  placeholder="https://coursera.org/verify/..."
                  value={newCert.link}
                  onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCert(false)}
                className="text-xs px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Add Certificate
              </button>
            </div>
          </form>
        )}

        {/* Certificate Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.length === 0 ? (
            <p className="text-xs text-gray-400 italic md:col-span-2">No certifications listed yet.</p>
          ) : (
            certificates.map((cert, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/40 space-y-1 relative group"
              >
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCertificate(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                    title="Remove certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2 pr-6">
                  <h3 className="text-sm font-bold text-gray-900">{cert.title}</h3>
                  {cert.link && (
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-amber-800 font-semibold">{cert.issuer}</p>
                {cert.date && <p className="text-[11px] text-gray-400">Issued: {cert.date}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: RESUME TELEMETRY & UPLOAD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Stored Resume & AI Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Resume file card */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Platform Default Resume
              </span>
              {user?.resumeUrl && (
                <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                  Auto-Fetched on Apply
                </span>
              )}
            </div>

            {user?.resumeUrl ? (
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800 truncate">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="truncate">{user?.resumeOriginalName || 'Uploaded Resume'}</span>
                  </div>
                  <a
                    href={`http://localhost:5000${user.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition shrink-0"
                  >
                    <span>View / Download</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  This resume is saved to your account and automatically populated in any job application form.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-800">
                No resume uploaded yet. Upload a PDF resume to enable 1-click applications and automated job match scoring.
              </div>
            )}

            {mode === 'edit' && (
              <div className="pt-1">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer transition">
                  <UploadCloud className="w-4 h-4" />
                  <span>{resumeUploading ? 'Uploading & Recalculating Matches...' : user?.resumeUrl ? 'Replace / Upload New Resume' : 'Upload Resume PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={resumeUploading}
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </label>
              </div>
            )}
          </div>

          {/* AI Score Badge */}
          {aiAnalysis ? (
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  AI ATS Score
                </span>
                <p className="text-2xl font-black text-gray-900 mt-0.5">
                  {aiAnalysis.overallScore} <span className="text-sm font-semibold text-gray-400">/ 100</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Inferred Experience: <span className="font-semibold">{aiAnalysis.experienceYears} years</span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                  Profile Active
                </span>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
              Upload a PDF resume to trigger automated AI parsing of your skills and strengths.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

