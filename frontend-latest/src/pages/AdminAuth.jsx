import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, User, AlertCircle, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

const AdminAuth = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [adminEmailHint, setAdminEmailHint] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check if an Admin is already provisioned
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await apiClient.get('/admin/auth/status');
        if (isMounted && res.data) {
          setHasAdmin(Boolean(res.data.hasAdmin));
          if (res.data.adminEmail) {
            setAdminEmailHint(res.data.adminEmail);
          }
        }
      } catch (err) {
        console.error('Failed to verify admin status:', err);
      } finally {
        if (isMounted) setLoadingStatus(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!hasAdmin) {
      // One-time Setup validation
      if (!name.trim()) {
        setError('Please provide your full administrator name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await apiClient.post('/admin/auth/init', {
          name,
          email,
          password,
        });

        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          setUser(res.data.user);
          setSuccessMsg('Master Admin account created! Redirecting to Admin Console...');
          setTimeout(() => {
            navigate('/admin');
          }, 1200);
        }
      } catch (err) {
        console.error('Admin init error:', err);
        setError(
          err.response?.data?.error ||
          (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
            ? 'Cannot connect to backend server. Please verify backend is running on port 5000.'
            : 'Failed to initialize Master Admin account.')
        );
      } finally {
        setSubmitting(false);
      }
    } else {
      // Existing Admin login
      setSubmitting(true);
      try {
        const res = await apiClient.post('/admin/auth/login', {
          email,
          password,
        });

        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          setUser(res.data.user);
          navigate('/admin');
        }
      } catch (err) {
        console.error('Admin login error:', err);
        setError(
          err.response?.data?.error ||
          (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
            ? 'Cannot connect to backend server. Please verify backend is running on port 5000.'
            : 'Invalid administrator credentials.')
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex justify-center items-center py-28 min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Top Security Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/50 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border backdrop-blur-sm border-purple-400/30 bg-purple-500/20 text-purple-300">
            {hasAdmin ? (
              <>
                <ShieldAlert className="w-3 h-3 text-amber-400" /> Restricted Access
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> One-Time Master Setup
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {hasAdmin ? 'Administrator Portal' : 'Initialize Master Admin'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-sm mx-auto">
            {hasAdmin
              ? 'Authorized platform administrators only. All actions are logged and audited.'
              : 'Establish the primary administrative account. Once claimed, this setup route locks permanently.'}
          </p>
        </div>

        <div className="p-8 sm:p-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasAdmin && (
              <div>
                <label className="block text-gray-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Full Administrator Name *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Master Administrator"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-gray-800 text-xs font-bold uppercase tracking-wider">
                  Admin Email Address *
                </label>
                {hasAdmin && adminEmailHint && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    Registered: {adminEmailHint}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jobboard.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                {hasAdmin ? 'Administrator Password *' : 'Create Master Password *'}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition"
                />
              </div>
            </div>

            {!hasAdmin && (
              <div>
                <label className="block text-gray-800 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Confirm Master Password *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter master password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 mt-6 text-sm"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{hasAdmin ? 'Authenticating...' : 'Initializing Master Admin...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>{hasAdmin ? 'Sign In to Admin Console' : 'Initialize & Lock Master Admin'}</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-gray-900 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Home
            </Link>
            <Link to="/login" className="hover:text-blue-600 font-semibold transition">
              Candidate / Employer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;

