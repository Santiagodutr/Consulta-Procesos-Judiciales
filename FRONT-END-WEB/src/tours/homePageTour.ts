import { TourStep } from '../hooks/useTour.ts';

export const homePageTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-type"]',
    popover: {
      title: '⚡ Tipo de Consulta',
      description: 'Elige entre consultar solo procesos con actuaciones recientes (más rápido) o todos los procesos (consulta completa). La opción de actuaciones recientes te ahorra tiempo.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="search-input"]',
    popover: {
      title: '📝 Número de Radicación',
      description: 'Ingresa exactamente 23 dígitos del número de radicación del proceso judicial que deseas consultar. El sistema validará automáticamente el formato.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="search-button"]',
    popover: {
      title: '🚀 Consultar Proceso',
      description: 'Haz clic aquí para iniciar la búsqueda. El sistema se conectará al portal oficial de la Rama Judicial para obtener información actualizada en tiempo real.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="search-results"]',
    popover: {
      title: '📋 Resultados de Búsqueda',
      description: 'Aquí se mostrarán los procesos encontrados con toda su información: número de radicación, fechas, despacho y sujetos procesales.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="download-buttons"]',
    popover: {
      title: '📥 Botones de Descarga',
      description: 'Exporta toda la información del proceso en formato DOC o CSV para editar, compartir o analizar fácilmente.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="favorite-button"]',
    popover: {
      title: '⭐ Guardar como Favorito',
      description: 'Agrega este proceso a tus favoritos para acceder rápidamente y recibir notificaciones automáticas de nuevas actuaciones.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="process-tabs"]',
    popover: {
      title: '📑 Pestañas de Información',
      description: 'Navega entre diferentes secciones: Datos del Proceso, Sujetos Procesales, Documentos y Actuaciones. Cada pestaña organiza la información de manera clara.',
      side: 'bottom',
      align: 'start',
    },
  },
];
