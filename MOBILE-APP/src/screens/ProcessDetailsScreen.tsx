import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { judicialAPI } from '../services/apiService';

type RouteParams = {
  numeroRadicacion?: string;
  idProceso?: string | number;
  processData?: any;
};

const ProcessDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = (route.params || {}) as RouteParams;

  const [activeTab, setActiveTab] = useState<'datos' | 'sujetos' | 'documentos' | 'actuaciones'>('datos');
  const [loading, setLoading] = useState(false);
  const [sujetos, setSujetos] = useState<any[]>([]);
  const [actuaciones, setActuaciones] = useState<any[]>([]);
  const [process, setProcess] = useState<any>(params.processData || { numeroRadicacion: params.numeroRadicacion });

  useEffect(() => {
    // If we don't have detailed data, try to consult the process (force refresh)
    if ((!process || (!process.sujetos && !process.actuaciones)) && params.numeroRadicacion) {
      loadFullProcess();
    }
  }, []);

  const loadFullProcess = async () => {
    if (!params.numeroRadicacion) return;
    setLoading(true);
    try {
      // Force a fresh consult so backend scrapes portal if needed
      const res = await judicialAPI.consultProcess(params.numeroRadicacion, false, true);
      if (res && res.success && res.data) {
        setProcess(res.data);
        setSujetos(res.data.sujetos || []);
        setActuaciones(res.data.actuaciones || []);
      } else {
        // If consult didn't return data, keep trying lightweight endpoints when tabs open
        console.debug('Full consult returned no data', res);
      }
    } catch (err) {
      console.error('Error loading full process data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSujetos = async () => {
    if (!params.numeroRadicacion) return;
    setLoading(true);
    try {
      // First try to use any already-loaded process data
      if (process && Array.isArray(process.sujetos) && process.sujetos.length > 0) {
        setSujetos(process.sujetos);
      } else {
        const res = await judicialAPI.getProcessSubjects(params.numeroRadicacion);
        if (res && res.success && Array.isArray(res.data)) setSujetos(res.data);
        else setSujetos([]);
      }
    } catch (err) {
      console.error('Error loading sujetos', err);
      Alert.alert('Error', 'No se pudieron cargar los sujetos procesales');
    } finally {
      setLoading(false);
    }
  };

  const loadActuaciones = async () => {
    if (!params.numeroRadicacion) return;
    setLoading(true);
    try {
      // Try existing data first
      if (process && Array.isArray(process.actuaciones) && process.actuaciones.length > 0) {
        setActuaciones(process.actuaciones);
      } else {
        const res = await judicialAPI.getProcessActivities(params.numeroRadicacion);
        if (res && res.success && Array.isArray(res.data)) setActuaciones(res.data);
        else setActuaciones([]);
      }
    } catch (err) {
      console.error('Error loading actuaciones', err);
      Alert.alert('Error', 'No se pudieron cargar las actuaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderSujeto = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <Text style={styles.bold}>{item.nombreRazonSocial || item.lsNombreSujeto || '-'}</Text>
      <Text style={styles.small}>{item.tipoSujeto || item.lsTipoSujeto || '-'}</Text>
      <Text style={styles.small}>{item.identificacion || item.lsIdentificacion || '-'}</Text>
    </View>
  );

  const renderActuacion = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <Text style={styles.bold}>{item.actuacion}</Text>
      <Text style={styles.small}>{item.fechaActuacion || item.fechaRegistro || ''}</Text>
    </View>
  );

  const onTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'sujetos') loadSujetos();
    if (tab === 'actuaciones') loadActuaciones();
  };

  // process state now held in `process` variable

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle - {process?.numeroRadicacion || 'Proceso'}</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => onTabChange('datos')} style={[styles.tab, activeTab === 'datos' && styles.tabActive]}>
          <Text style={activeTab === 'datos' ? styles.tabTextActive : styles.tabText}>Datos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabChange('sujetos')} style={[styles.tab, activeTab === 'sujetos' && styles.tabActive]}>
          <Text style={activeTab === 'sujetos' ? styles.tabTextActive : styles.tabText}>Sujetos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabChange('documentos')} style={[styles.tab, activeTab === 'documentos' && styles.tabActive]}>
          <Text style={activeTab === 'documentos' ? styles.tabTextActive : styles.tabText}>Documentos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabChange('actuaciones')} style={[styles.tab, activeTab === 'actuaciones' && styles.tabActive]}>
          <Text style={activeTab === 'actuaciones' ? styles.tabTextActive : styles.tabText}>Actuaciones</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : activeTab === 'datos' ? (
          <View>
            <Text style={styles.label}>Despacho</Text>
            <Text style={styles.value}>{process?.despacho || '-'}</Text>
            <Text style={styles.label}>Demandante</Text>
            <Text style={styles.value}>{process?.demandante || '-'}</Text>
            <Text style={styles.label}>Demandado</Text>
            <Text style={styles.value}>{process?.demandado || '-'}</Text>
          </View>
        ) : activeTab === 'sujetos' ? (
          <FlatList data={sujetos} keyExtractor={(i, idx) => String(idx)} renderItem={renderSujeto} />
        ) : activeTab === 'documentos' ? (
          <View>
            <Text style={{ color: '#666' }}>Documentos asociados se muestran en la pestaña de actuaciones (si existen).</Text>
          </View>
        ) : (
          <FlatList data={actuaciones} keyExtractor={(i, idx) => String(idx)} renderItem={renderActuacion} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { paddingRight: 12 },
  backText: { fontSize: 18 },
  title: { fontSize: 18, fontWeight: '700' },
  tabsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#fff', marginRight: 8 },
  tabActive: { backgroundColor: '#1f6feb' },
  tabText: { color: '#333' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  row: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  bold: { fontWeight: '700' },
  small: { color: '#666', marginTop: 4 },
  label: { color: '#666', marginTop: 8 },
  value: { fontSize: 15, fontWeight: '600' },
});

export default ProcessDetailsScreen;
