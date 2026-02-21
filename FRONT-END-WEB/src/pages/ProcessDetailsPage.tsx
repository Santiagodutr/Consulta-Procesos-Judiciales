import React, { useEffect, useState, useRef } from 'react';
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
import { PublicFooter } from '../components/PublicFooter.tsx';
import { Header } from '../components/Header.tsx';
import {
  Star,
  Download,
  FileDown,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Gavel,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Users,
  Briefcase,
  Loader2,
  Search,
  Clock
} from 'lucide-react';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const REGISTROS_POR_PAGINA = 30;

export const ProcessDetailsPage: React.FC = () => {
  const { numeroRadicacion } = useParams<{ numeroRadicacion: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const exportContentRef = useRef<HTMLElement | null>(null);


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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header title="Historial de Expediente" />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-t-2 border-accent-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gavel className="h-8 w-8 text-primary-900 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-primary-900 uppercase tracking-widest">Sincronizando Expediente</p>
            <p className="text-xs text-gray-400 mt-1">Recuperando registros históricos de la Rama Judicial...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !processData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header title="Historial de Expediente" />
        <div className="flex-1 flex items-center justify-center py-24 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-lg w-full text-center border border-gray-100 animate-scale-in">
            <div className="w-20 h-20 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="h-10 w-10 text-danger-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary-900 mb-2">Error de Sincronización</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">{error || 'No se encontró información del proceso en los archivos históricos.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 bg-primary-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-accent-500 hover:text-primary-900 transition-all active:scale-95 shadow-xl shadow-primary-900/10"
            >
              Regresar al Panel
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const detailsSource = processDetails || processData;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header title="Historial de Expediente" />

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
                    {processData.numeroRadicacion}
                  </h2>
                  <div className="flex flex-wrap items-center gap-6 text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-500" />
                      <span className="text-xs font-semibold">Radicado: {formatDate(processData.fechaRadicacion)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent-500" />
                      <span className="text-xs font-semibold truncate max-w-[300px]">{processData.despacho}</span>
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
                <p className="text-sm font-bold text-primary-900 whitespace-nowrap overflow-hidden text-ellipsis">{processData.tipoProceso || 'ORALIDAD'}</p>
              </div>
              <div className="p-4 px-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sujeto Activo</p>
                <p className="text-sm font-bold text-primary-900 truncate">{processData.demandante || 'RESERVA'}</p>
              </div>
              <div className="p-4 px-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sujeto Pasivo</p>
                <p className="text-sm font-bold text-primary-900 truncate">{processData.demandado || 'RESERVA'}</p>
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
                        { label: 'Fecha de Radicación', value: formatDate(detailsSource?.fechaRadicacion || processData.fechaRadicacion), icon: Calendar },
                        { label: 'Recurso', value: detailsSource?.recurso || 'SIN TIPO DE RECURSO', icon: Gavel },
                        { label: 'Ponente', value: detailsSource?.ponente || 'No especificado', icon: User },
                        { label: 'Ubicación Exp.', value: detailsSource?.ubicacionExpediente || 'ARCHIVO', icon: MapPin },
                        { label: 'Tipo Proceso', value: detailsSource?.tipoProceso || processData.tipoProceso || 'N/A', icon: Briefcase },
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
                          {detailsSource?.despacho || processData.despacho}
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
                                    <span className="text-sm font-bold text-primary-900 whitespace-nowrap">{formatDate(actuacion.fechaActuacion)}</span>
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
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-900/5 text-primary-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-accent-500 hover:text-primary-900 transition-all border border-transparent hover:border-accent-500/20"
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
                            <div>
                              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-gray-100 overflow-hidden" aria-label="Pagination">
                                <button
                                  disabled={!actuacionesPaginacion.anteriorPagina}
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual - 1)}
                                  className="relative inline-flex items-center px-4 py-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 border-r border-gray-100"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  disabled={!actuacionesPaginacion.siguientePagina}
                                  onClick={() => loadActuacionesPagina(actuacionesPaginaActual + 1)}
                                  className="relative inline-flex items-center px-4 py-2 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </nav>
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

      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>

            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in border border-gray-100">
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

              <div className="px-8 py-8 bg-gray-50/50">
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
        </div>
      )}

      <PublicFooter />
    </div>
  );
};

export default ProcessDetailsPage;
