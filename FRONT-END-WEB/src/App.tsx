import React, { useState } from 'react';

interface ConsultationResult {
  success: boolean;
  data?: any;
  error?: string;
  source: 'portal' | 'database';
}

function App() {
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
      // Construir URL con parámetros para la API oficial de la Rama Judicial
      const apiUrl = new URL('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion');
      apiUrl.searchParams.append('numero', numeroRadicacion.trim());
      apiUrl.searchParams.append('SoloActivos', searchType === 'recent' ? 'true' : 'false');
      apiUrl.searchParams.append('pagina', '1');
      
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Error en la consulta al portal oficial');
      }

      if (data && data.procesos && data.procesos.length > 0) {
        const proceso = data.procesos[0];
        
        // Extraer demandante y demandado del campo sujetosProcesales
        let demandante = 'NO DISPONIBLE';
        let demandado = 'NO DISPONIBLE';
        let ciudad = 'NO DISPONIBLE';
        let departamento = 'NO DISPONIBLE';
        
        if (proceso.sujetosProcesales) {
          const sujetos = proceso.sujetosProcesales;
          
          // Extraer demandante
          const demandanteMatch = sujetos.match(/Demandante:\s*([^|]+)/i);
          if (demandanteMatch) {
            demandante = demandanteMatch[1].trim();
          }
          
          // Extraer demandado  
          const demandadoMatch = sujetos.match(/Demandado:\s*([^|]+)/i);
          if (demandadoMatch) {
            demandado = demandadoMatch[1].trim();
          }
        }
        
        // Extraer ciudad del despacho
        if (proceso.despacho) {
          const despachoPartes = proceso.despacho.split(' - ');
          if (despachoPartes.length > 1) {
            ciudad = despachoPartes[despachoPartes.length - 1].trim();
          }
        }
        
        const processData = {
          numero_radicacion: proceso.llaveProceso || numeroRadicacion,
          fecha_radicacion: proceso.fechaProceso ? proceso.fechaProceso.split('T')[0] : 'No disponible',
          despacho: proceso.despacho || 'NO DISPONIBLE',
          departamento: proceso.departamento || departamento,
          ciudad: ciudad,
          tipo_proceso: proceso.departamento || 'NO DISPONIBLE',
          demandante: demandante,
          demandado: demandado,
          sujetos_procesales: proceso.sujetosProcesales || '',
          ponente: proceso.ponente || 'No especificado',
          estado: 'Activo',
          es_privado: proceso.esPrivado === true,
          cantidad_folios: proceso.cantFilas || 0
        };

        setResult({
          success: true,
          data: processData,
          source: 'portal'
        });
      } else {
        setResult({
          success: false,
          error: 'No se encontró información para el número de radicación ingresado',
          source: 'portal'
        });
      }
    } catch (error) {
      console.error('Error en consulta:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con el portal oficial',
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Pantalla de resultados
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header simplificado para resultados */}
          <div className="bg-white shadow-sm border-b mb-6 rounded-lg">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🏛️</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-blue-800">CONSULTA DE PROCESOS</h1>
                    <h2 className="text-lg font-semibold text-blue-700">NACIONAL UNIFICADA</h2>
                  </div>
                </div>
                <button
                  onClick={handleNewConsultation}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Nueva Consulta
                </button>
              </div>
            </div>
          </div>

          {result.success && result.data ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="border-b pb-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Información del Proceso Judicial
                </h2>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Consultado desde: {result.source === 'database' ? 'Base de datos local' : 'Portal oficial'}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información básica */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Radicación
                    </label>
                    <p className="text-lg font-mono bg-blue-50 p-3 rounded border border-blue-200">
                      {result.data.numero_radicacion}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Radicación
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {formatDate(result.data.fecha_radicacion)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado del Proceso
                    </label>
                    <span className="inline-flex px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {result.data.estado || 'Activo'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{result.data.ciudad}</p>
                      <p className="text-gray-600">{result.data.departamento}</p>
                    </div>
                  </div>
                </div>

                {/* Información del proceso */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Despacho Judicial
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {result.data.despacho}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Proceso
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {result.data.tipo_proceso}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ponente/Juez
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {result.data.ponente || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sujetos procesales */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Demandante(s)
                  </label>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="font-semibold text-blue-900">
                      {result.data.demandante || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Demandado(s)
                  </label>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="font-semibold text-red-900">
                      {result.data.demandado || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {result.data.sujetos_procesales && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Todos los Sujetos Procesales
                  </label>
                  <div className="bg-gray-50 border p-4 rounded">
                    <p className="text-gray-900 whitespace-pre-line leading-relaxed">
                      {result.data.sujetos_procesales.replace(/\|/g, '\n')}
                    </p>
                  </div>
                </div>
              )}

              {/* Información adicional si existe */}
              {(result.data.categoria || result.data.subcategoria) && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {result.data.categoria && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Categoría
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {result.data.categoria}
                      </p>
                    </div>
                  )}
                  {result.data.subcategoria && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subcategoría
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {result.data.subcategoria}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="mb-4">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Proceso no encontrado
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {result.error || 'No se encontró información para el número de radicación ingresado'}
              </p>
              <button
                onClick={handleNewConsultation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Realizar nueva consulta
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pantalla principal de consulta
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
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  Sistema Nacional de Consultas
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-14 w-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-lg">🇨🇴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de navegación */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                <span className="text-sm">👁️ Visión</span>
              </button>
              <button className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                <span className="text-sm">👤 Iniciar Sesión</span>
              </button>
              <button className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                <span className="text-sm">📋 Servicios</span>
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <button className="hover:bg-blue-700 px-3 py-2 rounded transition-colors">
                <span className="text-sm">❓ Ayuda</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
            <span className="mr-2">←</span>
            Regresar a opciones de Consulta
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-8 bg-blue-600 rounded-full mb-1"></div>
                <div className="w-5 h-3 bg-blue-600 rounded-full mb-1"></div>
                <div className="w-7 h-3 bg-blue-600 rounded-full"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Consulta por Número de Radicación
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ingrese el número de radicación de 23 dígitos para consultar la información del proceso judicial
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Tipo de consulta:</h3>
              <div className="space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="recent"
                    checked={searchType === 'recent'}
                    onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-700">
                      Procesos con Actuaciones Recientes
                    </span>
                    <p className="text-sm text-gray-500">
                      Consulta rápida de procesos con movimientos en los últimos 30 días
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="all"
                    checked={searchType === 'all'}
                    onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-700">
                      Todos los Procesos
                    </span>
                    <p className="text-sm text-gray-500">
                      Consulta completa (puede tomar más tiempo)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Número de Radicación
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={numeroRadicacion}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 23) {
                      setNumeroRadicacion(value);
                    }
                  }}
                  placeholder="Ingrese los 23 dígitos del número de radicación"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-4 text-sm text-gray-500">
                  {numeroRadicacion.length}/23
                </div>
              </div>
              {numeroRadicacion.length > 0 && numeroRadicacion.length < 23 && (
                <p className="text-sm text-orange-600">
                  Faltan {23 - numeroRadicacion.length} dígitos
                </p>
              )}
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || numeroRadicacion.length !== 23}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-10 py-3 rounded-lg font-semibold transition-colors text-lg min-w-[160px]"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    CONSULTANDO...
                  </span>
                ) : (
                  'CONSULTAR'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleNewConsultation}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
              >
                LIMPIAR
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Sistema desarrollado para consulta de procesos del sistema judicial colombiano</p>
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
              Políticas de Privacidad y Condiciones de Uso
            </p>
            <p className="text-sm">
              Calle 12 No. 7 - 65 Bogotá D.C., Colombia
            </p>
            <p className="text-sm">
              Teléfono (57) 601 - 565 8500 Ext 7550
            </p>
            <p className="text-sm">
              soporteciu@cendoj.ramajudicial.gov.co
            </p>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
              <p className="text-xs">
                © 2025 Consulta de Procesos Nacional Unificada
              </p>
              <div className="text-xs">
                <p>Visitantes conectados: 1,247</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;