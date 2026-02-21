import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directJudicialAPI } from '../services/apiService.ts';
import { PublicFooter } from '../components/PublicFooter.tsx';
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { myProcessesTourSteps } from '../tours/myProcessesTour.ts';
import {
  judicialPortalService,
  JudicialProcessData,
  ProcessActivity,
  ProcessSubject,
  ProcessDocument,
  ActuacionDocument,
  PaginationInfo
} from '../services/judicialPortalService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Header } from '../components/Header.tsx';
import {
  Star,
  Eye,
  Trash2,
  AlertCircle,
  Download,
  FileDown,
  X,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Briefcase,
  User,
  Search,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Users,
  Loader2
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
  const { user } = useAuth();
  const { startTour, hasCompletedTour } = useTour(myProcessesTourSteps, 'myprocesses');

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


  useEffect(() => {
    loadFavorites();
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

  const handleHeaderBack = () => {
    if (selectedProcess) {
      setSelectedProcess(null);
    } else {
      navigate('/dashboard');
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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


  // Conditional Rendering Logic
  if (selectedProcess) {
    const detailsSource = processDetails || selectedProcess;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header title="Detalles del Proceso" onBack={handleHeaderBack} />

        <main className="flex-1 py-10">
          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-t-2 border-accent-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gavel className="h-8 w-8 text-primary-900 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary-900 uppercase tracking-widest">Sincronizando Expediente</p>
                <p className="text-xs text-gray-400 mt-1">Consultando base de datos judicial en tiempo real...</p>
              </div>
            </div>
          ) : (
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
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Expediente Digital Activo</span>
                      </div>
                      <h2 className="text-4xl font-serif font-bold text-white tracking-tight">
                        {selectedProcess.numeroRadicacion}
                      </h2>
                      <div className="flex flex-wrap items-center gap-6 text-white/60">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent-500" />
                          <span className="text-xs font-semibold">Radicado: {formatDate(selectedProcess.fechaRadicacion)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent-500" />
                          <span className="text-xs font-semibold truncate max-w-[300px]">{selectedProcess.despacho}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4" data-tour="process-actions">
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
                    <p className="text-sm font-bold text-primary-900">{selectedProcess.tipoProceso || 'ORALIDAD'}</p>
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
                      <p className="text-sm font-bold text-primary-900">VIGENTE</p>
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
                            { label: 'Fecha de Radicación', value: formatDate(detailsSource?.fechaRadicacion || selectedProcess.fechaRadicacion || 'N/A'), icon: Calendar },
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
                                {['Sujeto', 'Rol', 'Identificación'].map(header => (
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
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 font-medium">No se registran sujetos procesales</td>
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
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron archivos adjuntos</p>
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
                                  <th className="px-6 py-4 text-left text-[10px] font-bold text-accent-500 uppercase tracking-widest">Fecha</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-bold text-accent-500 uppercase tracking-widest">Actuación</th>
                                  <th className="px-6 py-4 text-center text-[10px] font-bold text-accent-500 uppercase tracking-widest">Docs</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {actuaciones.map((actuacion, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-accent-500/10 transition-colors">
                                          <Calendar className="w-4 h-4 text-gray-400 group-hover:text-accent-500" />
                                        </div>
                                        <span className="text-xs font-bold text-primary-900">{formatDate(actuacion.fechaActuacion)}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                      <p className="text-sm font-bold text-primary-900 mb-1 leading-tight">{actuacion.actuacion}</p>
                                      <p className="text-xs text-gray-500 line-clamp-2">{actuacion.anotacion || 'Sin anotaciones adicionales'}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                      {actuacion.conDocumentos ? (
                                        <button
                                          onClick={() => handleVerDocumentos(actuacion)}
                                          className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-600 hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
                                        >
                                          <FileDown className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                          <X className="w-4 h-4" />
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {actuacionesPaginacion && actuacionesPaginacion.cantPaginas > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <button
                                onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                                disabled={!actuacionesPaginacion.anteriorPagina}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-primary-900 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Anterior</span>
                              </button>
                              <div className="px-4 py-1.5 bg-gray-100 rounded-full">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  Folio {actuacionesPaginaActual} de {actuacionesPaginacion.cantPaginas}
                                </p>
                              </div>
                              <button
                                onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                                disabled={!actuacionesPaginacion.siguientePagina}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-primary-900 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              >
                                <span>Siguiente</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
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

        {/* Improved Document Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div
              className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm animate-fade-in"
              onClick={handleCloseModal}
            ></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
              <div className="bg-primary-900 p-8 flex items-center justify-between border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-500"></div>
                    <span className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">Expediente Adjunto</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white">Documentos de Actuación</h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-danger-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingDocuments ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-accent-500 animate-spin" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recuperando Archivos</p>
                  </div>
                ) : actuacionDocuments.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <Search size={32} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron documentos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actuacionDocuments.map((doc, idx) => (
                      <div key={idx} className="group flex items-center justify-between bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:border-accent-500/30 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary-900/5 flex items-center justify-center text-primary-900 group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary-900 truncate">{doc.nombre}</p>
                            {doc.fechaDocumento && (
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {formatDate(doc.fechaDocumento)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocumento(doc)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
                        >
                          <Download size={14} />
                          <span>Obtener</span>
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

  // Favorites List Redesign
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Gestión de Procesos" onBack={() => navigate('/dashboard')} />
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-16 h-16 rounded-full border-t-2 border-accent-500 animate-spin"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cargando Portafolio</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Gestión de Procesos" onBack={() => navigate('/dashboard')} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-danger-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary-900 mb-2">Error de Conexión</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">{error}</p>
            <button
              onClick={loadFavorites}
              className="w-full bg-primary-900 text-white py-4 px-6 rounded-2xl font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
            >
              Reintentar sincronización
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header title="Gestión de Procesos" onBack={() => navigate('/dashboard')} />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-500"></div>
                <span className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.2em]">Expedientes Guardados</span>
              </div>
              <h1 className="text-4xl font-serif font-bold text-primary-900 tracking-tight">Mi Portafolio</h1>
              <p className="text-gray-500 text-sm">Gestiona y monitorea tus procesos judiciales favoritos</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-gray-100/50">
              <div className="px-6 py-2 bg-gray-50 rounded-xl text-center">
                <p className="text-[24px] font-serif font-bold text-primary-900 leading-none">{favoriteProcesses.length}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Activos</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-primary-900 text-white text-sm font-bold rounded-xl hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 flex items-center gap-3"
              >
                <Search size={16} />
                Nuevo Proceso
              </button>
            </div>
          </div>

          {favoriteProcesses.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-20 text-center border border-gray-100 animate-scale-in">
              <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto transform rotate-12">
                <Star size={48} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">Tu portafolio está vacío</h2>
              <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
                Empieza a seguir procesos judiciales para recibir actualizaciones en tiempo real y generar reportes detallados.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-primary-900 text-white py-4 px-10 rounded-2xl font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 shadow-xl shadow-primary-900/10"
              >
                Buscar mi primer proceso
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {favoriteProcesses.map((process, idx) => (
                <div
                  key={process.numero_radicacion}
                  className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-primary-900/5 transition-all duration-500 overflow-hidden animate-scale-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  data-tour="process-card"
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">JustiTrack ID: {process.id || 'N/A'}</p>
                        <h3 className="text-xl font-serif font-bold text-primary-900 group-hover:text-accent-600 transition-colors">{process.numero_radicacion}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600">
                        <Star size={20} className="fill-accent-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 opacity-40">
                          <Building2 size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Despacho</span>
                        </div>
                        <p className="text-xs font-bold text-primary-900 truncate">{process.despacho}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 opacity-40">
                          <Briefcase size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Tipo</span>
                        </div>
                        <p className="text-xs font-bold text-primary-900 truncate">{process.tipo_proceso || 'CIVIL'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 opacity-40">
                          <Users size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Demandante</span>
                        </div>
                        <p className="text-xs font-bold text-primary-900 truncate">{process.demandante || 'RESERVA'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 opacity-40">
                          <Calendar size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Radicación</span>
                        </div>
                        <p className="text-xs font-bold text-primary-900">{formatDate(process.fecha_radicacion)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                      <button
                        onClick={() => handleViewDetails(process.numero_radicacion)}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95"
                      >
                        <Eye size={18} />
                        <span>Gestionar</span>
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(process.numero_radicacion)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-danger-50 hover:text-danger-500 transition-all border border-transparent hover:border-danger-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <HelpButton onClick={startTour} showNotification={!hasCompletedTour} position="bottom-left" />
      <PublicFooter />
    </div>
  );
};

export default MyProcessesPage;
