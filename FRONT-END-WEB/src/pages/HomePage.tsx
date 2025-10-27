import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, ArrowLeft, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { judicialPortalService, JudicialProcessData, ProcessActivity, ProcessSubject, ProcessDocument, ActuacionDocument, PaginationInfo } from '../services/judicialPortalService.ts';
import { directJudicialAPI } from '../services/apiService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PublicFooter } from '../components/PublicFooter.tsx';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
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
  
  // Estados para paginación de actuaciones
  const [actuacionesPaginaActual, setActuacionesPaginaActual] = useState(1);
  const [actuacionesPaginacion, setActuacionesPaginacion] = useState<PaginationInfo | null>(null);
  const [todasActuaciones, setTodasActuaciones] = useState<ProcessActivity[]>([]); // Cache de todas las actuaciones
  
  // Estados para modal de documentos de actuación
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [actuacionDocuments, setActuacionDocuments] = useState<ActuacionDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedActuacion, setSelectedActuacion] = useState<ProcessActivity | null>(null);
  
  // Estados para descargas
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  
  // Estados para favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { label: 'Inicio', onClick: () => navigate('/dashboard') },
    { label: 'Reportes', onClick: () => navigate('/analytics') },
    { label: 'Servicios', onClick: () => navigate('/notifications') },
  ];

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Usuario';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderNavbar = () => (
    <header className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleNewSearch}
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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
      const response = await directJudicialAPI.consultProcess(
        numeroRadicacion.trim(), 
        searchType === 'recent'
      );

      if (response.success && response.data) {
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
    
    // Verificar si el proceso es favorito
    if (process.numeroRadicacion) {
      try {
        const esFavorito = await directJudicialAPI.checkIfFavorite(process.numeroRadicacion);
        setIsFavorite(esFavorito);
      } catch (error) {
        console.error('Error verificando favorito:', error);
        setIsFavorite(false);
      }
    }
    
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
          await loadActuacionesPagina(actuacionesPaginaActual);
          break;
      }
    } catch (error) {
      console.error(`Error cargando ${tab}:`, error);
    } finally {
      setIsLoadingTab(false);
    }
  };

  // Cargar página específica de actuaciones
  const loadActuacionesPagina = async (pagina: number) => {
    if (!selectedProcess?.idProceso) {
      console.log('[HomePage] No hay proceso seleccionado');
      return;
    }
    
    console.log(`[HomePage] Solicitando página ${pagina} de actuaciones...`);
    setIsLoadingTab(true);
    
    try {
      // Si ya tenemos todas las actuaciones cacheadas, paginamos localmente
      if (todasActuaciones.length > 0) {
        console.log(`[HomePage] Usando cache (${todasActuaciones.length} actuaciones totales)`);
        
        const REGISTROS_POR_PAGINA = 30;
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
          anteriorPagina: pagina > 1
        });
        setActuacionesPaginaActual(pagina);
        
        console.log(`[HomePage] Mostrando ${actuacionesPagina.length} de ${totalRegistros} (página ${pagina}/${totalPaginas})`);
      } else {
        // Primera carga: obtener del API y cachear
        console.log('[HomePage] Primera carga - obteniendo del API');
        const response = await judicialPortalService.getActuacionesByIdProceso(selectedProcess.idProceso, pagina);
        
        setActuaciones(response.actuaciones);
        setActuacionesPaginacion(response.paginacion || null);
        setActuacionesPaginaActual(pagina);
        
        // Guardar todas las actuaciones en cache
        if (response.todasActuaciones) {
          setTodasActuaciones(response.todasActuaciones);
          console.log(`[HomePage] Cache guardado: ${response.todasActuaciones.length} actuaciones`);
        }
      }
    } catch (error) {
      console.error('[HomePage] Error cargando actuaciones:', error);
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
    setTodasActuaciones([]); // Limpiar cache de actuaciones
    setActuacionesPaginaActual(1);
    setActuacionesPaginacion(null);
    setActiveTab('datos');
  };

  // Nueva consulta
  const handleNewSearch = () => {
    setNumeroRadicacion('');
    setSearchResults([]);
    setSelectedProcess(null);
    setSearchType('all');
    setTodasActuaciones([]); // Limpiar cache de actuaciones
  };

  // Descargas
  const handleDownloadDOCX = async () => {
    setIsDownloadingDOCX(true);
    try {
      // Si estamos en la vista de detalles con idProceso, usar API con idProceso
      if (selectedProcess?.idProceso) {
        await judicialPortalService.downloadDOCXByIdProceso(selectedProcess.idProceso);
      } else {
        // Si estamos en la vista de listado, usar API con numeroRadicacion
        const processToDownload = searchResults[0];
        if (!processToDownload?.numeroRadicacion) {
          alert('No hay proceso disponible para descargar');
          return;
        }
        await judicialPortalService.downloadDOCX(processToDownload.numeroRadicacion, searchType === 'recent');
      }
    } catch (error) {
      console.error('Error descargando DOCX:', error);
      alert('Error al descargar el archivo DOCX');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadCSV = async () => {
    setIsDownloadingCSV(true);
    try {
      // Si estamos en la vista de detalles con idProceso, usar API con idProceso
      if (selectedProcess?.idProceso) {
        await judicialPortalService.downloadCSVByIdProceso(selectedProcess.idProceso);
      } else {
        // Si estamos en la vista de listado, usar API con numeroRadicacion
        const processToDownload = searchResults[0];
        if (!processToDownload?.numeroRadicacion) {
          alert('No hay proceso disponible para descargar');
          return;
        }
        await judicialPortalService.downloadCSV(processToDownload.numeroRadicacion, searchType === 'recent');
      }
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

  // Manejar clic en "Con documentos" para abrir modal
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
    } catch (error) {
      console.error('Error cargando documentos:', error);
      alert('No se pudieron cargar los documentos de la actuación');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Manejar descarga de documento individual
  const handleDownloadDocumento = async (documento: ActuacionDocument) => {
    try {
      await judicialPortalService.downloadDocumento(
        documento.idRegDocumento,
        documento.nombre || `Documento_${documento.idRegDocumento}.pdf`
      );
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('No se pudo descargar el documento');
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setActuacionDocuments([]);
    setSelectedActuacion(null);
  };

  // Manejar agregar/quitar favorito
  const handleToggleFavorite = async () => {
    if (!selectedProcess) return;
    
    setIsSavingFavorite(true);
    try {
      if (isFavorite) {
        // Quitar de favoritos
        await directJudicialAPI.removeFavoriteProcess(selectedProcess.numeroRadicacion);
        setIsFavorite(false);
        alert('Proceso removido de favoritos');
      } else {
        // Agregar a favoritos
        await directJudicialAPI.saveFavoriteProcess({
          numero_radicacion: selectedProcess.numeroRadicacion,
          despacho: selectedProcess.despacho,
          demandante: selectedProcess.demandante || '',
          demandado: selectedProcess.demandado || '',
          tipo_proceso: selectedProcess.tipoProceso || '',
          fecha_radicacion: selectedProcess.fechaProceso || new Date().toISOString()
        });
        setIsFavorite(true);
        alert('Proceso agregado a favoritos');
      }
    } catch (error) {
      console.error('Error al guardar favorito:', error);
      alert('Error al actualizar favoritos');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  // ==================== VISTA DE DETALLES CON PESTAÑAS ====================
  if (selectedProcess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {renderNavbar()}

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-100"
                title="Regresar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm text-gray-600">Detalle del proceso</p>
                <p className="text-lg font-semibold text-gray-900">{selectedProcess.numeroRadicacion}</p>
                <p className="text-xs text-gray-500">{selectedProcess.despacho}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              Ir al dashboard
            </button>
          </div>

          <div className="bg-white shadow-sm border-b mb-6 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">DETALLE DEL PROCESO</h2>
                <p className="text-lg text-blue-600 font-mono">{selectedProcess.numeroRadicacion}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleFavorite}
                  disabled={isSavingFavorite}
                  className={`${
                    isFavorite 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  } disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2`}
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

            <div className="text-sm text-gray-600 space-y-1">
              <p>Fecha de consulta: {new Date().toLocaleString('es-CO')}</p>
              <p>Fecha de replicación de datos: {new Date().toLocaleString('es-CO')}</p>
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

                          {/* Controles de Paginación - Solo mostrar si hay navegación disponible */}
                          {actuacionesPaginacion && (actuacionesPaginacion.siguientePagina || actuacionesPaginacion.anteriorPagina) && (
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <span>
                                  Página <span className="font-semibold">{actuacionesPaginacion.paginaActual}</span>
                                  {actuacionesPaginacion.cantPaginas > actuacionesPaginacion.paginaActual && (
                                    <> de <span className="font-semibold">{actuacionesPaginacion.cantPaginas}+</span></>
                                  )}
                                </span>
                                <span className="text-gray-500">•</span>
                                <span>
                                  Total: <span className="font-semibold">{actuaciones.length}</span> actuaciones
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                                  disabled={!actuacionesPaginacion.anteriorPagina || isLoadingTab}
                                  className={`
                                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg
                                    ${actuacionesPaginacion.anteriorPagina && !isLoadingTab
                                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                                    transition-colors
                                  `}
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />
                                  Anterior
                                </button>

                                <button
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                                  disabled={!actuacionesPaginacion.siguientePagina || isLoadingTab}
                                  className={`
                                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg
                                    ${actuacionesPaginacion.siguientePagina && !isLoadingTab
                                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                                    transition-colors
                                  `}
                                >
                                  Siguiente
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                              </div>
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

        <PublicFooter />

        {/* Modal de Documentos de Actuación */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              {/* Header del modal */}
              <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b">
                <h3 className="text-lg font-semibold text-gray-900">Documentos de Actuación</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando documentos...</span>
                  </div>
                ) : actuacionDocuments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay documentos disponibles para esta actuación</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Descripción</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Descargar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {actuacionDocuments.map((doc, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{doc.nombre || `Documento ${index + 1}`}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{doc.descripcion || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDownloadDocumento(doc)}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                title="Descargar documento"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Descargar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VISTA DE LISTADO DE RESULTADOS ====================
  if (searchResults.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {renderNavbar()}

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handleNewSearch}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 transition hover:text-primary-600"
              >
                <span className="text-xl">←</span>
                <span>Regresar a opciones de Consulta</span>
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-4 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={numeroRadicacion}
                  onChange={(e) => setNumeroRadicacion(e.target.value)}
                  placeholder="Ingrese los 23 dígitos del número de radicación"
                  maxLength={23}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
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

        <PublicFooter />
      </div>
    );
  }

  // ==================== PANTALLA INICIAL DE BÚSQUEDA ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {renderNavbar()}

      {/* Contenido principal - Consulta por Número de Radicación */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
                <img src="/consultar.png" alt="Icono consultar" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Consulta por Número de Radicación
              </h2>
              <p className="text-gray-600 mt-2">
                Ingrese el número de radicación de 23 dígitos para consultar la información del proceso judicial
              </p>
            </div>
          </div>

          {/* Tipo de consulta */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de consulta:</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="recent"
                  checked={searchType === 'recent'}
                  onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-700">Procesos con Actuaciones Recientes</span>
                  <span className="block text-sm text-gray-500">Consulta rápida de procesos con movimientos en los últimos 30 días</span>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  value="all"
                  checked={searchType === 'all'}
                  onChange={(e) => setSearchType(e.target.value as 'recent' | 'all')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="ml-3">
                  <span className="block font-medium text-gray-700">Todos los Procesos</span>
                  <span className="block text-sm text-gray-500">Consulta completa (puede tomar más tiempo)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Campo de número de radicación */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Radicación
            </label>
            <input
              type="text"
              value={numeroRadicacion}
              onChange={(e) => setNumeroRadicacion(e.target.value)}
              placeholder="Ej: 12345678901234567890123"
              maxLength={23}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2 text-right text-sm text-gray-500">
              {numeroRadicacion.length} / 23
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-bold text-lg transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>CONSULTANDO...</span>
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
              LIMPIAR
            </button>
          </div>
        </div>
      </div>
    </div>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
