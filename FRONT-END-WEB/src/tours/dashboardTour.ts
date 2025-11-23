import { TourStep } from '../hooks/useTour.ts';

export const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="welcome-section"]',
    popover: {
      title: '👋 Bienvenido a tu Dashboard',
      description: 'Este es tu centro de control. Aquí encontrarás un resumen de tu actividad, estadísticas importantes y accesos rápidos a todas las funcionalidades.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: '⚡ Acciones Rápidas',
      description: 'Accede rápidamente a las funciones más usadas: Consultar Procesos, Ver Mis Procesos, Análisis y Notificaciones. Un clic y listo.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="stats-overview"]',
    popover: {
      title: '📊 Resumen de Estadísticas',
      description: 'Visualiza métricas clave: total de consultas realizadas, procesos activos, notificaciones pendientes y fecha de tu última consulta.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="consultation-history"]',
    popover: {
      title: '📜 Historial de Consultas',
      description: 'Revisa todas tus consultas anteriores. Cada proceso muestra información resumida y un botón para ver los detalles completos.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="user-info"]',
    popover: {
      title: '👤 Información de Usuario',
      description: 'Tus datos de perfil siempre visibles. Puedes editarlos desde el menú de usuario en la parte superior.',
      side: 'top',
      align: 'center',
    },
  },
];
