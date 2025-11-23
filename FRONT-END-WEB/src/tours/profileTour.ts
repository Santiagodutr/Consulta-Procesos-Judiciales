import { TourStep } from '../hooks/useTour.ts';

export const profileTourSteps: TourStep[] = [
  {
    element: '[data-tour="profile-header"]',
    popover: {
      title: '👤 Tu Perfil',
      description: 'Administra toda tu información personal, preferencias de notificaciones y configuración de cuenta desde esta página.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="personal-info"]',
    popover: {
      title: '📝 Información Personal',
      description: 'Aquí se muestran tus datos: nombre, correo, teléfono, tipo y número de documento. Haz clic en "Editar información" para actualizarlos.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="edit-button"]',
    popover: {
      title: '✏️ Editar Información',
      description: 'Este botón te permite modificar tu nombre, apellidos y teléfono. Los cambios se guardan de forma segura.',
      side: 'left',
      align: 'end',
    },
  },
  {
    element: '[data-tour="account-status"]',
    popover: {
      title: '✅ Estado de Cuenta',
      description: 'Revisa el estado de tu cuenta: si está activa, si tu correo está verificado y las fechas de creación y última actualización.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="notification-preferences"]',
    popover: {
      title: '🔔 Preferencias de Notificación',
      description: 'Personaliza cómo y cuándo recibir alertas: por correo, SMS, dentro de la app, sobre actuaciones, audiencias, documentos y resúmenes semanales.',
      side: 'top',
      align: 'center',
    },
  },
];
