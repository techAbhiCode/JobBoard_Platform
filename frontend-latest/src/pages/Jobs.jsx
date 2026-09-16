import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { calculateJobMatch } from '../utils/matchCalculator';
import { Search, MapPin, Filter, RotateCcw, Briefcase, Sparkles, UserCheck } from 'lucide-react';

const JOB_TYPES = ['All', 'Full-Time', 'Part-Time', 'Contract', 'Internship'];
const MATCH_FILTERS = ['All Matches', 'Strong Match', 'Good Match', 'Low Match'];

const Jobs = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const initialLocation = searchParams.get('location') || '';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState('All');
  const [matchFilter, setMatchFilter] = useState('All Matches');

  const fetchJobs = useCallback(async (filterKeyword = keyword, filterLocation = location, filterType = jobType) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterKeyword.trim()) params.keyword = filterKeyword.trim();
      if (filterLocation.trim()) params.location = filterLocation.trim();
      if (filterType && filterType !== 'All') params.jobType = filterType;

      const response = await apiClient.get('/jobs', { params });
      
      // Backend returns { success: true, count: X, data: [...] }
      if (response.data && Array.isArray(response.data.data)) {
        setJobs(response.data.data);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to retrieve jobs. Please check if the backend service is reachable.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, location, jobType]);

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const params = {};
        if (initialKeyword.trim()) params.keyword = initialKeyword.trim();
        if (initialLocation.trim()) params.location = initialLocation.trim();

        const response = await apiClient.get('/jobs', { params });
        if (isMounted) {
          if (response.data && Array.isArray(response.data.data)) {
            setJobs(response.data.data);
          } else {
            setJobs([]);
          }
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        if (isMounted) {
          setError('Unable to retrieve jobs. Please check if the backend service is reachable.');
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [initialKeyword, initialLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = {};
    if (keyword.trim()) nextParams.keyword = keyword.trim();
    if (location.trim()) nextParams.location = location.trim();
    setSearchParams(nextParams);

    fetchJobs(keyword, location, jobType);
  };

  const handleTypeSelect = (type) => {
    setJobType(type);
    fetchJobs(keyword, location, type);
  };

  const handleReset = () => {
    setKeyword('');
    setLocation('');
    setJobType('All');
    setMatchFilter('All Matches');
    setSearchParams({});
    fetchJobs('', '', 'All');
  };

  // Filter jobs by candidate profile match if candidate is signed in
  const displayedJobs = jobs.filter((job) => {
    if (matchFilter === 'All Matches' || user?.role !== 'Candidate') return true;
    const storedMatch = Array.isArray(user?.jobMatches)
      ? user.jobMatches.find(
          (m) =>
            (m.jobId?._id || m.jobId)?.toString() === (job._id || job.id)?.toString()
        )
      : null;
    const category = storedMatch ? storedMatch.category : calculateJobMatch(job, user)?.category;
    return category === matchFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Job Openings</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Find the right role tailored to your profile, skills, and portfolio.
          </p>
        </div>

        {/* Search Inputs */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Job title, tech stack, or company..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm sm:text-base transition"
            />
          </div>

          <div className="flex-1 relative">
            <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Location or 'Remote'..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm sm:text-base transition"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-sm"
            >
              Search
            </button>
            {(keyword || location || jobType !== 'All' || matchFilter !== 'All Matches') && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset filters"
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Filters: Job Type & Candidate Match Filter */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {/* Job Type Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {JOB_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  jobType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Candidate AI Match Filter (Shown when signed in as Candidate) */}
          {user?.role === 'Candidate' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Profile Fit:
              </span>
              {MATCH_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMatchFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    matchFilter === cat
                      ? cat === 'Strong Match'
                        ? 'bg-green-600 text-white shadow-sm'
                        : cat === 'Good Match'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : cat === 'Low Match'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <Link
                to="/profile"
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Manage Profile Skills & Projects</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-gray-600">
          Showing <span className="text-gray-900 font-bold">{displayedJobs.length}</span>{' '}
          {displayedJobs.length === 1 ? 'position' : 'positions'}
          {matchFilter !== 'All Matches' && ` (${matchFilter})`}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded mt-4"></div>
            </div>
          ))}
        </div>
      ) : displayedJobs.length > 0 ? (
        /* Jobs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No matching jobs found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {matchFilter !== 'All Matches'
              ? `No jobs match the '${matchFilter}' category with your current profile skills and projects.`
              : 'Try tweaking your keyword, broadening your location, or selecting another job type filter.'}
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm pt-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;