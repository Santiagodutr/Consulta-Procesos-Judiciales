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
import { useNavigation } from '@react-navigation/native';
import { judicialAPI, judicialPortalAPI } from '../services/apiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type TabType = 'datos' | 'sujetos' | 'documentos' | 'actuaciones';

const REGISTROS_POR_PAGINA = 30;

const MyProcessesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<any>(null);
  
  // Estado para detalles del proceso seleccionado
  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processDetails, setProcessDetails] = useState<any>(null);
  const [sujetos, setSujetos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [actuaciones, setActuaciones] = useState<any[]>([]);
  const [todasActuaciones, setTodasActuaciones] = useState<any[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loadingTab, setLoadingTab] = useState(false);
  const [idProceso, setIdProceso] = useState<number | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await judicialAPI.getFavoriteProcesses();
      if (res && res.success && Array.isArray(res.data)) {
        setFavorites(res.data);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error loading favorites', err);
      Alert.alert('Error', 'No se pudieron cargar los procesos favoritos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (numeroRadicacion: string) => {
    Alert.alert(
      'Confirmar',
      '¿Desea eliminar este proceso de favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await judicialAPI.removeFavoriteProcess(numeroRadicacion);
              setFavorites(favorites.filter(f => f.numero_radicacion !== numeroRadicacion));
              Alert.alert('Éxito', 'Proceso removido de favoritos');
              if (selectedFavorite?.numero_radicacion === numeroRadicacion) {
                setSelectedFavorite(null);
              }
            } catch (err) {
              console.error('Error removing favorite', err);
              Alert.alert('Error', 'No se pudo eliminar el favorito');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = async (favorite: any) => {
    setSelectedFavorite(favorite);
    setLoadingDetails(true);
    setActiveTab('datos');
    setPaginaActual(1);
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setTodasActuaciones([]);
    
    try {
      // Paso 1: Consultar backend para obtener idProceso
      console.log('🔍 Consultando proceso:', favorite.numero_radicacion);
      const res = await judicialAPI.consultProcess(favorite.numero_radicacion, false, true);
      console.log('📦 Respuesta backend:', JSON.stringify(res, null, 2));
      
      if (res && res.success && res.data) {
        const processData = res.data;
        console.log('✅ ProcessData recibido:', {
          idProceso: processData.idProceso,
          id_proceso: processData.id_proceso,
          numeroRadicacion: processData.numeroRadicacion,
          keys: Object.keys(processData)
        });
        setProcessDetails(processData);
        
        // Extraer idProceso (soporta ambos formatos: camelCase y snake_case)
        const id = processData.idProceso || processData.id_proceso;
        if (id) {
          console.log('✅ idProceso encontrado:', id);
          setIdProceso(id);
          // Cargar datos completos desde el portal
          try {
            const portalRes = await judicialPortalAPI.getProcessByIdProceso(id);
            if (portalRes && portalRes.success && portalRes.data) {
              setProcessDetails((prev: any) => ({ ...prev, ...portalRes.data }));
              console.log('✅ Datos del portal cargados');
            }
          } catch (portalErr) {
            console.error('❌ Error loading from portal:', portalErr);
          }
        } else {
          console.warn('⚠️ No idProceso found in processData:', processData);
          Alert.alert('Advertencia', 'No se pudo obtener el ID del proceso. Verifique el número de radicación.');
        }
      } else {
        console.error('❌ Respuesta inválida del backend:', res);
        Alert.alert('Error', 'No se encontró información del proceso');
      }
    } catch (err) {
      console.error('❌ Error loading process details:', err);
      Alert.alert('Error', 'No se pudo cargar la información del proceso');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackToList = () => {
    setSelectedFavorite(null);
    setProcessDetails(null);
    setSujetos([]);
    setDocumentos([]);
    setActuaciones([]);
    setTodasActuaciones([]);
    setIdProceso(null);
    setLoadingTab(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadTabData(tab);
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
            const res = await judicialPortalAPI.getAllActuaciones(idProceso);
            if (res && res.success) {
              const acts = res.data || [];
              setTodasActuaciones(acts);
              setActuaciones(acts.slice(0, REGISTROS_POR_PAGINA));
              setPaginaActual(1);
            }
          }
          break;
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
      Alert.alert('Error', 'No se pudo cargar la información de esta pestaña');
    } finally {
      setLoadingTab(false);
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    const totalPaginas = Math.ceil(todasActuaciones.length / REGISTROS_POR_PAGINA);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    const inicio = (nuevaPagina - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    setActuaciones(todasActuaciones.slice(inicio, fin));
    setPaginaActual(nuevaPagina);
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

  const renderFavoriteItem = ({ item }: { item: any }) => (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteHeader}>
        <Icon name="star" size={20} color="#fbbf24" />
        <Text style={styles.favoriteNumber}>{item.numero_radicacion}</Text>
      </View>
      
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteLabel}>Despacho:</Text>
        <Text style={styles.favoriteValue}>{item.despacho || 'N/A'}</Text>
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteLabel}>Demandante:</Text>
        <Text style={styles.favoriteValue}>{item.demandante || 'N/A'}</Text>
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteLabel}>Demandado:</Text>
        <Text style={styles.favoriteValue}>{item.demandado || 'N/A'}</Text>
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteLabel}>Tipo:</Text>
        <Text style={styles.favoriteValue}>{item.tipo_proceso || 'N/A'}</Text>
      </View>

      <View style={styles.favoriteActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Icon name="eye" size={16} color="#fff" />
          <Text style={styles.viewButtonText}>Ver Detalles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.numero_radicacion)}
        >
          <Icon name="delete" size={16} color="#fff" />
          <Text style={styles.removeButtonText}>Quitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSujeto = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombreRazonSocial || item.lsNombreSujeto || '-'}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Tipo:</Text>
        <Text style={styles.cardValue}>{item.tipoSujeto || item.lsTipoSujeto || '-'}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Identificación:</Text>
        <Text style={styles.cardValue}>{item.identificacion || item.lsIdentificacion || '-'}</Text>
      </View>
      {item.lsApoderado && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Apoderado:</Text>
          <Text style={styles.cardValue}>{item.lsApoderado}</Text>
        </View>
      )}
    </View>
  );

  const renderDocumento = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.docHeader}>
        <Icon name="file-document" size={20} color="#2563eb" />
        <Text style={styles.cardTitle}>{item.lsNombreArchivo || 'Documento'}</Text>
      </View>
      {item.lsTipoDocumento && (
        <Text style={styles.small}>{item.lsTipoDocumento}</Text>
      )}
      {item.lsExtensionArchivo && (
        <Text style={styles.small}>
          {item.lsExtensionArchivo.toUpperCase()}
          {item.lnTamanoArchivo && ` • ${(item.lnTamanoArchivo / 1024).toFixed(1)} KB`}
        </Text>
      )}
    </View>
  );

  const renderActuacion = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.actuacionRow}>
        <View style={styles.flex1}>
          <Text style={styles.actuacionFecha}>{formatDate(item.fechaActuacion)}</Text>
          <Text style={styles.actuacionTitle}>{item.actuacion}</Text>
          {item.anotacion && (
            <Text style={styles.small}>{item.anotacion}</Text>
          )}
          {item.conDocumentos && (
            <View style={styles.docsButton}>
              <Icon name="paperclip" size={14} color="#fff" />
              <Text style={styles.docsButtonText}>Con documentos</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const totalPaginas = Math.ceil(todasActuaciones.length / REGISTROS_POR_PAGINA);

  // Si hay un favorito seleccionado, mostrar vista de detalles
  if (selectedFavorite) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles del Proceso</Text>
        </View>

        <View style={styles.processInfo}>
          <Text style={styles.processNumber}>{selectedFavorite.numero_radicacion}</Text>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => handleTabChange('datos')}
            style={[styles.tab, activeTab === 'datos' && styles.tabActive]}
          >
            <Text style={activeTab === 'datos' ? styles.tabTextActive : styles.tabText}>Datos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('sujetos')}
            style={[styles.tab, activeTab === 'sujetos' && styles.tabActive]}
          >
            <Text style={activeTab === 'sujetos' ? styles.tabTextActive : styles.tabText}>Sujetos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('documentos')}
            style={[styles.tab, activeTab === 'documentos' && styles.tabActive]}
          >
            <Text style={activeTab === 'documentos' ? styles.tabTextActive : styles.tabText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('actuaciones')}
            style={[styles.tab, activeTab === 'actuaciones' && styles.tabActive]}
          >
            <Text style={activeTab === 'actuaciones' ? styles.tabTextActive : styles.tabText}>Actuaciones</Text>
          </TouchableOpacity>
        </View>

        {loadingDetails ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1f6feb" />
            <Text style={styles.loadingText}>Cargando detalles...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {loadingTab && (
              <View style={styles.loadingTabOverlay}>
                <ActivityIndicator size="large" color="#1f6feb" />
              </View>
            )}
            {activeTab === 'datos' && (
              <View style={styles.datosContainer}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Fecha de Radicación:</Text>
                  <Text style={styles.dataValue}>{formatDate(processDetails?.fechaRadicacion || selectedFavorite.fecha_radicacion)}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Despacho:</Text>
                  <Text style={styles.dataValue}>{processDetails?.despacho || selectedFavorite.despacho || '-'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Ponente:</Text>
                  <Text style={styles.dataValue}>{processDetails?.ponente || 'No especificado'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Tipo de Proceso:</Text>
                  <Text style={styles.dataValue}>{processDetails?.tipoProceso || selectedFavorite.tipo_proceso || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Clase de Proceso:</Text>
                  <Text style={styles.dataValue}>{processDetails?.claseProceso || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Demandante:</Text>
                  <Text style={styles.dataValue}>{processDetails?.demandante || selectedFavorite.demandante || '-'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Demandado:</Text>
                  <Text style={styles.dataValue}>{processDetails?.demandado || selectedFavorite.demandado || '-'}</Text>
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
          </ScrollView>
        )}
      </View>
    );
  }

  // Vista de lista de favoritos
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Procesos Favoritos</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1f6feb" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="star-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No tienes procesos favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Marca procesos como favoritos desde la búsqueda para verlos aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, idx) => String(idx)}
          renderItem={renderFavoriteItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 12,
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  favoriteNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f6feb',
    flex: 1,
  },
  favoriteInfo: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  favoriteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  favoriteValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  favoriteActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f6feb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  loadingTabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
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

export default MyProcessesScreen;
