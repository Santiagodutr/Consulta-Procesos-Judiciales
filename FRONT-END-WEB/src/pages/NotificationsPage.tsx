import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'process_update' | 'system' | 'reminder' | 'alert';
  title: string;
  message: string;
  processNumber?: string;
  createdAt: string;
  readAt?: string;
  priority: 'low' | 'medium' | 'high';
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'process_update' | 'system'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['notifications', user?.id, filter],
    queryFn: async (): Promise<Notification[]> => {
      // Mock data for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'process_update',
          title: 'Nueva actuación procesal',
          message: 'Se ha registrado una nueva actuación en el proceso 2024-00123: Auto de admisión de demanda',
          processNumber: '2024-00123',
          createdAt: '2024-01-20T14:20:00Z',
          priority: 'high'
        },
        {
          id: '2',
          type: 'process_update',
          title: 'Actualización de proceso',
          message: 'El proceso 2024-00098 ha sido actualizado: Traslado de demanda por 20 días',
          processNumber: '2024-00098',
          createdAt: '2024-01-19T16:45:00Z',
          readAt: '2024-01-19T18:30:00Z',
          priority: 'medium'
        },
        {
          id: '3',
          type: 'reminder',
          title: 'Recordatorio de audiencia',
          message: 'Recordatorio: Audiencia de conciliación programada para mañana a las 2:00 PM en el proceso 2024-00076',
          processNumber: '2024-00076',
          createdAt: '2024-01-18T09:15:00Z',
          priority: 'high'
        },
        {
          id: '4',
          type: 'system',
          title: 'Sistema actualizado',
          message: 'El sistema de consultas ha sido actualizado con nuevas funcionalidades de monitoreo',
          createdAt: '2024-01-17T10:00:00Z',
          readAt: '2024-01-17T15:20:00Z',
          priority: 'low'
        },
        {
          id: '5',
          type: 'alert',
          title: 'Falla en monitoreo',
          message: 'No se pudo acceder al portal judicial. Reintentando automáticamente...',
          createdAt: '2024-01-16T08:30:00Z',
          readAt: '2024-01-16T09:00:00Z',
          priority: 'medium'
        }
      ];

      // Filter notifications based on selected filter
      let filtered = mockNotifications;
      
      if (filter === 'unread') {
        filtered = mockNotifications.filter(n => !n.readAt);
      } else if (filter !== 'all') {
        filtered = mockNotifications.filter(n => n.type === filter);
      }

      return filtered;
    },
    enabled: !!user
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const markAsRead = async (notificationIds: string[]) => {
    try {
      // Here you would call your API to mark notifications as read
      // await markNotificationsAsRead(notificationIds);
      
      refetch();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      // Here you would call your API to delete notifications
      // await deleteNotifications(notificationIds);
      
      setSelectedNotifications([]);
      refetch();
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const toggleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(prev => prev.filter(nId => nId !== id));
    } else {
      setSelectedNotifications(prev => [...prev, id]);
    }
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'process_update':
        return (
          <svg className={`h-5 w-5 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'reminder':
        return (
          <svg className={`h-5 w-5 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className={`h-5 w-5 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className={`h-5 w-5 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-2 text-sm text-gray-700">
            Mantente al día con las actualizaciones de tus procesos
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {selectedNotifications.length > 0 && (
            <>
              <button
                onClick={() => markAsRead(selectedNotifications)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Marcar como leído
              </button>
              <button
                onClick={() => deleteNotifications(selectedNotifications)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </button>
            </>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'unread'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Sin leer {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('process_update')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'process_update'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Procesos
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'system'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Sistema
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 12a5 5 0 0110 0v3.5" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones en este momento'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Select All Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6">
            <div className="flex items-center">
              <input
                id="select-all"
                type="checkbox"
                checked={selectedNotifications.length === notifications.length}
                onChange={selectAllNotifications}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="select-all" className="ml-3 text-sm text-gray-700">
                Seleccionar todas
              </label>
              {selectedNotifications.length > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({selectedNotifications.length} seleccionadas)
                </span>
              )}
            </div>
          </div>

          {/* Notifications */}
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors ${
                  !notification.readAt ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelectNotification(notification.id)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />

                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium ${!notification.readAt ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority === 'high' ? 'Alta' : notification.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                        {!notification.readAt && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('es-CO')} - {new Date(notification.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={`mt-1 text-sm ${!notification.readAt ? 'text-gray-900' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    {notification.processNumber && (
                      <p className="mt-1 text-xs text-indigo-600">
                        Proceso: {notification.processNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {!notification.readAt && (
                      <button
                        onClick={() => markAsRead([notification.id])}
                        className="text-indigo-600 hover:text-indigo-500 text-sm"
                      >
                        Marcar leído
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};