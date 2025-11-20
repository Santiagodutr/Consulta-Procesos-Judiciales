import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { judicialAPI, notificationAPI } from '../services/apiService';

interface ConsultationHistoryItem {
  consultation_id: string;
  process_id: string;
  numero_radicacion: string;
  despacho: string;
  demandante: string;
  demandado: string;
  consulted_at: string;
}

const SimpleDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  useEffect(() => {
    loadConsultationHistory();
    loadUnreadNotifications();
  }, []);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);
      const res = await judicialAPI.getConsultationHistory(10);
      if (res && res.success && Array.isArray(res.data)) {
        setConsultationHistory(res.data);
      } else {
        setConsultationHistory([]);
      }
    } catch (err) {
      console.error('Error loading consultation history', err);
      Alert.alert('Error', 'No se pudo cargar el historial de consultas');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const res = await notificationAPI.getUnreadNotifications(50);
      if (res && res.success && Array.isArray(res.data)) {
        setUnreadNotifications(res.data.length);
      } else if (res && res.success && typeof res.data === 'number') {
        setUnreadNotifications(res.data);
      }
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // navigation will be handled by auth provider / root navigator
    } catch (err) {
      console.error('Logout error', err);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const quickActions = [
    { title: 'Consultar Procesos', description: 'Buscar procesos por número', action: () => navigation.navigate('Home' as any) },
    { title: 'Mis Procesos', description: 'Ver procesos guardados', action: () => navigation.navigate('Profile' as any) },
    { title: 'Análisis', description: 'Ver estadísticas', action: () => Alert.alert('Analytics', 'Funcionalidad de analíticas no implementada aún') },
    { title: 'Notificaciones', description: 'Revisa alertas recientes', action: () => Alert.alert('Notificaciones', 'Ir a notificaciones (no implementado)') },
  ];

  const renderHistoryItem = ({ item }: { item: ConsultationHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.caseNumber}>{item.numero_radicacion}</Text>
        <Text style={styles.small}>{item.despacho}</Text>
        {item.demandante ? <Text style={styles.small}>Demandante: {item.demandante}</Text> : null}
      </View>
      <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
        <Text style={styles.small}>{new Date(item.consulted_at).toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => Alert.alert('Ver detalles', `Ir a detalles del proceso ${item.numero_radicacion}`)}
        >
          <Text style={styles.detailsButtonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bienvenido, {user?.first_name || 'Usuario'}!</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => Alert.alert('Notificaciones', 'Ir a notificaciones (no implementado)')} style={styles.iconButton}>
            <Text>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)} style={styles.iconButton}>
            <Text>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Text>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} onPress={a.action}>
              <Text style={styles.quickTitle}>{a.title}</Text>
              <Text style={styles.quickDesc}>{a.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Consultas</Text>
            <Text style={styles.statValue}>{consultationHistory.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Procesos Activos</Text>
            <Text style={styles.statValue}>{consultationHistory.length}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Notificaciones</Text>
            <Text style={styles.statValue}>{unreadNotifications}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Última Consulta</Text>
            <Text style={styles.statValue}>{consultationHistory.length > 0 ? new Date(consultationHistory[0].consulted_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Consultas</Text>
        {loading ? (
          <ActivityIndicator />
        ) : consultationHistory.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text>No hay consultas recientes</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home' as any)}>
              <Text style={styles.primaryButtonText}>Consultar Procesos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={consultationHistory}
            keyExtractor={(i) => i.consultation_id}
            renderItem={renderHistoryItem}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Usuario</Text>
        <View style={styles.userCard}>
          <Text style={styles.userLabel}>Nombre completo</Text>
          <Text style={styles.userValue}>{user?.first_name} {user?.last_name}</Text>

          <Text style={styles.userLabel}>Email</Text>
          <Text style={styles.userValue}>{user?.email}</Text>

          <Text style={styles.userLabel}>Tipo de usuario</Text>
          <Text style={styles.userValue}>{user?.user_type}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 10, padding: 6 },

  section: { marginTop: 12, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickCard: { width: '48%', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1 },
  quickTitle: { fontWeight: '600', marginBottom: 6 },
  quickDesc: { color: '#666', fontSize: 12 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, width: '48%' },
  statLabel: { color: '#666', fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },

  historyItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  caseNumber: { fontWeight: '700', fontSize: 14 },
  small: { color: '#666', fontSize: 12 },
  detailsButton: { marginTop: 8, backgroundColor: '#1f6feb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  detailsButtonText: { color: '#fff', fontSize: 12 },

  emptyBox: { alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  primaryButton: { marginTop: 8, backgroundColor: '#1f6feb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  primaryButtonText: { color: '#fff' },

  userCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  userLabel: { color: '#666', fontSize: 12, marginTop: 8 },
  userValue: { fontSize: 14, fontWeight: '600' },
});

export default SimpleDashboardScreen;
