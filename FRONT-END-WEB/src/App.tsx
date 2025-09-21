import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Main pages
import { DashboardPage } from './pages/DashboardPage';
import { ProcessesPage } from './pages/processes/ProcessesPage';
import { CreateProcessPage } from './pages/processes/CreateProcessPage';
import { ProcessDetailPage } from './pages/processes/ProcessDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CompanyPage } from './pages/CompanyPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes - redirect to dashboard if authenticated */}
            <Route path="/login" element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            } />
            <Route path="/register" element={
              <ProtectedRoute requireAuth={false}>
                <RegisterPage />
              </ProtectedRoute>
            } />
            <Route path="/forgot-password" element={
              <ProtectedRoute requireAuth={false}>
                <ForgotPasswordPage />
              </ProtectedRoute>
            } />
            <Route path="/reset-password" element={
              <ProtectedRoute requireAuth={false}>
                <ResetPasswordPage />
              </ProtectedRoute>
            } />
            <Route path="/verify-email/:token" element={
              <ProtectedRoute requireAuth={false}>
                <VerifyEmailPage />
              </ProtectedRoute>
            } />

            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Process routes */}
              <Route path="processes" element={<ProcessesPage />} />
              <Route path="processes/create" element={<CreateProcessPage />} />
              <Route path="processes/:id" element={<ProcessDetailPage />} />
              
              {/* Other protected routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="company" element={<CompanyPage />} />
            </Route>

            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;