import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';
import { SimpleDashboard } from './pages/SimpleDashboard.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { useAuth } from './contexts/AuthContext.tsx';

// Página de bienvenida pública
const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header oficial */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏛️</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-800">
                  CONSULTA DE PROCESOS
                </h1>
                <h2 className="text-xl font-semibold text-blue-700">
                  NACIONAL UNIFICADA
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-lg">🇨🇴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Consultas Directas</h4>
            <p className="text-gray-600">
              Información en tiempo real desde el portal oficial de la Rama Judicial
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Historial Completo</h4>
            <p className="text-gray-600">
              Mantén un registro de todas tus consultas y procesos de interés
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Seguro y Confiable</h4>
            <p className="text-gray-600">
              Acceso seguro con autenticación y protección de datos personales
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <span className="text-2xl">🏛️</span>
              <span className="font-semibold">Rama Judicial del Poder Público</span>
              <span className="text-2xl">🇨🇴</span>
            </div>
            <p className="text-sm">
              Sistema desarrollado para consulta de procesos del sistema judicial colombiano
            </p>
          </div>
        </div>
      </footer>
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
      
      {/* Rutas de placeholder para las otras páginas */}
      <Route 
        path="/processes" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Procesos</h1>
                <p className="text-gray-600">Esta página está en desarrollo.</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Análisis</h1>
                <p className="text-gray-600">Esta página está en desarrollo.</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Perfil</h1>
                <p className="text-gray-600">Esta página está en desarrollo.</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Notificaciones</h1>
                <p className="text-gray-600">Esta página está en desarrollo.</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;