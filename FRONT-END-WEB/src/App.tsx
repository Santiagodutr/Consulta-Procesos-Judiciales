import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';
import { SimpleDashboard } from './pages/SimpleDashboard.tsx';
import { ProcessDetailsPage } from './pages/ProcessDetailsPage.tsx';
import MyProcessesPage from './pages/MyProcessesPage.tsx';
import AnalyticsPage from './pages/AnalyticsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { MainLayout } from './components/MainLayout.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { PublicFooter } from './components/PublicFooter.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import { WelcomePage } from './pages/WelcomePage.tsx';


function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <Routes>
        {/* Página de bienvenida pública */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireAuth={false}>
              <WelcomePage />
            </ProtectedRoute>
          }
        />

        {/* Rutas de autenticación */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute requireAuth={false}>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ResetPasswordPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas - REQUIEREN LOGIN */}
        <Route
          path="/consulta"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SimpleDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/process/:numeroRadicacion"
          element={
            <ProtectedRoute>
              <ProcessDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas de placeholder para las otras páginas */}
        <Route
          path="/processes"
          element={
            <ProtectedRoute>
              <MyProcessesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;