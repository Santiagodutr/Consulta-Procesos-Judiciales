import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { judicialAPI } from '../services/apiService.ts';

interface ProcessData {
  numero_radicacion: string;
  fecha_radicacion: string;
  fecha_proceso: string;
  fecha_ultima_actuacion: string;
  despacho: string;
  departamento: string;
  tipo_proceso: string;
  demandante: string;
  demandado: string;
  sujetos_procesales: string;
  cantidad_folios: number;
  es_privado: boolean;
  estado: string;
  actuaciones: any[];
  sujetos: any[];
}

export const ProcessDetailsPage: React.FC = () => {
  const { numeroRadicacion } = useParams<{ numeroRadicacion: string }>();
  const navigate = useNavigate();
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (numeroRadicacion) {
      loadProcessDetails();
    }
  }, [numeroRadicacion]);

  const loadProcessDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await judicialAPI.consultProcess(numeroRadicacion || '', false);
      
      if (response.success && response.data) {
        setProcessData(response.data);
      } else {
        setError('No se pudo cargar la información del proceso');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el proceso');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⏳</span>
          <p className="text-gray-600">Cargando información del proceso...</p>
        </div>
      </div>
    );
  }

  if (error || !processData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                ← Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Proceso: {processData.numero_radicacion}
              </h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              processData.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {processData.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Información General */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Despacho</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.despacho}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Departamento</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.departamento || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo de Proceso</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.tipo_proceso || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Radicación</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {processData.fecha_radicacion ? new Date(processData.fecha_radicacion).toLocaleDateString('es-CO') : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Última Actuación</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {processData.fecha_ultima_actuacion ? new Date(processData.fecha_ultima_actuacion).toLocaleDateString('es-CO') : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cantidad de Folios</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.cantidad_folios || 0}</dd>
            </div>
          </div>
        </div>

        {/* Partes del Proceso */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Partes del Proceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Demandante</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.demandante}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Demandado</dt>
              <dd className="mt-1 text-sm text-gray-900">{processData.demandado}</dd>
            </div>
          </div>
        </div>

        {/* Actuaciones */}
        {processData.actuaciones && processData.actuaciones.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Actuaciones ({processData.actuaciones.length})
            </h2>
            <div className="space-y-4">
              {processData.actuaciones.slice(0, 5).map((actuacion: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-900">
                    {actuacion.actuacion || actuacion.fechaActuacion}
                  </p>
                  {actuacion.anotacion && (
                    <p className="text-sm text-gray-600 mt-1">{actuacion.anotacion}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {actuacion.fechaActuacion ? new Date(actuacion.fechaActuacion).toLocaleDateString('es-CO') : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
