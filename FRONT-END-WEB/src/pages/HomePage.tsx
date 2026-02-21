import React, { useState } from 'react';
import {
  Download,
  FileDown,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  History,
  FileText,
  Users,
  ClipboardList,
  AlertCircle,
  Info,
  Calendar,
  Briefcase,
  SearchCode,
  Loader2,
  Gavel,
  Building2,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { judicialPortalService, JudicialProcessData, ProcessActivity, ProcessSubject, ProcessDocument, ActuacionDocument, PaginationInfo } from '../services/judicialPortalService.ts';
import { directJudicialAPI } from '../services/apiService.ts';
import { Header } from '../components/Header.tsx';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { homePageTourSteps } from '../tours/homePageTour.ts';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const HomePage: React.FC = () => {
  // const navigate = useNavigate();
  // const { user, signOut } = useAuth();
  const { startTour, hasCompletedTour } = useTour(homePageTourSteps, 'home');

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
    const detailsSource = processDetails || selectedProcess;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header title="Consulta Digital" showBack={true} onBack={handleBack} />

        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Process Header Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 ring-1 ring-gray-100/50 mb-8 animate-fade-in">
              <div className="bg-primary-900 px-8 py-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Gavel size={240} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full text-accent-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Expediente Digital</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-white tracking-tight">
                      {selectedProcess.numeroRadicacion}
                    </h2>
                    <div className="flex flex-wrap items-center gap-6 text-white/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent-500" />
                        <span className="text-xs font-semibold">Radicado: {formatDate(selectedProcess.fechaRadicacion || '')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-accent-500" />
                        <span className="text-xs font-semibold truncate max-w-[300px]">{selectedProcess.despacho}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isSavingFavorite}
                      className={`group flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${isFavorite
                        ? 'bg-accent-500 text-primary-900 shadow-lg shadow-accent-500/20 active:scale-95'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        }`}
                    >
                      {isSavingFavorite ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary-900" />
                      ) : (
                        <Star className={`h-5 w-5 ${isFavorite ? 'fill-primary-900 text-primary-900' : ''} group-hover:scale-110 transition-transform`} />
                      )}
                      <span>{isFavorite ? 'Favorito' : 'Guardar'}</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadDOCX}
                        disabled={isDownloadingDOCX}
                        className="flex items-center gap-2 px-5 py-3.5 bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isDownloadingDOCX ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 text-accent-500" />}
                        <span>Word</span>
                      </button>
                      <button
                        onClick={handleDownloadCSV}
                        disabled={isDownloadingCSV}
                        className="flex items-center gap-2 px-5 py-3.5 bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isDownloadingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-success-400" />}
                        <span>Excel</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 bg-gray-50/50">
                <div className="p-4 px-8">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de Proceso</p>
                  <p className="text-sm font-bold text-primary-900 whitespace-nowrap overflow-hidden text-ellipsis">{selectedProcess.tipoProceso || 'ORALIDAD'}</p>
                </div>
                <div className="p-4 px-8">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sujeto Activo</p>
                  <p className="text-sm font-bold text-primary-900 truncate">{selectedProcess.demandante || 'RESERVA'}</p>
                </div>
                <div className="p-4 px-8">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sujeto Pasivo</p>
                  <p className="text-sm font-bold text-primary-900 truncate">{selectedProcess.demandado || 'RESERVA'}</p>
                </div>
                <div className="p-4 px-8">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success-500"></span>
                    <p className="text-sm font-bold text-primary-900">ACTIVO</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 ring-1 ring-gray-100/50 animate-scale-in">
              <div className="p-2 bg-gray-50/50 border-b border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'datos', label: 'Datos Generales', icon: FileText },
                    { id: 'sujetos', label: 'Sujetos Procesales', icon: Users },
                    { id: 'documentos', label: 'Expediente Dig.', icon: Briefcase },
                    { id: 'actuaciones', label: 'Actuaciones', icon: Gavel },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as TabType)}
                      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20 active:scale-95'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-primary-900'
                        }`}
                    >
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-accent-500' : ''}`} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {isLoadingTab ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-10 w-10 text-accent-500 animate-spin" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando Sección</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'datos' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4 px-2">
                        {[
                          { label: 'Fecha de Radicación', value: formatDate(detailsSource?.fechaRadicacion || selectedProcess.fechaRadicacion || ''), icon: Calendar },
                          { label: 'Recurso', value: detailsSource?.recurso || 'SIN TIPO DE RECURSO', icon: Gavel },
                          { label: 'Ponente', value: detailsSource?.ponente || 'No especificado', icon: User },
                          { label: 'Ubicación Exp.', value: detailsSource?.ubicacionExpediente || 'ARCHIVO', icon: MapPin },
                          { label: 'Tipo Proceso', value: detailsSource?.tipoProceso || selectedProcess.tipoProceso || 'N/A', icon: Briefcase },
                          { label: 'Clase Proceso', value: detailsSource?.claseProceso || 'N/A', icon: FileText },
                          { label: 'Subclase Proceso', value: detailsSource?.subclaseProceso || 'SIN SUBCLASE', icon: FileText },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-2 group">
                            <div className="flex items-center gap-2">
                              <item.icon className="w-3.5 h-3.5 text-accent-500" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                            </div>
                            <p className="text-sm font-bold text-primary-900 bg-gray-50/50 p-4 rounded-xl border border-gray-100 group-hover:border-accent-500/20 transition-colors">
                              {item.value}
                            </p>
                          </div>
                        ))}
                        <div className="md:col-span-2 lg:col-span-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-accent-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Despacho</span>
                          </div>
                          <p className="text-sm font-bold text-primary-900 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            {detailsSource?.despacho || selectedProcess.despacho}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'sujetos' && (
                      <div className="overflow-hidden rounded-2xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Sujeto', 'Rol', 'Identificación', 'Apoderado'].map(header => (
                                <th key={header} className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sujetos.length > 0 ? sujetos.map((sujeto, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-5 text-sm font-bold text-primary-900">
                                  {sujeto.nombreRazonSocial || sujeto.lsNombreSujeto || '-'}
                                </td>
                                <td className="px-6 py-5">
                                  <span className="inline-flex px-2.5 py-1 bg-primary-900/5 text-primary-900 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                    {sujeto.tipoSujeto || sujeto.lsTipoSujeto || '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-medium text-gray-500">
                                  {sujeto.identificacion || sujeto.lsIdentificacion || '-'}
                                </td>
                                <td className="px-6 py-5 text-xs text-gray-400">
                                  {sujeto.lsApoderado || '-'}
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">No se registran sujetos procesales</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'documentos' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentos.length > 0 ? documentos.map((doc, idx) => (
                          <div key={idx} className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-accent-500/30 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-primary-900 truncate mb-1">{doc.lsNombreArchivo}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.lsTipoDocumento}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-full py-20 text-center space-y-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                              <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay archivos en el expediente digital</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'actuaciones' && (
                      <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-gray-100">
                          <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-primary-900">
                              <tr>
                                {['Fecha', 'Actuación', 'Detalle', 'Documento'].map(header => (
                                  <th key={header} className="px-6 py-4 text-left text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {actuaciones.length > 0 ? actuaciones.map((actuacion, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                      <Clock size={14} className="text-accent-500" />
                                      <span className="text-sm font-bold text-primary-900 whitespace-nowrap">{formatDate(actuacion.fechaActuacion || '')}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="text-sm font-bold text-primary-900 uppercase tracking-tight">{actuacion.actuacion}</span>
                                  </td>
                                  <td className="px-6 py-5 pr-12">
                                    <p className="text-xs text-gray-500 leading-relaxed max-w-md italic">
                                      {actuacion.anotacion || 'Sin anotaciones registradas'}
                                    </p>
                                  </td>
                                  <td className="px-6 py-5">
                                    <button
                                      onClick={() => handleVerDocumentos(actuacion)}
                                      className="flex items-center gap-2 px-4 py-2 bg-primary-900/5 text-primary-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-accent-50 hover:text-primary-900 transition-all border border-transparent hover:border-accent-500/20"
                                    >
                                      <FileText size={14} />
                                      <span>Ver Adjunto</span>
                                    </button>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">No se registran actuaciones</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {actuacionesPaginacion && actuacionesPaginacion.cantPaginas > 1 && (
                          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 border border-gray-100 rounded-2xl">
                            <div className="flex flex-1 justify-between sm:hidden">
                              <button
                                disabled={!actuacionesPaginacion.anteriorPagina}
                                onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Anterior
                              </button>
                              <button
                                disabled={!actuacionesPaginacion.siguientePagina}
                                onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Siguiente
                              </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Mostrando página <span className="font-bold text-primary-900">{actuacionesPaginaActual}</span> de{' '}
                                  <span className="font-bold text-primary-900">{actuacionesPaginacion.cantPaginas}</span> ({actuacionesPaginacion.cantRegistros} actuaciones)
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  disabled={!actuacionesPaginacion.anteriorPagina}
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                                  className="relative inline-flex items-center rounded-xl p-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 border border-gray-100"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  disabled={!actuacionesPaginacion.siguientePagina}
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                                  className="relative inline-flex items-center rounded-xl p-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 border border-gray-100"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />

        {/* Modal de Documentos */}
        {showDocumentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm animate-fade-in" onClick={handleCloseModal}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in relative z-10 border border-gray-100">
              <div className="bg-primary-900 px-8 py-6 flex items-center justify-between border-b border-accent-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-accent-500 uppercase tracking-[0.2em] leading-none mb-1">Documentos de Actuación</h3>
                    <p className="text-white text-xs font-serif opacity-80">{selectedActuacion?.actuacion || 'Detalles del Archivo'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-8 py-8 bg-gray-50/50 max-h-[60vh] overflow-y-auto">
                {loadingDocuments ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-10 w-10 text-accent-500 animate-spin" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Recuperando Archivos</p>
                  </div>
                ) : actuacionDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {actuacionDocuments.map((doc, idx) => (
                      <div key={idx} className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 hover:border-accent-500/30 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary-900 truncate mb-1">{doc.nombre || `Documento_${doc.idRegDocumento}`}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.nombre?.split('.').pop() || 'PDF'} • Expediente Digital</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocumento(doc)}
                          className="flex items-center gap-2 px-5 py-3 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 shadow-lg shadow-primary-900/10"
                        >
                          <Download size={14} />
                          <span>Descargar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                      <Search size={32} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron adjuntos para este registro</p>
                  </div>
                )}
              </div>
              <div className="bg-white px-8 py-6 border-t border-gray-100 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Todos los archivos son firmados digitalmente por la Rama Judicial</p>
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
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header title="Resultados Jurídicos" showBack={true} onBack={handleNewSearch} />

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in flex-1">
          {/* Header de resultados */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <button
                onClick={handleNewSearch}
                className="group flex items-center gap-2 text-gray-400 hover:text-primary-700 transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nueva Consulta</span>
              </button>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-900">
                Expedientes <span className="text-accent-600">Encontrados</span>
              </h2>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadDOCX}
                disabled={isDownloadingDOCX}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-primary-900 text-primary-900 rounded-xl text-xs font-bold hover:bg-primary-50 transition-all shadow-sm"
              >
                {isDownloadingDOCX ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                <span>Descargar Word</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={isDownloadingCSV}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-800 transition-all shadow-lg shadow-primary-900/10"
              >
                {isDownloadingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-accent-500" />}
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          <div className="space-y-6" data-tour="search-results">
            {searchResults.map((process, index) => (
              <div
                key={index}
                onClick={() => handleSelectProcess(process)}
                className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-accent-500 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-primary-900 text-white text-xs font-bold font-mono tracking-[0.2em] rounded-full">
                        {process.numeroRadicacion}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-success-50 text-success-700 rounded-full border border-success-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Activo en Rama</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl md:text-2xl font-serif font-bold text-primary-900 group-hover:text-accent-600 transition-colors uppercase leading-tight">
                        {process.despacho}
                      </h4>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={14} className="text-accent-500" />
                        <p className="text-xs font-bold uppercase tracking-widest">{process.departamento || 'Jurisdicción Nacional'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-gray-50">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sujeto Activo</p>
                        <p className="text-sm font-bold text-primary-900 truncate bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 group-hover:bg-white transition-colors">{process.demandante || 'Información en reserva'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sujeto Pasivo</p>
                        <p className="text-sm font-bold text-primary-900 truncate bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 group-hover:bg-white transition-colors">{process.demandado || 'Información en reserva'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-px lg:h-auto bg-gray-100 self-stretch hidden lg:block"></div>

                  <div className="flex flex-col justify-between items-start lg:items-end lg:w-64 text-left lg:text-right space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Fecha de Radicación</p>
                        <div className="flex lg:justify-end items-center gap-2">
                          <Calendar size={14} className="text-accent-500" />
                          <p className="text-sm font-bold text-primary-900 font-mono">{formatDate(process.fechaRadicacion || '')}</p>
                        </div>
                      </div>
                      {process.fechaUltimaActuacion && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Última Actuación</p>
                          <div className="flex lg:justify-end items-center gap-2">
                            <Clock size={14} className="text-success-500" />
                            <p className="text-sm font-bold text-primary-900 font-mono">{formatDate(process.fechaUltimaActuacion)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary-900 text-white rounded-2xl text-xs font-bold hover:bg-accent-500 hover:text-primary-900 transition-all shadow-xl shadow-primary-900/10 active:scale-95">
                      EXPLORAR EXPEDIENTE
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Decorative accent */}
                <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                  <Gavel size={200} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Mostrando {searchResults.length} {searchResults.length === 1 ? 'proceso encontrado' : 'procesos encontrados'} para el radicado consultado.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>
    );
  }

  // ==================== PANTALLA INICIAL DE BÚSQUEDA ====================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-accent-500/30 relative">
      <Header title="JustiTrack" showBack={false} />

      {/* Hero Background Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-primary-900/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Contenido principal - Consulta por Número de Radicación */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-4xl animate-scale-in">

          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-900/5 border border-primary-900/10 rounded-full text-primary-900/60 mb-2">
              <SearchCode size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Buscador Oficial Rama Judicial</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary-900 leading-tight">
              Localice su <span className="text-accent-600">Proceso</span> <br />
              de Manera Instantánea.
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Gestione su portafolio judicial con la herramienta líder en automatización y consulta de procesos gubernamentales en Colombia.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 relative group">
            {/* Design accents */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <History size={180} />
            </div>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left Panel: visual context */}
              <div className="md:w-1/3 bg-primary-900 p-10 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-900 to-primary-950/80"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center text-primary-900 shadow-xl mb-6">
                    <Search size={28} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold leading-tight decoration-accent-500 underline decoration-2 underline-offset-8">Consulta de Proceso</h3>
                  <p className="text-gray-400 text-sm mt-6 leading-relaxed">
                    Obtenga acceso directo a la base de datos de la Rama Judicial con un solo clic.
                  </p>
                </div>

                <div className="relative z-10 space-y-4">
                  {[
                    { icon: FileText, text: 'Historial completo' },
                    { icon: Users, text: 'Sujetos procesales' },
                    { icon: ClipboardList, text: 'Actuaciones' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/60">
                      <item.icon size={16} className="text-accent-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: actual form */}
              <div className="md:w-2/3 p-10 lg:p-14 flex flex-col justify-center space-y-10">
                <div className="space-y-8">
                  {/* Selector de tipo */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-px bg-accent-500"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Alcance de la Búsqueda</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'recent', label: 'Recientes', sub: 'Últimos 30 días' },
                        { id: 'all', label: 'Histórico', sub: 'Todos los años' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSearchType(type.id as 'recent' | 'all')}
                          className={`
                            text-left p-4 rounded-2xl border transition-all
                            ${searchType === type.id
                              ? 'bg-primary-900 border-primary-900 text-white shadow-xl shadow-primary-900/20'
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}
                          `}
                        >
                          <p className={`text-xs font-bold uppercase tracking-widest ${searchType === type.id ? 'text-accent-500' : 'text-gray-400'}`}>
                            {type.label}
                          </p>
                          <p className="text-[10px] opacity-60 font-medium">{type.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-px bg-accent-500"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Identificador del Proceso</span>
                      </div>
                      <span className={`text-[10px] font-bold font-mono ${numeroRadicacion.length === 23 ? 'text-success-600' : 'text-gray-300'}`}>
                        {numeroRadicacion.length}/23 dígitos
                      </span>
                    </div>
                    <div className="relative group/input">
                      <input
                        type="text"
                        value={numeroRadicacion}
                        onChange={(e) => setNumeroRadicacion(e.target.value.replace(/\D/g, ''))}
                        placeholder="05001310300520190012300"
                        maxLength={23}
                        className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl pl-6 pr-14 py-5 text-2xl font-mono tracking-[0.3em] font-bold text-primary-900 focus:bg-white focus:border-accent-500 transition-all outline-none placeholder:text-gray-200"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        {numeroRadicacion.length === 23 ? (
                          <div className="w-8 h-8 rounded-full bg-success-500 text-white flex items-center justify-center animate-scale-in">
                            <Info size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center">
                            <AlertCircle size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-accent-50 rounded-2xl border border-accent-100">
                      <Info size={16} className="text-accent-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-accent-700 font-medium leading-relaxed">
                        El número de radicación consta de 23 dígitos que identifican de manera única su expediente en el sistema nacional.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || numeroRadicacion.length !== 23}
                    className="flex-1 bg-primary-900 text-white rounded-2xl py-5 font-bold text-sm hover:bg-accent-500 hover:text-primary-900 transition-all shadow-2xl shadow-primary-900/20 active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <div className="bg-accent-500 p-1 rounded-lg group-hover:bg-primary-900 transition-colors">
                        <ChevronRight size={14} className="text-primary-900 group-hover:text-accent-500" />
                      </div>
                    )}
                    <span>{isLoading ? 'EJECUTANDO CONSULTA...' : 'CONSULTAR AHORA'}</span>
                  </button>
                  <button
                    onClick={handleNewSearch}
                    className="w-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary-900 hover:bg-gray-100 transition-all active:scale-95"
                    title="Limpiar"
                  >
                    <History size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
      <PublicFooter />
    </div>
  );
};

export default HomePage;
