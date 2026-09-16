import { Briefcase, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JobBoard
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              An intelligent job discovery and recruitment platform powered by AI matching and deep ATS resume analysis.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">For Candidates</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/jobs" className="hover:text-blue-600 transition">Browse Jobs</Link></li>
              <li><Link to="/resume-analyzer" className="hover:text-blue-600 transition">AI Resume Scorer</Link></li>
              <li><Link to="/candidate" className="hover:text-blue-600 transition">My Applications</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">For Employers</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/employer" className="hover:text-blue-600 transition">Post a Job</Link></li>
              <li><Link to="/employer" className="hover:text-blue-600 transition">Manage Candidates</Link></li>
              <li><Link to="/register" className="hover:text-blue-600 transition">Employer Registration</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Platform</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Featuring automated ATS scoring, LangGraph agent workflows, Redis caching, and real-time candidate matchmaking.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span>API & AI Systems Online</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} JobBoard Platform. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for modern careers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

