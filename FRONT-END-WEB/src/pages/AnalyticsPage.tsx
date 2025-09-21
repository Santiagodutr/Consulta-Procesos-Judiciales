import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  processStats: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    byMonth: Array<{ month: string; count: number }>;
    byType: Array<{ type: string; count: number; percentage: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
  };
  activityStats: {
    totalActivities: number;
    thisMonth: number;
    lastMonth: number;
    averagePerDay: number;
    byType: Array<{ type: string; count: number }>;
  };
  performanceMetrics: {
    averageResolutionTime: number;
    successRate: number;
    clientSatisfaction: number;
    responseTime: number;
  };
  trends: {
    processGrowth: number;
    activityGrowth: number;
    satisfactionTrend: number;
  };
}

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'processes' | 'activity' | 'performance'>('overview');

  // Fetch analytics data
  const {
    data: analytics,
    isLoading
  } = useQuery({
    queryKey: ['analytics', user?.id, timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      // Mock data for now
      return {
        processStats: {
          total: 47,
          active: 23,
          completed: 18,
          pending: 6,
          byMonth: [
            { month: 'Ene', count: 5 },
            { month: 'Feb', count: 8 },
            { month: 'Mar', count: 12 },
            { month: 'Abr', count: 15 },
            { month: 'May', count: 7 }
          ],
          byType: [
            { type: 'Civil', count: 18, percentage: 38.3 },
            { type: 'Laboral', count: 12, percentage: 25.5 },
            { type: 'Comercial', count: 10, percentage: 21.3 },
            { type: 'Penal', count: 7, percentage: 14.9 }
          ],
          byStatus: [
            { status: 'En tramite', count: 23, percentage: 48.9 },
            { status: 'Terminado', count: 18, percentage: 38.3 },
            { status: 'Suspendido', count: 4, percentage: 8.5 },
            { status: 'Archivado', count: 2, percentage: 4.3 }
          ]
        },
        activityStats: {
          totalActivities: 156,
          thisMonth: 34,
          lastMonth: 28,
          averagePerDay: 1.2,
          byType: [
            { type: 'Auto', count: 45 },
            { type: 'Sentencia', count: 23 },
            { type: 'Providencia', count: 35 },
            { type: 'Resolución', count: 28 },
            { type: 'Otros', count: 25 }
          ]
        },
        performanceMetrics: {
          averageResolutionTime: 125, // days
          successRate: 78.5, // percentage
          clientSatisfaction: 4.3, // out of 5
          responseTime: 2.1 // hours
        },
        trends: {
          processGrowth: 12.5,
          activityGrowth: 21.4,
          satisfactionTrend: 8.7
        }
      };
    },
    enabled: !!user
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return (
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (growth < 0) {
      return (
        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    icon: React.ReactNode;
  }> = ({ title, value, subtitle, trend, icon }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {(subtitle || trend !== undefined) && (
                  <div className="flex items-center space-x-2 mt-1">
                    {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
                    {trend !== undefined && (
                      <div className="flex items-center space-x-1">
                        {getGrowthIcon(trend)}
                        <span className={`text-sm ${getGrowthColor(trend)}`}>
                          {formatPercentage(Math.abs(trend))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const ChartPlaceholder: React.FC<{ title: string; height?: string }> = ({ title, height = "h-64" }) => (
    <div className={`${height} bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center`}>
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">Gráfico interactivo próximamente</p>
      </div>
    </div>
  );

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análiticas y Reportes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualiza el rendimiento y estadísticas de tus procesos jurídicos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Resumen' },
            { key: 'processes', label: 'Procesos' },
            { key: 'activity', label: 'Actividad' },
            { key: 'performance', label: 'Rendimiento' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Procesos"
              value={formatNumber(analytics.processStats.total)}
              trend={analytics.trends.processGrowth}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatCard
              title="Procesos Activos"
              value={formatNumber(analytics.processStats.active)}
              subtitle={`${formatPercentage((analytics.processStats.active / analytics.processStats.total) * 100)}`}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatCard
              title="Actividades"
              value={formatNumber(analytics.activityStats.totalActivities)}
              trend={analytics.trends.activityGrowth}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <StatCard
              title="Tasa de Éxito"
              value={`${analytics.performanceMetrics.successRate}%`}
              trend={analytics.trends.satisfactionTrend}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Procesos por Mes</h3>
              <ChartPlaceholder title="Gráfico de Barras - Procesos por Mes" />
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Tipo</h3>
              <ChartPlaceholder title="Gráfico de Dona - Tipos de Proceso" />
            </div>
          </div>
        </div>
      )}

      {/* Processes Tab */}
      {selectedTab === 'processes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Status Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Estado</h3>
              <div className="space-y-3">
                {analytics.processStats.byStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        status.status === 'En tramite' ? 'bg-blue-500' :
                        status.status === 'Terminado' ? 'bg-green-500' :
                        status.status === 'Suspendido' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{status.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{status.count}</span>
                      <span className="text-sm text-gray-500">({formatPercentage(status.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Types */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Proceso</h3>
              <div className="space-y-3">
                {analytics.processStats.byType.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{type.type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process Timeline */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia de Procesos</h3>
            <ChartPlaceholder title="Gráfico de Líneas - Tendencia Mensual" />
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {selectedTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Actividades"
              value={formatNumber(analytics.activityStats.totalActivities)}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
            />
            <StatCard
              title="Este Mes"
              value={formatNumber(analytics.activityStats.thisMonth)}
              subtitle="actividades"
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              title="Mes Anterior"
              value={formatNumber(analytics.activityStats.lastMonth)}
              subtitle="actividades"
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Promedio Diario"
              value={analytics.activityStats.averagePerDay.toFixed(1)}
              subtitle="actividades/día"
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actividades por Tipo</h3>
            <div className="space-y-3">
              {analytics.activityStats.byType.map((activity) => (
                <div key={activity.type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{activity.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ 
                          width: `${(activity.count / Math.max(...analytics.activityStats.byType.map(a => a.count))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{activity.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Tiempo Promedio"
              value={`${analytics.performanceMetrics.averageResolutionTime} días`}
              subtitle="resolución"
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Tasa de Éxito"
              value={`${analytics.performanceMetrics.successRate}%`}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Satisfacción"
              value={`${analytics.performanceMetrics.clientSatisfaction}/5`}
              trend={analytics.trends.satisfactionTrend}
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
            />
            <StatCard
              title="Tiempo Respuesta"
              value={`${analytics.performanceMetrics.responseTime}h`}
              subtitle="promedio"
              icon={
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Rendimiento</h3>
            <ChartPlaceholder title="Gráfico de Rendimiento - Tendencias" />
          </div>
        </div>
      )}
    </div>
  );
};