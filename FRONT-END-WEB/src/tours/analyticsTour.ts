import { TourStep } from '../hooks/useTour.ts';

export const analyticsTourSteps: TourStep[] = [
  {
    element: '[data-tour="analytics-header"]',
    popover: {
      title: '📈 Analítica de Procesos',
      description: 'Aquí puedes visualizar la actividad temporal de tus procesos favoritos, identificar patrones y entender mejor el comportamiento judicial.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="export-pdf-btn"]',
    popover: {
      title: '📄 Exportar a PDF',
      description: 'Genera un reporte PDF profesional con todos los gráficos y estadísticas para compartir o archivar.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="summary-cards"]',
    popover: {
      title: '📊 Tarjetas de Resumen',
      description: 'Métricas clave al alcance: procesos favoritos, procesos analizados, total de actuaciones y periodos de inactividad detectados.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="process-list"]',
    popover: {
      title: '📑 Lista de Procesos',
      description: 'Selecciona cualquier proceso de tu lista de favoritos para ver su gráfico de actividad temporal individualizado.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="timeline-chart"]',
    popover: {
      title: '📉 Línea de Tiempo',
      description: 'Visualiza la frecuencia de actuaciones por año. Los picos están marcados en naranja y las zonas sombreadas indican periodos sin actividad.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="activity-details"]',
    popover: {
      title: '📌 Detalles de Actividad',
      description: 'Información detallada sobre el pico de actividad, última actuación registrada y el periodo inactivo más largo detectado.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="consolidated-chart"]',
    popover: {
      title: '📊 Actividad Consolidada',
      description: 'Este gráfico combina la actividad de todos tus procesos favoritos, mostrando tendencias generales en barras.',
      side: 'top',
      align: 'center',
    },
  },
];
