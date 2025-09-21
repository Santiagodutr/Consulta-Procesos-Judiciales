import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  monitoredProcesses: number;
  recentActivities: number;
  pendingNotifications: number;
}

interface RecentActivity {
  id: string;
  processNumber: string;
  type: string;
  description: string;
  date: string;
  isNew: boolean;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      // Mock data for now
      return {
        totalProcesses: 12,
        activeProcesses: 8,
        monitoredProcesses: 6,
        recentActivities: 24,
        pendingNotifications: 3
      };
    },
    enabled: !!user
  });

  // Fetch recent activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      // Mock data for now
      return [
        {
          id: '1',
          processNumber: '2024-00123',
          type: 'Auto',
          description: 'Auto de admisión de demanda',
          date: '2024-01-20T14:20:00Z',
          isNew: true
        },
        {
          id: '2',
          processNumber: '2024-00098',
          type: 'Traslado',
          description: 'Traslado de demanda por 20 días',
          date: '2024-01-19T16:45:00Z',
          isNew: true
        },
        {
          id: '3',
          processNumber: '2024-00076',
          type: 'Audiencia',
          description: 'Audiencia de conciliación programada',
          date: '2024-01-18T09:15:00Z',
          isNew: false
        },
        {
          id: '4',
          processNumber: '2024-00045',
          type: 'Sentencia',
          description: 'Sentencia de primera instancia',
          date: '2024-01-17T11:30:00Z',
          isNew: false
        },
        {
          id: '5',
          processNumber: '2024-00034',
          type: 'Notificación',
          description: 'Notificación personal ordenada',
          date: '2024-01-16T15:20:00Z',
          isNew: false
        }
      ];
    },
    enabled: !!user
  });

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    link?: string;
  }> = ({ title, value, icon, color, link }) => {
    const content = (
      <div className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ${link ? 'cursor-pointer' : ''}`}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-md ${color}`}>
                {icon}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd className="text-lg font-medium text-gray-900">{value}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido, {user?.first_name}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Aquí tienes un resumen de tus procesos judiciales
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/processes/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Proceso
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Procesos"
          value={stats?.totalProcesses || 0}
          color="bg-blue-500"
          link="/processes"
          icon={
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Procesos Activos"
          value={stats?.activeProcesses || 0}
          color="bg-green-500"
          link="/processes?status=active"
          icon={
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Monitoreados"
          value={stats?.monitoredProcesses || 0}
          color="bg-yellow-500"
          link="/processes?monitored=true"
          icon={
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        
        <StatCard
          title="Actividades"
          value={stats?.recentActivities || 0}
          color="bg-purple-500"
          link="/analytics"
          icon={
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        
        <StatCard
          title="Notificaciones"
          value={stats?.pendingNotifications || 0}
          color="bg-red-500"
          link="/notifications"
          icon={
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 12a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Actividades Recientes</h2>
              <Link
                to="/processes"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Ver todas →
              </Link>
            </div>
            
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividades</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cuando tengas procesos, sus actividades aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.slice(0, 5).map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== activities.slice(0, 5).length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.isNew ? 'bg-blue-500' : 'bg-gray-400'
                            }`}>
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.processNumber}</span> - {activity.description}
                              </p>
                              <p className="text-sm text-gray-500">{activity.type}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500 flex items-center">
                              <time dateTime={activity.date}>
                                {new Date(activity.date).toLocaleDateString('es-CO')}
                              </time>
                              {activity.isNew && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Nuevo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/processes/create"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Agregar Proceso
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Registra un nuevo proceso judicial para monitoreo
                  </p>
                </div>
              </Link>

              <Link
                to="/analytics"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Ver Análiticas
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Analiza la actividad de tus procesos
                  </p>
                </div>
              </Link>

              <Link
                to="/notifications"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 12a5 5 0 0110 0v3.5" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Configurar Alertas
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Personaliza tus notificaciones
                  </p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Mi Perfil
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Actualiza tu información personal
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tips and Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ¿Sabías que...?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Puedes activar el monitoreo automático para recibir alertas inmediatas</li>
                <li>El sistema verifica actualizaciones diariamente en los portales judiciales</li>
                <li>Puedes compartir procesos con otros usuarios de tu empresa</li>
                <li>Las gráficas de analytics te ayudan a identificar patrones en tus procesos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};