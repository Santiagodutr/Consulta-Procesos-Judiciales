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
import { useAuth } from './contexts/AuthContext.tsx';
import { PublicFooter } from './components/PublicFooter.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';

// Página de bienvenida pública
const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header oficial */}
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <img src="/logo_justitrack.png" alt="JustiTrack" className="h-14 w-auto" />
            </div>
            <div className="hidden sm:flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
              Plataforma de gestión y consulta de procesos judiciales
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Consulta de Procesos Judiciales
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accede de forma rápida y segura a la información actualizada de procesos judiciales 
            en Colombia. Consulta directamente desde el portal oficial de la Rama Judicial.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Acceso al Sistema
          </h3>
          <p className="text-gray-600 text-center mb-8">
            Para acceder a las funcionalidades de consulta, necesitas iniciar sesión con tu cuenta.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </a>
            <a 
              href="/register" 
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Crear Cuenta
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/consultar.png" alt="Consultas" className="h-10 w-10 object-contain" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Consultas Directas</h4>
            <p className="text-gray-600">
              Información en tiempo real desde el portal oficial de la Rama Judicial
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/analyitics.png" alt="Analíticas" className="h-10 w-10 object-contain" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Historial Completo</h4>
            <p className="text-gray-600">
              Mantén un registro de todas tus consultas y procesos de interés
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/lock.png" alt="Seguridad" className="h-10 w-10 object-contain" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Seguro y Confiable</h4>
            <p className="text-gray-600">
              Acceso seguro con autenticación y protección de datos personales
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};

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
  );
}

export default App;