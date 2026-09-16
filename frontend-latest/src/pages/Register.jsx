import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Lock, Mail, User, Building, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Candidate',
    companyName: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.role === 'Employer' && !formData.companyName.trim()) {
      setError('Company name is required for Employer accounts.');
      return;
    }

    setSubmitting(true);

    try {
      const newUser = await register(formData);
      if (newUser?.role === 'Employer') {
        navigate('/employer');
      } else if (newUser?.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] animate-fade-in py-8 px-4">
      <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join as a job seeker or hiring team</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Sarah Connor"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah@example.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
              />
            </div>
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-1.5">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: 'Candidate' }))}
                className={`py-3 px-4 rounded-xl text-sm font-semibold border text-center transition ${
                  formData.role === 'Candidate'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Find Jobs (Candidate)
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: 'Employer' }))}
                className={`py-3 px-4 rounded-xl text-sm font-semibold border text-center transition ${
                  formData.role === 'Employer'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hire Talent (Employer)
              </button>
            </div>
          </div>

          {/* Conditional Company Name */}
          {formData.role === 'Employer' && (
            <div className="animate-fade-in pt-1">
              <label className="block text-gray-800 text-sm font-semibold mb-1.5">Company Name</label>
              <div className="relative">
                <Building className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="companyName"
                  required={formData.role === 'Employer'}
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Innovations Inc."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100 text-sm text-gray-500">
          <span>Already registered? </span>
          <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

