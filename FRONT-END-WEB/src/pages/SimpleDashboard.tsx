import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { judicialAPI } from '../services/apiService.ts';

interface ConsultationHistoryItem {
  consultation_id: string;
  process_id: string;
  numero_radicacion: string;
  despacho: string;
  demandante: string;
  demandado: string;
  consulted_at: string;
}

export const SimpleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultationHistory();
  }, []);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);
      const response = await judicialAPI.getConsultationHistory(10);
      if (response.success && response.data) {
        setConsultationHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading consultation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };

  const quickActions = [
    {
      title: 'Consultar Procesos',
      description: 'Buscar procesos judiciales por número de radicación',
      icon: '�',
      href: '/consulta',
      color: 'bg-blue-500',
    },
    {
      title: 'Mis Procesos',
      description: 'Ver procesos guardados',
      icon: '📊',
      href: '/processes',
      color: 'bg-green-500',
    },
    {
      title: 'Análisis',
      description: 'Ver estadísticas y reportes',
      icon: '📈',
      href: '/analytics',
      color: 'bg-purple-500',
    },
    {
      title: 'Configuración',
      description: 'Gestionar perfil y notificaciones',
      icon: '⚙️',
      href: '/profile',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {user?.first_name || 'Usuario'}!
              </h1>
              <p className="text-gray-600">
                Aquí tienes un resumen de tus procesos judiciales.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/notifications"
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                title="Notificaciones"
              >
                <span className="text-xl">🔔</span>
              </Link>
              
              <Link
                to="/profile"
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                title="Perfil"
              >
                <span className="text-xl">👤</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                title="Cerrar sesión"
              >
                <span className="text-xl">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <div className={`flex-shrink-0 rounded-lg ${action.color} p-3`}>
                  <span className="text-white text-xl">{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {action.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Resumen General
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Consultas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {consultationHistory.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Procesos Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {consultationHistory.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Notificaciones
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Última Consulta
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {consultationHistory.length > 0 
                          ? new Date(consultationHistory[0].consulted_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short'
                            })
                          : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Historial de Consultas
          </h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">⏳</span>
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            ) : consultationHistory.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📋</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay consultas recientes
                </h3>
                <p className="text-gray-500 mb-4">
                  Cuando consultes procesos, aparecerán aquí.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Consultar Procesos
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {consultationHistory.map((item) => (
                  <li key={item.consultation_id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">⚖️</span>
                            <div>
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {item.numero_radicacion}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {item.despacho}
                              </p>
                              {item.demandante && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Demandante: {item.demandante}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                          <span className="text-xs text-gray-400">
                            {new Date(item.consulted_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <button
                            onClick={() => navigate(`/process/${item.numero_radicacion}`)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información de Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.first_name} {user?.last_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo de usuario</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.user_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};