import { TourStep } from '../hooks/useTour.ts';

export const myProcessesTourSteps: TourStep[] = [
  {
    element: '[data-tour="favorites-header"]',
    popover: {
      title: '⭐ Tus Procesos Favoritos',
      description: 'Esta es tu lista personalizada de procesos guardados. Aquí puedes acceder rápidamente a los procesos que más te interesan.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="process-card"]',
    popover: {
      title: '📋 Tarjeta de Proceso',
      description: 'Cada tarjeta muestra información resumida del proceso: número de radicación, despacho, partes involucradas y tipo de proceso.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="view-details-btn"]',
    popover: {
      title: '👁️ Ver Detalles',
      description: 'Haz clic aquí para acceder a toda la información detallada del proceso: actuaciones, documentos, sujetos procesales y más.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="remove-favorite-btn"]',
    popover: {
      title: '🗑️ Quitar de Favoritos',
      description: 'Si ya no necesitas seguir este proceso, puedes quitarlo de tus favoritos. No te preocupes, siempre podrás volver a agregarlo.',
      side: 'left',
      align: 'center',
    },
  },
];
