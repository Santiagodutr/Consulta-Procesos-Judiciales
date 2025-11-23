import { TourStep } from '../hooks/useTour.ts';

export const notificationsTourSteps: TourStep[] = [
  {
    element: '[data-tour="notifications-header"]',
    popover: {
      title: '🔔 Centro de Notificaciones',
      description: 'Todas tus alertas en un solo lugar. Mantente informado sobre actuaciones nuevas, recordatorios de audiencias y documentos importantes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="stats-badges"]',
    popover: {
      title: '📊 Resumen de Notificaciones',
      description: 'Visualiza rápidamente cuántas notificaciones tienes en total y cuántas aún no has leído.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="filter-unread"]',
    popover: {
      title: '🔍 Filtrar No Leídas',
      description: 'Activa este filtro para ver solamente las notificaciones que aún no has revisado.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="refresh-button"]',
    popover: {
      title: '🔄 Actualizar',
      description: 'Haz clic aquí para recargar la lista y obtener las notificaciones más recientes.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="mark-all-read-btn"]',
    popover: {
      title: '✅ Marcar Todas como Leídas',
      description: 'Con un solo clic, marca todas las notificaciones pendientes como leídas.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="notification-item"]',
    popover: {
      title: '📬 Notificación Individual',
      description: 'Cada notificación muestra título, mensaje, fecha de creación y un botón para marcarla como leída. Las no leídas tienen fondo azul claro.',
      side: 'right',
      align: 'start',
    },
  },
];
