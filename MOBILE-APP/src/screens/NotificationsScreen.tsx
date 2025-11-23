import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  processId?: string;
  type?: string;
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Sin datos - página vacía
  const mockNotifications: NotificationItem[] = [];

  const displayNotifications = showUnreadOnly
    ? mockNotifications.filter((n) => !n.isRead)
    : mockNotifications;

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  const handleRefresh = () => {
    setLoading(true);
    // Simular carga
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleMarkAsRead = (id: string) => {
    // Implementación futura
    console.log('Marcar como leída:', id);
  };

  const handleMarkAllAsRead = () => {
    // Implementación futura
    console.log('Marcar todas como leídas');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'process_update':
        return 'file-document-edit';
      case 'hearing_reminder':
        return 'calendar-clock';
      case 'document_alert':
        return 'file-download';
      default:
        return 'bell';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notificaciones</Text>
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={handleRefresh}
      >
        <Icon name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statBadge}>
        <Text style={styles.statLabel}>Total</Text>
        <Text style={styles.statValue}>{mockNotifications.length}</Text>
      </View>
      <View style={[styles.statBadge, styles.statBadgeWarning]}>
        <Text style={[styles.statLabel, styles.statLabelWarning]}>Sin leer</Text>
        <Text style={[styles.statValue, styles.statValueWarning]}>{unreadCount}</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={styles.filterCheckbox}
        onPress={() => setShowUnreadOnly(!showUnreadOnly)}
      >
        <View style={[styles.checkbox, showUnreadOnly && styles.checkboxChecked]}>
          {showUnreadOnly && <Icon name="check" size={16} color="#fff" />}
        </View>
        <Text style={styles.filterLabel}>Mostrar solo no leídas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.markAllButton, unreadCount === 0 && styles.buttonDisabled]}
        onPress={handleMarkAllAsRead}
        disabled={unreadCount === 0}
      >
        <Icon name="check-all" size={18} color={unreadCount === 0 ? '#999' : '#fff'} />
        <Text style={[styles.markAllButtonText, unreadCount === 0 && styles.buttonDisabledText]}>
          Marcar todas
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotification = (item: NotificationItem) => (
    <View
      key={item.id}
      style={[styles.notificationCard, !item.isRead && styles.notificationUnread]}
    >
      <View style={styles.notificationHeader}>
        <Icon
          name={getNotificationIcon(item.type)}
          size={24}
          color={item.isRead ? '#666' : '#1f6feb'}
        />
        <View style={styles.notificationTitleContainer}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>
            {item.title}
          </Text>
          {!item.isRead && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nueva</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.notificationMessage}>{item.message}</Text>

      <View style={styles.notificationFooter}>
        <View style={styles.notificationMeta}>
          <Icon name="clock-outline" size={12} color="#999" />
          <Text style={styles.notificationDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {!item.isRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Text style={styles.markReadButtonText}>Marcar leída</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/notificaciones.png')}
        style={styles.emptyIcon}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No hay notificaciones</Text>
      <Text style={styles.emptySubtitle}>
        Aquí aparecerán las actualizaciones de{"\n"}
        los procesos que sigues y tus consultas{"\n"}
        recientes.
      </Text>
      <TouchableOpacity 
        style={styles.backToDashboardButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backToDashboardButtonText}>Volver al dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Gestiona tus alertas</Text>
          <Text style={styles.descriptionText}>
            Mantente informado sobre las actualizaciones de tus procesos favoritos y consultas recientes
          </Text>
        </View>

        {renderStats()}
        {renderFilters()}

        <View style={styles.notificationsContainer}>
          {displayNotifications.length === 0 ? (
            renderEmptyState()
          ) : (
            displayNotifications.map(renderNotification)
          )}
        </View>
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  refreshBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statBadge: {
    backgroundColor: '#e0edff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadgeWarning: {
    backgroundColor: '#fef3c7',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f6feb',
  },
  statLabelWarning: {
    color: '#92400e',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f6feb',
  },
  statValueWarning: {
    color: '#92400e',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1f6feb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1f6feb',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1f6feb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  buttonDisabledText: {
    color: '#999',
  },
  notificationsContainer: {
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationUnread: {
    backgroundColor: '#f0f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1f6feb',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  notificationTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  notificationTitleUnread: {
    color: '#1f6feb',
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#1f6feb',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  markReadButton: {
    borderWidth: 1,
    borderColor: '#1f6feb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markReadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f6feb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    tintColor: '#fbbf24',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToDashboardButton: {
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  backToDashboardButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
