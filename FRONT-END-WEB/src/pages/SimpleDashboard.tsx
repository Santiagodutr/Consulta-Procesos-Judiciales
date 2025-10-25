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
      iconSrc: '/consultar.png',
      iconAlt: 'Consultar procesos',
      href: '/consulta',
      iconBg: 'bg-blue-300 border border-blue-500',
    },
    {
      title: 'Mis Procesos',
      description: 'Ver procesos guardados',
      iconSrc: '/misProcesos.png',
      iconAlt: 'Mis procesos',
      href: '/processes',
      iconBg: 'bg-yellow-100 border border-yellow-300',
    },
    {
      title: 'Análisis',
      description: 'Ver estadísticas y reportes',
      iconSrc: '/analyitics.png',
      iconAlt: 'Analíticas',
      href: '/analytics',
      iconBg: 'bg-purple-300 border border-purple-500',
    },
    {
      title: 'Configuración',
      description: 'Gestionar perfil y notificaciones',
      iconSrc: '/config.png',
      iconAlt: 'Configuración',
      href: '/profile',
      iconBg: 'bg-orange-300 border border-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-neutral">
      {/* Header */}
      <div className="bg-primary-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <img src="/logo_justitrack.png" alt="JustiTrack" className="h-14 w-auto" />
            
            <div className="flex items-center space-x-4">
              <Link
                to="/notifications"
                className="p-2 text-white/90 hover:text-white rounded-full hover:bg-white/20"
                title="Notificaciones"
              >
                <img src="/notificaciones.png" alt="Notificaciones" className="h-6 w-6" />
              </Link>
              
              <Link
                to="/profile"
                className="p-2 text-white/90 hover:text-white rounded-full hover:bg-white/20"
                title="Perfil"
              >
                <img src="/usuario.png" alt="Perfil" className="h-6 w-6" />
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 text-white/90 hover:text-white rounded-full hover:bg-white/20"
                title="Cerrar sesión"
              >
                <img src="/log-out.png" alt="Cerrar sesión" className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.first_name || 'Usuario'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Aquí tienes un resumen actualizado de tus procesos judiciales.
          </p>
        </div>

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
                className="relative rounded-lg border border-brand-accent bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-brand-primary hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
              >
                <div className={`flex-shrink-0 rounded-lg ${action.iconBg} p-3 flex items-center justify-center`}> 
                  <img src={action.iconSrc} alt={action.iconAlt} className="h-8 w-8 object-contain" />
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
                    <img src="/totalConsult.png" alt="Total consultas" className="h-10 w-10 object-contain" />
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
                    <img src="/procesosActivos.png" alt="Procesos activos" className="h-10 w-10 object-contain" />
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
                    <img src="/notificaciones.png" alt="Notificaciones" className="h-10 w-10 object-contain" />
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
                    <img src="/calendar.png" alt="Última consulta" className="h-10 w-10 object-contain" />
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
                <img src="/process.png" alt="Cargando historial" className="h-16 w-16 mx-auto mb-4 object-contain" />
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            ) : consultationHistory.length === 0 ? (
              <div className="text-center py-12">
                <img src="/process.png" alt="Sin consultas" className="h-20 w-20 mx-auto mb-4 object-contain" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay consultas recientes
                </h3>
                <p className="text-gray-500 mb-4">
                  Cuando consultes procesos, aparecerán aquí.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary"
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
                              <p className="text-sm font-medium text-brand-primary truncate">
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
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
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