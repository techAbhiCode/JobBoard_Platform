import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Building, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateJobMatch } from '../utils/matchCalculator';

const JobCard = ({ job }) => {
  const { user } = useAuth();

  if (!job) return null;

  // Read persisted match score from database first
  const storedMatch =
    user?.role === 'Candidate' && Array.isArray(user?.jobMatches)
      ? user.jobMatches.find(
          (m) =>
            (m.jobId?._id || m.jobId)?.toString() === (job._id || job.id)?.toString()
        )
      : null;

  // Use stored DB match; fallback to client calculator if awaiting first recalculation
  const matchResult = storedMatch
    ? {
        score: storedMatch.score,
        category: storedMatch.category,
        matchedSkills: storedMatch.matchedSkills || [],
        reason: storedMatch.reasoning,
        isStored: true,
      }
    : user?.role === 'Candidate'
    ? calculateJobMatch(job, user)
    : null;

  const getMatchBadgeStyle = (category) => {
    switch (category) {
      case 'Strong Match':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Good Match':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-100 transition duration-300 flex flex-col justify-between group relative">
      <div>
        {/* Candidate Match Suggestion Tag */}
        {matchResult && (
          <div className="mb-3.5 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getMatchBadgeStyle(
                matchResult.category
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {matchResult.category} ({matchResult.score}%)
              </span>
            </span>
            {matchResult.matchedSkills.length > 0 && (
              <span className="text-[11px] text-gray-400 font-medium">
                {matchResult.matchedSkills.length} skill{matchResult.matchedSkills.length > 1 ? 's' : ''} matched
              </span>
            )}
          </div>
        )}

        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-xl shrink-0">
              {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {job.title}
              </h2>
              <p className="text-gray-600 font-medium text-sm flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                {job.company}
              </p>
            </div>
          </div>

          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0 border border-blue-100">
            {job.jobType || 'Full-Time'}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{job.location || 'Remote'}</span>
          </div>
          {job.salary ? (
            <div className="flex items-center gap-1.5 truncate text-green-700 font-medium">
              <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
              <span className="truncate">{job.salary}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Competitive</span>
            </div>
          )}
        </div>

        {/* Skills required preview */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skillsRequired.slice(0, 3).map((skill, idx) => {
              const isMatched = matchResult?.matchedSkills?.some(
                (ms) => ms.toLowerCase() === skill.toLowerCase()
              );
              return (
                <span
                  key={idx}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-md border truncate max-w-40 ${
                    isMatched
                      ? 'bg-green-50 text-green-800 border-green-200 font-semibold'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {job.skillsRequired.length > 3 && (
              <span className="text-xs text-gray-400 font-medium self-center">
                +{job.skillsRequired.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-2">
        <Link
          to={`/jobs/${job._id}`}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-600 hover:text-white transition duration-300 group-hover:bg-blue-600 group-hover:text-white"
        >
          <span>{user?.role === 'Admin' ? 'Inspect Listing' : user?.role === 'Candidate' ? 'View Details & Match' : 'View Job Details'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default JobCard;