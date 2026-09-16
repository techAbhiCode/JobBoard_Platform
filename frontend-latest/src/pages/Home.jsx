import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { Search, MapPin, Sparkles, Briefcase, Zap, Shield, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';

function Home() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [latestJobs, setLatestJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestJobs = async () => {
      try {
        const res = await apiClient.get('/jobs');
        if (res.data?.data) {
          setLatestJobs(res.data.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Error loading latest jobs on home:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location.trim()) params.append('location', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-indigo-700 to-purple-500 text-white p-8 sm:p-14 shadow-xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs sm:text-sm font-semibold mb-6 border border-white/10">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Next-Gen AI Powered Job Search & Resume Analysis</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Find Your Next Career Move with{' '}
            <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Confidence
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 font-light mb-10 max-w-2xl mx-auto">
            Discover roles matched to your unique profile, score your resume against real job descriptions, and apply in seconds.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto"
          >
            <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Job title, keywords, or company..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full text-gray-800 focus:outline-none placeholder-gray-400 text-sm sm:text-base font-normal bg-transparent"
              />
            </div>

            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="City, country, or 'remote'..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-gray-800 focus:outline-none placeholder-gray-400 text-sm sm:text-base font-normal bg-transparent"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-md shadow-blue-500/20 text-sm sm:text-base"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </div>

      {/* Feature Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Deep AI Resume Scorer</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Upload your PDF resume to receive ATS scores, missing keywords, and actionable recruiter feedback tailored to any role.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Fit Evaluation</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            See your personalized match score (0-100) before you apply, complete with strengths and gap insights.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-5">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Direct Employer Portal</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Employers post positions, review verified candidates, download resumes, and manage application statuses in real time.
          </p>
        </div>
      </div>

      {/* Latest Jobs Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Explore Opportunities</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Job Openings</h2>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm group"
          >
            <span>View All Jobs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : latestJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">No job openings found at the moment. Check back soon!</p>
          </div>
        )}
      </div>

      {/* Split CTA Section */}
      {user?.role === 'Admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin Control Center CTA */}
          <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-purple-900/40 shadow-xl">
            <div>
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Platform Administration
              </span>
              <h3 className="text-2xl font-bold mt-2 mb-3">Admin Control Center</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Manage registered users, inspect job applications, and monitor platform activity in real-time.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition w-fit shadow-md shadow-purple-900/40"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Admin Console</span>
            </Link>
          </div>

          {/* Audit Job Listings CTA */}
          <div className="bg-gradient-to-br from-slate-900 to-gray-800 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-gray-800 shadow-xl">
            <div>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-400" /> Audit Listings
              </span>
              <h3 className="text-2xl font-bold mt-2 mb-3">Inspect Platform Jobs</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                View all published job listings across employers to verify compliance and audit company details.
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition w-fit shadow-md shadow-blue-900/40"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Active Jobs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Candidate CTA */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <span className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Candidate Toolkit</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-3">Optimize Your Resume with AI</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Compare your current resume against job descriptions to discover what ATS scanners look for and boost your interview callback rate.
              </p>
            </div>
            <Link
              to="/resume-analyzer"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition w-fit shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Try Resume Analyzer</span>
            </Link>
          </div>

          {/* Employer CTA */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">For Hiring Teams</span>
              <h3 className="text-2xl font-bold mt-2 mb-3">Looking to Hire Top Talent?</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Publish your openings to our qualified community, review applicants with AI skill matching, and manage your pipeline efficiently.
              </p>
            </div>
            <Link
              to="/employer"
              className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-600 transition w-fit shadow-md shadow-blue-500/20"
            >
              <Briefcase className="w-4 h-4" />
              <span>Post a Job Today</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;