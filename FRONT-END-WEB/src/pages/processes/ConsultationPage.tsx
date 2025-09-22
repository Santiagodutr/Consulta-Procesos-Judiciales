import React, { useState } from 'react';
import { Eye, HelpCircle, User } from 'lucide-react';
import { ProcessConsultationResult } from '../../components/ProcessConsultationResult';
import { judicialAPI } from '../../services/apiService';

interface ConsultationResult {
  success: boolean;
  data?: any;
  error?: string;
  source: 'portal' | 'database';
}

export const ConsultationPage: React.FC = () => {
  const [numeroRadicacion, setNumeroRadicacion] = useState('');
  const [searchType, setSearchType] = useState<'recent' | 'all'>('recent');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConsultationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroRadicacion.trim()) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await judicialAPI.consultProcess(
        numeroRadicacion.trim(),
        searchType === 'recent',
        false // refresh parameter
      );

      setResult({
        success: response.success,
        data: response.data,
        error: response.message,
        source: response.data?.source || 'portal'
      });
    } catch (error: any) {
      console.error('Error en consulta:', error);
      setResult({
        success: false,
        error: error.response?.data?.message || error.message || 'Error desconocido',
        source: 'portal'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConsultation = () => {
    setNumeroRadicacion('');
    setResult(null);
    setSearchType('recent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y título principal */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img 
                  src="/logo-rama-judicial.png" 
                  alt="Rama Judicial" 
                  className="h-12 w-auto"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMyMTYzZWIiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIj4KPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMTIgMnY2bDQgMi00IDJ2Nkg4di02bC00LTIgNC0yVjJoNHoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4KPC9zdmc+Cg=='
                  }}
                />
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

            {/* Fecha y escudo */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="/escudo-colombia.png" 
                  alt="República de Colombia" 
                  className="h-12 w-auto"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmZmRiMDAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMTIgMnY2bDQgMi00IDJ2Nkg4di02bC00LTIgNC0yVjJoNHoiIGZpbGw9IiNkYzI2MjYiLz4KPC9zdmc+Cg=='
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de navegación superior */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-1 hover:bg-blue-700 px-3 py-1 rounded">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Visión</span>
              </button>
              <a href="/login" className="flex items-center space-x-1 hover:bg-blue-700 px-3 py-1 rounded">
                <User className="h-4 w-4" />
                <span className="text-sm">Iniciar Sesión</span>
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Ayuda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!result ? (
          <>
            {/* Botón regresar (simulado) */}
            <div className="mb-6">
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <span className="mr-2">←</span>
                Regresar a opciones de Consulta
              </button>
            </div>

            {/* Formulario de consulta */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center space-x-2 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-6 bg-blue-600 rounded-full mb-1"></div>
                    <div className="w-4 h-2 bg-blue-600 rounded-full mb-1"></div>
                    <div className="w-6 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Número de Radicación
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Opciones de búsqueda */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="searchType"
                        value="recent"
                        checked={searchType === 'recent'}
                        onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">
                        <strong>Procesos con Actuaciones Recientes</strong> (últimos 30 días)
                      </span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="searchType"
                        value="all"
                        checked={searchType === 'all'}
                        onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">
                        <strong>Todos los Procesos</strong> (consulta completa, menos rápida)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Campo de número de radicación */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={numeroRadicacion}
                      onChange={(e) => setNumeroRadicacion(e.target.value)}
                      placeholder="Ingrese los 23 dígitos del número de Radicación"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      maxLength={23}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-3 text-sm text-gray-500">
                      {numeroRadicacion.length}/23
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-center space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading || numeroRadicacion.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors min-w-[120px]"
                  >
                    {isLoading ? 'CONSULTANDO...' : 'CONSULTAR'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleNewConsultation}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    NUEVA CONSULTA
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <ProcessConsultationResult 
            result={result}
            onNewConsultation={handleNewConsultation}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2">
            <p className="text-sm">
              Políticas de Privacidad y Condiciones de Uso
            </p>
            <p className="text-sm">
              Calle 12 No. 7 - 65 Bogotá Colombia
            </p>
            <p className="text-sm">
              Teléfono (57) 601 - 565 8500 Ext 7550 o al correo electrónico
            </p>
            <p className="text-sm">
              soporteciu@cendoj.ramajudicial.gov.co
            </p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
              <p className="text-xs">
                Reporte Visitas
              </p>
              <div className="text-xs">
                <p>Total de Visitantes: 1872681</p>
                <p>Visitantes hoy: 9879</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};