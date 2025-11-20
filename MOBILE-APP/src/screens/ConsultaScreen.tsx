import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { judicialAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ConsultaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [numeroRadicacion, setNumeroRadicacion] = useState('');
  const [searchType, setSearchType] = useState<'recent' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<any | null>(null);

  const handleSearch = async () => {
    if (!numeroRadicacion.trim()) {
      Alert.alert('Atención', 'Ingrese el número de radicación');
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setSelectedProcess(null);

    try {
      const res = await judicialAPI.consultProcess(numeroRadicacion.trim(), searchType === 'recent');
      if (res && res.success && res.data) {
        setSearchResults([res.data]);
      } else {
        Alert.alert('Sin resultados', res?.message || 'No se encontró información');
      }
    } catch (err) {
      console.error('Consulta error', err);
      Alert.alert('Error', 'Fallo en la consulta. Verifique la conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProcess = (process: any) => {
    setSelectedProcess(process);
    // navigate to details in parent stack
    navigation.getParent()?.navigate('ProcessDetails', { numeroRadicacion: process.numeroRadicacion, processData: process });
  };

  const handleClear = () => {
    setNumeroRadicacion('');
    setSearchResults([]);
    setSelectedProcess(null);
    setSearchType('all');
  };

  const renderResult = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectProcess(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.caseNumber}>{item.numeroRadicacion}</Text>
        <Text style={styles.small}>{item.despacho}</Text>
        <Text style={styles.small}>Demandante: {item.demandante || 'N/A'}</Text>
      </View>
      <View style={{ justifyContent: 'center' }}>
        <Text style={styles.small}>{item.fechaUltimaActuacion ? new Date(item.fechaUltimaActuacion).toLocaleDateString() : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Consulta por Número de Radicación</Text>
        <Text style={styles.subtitle}>Ingresa 23 dígitos para consultar el proceso judicial</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tipo de consulta</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity style={[styles.radioOption, searchType === 'recent' && styles.radioSelected]} onPress={() => setSearchType('recent')}>
            <Text style={styles.radioTitle}>Procesos con Actuaciones Recientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radioOption, searchType === 'all' && styles.radioSelected]} onPress={() => setSearchType('all')}>
            <Text style={styles.radioTitle}>Todos los Procesos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Número de Radicación</Text>
        <TextInput
          value={numeroRadicacion}
          onChangeText={setNumeroRadicacion}
          placeholder="Ej: 12345678901234567890123"
          keyboardType="number-pad"
          maxLength={23}
          style={styles.input}
        />
        <Text style={styles.count}>{numeroRadicacion.length} / 23</Text>
      </View>

      <View style={styles.rowButtons}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSearch} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CONSULTAR</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleClear}>
          <Text style={styles.buttonTextLight}>LIMPIAR</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );

  return (
    <FlatList
      data={searchResults}
      keyExtractor={(i) => i.numeroRadicacion || i.idProceso || String(Math.random())}
      renderItem={renderResult}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={() => (
        <View style={{ padding: 16 }}>
          {!isLoading && <Text style={{ color: '#666' }}>No hay resultados</Text>}
        </View>
      )}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 6, textAlign: 'center' },

  section: { marginTop: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 6 },
  radioRow: { flexDirection: 'column' },
  radioOption: { padding: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  radioSelected: { borderColor: '#1f6feb', backgroundColor: '#eef6ff' },
  radioTitle: { fontWeight: '600' },

  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  count: { textAlign: 'right', color: '#666', marginTop: 6 },

  rowButtons: { flexDirection: 'row', marginTop: 12 },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  primaryButton: { backgroundColor: '#1f6feb', marginRight: 8 },
  secondaryButton: { backgroundColor: '#6b7280' },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonTextLight: { color: '#fff', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  resultItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  caseNumber: { fontWeight: '700' },
  small: { color: '#666', fontSize: 12 },

  detailCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  detailNumber: { fontWeight: '700', fontSize: 16 },
  detailText: { color: '#444', marginTop: 6 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
});

export default ConsultaScreen;
