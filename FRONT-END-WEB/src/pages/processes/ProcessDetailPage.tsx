import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface ProcessActivity {
  id: string;
  date: string;
  type: string;
  description: string;
  details?: string;
  status: 'new' | 'read';
}

interface ProcessDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  downloadUrl?: string;
}

interface ProcessDetail {
  id: string;
  processNumber: string;
  court: string;
  processType: string;
  subject: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  description?: string;
  isMonitored: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  activities: ProcessActivity[];
  documents: ProcessDocument[];
  statistics: {
    totalActivities: number;
    lastUpdate: string;
    daysActive: number;
  };
}

export const ProcessDetailPage: React.FC = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'documents'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch process details
  const {
    data: process,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['process', processId],
    queryFn: async (): Promise<ProcessDetail> => {
      // Mock data for now
      const mockProcess: ProcessDetail = {
        id: processId!,
        processNumber: '2024-00123',
        court: 'Juzgado 1º Civil del Circuito de Bogotá',
        processType: 'Ejecutivo',
        subject: 'Cobro Ejecutivo de Obligaciones',
        status: 'Activo',
        role: 'Demandante',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:20:00Z',
        startDate: '2024-01-10',
        description: 'Proceso ejecutivo por incumplimiento de contrato de prestación de servicios',
        isMonitored: true,
        notificationPreferences: {
          email: true,
          sms: false,
          inApp: true
        },
        activities: [
          {
            id: '1',
            date: '2024-01-20T14:20:00Z',
            type: 'Actuación Procesal',
            description: 'Auto de admisión de demanda',
            details: 'Se admite la demanda ejecutiva y se ordena el mandamiento de pago',
            status: 'new'
          },
          {
            id: '2',
            date: '2024-01-18T09:15:00Z',
            type: 'Presentación',
            description: 'Presentación de demanda ejecutiva',
            details: 'Demanda presentada con todos los requisitos legales',
            status: 'read'
          },
          {
            id: '3',
            date: '2024-01-15T16:45:00Z',
            type: 'Reparto',
            description: 'Proceso repartido al juzgado',
            details: 'Asignación inicial del proceso al despacho judicial',
            status: 'read'
          }
        ],
        documents: [
          {
            id: '1',
            name: 'Demanda Ejecutiva.pdf',
            type: 'pdf',
            size: 2458000,
            uploadDate: '2024-01-15T16:45:00Z',
            downloadUrl: '#'
          },
          {
            id: '2',
            name: 'Auto Admisorio.pdf',
            type: 'pdf',
            size: 1234000,
            uploadDate: '2024-01-20T14:20:00Z',
            downloadUrl: '#'
          },
          {
            id: '3',
            name: 'Certificado de Existencia.pdf',
            type: 'pdf',
            size: 890000,
            uploadDate: '2024-01-15T16:45:00Z',
            downloadUrl: '#'
          }
        ],
        statistics: {
          totalActivities: 3,
          lastUpdate: '2024-01-20T14:20:00Z',
          daysActive: 10
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockProcess;
    },
    enabled: !!processId
  });

  const handleManualUpdate = async () => {
    try {
      setIsUpdating(true);
      
      // Here you would call your API to manually trigger an update
      // await triggerProcessUpdate(processId);
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      
      toast.success('Proceso actualizado correctamente');
      refetch();
      
    } catch (error) {
      toast.error('Error al actualizar el proceso');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      // Here you would call your API to toggle monitoring
      // await toggleProcessMonitoring(processId, !process?.isMonitored);
      
      toast.success(`Monitoreo ${process?.isMonitored ? 'desactivado' : 'activado'} correctamente`);
      refetch();
      
    } catch (error) {
      toast.error('Error al cambiar el estado de monitoreo');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'suspendido': return 'bg-yellow-100 text-yellow-800';
      case 'terminado': return 'bg-gray-100 text-gray-800';
      case 'archivado': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'demandante': return 'bg-blue-100 text-blue-800';
      case 'demandado': return 'bg-orange-100 text-orange-800';
      case 'tercero': return 'bg-purple-100 text-purple-800';
      case 'apoderado': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">Cargando detalles del proceso...</p>
        </div>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar el proceso</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar el proceso solicitado</p>
          <Link
            to="/processes"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Volver a Procesos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/processes')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{process.processNumber}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                  {process.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(process.role)}`}>
                  {process.role}
                </span>
                {process.isMonitored && (
                  <span className="inline-flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-xs">Monitoreado</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualUpdate}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {isUpdating ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              onClick={toggleMonitoring}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors ${
                process.isMonitored
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {process.isMonitored ? 'Monitoreo Activo' : 'Activar Monitoreo'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Asunto:</p>
            <p className="text-sm text-gray-700">{process.subject}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Juzgado:</p>
            <p className="text-sm text-gray-700">{process.court}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Tipo:</p>
            <p className="text-sm text-gray-700">{process.processType}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Fecha de inicio:</p>
            <p className="text-sm text-gray-700">
              {process.startDate ? new Date(process.startDate).toLocaleDateString('es-CO') : 'No especificada'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Última actualización:</p>
            <p className="text-sm text-gray-700">
              {new Date(process.updatedAt).toLocaleDateString('es-CO')} a las {new Date(process.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Días activo:</p>
            <p className="text-sm text-gray-700">{process.statistics.daysActive} días</p>
          </div>
        </div>

        {process.description && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">Descripción:</p>
            <p className="text-sm text-gray-700">{process.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'activities'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actuaciones ({process.activities.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documentos ({process.documents.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-500">Total Actuaciones</div>
                      <div className="text-2xl font-bold text-gray-900">{process.statistics.totalActivities}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-500">Días Activo</div>
                      <div className="text-2xl font-bold text-gray-900">{process.statistics.daysActive}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-500">Documentos</div>
                      <div className="text-2xl font-bold text-gray-900">{process.documents.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actividades Recientes</h3>
                <div className="space-y-3">
                  {process.activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${activity.status === 'new' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.type}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.date).toLocaleDateString('es-CO')} - {new Date(activity.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {process.activities.length > 3 && (
                  <button
                    onClick={() => setActiveTab('activities')}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Ver todas las actuaciones →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Todas las Actuaciones</h3>
              {process.activities.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actuaciones</h3>
                  <p className="mt-1 text-sm text-gray-500">Este proceso aún no tiene actuaciones registradas.</p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {process.activities.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== process.activities.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.status === 'new' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}>
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">{activity.description}</span>
                                </p>
                                <p className="text-sm text-gray-500">{activity.type}</p>
                                {activity.details && (
                                  <p className="text-sm text-gray-700 mt-1">{activity.details}</p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={activity.date}>
                                  {new Date(activity.date).toLocaleDateString('es-CO')}
                                  <br />
                                  {new Date(activity.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                </time>
                                {activity.status === 'new' && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Documentos del Proceso</h3>
              {process.documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
                  <p className="mt-1 text-sm text-gray-500">Este proceso aún no tiene documentos registrados.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {process.documents.map((document) => (
                      <li key={document.id}>
                        <div className="px-4 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-8 w-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">{document.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(document.size)} • {new Date(document.uploadDate).toLocaleDateString('es-CO')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {document.downloadUrl && (
                              <a
                                href={document.downloadUrl}
                                className="text-indigo-600 hover:text-indigo-500 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                                title="Descargar documento"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m3 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};