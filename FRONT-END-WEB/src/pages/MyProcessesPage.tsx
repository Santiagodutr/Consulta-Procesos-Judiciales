import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { directJudicialAPI } from '../services/apiService.ts';
import { PublicFooter } from '../components/PublicFooter.tsx';
import {
  judicialPortalService,
  JudicialProcessData,
  ProcessActivity,
  ProcessSubject,
  ProcessDocument,
  ActuacionDocument,
  PaginationInfo,
} from '../services/judicialPortalService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  Star,
  Eye,
  Trash2,
  AlertCircle,
  Download,
  FileDown,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface FavoriteProcess {
  id?: number;
  numero_radicacion: string;
  despacho: string;
  demandante: string;
  demandado: string;
  tipo_proceso: string;
  fecha_radicacion: string;
}

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const REGISTROS_POR_PAGINA = 30;

const MyProcessesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [favoriteProcesses, setFavoriteProcesses] = useState<FavoriteProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProcess, setSelectedProcess] = useState<JudicialProcessData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [processDetails, setProcessDetails] = useState<any>(null);
  const [sujetos, setSujetos] = useState<ProcessSubject[]>([]);
  const [documentos, setDocumentos] = useState<ProcessDocument[]>([]);
  const [actuaciones, setActuaciones] = useState<ProcessActivity[]>([]);
  const [todasActuaciones, setTodasActuaciones] = useState<ProcessActivity[]>([]);
  const [actuacionesPaginaActual, setActuacionesPaginaActual] = useState(1);
  const [actuacionesPaginacion, setActuacionesPaginacion] = useState<PaginationInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [actuacionDocuments, setActuacionDocuments] = useState<ActuacionDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedActuacion, setSelectedActuacion] = useState<ProcessActivity | null>(null);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isFavorite, setIsFavorite] = useState(true);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const navLinks = [
    { label: 'Dashboard', onClick: () => navigate('/dashboard') },
    { label: 'Reportes', onClick: () => navigate('/analytics') },
    { label: 'Servicios', onClick: () => navigate('/notifications') },
  ];

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await directJudicialAPI.getFavoriteProcesses();
      if (response.success && Array.isArray(response.data)) {
        setFavoriteProcesses(response.data);
      } else {
        setFavoriteProcesses([]);
      }
    } catch (err: any) {
      console.error('Error cargando favoritos:', err);
      setError(err.message || 'Error al cargar los procesos favoritos');
      setFavoriteProcesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleHeaderBack = () => {
    setSelectedProcess(null);
    setProcessDetails(null);
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setTodasActuaciones([]);
    setActuacionesPaginaActual(1);
    setActuacionesPaginacion(null);
    setActiveTab('datos');
    setIsFavorite(true);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const loadTabData = async (tab: TabType) => {
    if (!selectedProcess?.idProceso) {
      return;
    }

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
          await loadActuacionesPagina(actuacionesPaginaActual);
          break;
      }
    } catch (err) {
      console.error(`Error cargando datos de la pestaña ${tab}:`, err);
    } finally {
      setIsLoadingTab(false);
    }
  };

  const loadActuacionesPagina = async (pagina: number) => {
    if (!selectedProcess?.idProceso) {
      return;
    }

    setIsLoadingTab(true);

    try {
      if (todasActuaciones.length > 0) {
        const totalRegistros = todasActuaciones.length;
        const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA);
        const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
        const fin = inicio + REGISTROS_POR_PAGINA;
        const actuacionesPagina = todasActuaciones.slice(inicio, fin);

        setActuaciones(actuacionesPagina);
        setActuacionesPaginacion({
          paginaActual: pagina,
          cantPaginas: totalPaginas,
          cantRegistros: totalRegistros,
          siguientePagina: pagina < totalPaginas,
          anteriorPagina: pagina > 1,
        });
        setActuacionesPaginaActual(pagina);
        return;
      }

      const response = await judicialPortalService.getActuacionesByIdProceso(selectedProcess.idProceso, pagina);
      setActuaciones(response.actuaciones);
      setActuacionesPaginacion(response.paginacion || null);
      setActuacionesPaginaActual(pagina);

      if (response.todasActuaciones) {
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
      console.error('Error cargando documentos:', err);
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
      console.error('Error descargando documento:', err);
      alert('No se pudo descargar el documento');
    }
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setActuacionDocuments([]);
    setSelectedActuacion(null);
  };

  const handleDownloadDOCX = async () => {
    if (!selectedProcess) {
      alert('Selecciona un proceso para descargar la información');
      return;
    }

    setIsDownloadingDOCX(true);
    try {
      if (selectedProcess.idProceso) {
        await judicialPortalService.downloadDOCXByIdProceso(selectedProcess.idProceso);
      } else {
        await judicialPortalService.downloadDOCX(selectedProcess.numeroRadicacion, false);
      }
    } catch (err) {
      console.error('Error descargando DOCX:', err);
      alert('Error al descargar el archivo DOCX');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!selectedProcess) {
      alert('Selecciona un proceso para descargar la información');
      return;
    }

    setIsDownloadingCSV(true);
    try {
      if (selectedProcess.idProceso) {
        await judicialPortalService.downloadCSVByIdProceso(selectedProcess.idProceso);
      } else {
        await judicialPortalService.downloadCSV(selectedProcess.numeroRadicacion, false);
      }
    } catch (err) {
      console.error('Error descargando CSV:', err);
      alert('Error al descargar el archivo CSV');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = async (numeroRadicacion: string) => {
    setIsLoadingDetails(true);
    setProcessDetails(null);
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setTodasActuaciones([]);
    setActuacionesPaginaActual(1);
    setActuacionesPaginacion(null);

    try {
      const response = await directJudicialAPI.consultProcess(numeroRadicacion);

      if (!response.success || !response.data) {
        alert(response.message || 'No se encontraron detalles del proceso');
        return;
      }

      const processData = response.data as JudicialProcessData;

      let detalles = null;
      if (processData.idProceso) {
        try {
          detalles = await judicialPortalService.getProcessDetails(processData.idProceso);
        } catch (detalleError) {
          console.error('Error obteniendo detalles del proceso:', detalleError);
        }
      }

      const sujetosData = processData.sujetos || [];
      const documentosData = processData.documentos || [];
      const actuacionesData = processData.actuaciones || [];

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
        setActuacionesPaginaActual(1);
      }

      setProcessDetails(detalles || processData);
      setActiveTab('datos');

      try {
        const favoriteStatus = await directJudicialAPI.checkIfFavorite(numeroRadicacion);
        setIsFavorite(favoriteStatus);
      } catch (favoriteError) {
        console.error('Error verificando favorito:', favoriteError);
        setIsFavorite(true);
      }

      setSelectedProcess(processData);
    } catch (err) {
      console.error('Error cargando detalles del proceso:', err);
      alert('No se pudieron cargar los detalles del proceso. Inténtalo nuevamente.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleRemoveFavorite = async (numeroRadicacion: string) => {
    if (!window.confirm('¿Está seguro de quitar este proceso de favoritos?')) {
      return;
    }

    try {
      await directJudicialAPI.removeFavoriteProcess(numeroRadicacion);
      setFavoriteProcesses(prev => prev.filter(p => p.numero_radicacion !== numeroRadicacion));

      if (selectedProcess?.numeroRadicacion === numeroRadicacion) {
        handleHeaderBack();
      }

      alert('Proceso removido de favoritos');
    } catch (err) {
      console.error('Error removiendo favorito:', err);
      alert('Error al remover el proceso de favoritos');
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedProcess) {
      return;
    }

    setIsSavingFavorite(true);

    try {
      if (isFavorite) {
        await directJudicialAPI.removeFavoriteProcess(selectedProcess.numeroRadicacion);
        setIsFavorite(false);
        setFavoriteProcesses(prev => prev.filter(p => p.numero_radicacion !== selectedProcess.numeroRadicacion));
        handleHeaderBack();
        alert('Proceso removido de favoritos');
      } else {
        await directJudicialAPI.saveFavoriteProcess({
          numero_radicacion: selectedProcess.numeroRadicacion,
          despacho: selectedProcess.despacho,
          demandante: selectedProcess.demandante || '',
          demandado: selectedProcess.demandado || '',
          tipo_proceso: selectedProcess.tipoProceso || '',
          fecha_radicacion: selectedProcess.fechaProceso || new Date().toISOString(),
        });

        setIsFavorite(true);
        await loadFavorites();
        alert('Proceso agregado a favoritos');
      }
    } catch (err) {
      console.error('Error al actualizar favorito:', err);
      alert('Error al actualizar favoritos');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const renderHeader = (showBack: boolean) => (
    <header className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                type="button"
                onClick={handleHeaderBack}
                className="rounded-full p-2 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                title="Regresar al listado"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
            >
              <img src="/logo_justitrack.png" alt="JustiTrack" className="h-12 w-auto" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="rounded-full px-4 py-3 text-base font-semibold tracking-wide text-white/95 transition hover:bg-white/15 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <img src="/usuario.png" alt="Usuario" className="h-6 w-6" />
                <span className="hidden sm:inline">{displayName}</span>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 z-20 mt-3 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-xl ring-1 ring-black/5">
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-100"
                    >
                      Perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile?section=configuracion');
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-100"
                    >
                      Configuración
                    </button>
                  </div>
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger-600 transition hover:bg-danger-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  if (selectedProcess) {
    const detailsSource = processDetails || selectedProcess;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
        {renderHeader(true)}

        <main className="flex-1">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando detalles del proceso...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white shadow-sm border-b mb-6 rounded-lg p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">DETALLE DEL PROCESO</h2>
                  <p className="text-lg text-blue-600 font-mono">{selectedProcess.numeroRadicacion}</p>
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
                        <span className="text-gray-700">Guardando...</span>
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
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{formatDate(detailsSource?.fechaRadicacion || selectedProcess.fechaRadicacion || 'N/A')}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Recurso:</label>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.recurso || 'SIN TIPO DE RECURSO'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Despacho:</label>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.despacho || selectedProcess.despacho}</p>
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
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{detailsSource?.tipoProceso || selectedProcess.tipoProceso || 'N/A'}</p>
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
          )}
        </main>

        <PublicFooter />

        {showDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documentos de la actuación</h3>
                  <p className="text-sm text-gray-600">
                    {selectedActuacion?.actuacion} - {formatDate(selectedActuacion?.fechaActuacion || '')}
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
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {renderHeader(false)}
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando procesos favoritos...</p>
          </div>
        </div>

        <PublicFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {renderHeader(false)}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Error</h2>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <button
              onClick={loadFavorites}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>

        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderHeader(false)}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Procesos favoritos</h2>
              <p className="text-gray-600">Tienes {favoriteProcesses.length} procesos guardados</p>
            </div>
          </div>
        </div>

        {favoriteProcesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No tienes procesos favoritos</h2>
            <p className="text-gray-600 mb-6">
              Consulta un proceso y haz clic en el botón "Guardar" para agregarlo a tus favoritos.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Consultar Procesos
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {favoriteProcesses.map(process => (
              <div
                key={process.numero_radicacion}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-gray-800">{process.numero_radicacion}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Despacho:</span>
                        <p className="text-gray-600 mt-1">{process.despacho}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo de Proceso:</span>
                        <p className="text-gray-600 mt-1">{process.tipo_proceso || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Demandante:</span>
                        <p className="text-gray-600 mt-1">{process.demandante || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Demandado:</span>
                        <p className="text-gray-600 mt-1">{process.demandado || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Fecha de Radicación:</span>
                        <p className="text-gray-600 mt-1">{formatDate(process.fecha_radicacion)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(process.numero_radicacion)}
                      className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      title="Ver detalles del proceso"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalles</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(process.numero_radicacion)}
                      className="flex items-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default MyProcessesPage;
