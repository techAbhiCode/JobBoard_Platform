import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import Profile from './pages/Profile';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminAuth from './pages/AdminAuth';

// Conditionally render footer (hidden on all admin routes)
function ConditionalFooter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) return null;
  return <Footer />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-50/50 text-gray-900 selection:bg-blue-100 selection:text-blue-900">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <Routes>
              {/* Public Browsing Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />

              {/* Public Auth Routes (Inaccessible if already logged in) */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/admin/login"
                element={
                  <PublicOnlyRoute>
                    <AdminAuth />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/admin/portal"
                element={
                  <PublicOnlyRoute>
                    <AdminAuth />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/admin-login"
                element={
                  <PublicOnlyRoute>
                    <AdminAuth />
                  </PublicOnlyRoute>
                }
              />

              {/* Candidate Protected Routes */}
              <Route
                path="/candidate"
                element={
                  <ProtectedRoute allowedRoles={['Candidate']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['Candidate']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-analyzer"
                element={
                  <ProtectedRoute allowedRoles={['Candidate']}>
                    <ResumeAnalyzer />
                  </ProtectedRoute>
                }
              />

              {/* Employer Protected Routes */}
              <Route
                path="/employer"
                element={
                  <ProtectedRoute allowedRoles={['Employer']}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ConditionalFooter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
