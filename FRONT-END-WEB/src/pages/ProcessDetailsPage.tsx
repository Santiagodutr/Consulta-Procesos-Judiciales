import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { directJudicialAPI } from '../services/apiService.ts';
import {
  judicialPortalService,
  JudicialProcessData,
  ProcessSubject,
  ProcessDocument,
  ProcessActivity,
  ActuacionDocument,
  PaginationInfo,
} from '../services/judicialPortalService.ts';
import {
  ArrowLeft,
  Star,
  Download,
  FileDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const REGISTROS_POR_PAGINA = 30;

export const ProcessDetailsPage: React.FC = () => {
  const { numeroRadicacion } = useParams<{ numeroRadicacion: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [processData, setProcessData] = useState<JudicialProcessData | null>(null);
  const [processDetails, setProcessDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [sujetos, setSujetos] = useState<ProcessSubject[]>([]);
  const [documentos, setDocumentos] = useState<ProcessDocument[]>([]);
  const [actuaciones, setActuaciones] = useState<ProcessActivity[]>([]);
  const [todasActuaciones, setTodasActuaciones] = useState<ProcessActivity[]>([]);
  const [actuacionesPaginaActual, setActuacionesPaginaActual] = useState(1);
  const [actuacionesPaginacion, setActuacionesPaginacion] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [actuacionDocuments, setActuacionDocuments] = useState<ActuacionDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedActuacion, setSelectedActuacion] = useState<ProcessActivity | null>(null);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  useEffect(() => {
    if (numeroRadicacion) {
      loadProcessDetails(numeroRadicacion);
    }
  }, [numeroRadicacion]);

  const loadProcessDetails = async (radicacion: string) => {
    try {
      setLoading(true);
      setError(null);
      setProcessDetails(null);
      setSujetos([]);
      setDocumentos([]);
      setActuaciones([]);
      setTodasActuaciones([]);
      setActuacionesPaginaActual(1);
      setActuacionesPaginacion(null);
      setShowDocumentModal(false);
      setActuacionDocuments([]);
      setSelectedActuacion(null);
      setActiveTab('datos');

      const response = await directJudicialAPI.consultProcess(radicacion);

      if (!response.success || !response.data) {
        setError(response.message || 'No se pudo cargar la información del proceso');
        setProcessData(null);
        return;
      }

      const data = response.data;
      setProcessData(data);

      if (data.idProceso) {
        try {
          const detalles = await judicialPortalService.getProcessDetails(data.idProceso);
          setProcessDetails(detalles || data);
        } catch (detalleError) {
          console.error('Error obteniendo detalles adicionales del proceso:', detalleError);
          setProcessDetails(data);
        }
      } else {
        setProcessDetails(data);
      }

      const sujetosData = data.sujetos || [];
      const documentosData = data.documentos || [];
      const actuacionesData = data.actuaciones || [];

      setSujetos(sujetosData);
      setDocumentos(documentosData);
      setTodasActuaciones(actuacionesData);

      if (actuacionesData.length > 0) {
        const primeraPagina = actuacionesData.slice(0, REGISTROS_POR_PAGINA);
        setActuaciones(primeraPagina);
        setActuacionesPaginacion({
          paginaActual: 1,
          cantPaginas: Math.ceil(actuacionesData.length / REGISTROS_POR_PAGINA),
          cantRegistros: actuacionesData.length,
          siguientePagina: actuacionesData.length > REGISTROS_POR_PAGINA,
          anteriorPagina: false,
        });
      }

      try {
        const favoriteStatus = await directJudicialAPI.checkIfFavorite(radicacion);
        setIsFavorite(favoriteStatus);
      } catch (favoriteError) {
        console.error('Error verificando estado de favorito:', favoriteError);
        setIsFavorite(false);
      }
    } catch (err: any) {
      console.error('Error cargando detalles del proceso:', err);
      setError(err.message || 'Error al cargar la información del proceso');
      setProcessData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'datos') {
      loadTabData(tab);
    }
  };

  const loadTabData = async (tab: TabType) => {
    if (!processData || !processData.idProceso) {
      return;
    }

    try {
      setIsLoadingTab(true);

      switch (tab) {
        case 'sujetos':
          if (sujetos.length === 0) {
            const data = await judicialPortalService.getSujetosByIdProceso(processData.idProceso);
            setSujetos(data);
          }
          break;
        case 'documentos':
          if (documentos.length === 0) {
            const data = await judicialPortalService.getDocumentosByIdProceso(processData.idProceso);
            setDocumentos(data);
          }
          break;
        case 'actuaciones':
          await loadActuacionesPagina(actuacionesPaginaActual);
          break;
      }
    } catch (err) {
      console.error(`Error cargando datos para la pestaña ${tab}:`, err);
    } finally {
      setIsLoadingTab(false);
    }
  };

  const loadActuacionesPagina = async (pagina: number) => {
    if (!processData) {
      return;
    }

    try {
      setIsLoadingTab(true);

      if (todasActuaciones.length > 0) {
        const totalRegistros = todasActuaciones.length;
        const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA);
        const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
        const fin = inicio + REGISTROS_POR_PAGINA;
        const actuacionesPagina = todasActuaciones.slice(inicio, fin);

        setActuaciones(actuacionesPagina);
        setActuacionesPaginaActual(pagina);
        setActuacionesPaginacion({
          paginaActual: pagina,
          cantPaginas: totalPaginas,
          cantRegistros: totalRegistros,
          siguientePagina: pagina < totalPaginas,
          anteriorPagina: pagina > 1,
        });
        return;
      }

      if (!processData.idProceso) {
        return;
      }

      const response = await judicialPortalService.getActuacionesByIdProceso(processData.idProceso, pagina);
      setActuaciones(response.actuaciones);
      setActuacionesPaginacion(response.paginacion || null);
      setActuacionesPaginaActual(pagina);

      if (response.todasActuaciones && response.todasActuaciones.length > 0) {
        setTodasActuaciones(response.todasActuaciones);
      }
    } catch (err) {
      console.error('Error cargando actuaciones:', err);
    } finally {
      setIsLoadingTab(false);
    }
  };

  const handleVerDocumentos = async (actuacion: ProcessActivity) => {
    if (!actuacion.idRegActuacion && !actuacion.idActuacion) {
      alert('No se puede obtener los documentos de esta actuación');
      return;
    }

    setSelectedActuacion(actuacion);
    setShowDocumentModal(true);
    setLoadingDocuments(true);

    try {
      const idReg = actuacion.idRegActuacion || actuacion.idActuacion;
      const docs = await judicialPortalService.getDocumentosActuacion(idReg);
      setActuacionDocuments(docs);
    } catch (err) {
      console.error('Error cargando documentos de la actuación:', err);
      alert('No se pudieron cargar los documentos de la actuación');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDownloadDocumento = async (documento: ActuacionDocument) => {
    try {
      await judicialPortalService.downloadDocumento(
        documento.idRegDocumento,
        documento.nombre || `Documento_${documento.idRegDocumento}.pdf`
      );
    } catch (err) {
      console.error('Error al descargar documento:', err);
      alert('No se pudo descargar el documento');
    }
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setActuacionDocuments([]);
    setSelectedActuacion(null);
  };

  const handleDownloadDOCX = async () => {
    if (!processData) {
      alert('No hay información del proceso para descargar');
      return;
    }

    setIsDownloadingDOCX(true);
    try {
      if (processData.idProceso) {
        await judicialPortalService.downloadDOCXByIdProceso(processData.idProceso);
      } else {
        await judicialPortalService.downloadDOCX(processData.numeroRadicacion, false);
      }
    } catch (err) {
      console.error('Error al descargar DOCX:', err);
      alert('No se pudo descargar el archivo DOCX');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!processData) {
      alert('No hay información del proceso para descargar');
      return;
    }

    setIsDownloadingCSV(true);
    try {
      if (processData.idProceso) {
        await judicialPortalService.downloadCSVByIdProceso(processData.idProceso);
      } else {
        await judicialPortalService.downloadCSV(processData.numeroRadicacion, false);
      }
    } catch (err) {
      console.error('Error al descargar CSV:', err);
      alert('No se pudo descargar el archivo CSV');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!processData) {
      return;
    }

    setIsSavingFavorite(true);

    try {
      if (isFavorite) {
        await directJudicialAPI.removeFavoriteProcess(processData.numeroRadicacion);
        setIsFavorite(false);
        alert('Proceso removido de favoritos');
      } else {
        await directJudicialAPI.saveFavoriteProcess({
          numero_radicacion: processData.numeroRadicacion,
          despacho: processData.despacho,
          demandante: processData.demandante || '',
          demandado: processData.demandado || '',
          tipo_proceso: processData.tipoProceso || '',
          fecha_radicacion: processData.fechaProceso || new Date().toISOString(),
        });
        setIsFavorite(true);
        alert('Proceso agregado a favoritos');
      }
    } catch (err) {
      console.error('Error actualizando favorito:', err);
      alert('Error al actualizar el estado de favoritos');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderHeader = () => (
    <div className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-blue-600 transition-colors"
            title="Regresar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Detalle del Proceso</h1>
            <p className="text-sm text-blue-100">{numeroRadicacion}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
            title="Ir al dashboard"
          >
            <span>📊</span>
            <span className="hidden md:inline text-sm font-medium">Dashboard</span>
          </button>
          <div className="hidden md:flex items-center gap-2 bg-blue-600 px-3 py-2 rounded-lg">
            <span>👤</span>
            <span className="text-sm font-medium">Hola, {user?.first_name || 'Usuario'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-semibold">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {renderHeader()}
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del proceso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !processData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {renderHeader()}
        <div className="flex items-center justify-center py-24 px-4">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <span className="text-5xl mb-4 block">❌</span>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'No se encontró información del proceso.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Regresar al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const detailsSource = processDetails || processData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      {renderHeader()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border-b mb-6 rounded-lg p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">DETALLE DEL PROCESO</h2>
              <p className="text-lg text-blue-600 font-mono">{processData.numeroRadicacion}</p>
              <p className="text-sm text-gray-500 mt-1">Despacho: {processData.despacho}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleFavorite}
                disabled={isSavingFavorite}
                className={`${
                  isFavorite
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2`}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                {isSavingFavorite ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className={isFavorite ? 'text-white' : 'text-gray-700'}>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Star className={`h-5 w-5 ${isFavorite ? 'fill-white' : 'text-gray-600'}`} />
                    <span className={isFavorite ? 'text-white' : 'text-gray-700'}>
                      {isFavorite ? 'Favorito' : 'Guardar'}
                    </span>
                  </>
                )}
              </button>
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
          <div className="text-sm text-gray-600 space-y-1 mt-4">
            <p>Fecha de consulta: {new Date().toLocaleString('es-CO')}</p>
            <p>Fecha de replicación de datos: {new Date().toLocaleString('es-CO')}</p>
            {processData.portalUrl && (
              <a
                href={processData.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Ver en el portal judicial
              </a>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <div className="border-b">
            <div className="flex flex-wrap">
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

          <div className="p-6">
            {isLoadingTab ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando...</span>
              </div>
            ) : (
              <>
                {activeTab === 'datos' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Radicación:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{formatDate(detailsSource?.fechaRadicacion || processData.fechaRadicacion)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recurso:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.recurso || 'SIN TIPO DE RECURSO'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Despacho:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.despacho || processData.despacho}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ponente:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.ponente || 'No especificado'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación del Expediente:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.ubicacionExpediente || 'ARCHIVO'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Proceso:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.tipoProceso || processData.tipoProceso || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Clase de Proceso:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.claseProceso || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subclase de Proceso:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.subclaseProceso || 'SIN SUBCLASE DE PROCESO'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido de Radicación:</label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.contenidoRadicacion || ''}</p>
                      </div>
                    </div>
                  </div>
                )}

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

                {activeTab === 'actuaciones' && (
                  <div className="space-y-4">
                    {actuaciones.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No hay actuaciones disponibles</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Fecha de Actuación
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Actuación
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Anotación
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Fecha Inicio Término
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Fecha Finaliza Término
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">
                                  Fecha de Registro
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {actuaciones.map((actuacion, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors border-b">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatDate(actuacion.fechaActuacion)}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="space-y-1">
                                      <p className="font-medium text-gray-900">{actuacion.actuacion}</p>
                                      {actuacion.conDocumentos && (
                                        <button
                                          onClick={() => handleVerDocumentos(actuacion)}
                                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                                        >
                                          📎 Con documentos
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {actuacion.anotacion || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                                    {actuacion.fechaInicioTermino || actuacion.fechaInicial
                                      ? formatDate(actuacion.fechaInicioTermino || actuacion.fechaInicial!)
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                                    {actuacion.fechaFinalizaTermino || actuacion.fechaFinal
                                      ? formatDate(actuacion.fechaFinalizaTermino || actuacion.fechaFinal!)
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-900">
                                    {actuacion.fechaRegistro
                                      ? formatDate(actuacion.fechaRegistro)
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {actuacionesPaginacion && actuacionesPaginacion.cantPaginas > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <button
                              onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                              disabled={!actuacionesPaginacion.anteriorPagina}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </button>
                            <p className="text-sm text-gray-600">
                              Página {actuacionesPaginaActual} de {actuacionesPaginacion.cantPaginas}
                            </p>
                            <button
                              onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                              disabled={!actuacionesPaginacion.siguientePagina}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
                            >
                              Siguiente
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documentos de la actuación</h3>
                <p className="text-sm text-gray-600">
                  {selectedActuacion?.actuacion} - {formatDate(selectedActuacion?.fechaActuacion)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingDocuments ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando documentos...</span>
                </div>
              ) : actuacionDocuments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay documentos asociados a esta actuación</p>
              ) : (
                <div className="space-y-4">
                  {actuacionDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{doc.nombre}</p>
                        {doc.fechaDocumento && (
                          <p className="text-xs text-gray-500">Fecha: {formatDate(doc.fechaDocumento)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownloadDocumento(doc)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        <Download className="h-4 w-4" /> Descargar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
