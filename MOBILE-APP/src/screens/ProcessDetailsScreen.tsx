import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { judicialAPI, judicialPortalAPI } from '../services/apiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

type RouteParams = {
  numeroRadicacion?: string;
  idProceso?: string | number;
  processData?: any;
};

const REGISTROS_POR_PAGINA = 30;

const ProcessDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = (route.params || {}) as RouteParams;

  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [sujetos, setSujetos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [actuaciones, setActuaciones] = useState<any[]>([]);
  const [todasActuaciones, setTodasActuaciones] = useState<any[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [process, setProcess] = useState<any>(params.processData || { numeroRadicacion: params.numeroRadicacion });
  const [idProceso, setIdProceso] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    loadFullProcess();
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    if (!params.numeroRadicacion) return;
    try {
      const res = await judicialAPI.checkIfFavorite(params.numeroRadicacion);
      if (res && res.success) {
        setIsFavorite(res.data === true);
      }
    } catch (err) {
      console.error('Error checking favorite status', err);
    }
  };

  const loadFullProcess = async () => {
    if (!params.numeroRadicacion) return;
    setLoading(true);
    try {
      // Paso 1: Consultar backend para obtener idProceso
      const res = await judicialAPI.consultProcess(params.numeroRadicacion, false, true);
      if (res && res.success && res.data) {
        const processData = res.data;
        setProcess(processData);
        
        // Extraer idProceso
        const id = processData.idProceso;
        if (id) {
          setIdProceso(id);
          // Paso 2: Cargar datos básicos del portal usando idProceso
          await loadProcessFromPortal(id);
        } else {
          console.warn('No idProceso found in response');
          Alert.alert('Advertencia', 'No se pudo obtener el ID del proceso');
        }
      }
    } catch (err) {
      console.error('Error loading full process data', err);
      Alert.alert('Error', 'No se pudo cargar la información del proceso');
    } finally {
      setLoading(false);
    }
  };

  const loadProcessFromPortal = async (id: number) => {
    try {
      // Consultar datos básicos del proceso desde el portal
      const portalRes = await judicialPortalAPI.getProcessByIdProceso(id);
      if (portalRes && portalRes.success && portalRes.data) {
        setProcess((prev: any) => ({ ...prev, ...portalRes.data }));
      }
    } catch (err) {
      console.error('Error loading process from portal', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Limpiar datos existentes
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setTodasActuaciones([]);
    setPaginaActual(1);
    await loadFullProcess();
    setRefreshing(false);
  };

  const loadTabData = async (tab: TabType) => {
    if (tab === 'datos' || !idProceso) return;
    
    setLoadingTab(true);
    try {
      switch (tab) {
        case 'sujetos':
          if (sujetos.length === 0) {
            const res = await judicialPortalAPI.getSujetosByIdProceso(idProceso);
            if (res && res.success) {
              setSujetos(res.data || []);
            }
          }
          break;
        
        case 'documentos':
          if (documentos.length === 0) {
            const res = await judicialPortalAPI.getDocumentosByIdProceso(idProceso);
            if (res && res.success) {
              setDocumentos(res.data || []);
            }
          }
          break;
        
        case 'actuaciones':
          if (actuaciones.length === 0 && todasActuaciones.length === 0) {
            // Cargar todas las páginas de actuaciones
            const res = await judicialPortalAPI.getAllActuaciones(idProceso);
            if (res && res.success) {
              const acts = res.data || [];
              setTodasActuaciones(acts);
              // Mostrar primera página
              setActuaciones(acts.slice(0, REGISTROS_POR_PAGINA));
              setPaginaActual(1);
            }
          }
          break;
      }
    } catch (err) {
      console.error('Error loading tab data', err);
      Alert.alert('Error', 'No se pudo cargar la información de esta pestaña');
    } finally {
      setLoadingTab(false);
    }
  };

  const onTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const cambiarPagina = (nuevaPagina: number) => {
    const totalPaginas = Math.ceil(todasActuaciones.length / REGISTROS_POR_PAGINA);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    const inicio = (nuevaPagina - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    setActuaciones(todasActuaciones.slice(inicio, fin));
    setPaginaActual(nuevaPagina);
  };

  const handleToggleFavorite = async () => {
    if (!process || !process.numeroRadicacion) return;
    
    setSavingFavorite(true);
    try {
      if (isFavorite) {
        await judicialAPI.removeFavoriteProcess(process.numeroRadicacion);
        setIsFavorite(false);
        Alert.alert('Éxito', 'Proceso removido de favoritos');
      } else {
        await judicialAPI.saveFavoriteProcess({
          numero_radicacion: process.numeroRadicacion,
          despacho: process.despacho || process.lsDespacho || '',
          demandante: process.demandante || process.demandantes || '-',
          demandado: process.demandado || process.demandados || '-',
          tipo_proceso: process.tipoProceso || process.lsTipoProceso || process.departamento || '',
          fecha_radicacion: process.fechaProceso || process.fechaRadicacion || process.lsFechaRadicacion || new Date().toISOString(),
        });
        setIsFavorite(true);
        Alert.alert('Éxito', 'Proceso agregado a favoritos');
      }
    } catch (err) {
      console.error('Error updating favorite', err);
      Alert.alert('Error', 'No se pudo actualizar el favorito');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleDownloadDOCX = () => {
    Alert.alert('Descarga', 'Descarga de documentos DOCX no disponible en mobile');
  };

  const handleDownloadCSV = () => {
    Alert.alert('Descarga', 'Descarga de documentos CSV no disponible en mobile');
  };

  const handleVerDocumentos = (actuacion: any) => {
    Alert.alert('Documentos', 'Función de documentos por actuación próximamente');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderSujeto = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre || item.nombreRazonSocial || item.lsNombreSujeto || '-'}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Tipo:</Text>
        <Text style={styles.cardValue}>{item.tipo || item.tipoSujeto || item.lsTipoSujeto || '-'}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Identificación:</Text>
        <Text style={styles.cardValue}>{item.identificacion || item.lsIdentificacion || '-'}</Text>
      </View>
      {(item.apoderado || item.lsApoderado) && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Apoderado:</Text>
          <Text style={styles.cardValue}>{item.apoderado || item.lsApoderado}</Text>
        </View>
      )}
    </View>
  );

  const renderDocumento = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.docHeader}>
        <Icon name="file-document" size={20} color="#2563eb" />
        <Text style={styles.cardTitle}>{item.nombreArchivo || item.lsNombreArchivo || 'Documento'}</Text>
      </View>
      {(item.tipoDocumento || item.lsTipoDocumento) && (
        <Text style={styles.small}>{item.tipoDocumento || item.lsTipoDocumento}</Text>
      )}
      {(item.extensionArchivo || item.lsExtensionArchivo) && (
        <Text style={styles.small}>
          {(item.extensionArchivo || item.lsExtensionArchivo).toUpperCase()}
          {(item.tamanoArchivo || item.lnTamanoArchivo) && ` • ${((item.tamanoArchivo || item.lnTamanoArchivo) / 1024).toFixed(1)} KB`}
        </Text>
      )}
    </View>
  );

  const renderActuacion = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.actuacionRow}>
        <View style={styles.flex1}>
          <Text style={styles.actuacionFecha}>{formatDate(item.fechaActuacion || item.fecha)}</Text>
          <Text style={styles.actuacionTitle}>{item.actuacion || item.descripcion || '-'}</Text>
          {(item.anotacion || item.observacion) && (
            <Text style={styles.small}>{item.anotacion || item.observacion}</Text>
          )}
          {item.conDocumentos && (
            <TouchableOpacity
              style={styles.docsButton}
              onPress={() => handleVerDocumentos(item)}
            >
              <Icon name="paperclip" size={14} color="#fff" />
              <Text style={styles.docsButtonText}>Con documentos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const totalPaginas = Math.ceil(todasActuaciones.length / REGISTROS_POR_PAGINA);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Proceso</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={savingFavorite}
            style={styles.iconBtn}
          >
            <Icon
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? '#fbbf24' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.processInfo}>
        <Text style={styles.processNumber}>{process?.numeroRadicacion || 'N/A'}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadDOCX}>
            <Icon name="file-word" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>DOC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGreen]} onPress={handleDownloadCSV}>
            <Icon name="file-delimited" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => onTabChange('datos')}
          style={[styles.tab, activeTab === 'datos' && styles.tabActive]}
        >
          <Text style={activeTab === 'datos' ? styles.tabTextActive : styles.tabText}>Datos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTabChange('sujetos')}
          style={[styles.tab, activeTab === 'sujetos' && styles.tabActive]}
        >
          <Text style={activeTab === 'sujetos' ? styles.tabTextActive : styles.tabText}>Sujetos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTabChange('documentos')}
          style={[styles.tab, activeTab === 'documentos' && styles.tabActive]}
        >
          <Text style={activeTab === 'documentos' ? styles.tabTextActive : styles.tabText}>Documentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTabChange('actuaciones')}
          style={[styles.tab, activeTab === 'actuaciones' && styles.tabActive]}
        >
          <Text style={activeTab === 'actuaciones' ? styles.tabTextActive : styles.tabText}>Actuaciones</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1f6feb" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loadingTab ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#1f6feb" />
            </View>
          ) : (
            <>
              {activeTab === 'datos' && (
                <View style={styles.datosContainer}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Número de Radicación:</Text>
                    <Text style={styles.dataValue}>{process?.numeroRadicacion || process?.lsIdProceso || '-'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Fecha de Radicación:</Text>
                    <Text style={styles.dataValue}>{formatDate(process?.fechaRadicacion || process?.lsFechaRadicacion)}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Despacho:</Text>
                    <Text style={styles.dataValue}>{process?.despacho || process?.lsDespacho || '-'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Ponente:</Text>
                    <Text style={styles.dataValue}>{process?.ponente || 'No especificado'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Ubicación del Expediente:</Text>
                    <Text style={styles.dataValue}>{process?.ubicacionExpediente || process?.lsUbicacionExpediente || 'ARCHIVO'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Tipo de Proceso:</Text>
                    <Text style={styles.dataValue}>{process?.tipoProceso || process?.lsTipoProceso || process?.departamento || 'N/A'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Clase de Proceso:</Text>
                    <Text style={styles.dataValue}>{process?.claseProceso || process?.lsClaseProceso || 'N/A'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Subclase de Proceso:</Text>
                    <Text style={styles.dataValue}>{process?.subclaseProceso || process?.lsSubClaseProceso || 'SIN SUBCLASE'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Recurso:</Text>
                    <Text style={styles.dataValue}>{process?.recurso || process?.lsRecurso || 'N/A'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Contenido de la Decisión:</Text>
                    <Text style={styles.dataValue}>{process?.contenidoDecision || process?.lsContenidoDecision || 'N/A'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Demandante:</Text>
                    <Text style={styles.dataValue}>{process?.demandante || process?.demandantes || '-'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Demandado:</Text>
                    <Text style={styles.dataValue}>{process?.demandado || process?.demandados || '-'}</Text>
                  </View>
                </View>
              )}

              {activeTab === 'sujetos' && (
                <>
                  {sujetos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay sujetos procesales disponibles</Text>
                  ) : (
                    <FlatList
                      data={sujetos}
                      keyExtractor={(item, idx) => String(idx)}
                      renderItem={renderSujeto}
                      scrollEnabled={false}
                    />
                  )}
                </>
              )}

              {activeTab === 'documentos' && (
                <>
                  {documentos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay documentos disponibles</Text>
                  ) : (
                    <FlatList
                      data={documentos}
                      keyExtractor={(item, idx) => String(idx)}
                      renderItem={renderDocumento}
                      scrollEnabled={false}
                    />
                  )}
                </>
              )}

              {activeTab === 'actuaciones' && (
                <>
                  {actuaciones.length === 0 ? (
                    <Text style={styles.emptyText}>No hay actuaciones disponibles</Text>
                  ) : (
                    <>
                      <FlatList
                        data={actuaciones}
                        keyExtractor={(item, idx) => String(idx)}
                        renderItem={renderActuacion}
                        scrollEnabled={false}
                      />
                      {totalPaginas > 1 && (
                        <View style={styles.pagination}>
                          <TouchableOpacity
                            style={[styles.paginationBtn, paginaActual === 1 && styles.paginationBtnDisabled]}
                            onPress={() => cambiarPagina(paginaActual - 1)}
                            disabled={paginaActual === 1}
                          >
                            <Icon name="chevron-left" size={20} color="#333" />
                          </TouchableOpacity>
                          <Text style={styles.paginationText}>
                            Página {paginaActual} de {totalPaginas}
                          </Text>
                          <TouchableOpacity
                            style={[styles.paginationBtn, paginaActual === totalPaginas && styles.paginationBtnDisabled]}
                            onPress={() => cambiarPagina(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                          >
                            <Icon name="chevron-right" size={20} color="#333" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f6feb',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  processInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  processNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f6feb',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnGreen: {
    backgroundColor: '#16a34a',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1f6feb',
  },
  tabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1f6feb',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
  },
  datosContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  dataRow: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 15,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 100,
  },
  cardValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  small: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actuacionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  actuacionFecha: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actuacionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  docsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  docsButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  paginationBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paginationBtnDisabled: {
    opacity: 0.3,
  },
  paginationText: {
    fontSize: 13,
    color: '#666',
  },
});

export default ProcessDetailsScreen;
