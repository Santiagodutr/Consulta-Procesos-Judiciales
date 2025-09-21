import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Process {
  id: string;
  processNumber: string;
  court: string;
  processType: string;
  subject: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  isMonitored: boolean;
}

export const ProcessesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch processes using React Query
  const {
    data: processes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['processes', user?.id],
    queryFn: async () => {
      // Mock data for now
      const mockProcesses: Process[] = [
        {
          id: '1',
          processNumber: '2024-00123',
          court: 'Juzgado 1º Civil del Circuito de Bogotá',
          processType: 'Ejecutivo',
          subject: 'Cobro Ejecutivo de Obligaciones',
          status: 'Activo',
          role: 'Demandante',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:20:00Z',
          lastActivity: 'Admisión de demanda',
          isMonitored: true
        },
        {
          id: '2',
          processNumber: '2024-00098',
          court: 'Juzgado 2º Civil del Circuito de Bogotá',
          processType: 'Ordinario',
          subject: 'Nulidad de Contrato',
          status: 'Suspendido',
          role: 'Demandado',
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-18T16:45:00Z',
          lastActivity: 'Traslado de demanda',
          isMonitored: false
        },
        {
          id: '3',
          processNumber: '2024-00076',
          court: 'Juzgado 3º Laboral del Circuito de Bogotá',
          processType: 'Laboral',
          subject: 'Reintegro Laboral',
          status: 'Activo',
          role: 'Demandante',
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-19T13:30:00Z',
          lastActivity: 'Audiencia programada',
          isMonitored: true
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockProcesses;
    },
    enabled: !!user
  });

  // Filter processes based on search and filters
  const filteredProcesses = processes.filter((process) => {
    const matchesSearch = process.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.court.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || process.status.toLowerCase() === filterStatus;
    const matchesRole = filterRole === 'all' || process.role.toLowerCase() === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const toggleMonitoring = async (processId: string, currentStatus: boolean) => {
    try {
      // Here you would call your API to toggle monitoring
      // await toggleProcessMonitoring(processId, !currentStatus);
      
      toast.success(`Monitoreo ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      refetch(); // Refresh the data
    } catch (error) {
      toast.error('Error al cambiar el estado de monitoreo');
    }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar procesos</h2>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Procesos Judiciales</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona y monitorea tus procesos judiciales en tiempo real
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/processes/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar Proceso
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar procesos
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Número, asunto o juzgado..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="terminado">Terminado</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="demandante">Demandante</option>
              <option value="demandado">Demandado</option>
              <option value="tercero">Tercero</option>
              <option value="apoderado">Apoderado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando {filteredProcesses.length} de {processes.length} procesos
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Monitoreado
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Sin monitoreo
            </span>
          </div>
        </div>
      </div>

      {/* Processes List */}
      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredProcesses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay procesos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterRole !== 'all'
              ? 'No se encontraron procesos que coincidan con los filtros.'
              : 'Comienza agregando tu primer proceso judicial.'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && filterRole === 'all' && (
            <div className="mt-6">
              <Link
                to="/processes/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Proceso
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredProcesses.map((process) => (
              <li key={process.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {process.processNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                          {process.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(process.role)}`}>
                          {process.role}
                        </span>
                        {process.isMonitored && (
                          <span className="inline-flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                      </div>
                      
                      {process.lastActivity && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">Última actividad:</p>
                          <p className="text-sm text-gray-700">{process.lastActivity}</p>
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>Actualizado: {new Date(process.updatedAt).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {/* Toggle Monitoring */}
                      <button
                        onClick={() => toggleMonitoring(process.id, process.isMonitored)}
                        className={`p-2 rounded-md transition-colors ${
                          process.isMonitored
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                        title={process.isMonitored ? 'Desactivar monitoreo' : 'Activar monitoreo'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      {/* View Details */}
                      <Link
                        to={`/processes/${process.id}`}
                        className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};