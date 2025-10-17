import React, { useState } from 'react';
import { Download, FileDown, ArrowLeft } from 'lucide-react';
import { judicialPortalService, JudicialProcessData, ProcessActivity, ProcessSubject, ProcessDocument } from '../services/judicialPortalService.ts';
import { directJudicialAPI } from '../services/apiService.ts';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

interface SearchResult {
  success: boolean;
  data?: JudicialProcessData;
  error?: string;
  source?: 'portal' | 'database';
}

const HomePage: React.FC = () => {
  // Estados para búsqueda
  const [numeroRadicacion, setNumeroRadicacion] = useState('');
  const [searchType, setSearchType] = useState<'recent' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para resultados de búsqueda (listado)
  const [searchResults, setSearchResults] = useState<JudicialProcessData[]>([]);
  
  // Estados para vista de detalles
  const [selectedProcess, setSelectedProcess] = useState<JudicialProcessData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [processDetails, setProcessDetails] = useState<any>(null);
  const [sujetos, setSujetos] = useState<ProcessSubject[]>([]);
  const [documentos, setDocumentos] = useState<ProcessDocument[]>([]);
  const [actuaciones, setActuaciones] = useState<ProcessActivity[]>([]);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  
  // Estados para descargas
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

  // Manejar búsqueda
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroRadicacion.trim()) {
      alert('Por favor ingrese un número de radicación');
      return;
    }

    if (!directJudicialAPI.validateRadicationNumber(numeroRadicacion)) {
      alert('Número de radicación inválido. Debe tener 23 dígitos.');
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setSelectedProcess(null);

    try {
      console.log('Consultando proceso...');
      
      const response = await directJudicialAPI.consultProcess(
        numeroRadicacion.trim(), 
        searchType === 'recent'
      );

      if (response.success && response.data) {
        // Mostrar como resultado de búsqueda (listado)
        setSearchResults([response.data]);
      } else {
        alert(response.message || 'No se encontró información para el número de radicación ingresado');
      }
    } catch (error) {
      console.error('Error en consulta:', error);
      alert('Error de conexión con el portal oficial');
    } finally {
      setIsLoading(false);
    }
  };

  // Seleccionar proceso y cargar detalles
  const handleSelectProcess = async (process: JudicialProcessData) => {
    setSelectedProcess(process);
    setActiveTab('datos');
    
    // Cargar detalles del proceso
    if (process.idProceso) {
      setIsLoadingTab(true);
      try {
        const details = await judicialPortalService.getProcessDetails(process.idProceso);
        setProcessDetails(details);
      } catch (error) {
        console.error('Error cargando detalles:', error);
      } finally {
        setIsLoadingTab(false);
      }
    }
  };

  // Cargar datos de pestaña específica
  const loadTabData = async (tab: TabType) => {
    if (!selectedProcess?.idProceso) return;
    
    setIsLoadingTab(true);
    
    try {
      switch (tab) {
        case 'sujetos':
          if (sujetos.length === 0) {
            const data = await judicialPortalService.getSujetosByIdProceso(selectedProcess.idProceso);
            setSujetos(data);
          }
          break;
        case 'documentos':
          if (documentos.length === 0) {
            const data = await judicialPortalService.getDocumentosByIdProceso(selectedProcess.idProceso);
            setDocumentos(data);
          }
          break;
        case 'actuaciones':
          if (actuaciones.length === 0) {
            const data = await judicialPortalService.getActuacionesByIdProceso(selectedProcess.idProceso);
            setActuaciones(data);
          }
          break;
      }
    } catch (error) {
      console.error(`Error cargando ${tab}:`, error);
    } finally {
      setIsLoadingTab(false);
    }
  };

  // Cambiar pestaña
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  // Regresar al listado
  const handleBack = () => {
    setSelectedProcess(null);
    setProcessDetails(null);
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setActiveTab('datos');
  };

  // Nueva consulta
  const handleNewSearch = () => {
    setNumeroRadicacion('');
    setSearchResults([]);
    setSelectedProcess(null);
    setSearchType('all');
  };

  // Descargas
  const handleDownloadDOCX = async () => {
    if (!selectedProcess?.numeroRadicacion) return;
    
    setIsDownloadingDOCX(true);
    try {
      await judicialPortalService.downloadDOCX(selectedProcess.numeroRadicacion, searchType === 'recent');
    } catch (error) {
      console.error('Error descargando DOCX:', error);
      alert('Error al descargar el archivo DOCX');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!selectedProcess?.numeroRadicacion) return;
    
    setIsDownloadingCSV(true);
    try {
      await judicialPortalService.downloadCSV(selectedProcess.numeroRadicacion, searchType === 'recent');
    } catch (error) {
      console.error('Error descargando CSV:', error);
      alert('Error al descargar el archivo CSV');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // ==================== VISTA DE DETALLES CON PESTAÑAS ====================
  if (selectedProcess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-sm border-b mb-6 rounded-lg">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Regresar al listado"
                  >
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                  </button>
                  <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🏛️</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-blue-800">DETALLE DEL PROCESO</h1>
                    <h2 className="text-lg font-semibold text-blue-700">{selectedProcess.numeroRadicacion}</h2>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadDOCX}
                    disabled={isDownloadingDOCX}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isDownloadingDOCX ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Descargando...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="h-5 w-5" />
                        <span>Descargar DOC</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    disabled={isDownloadingCSV}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isDownloadingCSV ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Descargando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>Descargar CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Fecha de consulta */}
              <div className="mt-4 text-sm text-gray-600">
                Fecha de consulta: {new Date().toLocaleString('es-CO')}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Fecha de replicación de datos: {new Date().toLocaleString('es-CO')}
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => handleTabChange('datos')}
                  className={`px-6 py-4 font-semibold text-sm ${
                    activeTab === 'datos'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  DATOS DEL PROCESO
                </button>
                <button
                  onClick={() => handleTabChange('sujetos')}
                  className={`px-6 py-4 font-semibold text-sm ${
                    activeTab === 'sujetos'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  SUJETOS PROCESALES
                </button>
                <button
                  onClick={() => handleTabChange('documentos')}
                  className={`px-6 py-4 font-semibold text-sm ${
                    activeTab === 'documentos'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  DOCUMENTOS DEL PROCESO
                </button>
                <button
                  onClick={() => handleTabChange('actuaciones')}
                  className={`px-6 py-4 font-semibold text-sm ${
                    activeTab === 'actuaciones'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  ACTUACIONES
                </button>
              </div>
            </div>

            {/* Contenido de las pestañas */}
            <div className="p-6">
              {isLoadingTab ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando...</span>
                </div>
              ) : (
                <>
                  {/* PESTAÑA: DATOS DEL PROCESO */}
                  {activeTab === 'datos' && processDetails && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Radicación:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{formatDate(processDetails.fechaRadicacion || selectedProcess.fechaRadicacion || 'N/A')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Recurso:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.recurso || 'SIN TIPO DE RECURSO'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Despacho:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.despacho || selectedProcess.despacho}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ponente:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.ponente || 'No especificado'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación del Expediente:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.ubicacionExpediente || 'ARCHIVO'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Proceso:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.tipoProceso || selectedProcess.tipoProceso || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Clase de Proceso:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.claseProceso || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Subclase de Proceso:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.subclaseProceso || 'SIN SUBCLASE DE PROCESO'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido de Radicación:</label>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded">{processDetails.contenidoRadicacion || ''}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PESTAÑA: SUJETOS PROCESALES */}
                  {activeTab === 'sujetos' && (
                    <div className="space-y-4">
                      {sujetos.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay sujetos procesales disponibles</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apoderado</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sujetos.map((sujeto, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {sujeto.nombreRazonSocial || sujeto.lsNombreSujeto || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {sujeto.tipoSujeto || sujeto.lsTipoSujeto || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {sujeto.identificacion || sujeto.lsIdentificacion || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {sujeto.lsApoderado || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PESTAÑA: DOCUMENTOS */}
                  {activeTab === 'documentos' && (
                    <div className="space-y-4">
                      {documentos.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay documentos disponibles</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {documentos.map((documento, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-3">
                                <div className="bg-blue-100 rounded p-2">
                                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{documento.lsNombreArchivo}</p>
                                  <p className="text-xs text-gray-600 mt-1">{documento.lsTipoDocumento}</p>
                                  {documento.lsExtensionArchivo && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {documento.lsExtensionArchivo.toUpperCase()}
                                      {documento.lnTamanoArchivo && ` • ${(documento.lnTamanoArchivo / 1024).toFixed(1)} KB`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PESTAÑA: ACTUACIONES */}
                  {activeTab === 'actuaciones' && (
                    <div className="space-y-4">
                      {actuaciones.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay actuaciones disponibles</p>
                      ) : (
                        <div className="space-y-4">
                          {actuaciones.map((actuacion, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                      #{actuacion.consActuacion}
                                    </span>
                                    <span className="text-sm text-gray-600">{formatDate(actuacion.fechaActuacion)}</span>
                                    {actuacion.conDocumentos && (
                                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                                        📎 Con documentos
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-900 font-medium mb-1">{actuacion.actuacion}</p>
                                  {actuacion.anotacion && (
                                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{actuacion.anotacion}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm text-gray-500 ml-4">
                                  <p>{actuacion.cantFolios} folios</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VISTA DE LISTADO DE RESULTADOS ====================
  if (searchResults.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-sm border-b mb-6 rounded-lg">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🏛️</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-blue-800">Número de Radicación</h1>
                </div>
                <button
                  onClick={handleNewSearch}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  NUEVA CONSULTA
                </button>
              </div>
            </div>
          </div>

          {/* Formulario de búsqueda (compacto) */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <form onSubmit={handleSearch} className="flex gap-4 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={numeroRadicacion}
                  onChange={(e) => setNumeroRadicacion(e.target.value)}
                  placeholder="50001333100120070007600"
                  maxLength={23}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Consultando...' : 'CONSULTAR'}
              </button>
            </form>
          </div>

          {/* Botones de descarga */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDOCX}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {isDownloadingDOCX ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-5 w-5" />
                  <span>Descargar DOC</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={isDownloadingCSV}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {isDownloadingCSV ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Descargar CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Tabla de resultados */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="rounded" />
                <span className="font-semibold text-sm text-gray-700">Consultado</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Radicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Radicación y última actuación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Despacho y Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sujetos Procesales
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((process, index) => (
                    <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectProcess(process)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          {process.numeroRadicacion}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(process.fechaRadicacion || '')}</div>
                        {process.fechaUltimaActuacion && (
                          <div className="text-sm text-blue-600">{formatDate(process.fechaUltimaActuacion)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{process.despacho}</div>
                        <div className="text-sm text-gray-500">({process.departamento || 'META'})</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div><strong>Demandante:</strong> {process.demandante || 'No especificado'}</div>
                          <div><strong>Demandado:</strong> {process.demandado || 'No especificado'}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t text-center text-sm text-gray-600">
              Resultados encontrados: {searchResults.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PANTALLA INICIAL DE BÚSQUEDA ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-800">CONSULTA DE PROCESOS</h1>
                <h2 className="text-xl font-semibold text-blue-700">NACIONAL UNIFICADA</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Número de Radicación
          </h2>

          {/* Opciones de búsqueda */}
          <div className="mb-6 space-y-3">
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="recent"
                checked={searchType === 'recent'}
                onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                className="w-5 h-5 text-blue-600"
              />
              <span className="ml-3 text-gray-700">
                Procesos con Actuaciones Recientes (últimos 30 días)
              </span>
            </label>
            <label className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-lg cursor-pointer">
              <input
                type="radio"
                value="all"
                checked={searchType === 'all'}
                onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                className="w-5 h-5 text-blue-600"
              />
              <span className="ml-3 text-gray-700 font-medium">
                Todos los Procesos (consulta completa, menos rápida)
              </span>
            </label>
          </div>

          {/* Formulario de búsqueda */}
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <input
                type="text"
                value={numeroRadicacion}
                onChange={(e) => setNumeroRadicacion(e.target.value)}
                placeholder="Ingrese el número de radicación (23 dígitos)"
                maxLength={23}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-2 text-right text-sm text-gray-500">
                {numeroRadicacion.length} / 23
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Consultando...</span>
                  </div>
                ) : (
                  'CONSULTAR'
                )}
              </button>
              <button
                type="button"
                onClick={handleNewSearch}
                className="bg-gray-500 hover:bg-gray-600 text-white py-4 px-8 rounded-lg font-bold text-lg transition-colors"
              >
                NUEVA CONSULTA
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
