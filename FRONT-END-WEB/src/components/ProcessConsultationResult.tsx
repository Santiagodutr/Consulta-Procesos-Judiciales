import React, { useState } from 'react';
import { AlertCircle, Calendar, MapPin, Users, FileText, Activity, Download, FileDown } from 'lucide-react';
import { judicialPortalService } from '../services/judicialPortalService.ts';

interface ProcessData {
  id?: string;
  numero_radicacion: string;
  fecha_radicacion: string;
  fecha_ultima_actuacion?: string;
  despacho: string;
  departamento?: string;
  tipo_proceso: string;
  demandante: string;
  demandado: string;
  sujetos_procesales?: string;
  estado?: string;
  es_privado?: boolean;
  cantidad_folios?: number;
  portal_url?: string;
  actuaciones?: any[];
  sujetos?: any[];
  documentos?: any[];
}

interface ConsultationResult {
  success: boolean;
  data?: ProcessData;
  error?: string;
  source: 'portal' | 'database';
}

interface Props {
  result: ConsultationResult;
  onNewConsultation: () => void;
}

export const ProcessConsultationResult: React.FC<Props> = ({ result, onNewConsultation }) => {
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  const handleDownloadDOCX = async () => {
    if (!result.data?.numero_radicacion) return;
    
    setIsDownloadingDOCX(true);
    try {
      await judicialPortalService.downloadDOCX(result.data.numero_radicacion, false);
    } catch (error) {
      console.error('Error descargando DOCX:', error);
      alert('Error al descargar el archivo DOCX. Por favor, intente nuevamente.');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!result.data?.numero_radicacion) return;
    
    setIsDownloadingCSV(true);
    try {
      await judicialPortalService.downloadCSV(result.data.numero_radicacion, false);
    } catch (error) {
      console.error('Error descargando CSV:', error);
      alert('Error al descargar el archivo CSV. Por favor, intente nuevamente.');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Proceso no encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {result.error || 'No se encontró información del proceso en el portal oficial'}
          </p>
          <button
            onClick={onNewConsultation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Nueva consulta
          </button>
        </div>
      </div>
    );
  }

  const process = result.data;

  return (
    <div className="space-y-6">
      {/* Header con información del proceso */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Información del Proceso
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Consultado desde: {result.source === 'database' ? 'Base de datos' : 'Portal oficial'}
              </span>
              {process.es_privado && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Proceso Privado
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDOCX}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              title="Descargar en formato DOC"
            >
              {isDownloadingDOCX ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-5 w-5" />
                  <span>DOC</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={isDownloadingCSV}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              title="Descargar en formato CSV"
            >
              {isDownloadingCSV ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>CSV</span>
                </>
              )}
            </button>
            <button
              onClick={onNewConsultation}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Nueva Consulta
            </button>
          </div>
        </div>

        {/* Información básica del proceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Radicación
              </label>
              <p className="text-lg font-mono bg-gray-50 p-2 rounded border">
                {process.numero_radicacion}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha de Radicación
              </label>
              <p className="text-gray-900">
                {new Date(process.fecha_radicacion).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {process.fecha_ultima_actuacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Activity className="inline h-4 w-4 mr-1" />
                  Última Actuación
                </label>
                <p className="text-gray-900">
                  {new Date(process.fecha_ultima_actuacion).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Proceso
              </label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                process.estado === 'Activo' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {process.estado || 'Activo'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Despacho Judicial
              </label>
              <p className="text-gray-900">
                {process.despacho}
              </p>
              {process.departamento && (
                <p className="text-sm text-gray-600 mt-1">
                  {process.departamento}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Proceso
              </label>
              <p className="text-gray-900">
                {process.tipo_proceso}
              </p>
            </div>

            {process.cantidad_folios && process.cantidad_folios > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Cantidad de Folios
                </label>
                <p className="text-gray-900">
                  {process.cantidad_folios} folios
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sujetos procesales */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Sujetos Procesales
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandante
            </label>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-900">
                {process.demandante}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandado
            </label>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-semibold text-red-900">
                {process.demandado}
              </p>
            </div>
          </div>
        </div>

        {process.sujetos_procesales && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Información Completa de Sujetos Procesales
            </label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-line">
                {process.sujetos_procesales.replace(/\|/g, '\n')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actuaciones y documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actuaciones */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Actuaciones Procesales
          </h3>
          
          {process.actuaciones && process.actuaciones.length > 0 ? (
            <div className="space-y-4">
              {process.actuaciones.slice(0, 5).map((actuacion, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="text-sm text-gray-600">
                    {new Date(actuacion.fecha_actuacion).toLocaleDateString('es-CO')}
                  </div>
                  <div className="font-medium text-gray-900">
                    {actuacion.actuacion}
                  </div>
                  {actuacion.anotacion && (
                    <div className="text-sm text-gray-600 mt-1">
                      {actuacion.anotacion}
                    </div>
                  )}
                </div>
              ))}
              {process.actuaciones.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  ... y {process.actuaciones.length - 5} actuaciones más
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No hay actuaciones disponibles para mostrar
            </p>
          )}
        </div>

        {/* Documentos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Documentos Asociados
          </h3>
          
          {process.documentos && process.documentos.length > 0 ? (
            <div className="space-y-3">
              {process.documentos.slice(0, 5).map((documento, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {documento.nombre_archivo}
                  </div>
                  {documento.tipo_documento && (
                    <div className="text-sm text-gray-600">
                      Tipo: {documento.tipo_documento}
                    </div>
                  )}
                  {documento.tamano_archivo && (
                    <div className="text-sm text-gray-600">
                      Tamaño: {(documento.tamano_archivo / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              ))}
              {process.documentos.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  ... y {process.documentos.length - 5} documentos más
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No hay documentos disponibles para mostrar
            </p>
          )}
        </div>
      </div>

      {/* Enlace al portal oficial */}
      {process.portal_url && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm mb-2">
            <strong>Ver en el Portal Oficial:</strong>
          </p>
          <a
            href={process.portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
          >
            {process.portal_url}
          </a>
        </div>
      )}
    </div>
  );
};