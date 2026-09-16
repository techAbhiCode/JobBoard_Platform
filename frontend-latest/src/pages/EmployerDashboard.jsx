import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  PlusCircle,
  Users,
  MapPin,
  DollarSign,
  Trash2,
  X,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

const EmployerDashboard = () => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    company: user?.companyName || '',
    location: '',
    jobType: 'Full-Time',
    salary: '',
    description: '',
    skillsRequired: '',
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // Applicant Drawer/Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchEmployerJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/jobs');
      if (res.data?.data) {
        // Filter jobs posted by this employer
        const myJobs = res.data.data.filter(
          (j) => j.employerId === user?._id || j.employerId?.id === user?._id || j.company === user?.companyName
        );
        setJobs(myJobs);
      }
    } catch (err) {
      console.error('Error loading employer jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadJobs = async () => {
      try {
        const res = await apiClient.get('/jobs');
        if (isMounted && res.data?.data) {
          const myJobs = res.data.data.filter(
            (j) => j.employerId === user?._id || j.employerId?.id === user?._id || j.company === user?.companyName
          );
          setJobs(myJobs);
        }
      } catch (err) {
        console.error('Error loading employer jobs:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);
    setMessage({ text: '', type: '' });

    try {
      const skillsArray = newJob.skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await apiClient.post('/jobs', {
        ...newJob,
        company: newJob.company || user?.companyName || 'Company',
        skillsRequired: skillsArray,
      });

      setMessage({ text: 'Job opening posted successfully!', type: 'success' });
      setShowCreateModal(false);
      setNewJob({
        title: '',
        company: user?.companyName || '',
        location: '',
        jobType: 'Full-Time',
        salary: '',
        description: '',
        skillsRequired: '',
      });
      fetchEmployerJobs();
    } catch (err) {
      console.error('Error creating job:', err);
      setMessage({
        text: err.response?.data?.error || 'Failed to create job posting.',
        type: 'error',
      });
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/jobs/${jobId}`);
      setMessage({ text: 'Job posting deleted.', type: 'success' });
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setMessage({
        text: err.response?.data?.error || 'Failed to delete job.',
        type: 'error',
      });
    }
  };

  const handleViewApplicants = async (job) => {
    setSelectedJob(job);
    setApplicantsLoading(true);
    try {
      const res = await apiClient.get(`/applications/jobs/${job._id}`);
      setApplicants(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching job applicants:', err);
      setApplicants([]);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleUpdateApplicantStatus = async (applicationId, nextStatus) => {
    setUpdatingStatusId(applicationId);
    try {
      await apiClient.put(`/applications/${applicationId}`, { status: nextStatus });
      setApplicants((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status: nextStatus } : app))
      );
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.error || 'Failed to update application status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Hiring Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {user?.companyName ? `${user.companyName} Jobs` : 'Employer Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your active job postings and candidate pipeline</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post New Job</span>
        </button>
      </div>

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

      {/* Posted Jobs List */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900">Active Job Postings ({jobs.length})</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-28"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No job openings posted yet</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Create your first job listing to start receiving applications from qualified candidates.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                      {job.jobType}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        job.status === 'Open'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-green-700 font-semibold">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary}
                      </span>
                    )}
                    <span>Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewApplicants(job)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition"
                  >
                    <Users className="w-4 h-4" />
                    <span>View Applicants</span>
                  </button>

                  <Link
                    to={`/jobs/${job._id}`}
                    target="_blank"
                    className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
                    title="View Job Publicly"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Post a New Job Opening</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-800 text-xs font-bold mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-xs font-bold mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-xs font-bold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="e.g. Remote or San Francisco, CA"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-xs font-bold mb-1">Job Type</label>
                  <select
                    value={newJob.jobType}
                    onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-800 text-xs font-bold mb-1">Compensation / Salary (Optional)</label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="e.g. $120,000 - $150,000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-800 text-xs font-bold mb-1">Skills Required (Comma separated)</label>
                  <input
                    type="text"
                    value={newJob.skillsRequired}
                    onChange={(e) => setNewJob({ ...newJob, skillsRequired: e.target.value })}
                    placeholder="e.g. React, TypeScript, GraphQL, Tailwind CSS"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-800 text-xs font-bold mb-1">Job Description</label>
                  <textarea
                    rows={6}
                    required
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Detailed outline of roles, responsibilities, and team expectations..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
                >
                  {submittingJob ? 'Publishing...' : 'Publish Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW APPLICANTS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Applicants for: <span className="text-blue-600">{selectedJob.title}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Total submissions: <span className="font-semibold">{applicants.length}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {applicantsLoading ? (
                <div className="text-center py-12 text-sm text-gray-500">Loading applicants...</div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  No candidates have applied for this position yet.
                </div>
              ) : (
                applicants.map((app) => (
                  <div
                    key={app._id}
                    className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          {app.candidateId?.name || 'Applicant'}
                        </h4>
                        <p className="text-xs text-gray-500">{app.candidateId?.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-500">Status:</label>
                        <select
                          value={app.status}
                          disabled={updatingStatusId === app._id}
                          onChange={(e) => handleUpdateApplicantStatus(app._id, e.target.value)}
                          className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    {app.coverLetter && (
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-900 block mb-1">Cover Letter:</span>
                        <p className="whitespace-pre-line">{app.coverLetter}</p>
                      </div>
                    )}

                    {/* Candidate Skills */}
                    {app.candidateId?.skills && app.candidateId.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.candidateId.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resume download button */}
                    {app.resumeUrl && (
                      <div className="pt-1">
                        <a
                          href={`http://localhost:5000${app.resumeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-lg transition shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Candidate Resume</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
