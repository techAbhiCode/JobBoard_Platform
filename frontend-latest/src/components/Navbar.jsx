import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Sparkles, User as UserIcon, LogOut, Menu, X, PlusCircle, ShieldCheck } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:bg-blue-700 transition">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JobBoard
              </span>
            </Link>
          </div>

          {/* Center / Right side: Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium transition">
              Find Jobs
            </Link>

            {/* Candidate specific links */}
            {user?.role === 'Candidate' && (
              <>
                <Link
                  to="/resume-analyzer"
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  AI Resume Analyzer
                </Link>
                <Link to="/candidate" className="text-gray-600 hover:text-blue-600 font-medium transition">
                  My Applications
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-blue-600 font-medium transition">
                  My Profile
                </Link>
              </>
            )}

            {/* Employer specific links */}
            {user?.role === 'Employer' && (
              <Link
                to="/employer"
                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Employer Portal
              </Link>
            )}

            {/* Admin link */}
            {user?.role === 'Admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-800 font-medium px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Panel
              </Link>
            )}

            {/* Auth status buttons */}
            {user ? (
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                <Link
                  to={user.role === 'Candidate' ? '/profile' : user.role === 'Employer' ? '/employer' : '/admin'}
                  className="flex items-center space-x-2 hover:opacity-80 transition"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold border border-gray-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {user.role === 'Employer' && user.companyName ? user.companyName : user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 pt-3 pb-5 space-y-2 shadow-xl animate-fade-in">
          {user && (
            <div className="p-3 bg-gray-50 rounded-xl mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email} • <span className="font-semibold text-blue-600">{user.role}</span></p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
          >
            Home
          </Link>
          <Link
            to="/jobs"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
          >
            Find Jobs
          </Link>

          {user?.role === 'Candidate' && (
            <>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                My Profile & Portfolio
              </Link>
              <Link
                to="/resume-analyzer"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                ✨ AI Resume Analyzer
              </Link>
              <Link
                to="/candidate"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                My Applications
              </Link>
            </>
          )}

          {user?.role === 'Employer' && (
            <Link
              to="/employer"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50"
            >
              Employer Portal
            </Link>
          )}

          {user?.role === 'Admin' && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-600 hover:bg-purple-50"
            >
              Admin Dashboard
            </Link>
          )}

          {!user && (
            <div className="pt-3 border-t border-gray-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 rounded-lg text-gray-700 border border-gray-300 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;