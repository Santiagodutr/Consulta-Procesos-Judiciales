import { useEffect, useRef, useState } from 'react';
import { driver, DriveStep, Driver, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourStep extends DriveStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
}

export const useTour = (steps: TourStep[], pageName: string) => {
  const driverInstance = useRef<Driver | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si el usuario ya completó el tour de esta página
    const tourCompleted = localStorage.getItem(`tour_completed_${pageName}`);
    if (tourCompleted === 'true') {
      setHasCompletedTour(true);
    }

    // Configuración del driver con colores de la aplicación
    const config: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: steps,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      allowClose: true,
      onDestroyed: () => {
        // Marcar el tour como completado cuando se finaliza
        localStorage.setItem(`tour_completed_${pageName}`, 'true');
        setHasCompletedTour(true);
      },
      onDestroyStarted: () => {
        // Permitir cerrar el tour sin confirmación
        if (driverInstance.current) {
          driverInstance.current.destroy();
        }
        localStorage.setItem(`tour_completed_${pageName}`, 'true');
        setHasCompletedTour(true);
      },
      onCloseClick: () => {
        // Manejar el click en la X
        if (driverInstance.current) {
          driverInstance.current.destroy();
        }
        localStorage.setItem(`tour_completed_${pageName}`, 'true');
        setHasCompletedTour(true);
      },
      onPopoverRender: (popover) => {
        // Asegurar que el botón de cerrar funcione
        const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            if (driverInstance.current) {
              driverInstance.current.destroy();
            }
            localStorage.setItem(`tour_completed_${pageName}`, 'true');
            setHasCompletedTour(true);
          });
        }
      },
      popoverClass: 'driverjs-theme-custom',
    };

    driverInstance.current = driver(config);

    return () => {
      if (driverInstance.current) {
        driverInstance.current.destroy();
      }
    };
  }, [steps, pageName]);

  const startTour = () => {
    if (driverInstance.current) {
      // Filtrar solo los steps cuyos elementos existen en el DOM
      const availableSteps = steps.filter(step => {
        const element = document.querySelector(step.element);
        return element !== null;
      });

      if (availableSteps.length === 0) {
        console.warn('No hay elementos disponibles para el tour en esta página');
        return;
      }

      // Actualizar la configuración con los steps disponibles
      const config: Config = {
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: availableSteps,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        progressText: '{{current}} de {{total}}',
        allowClose: true,
        onDestroyed: () => {
          localStorage.setItem(`tour_completed_${pageName}`, 'true');
          setHasCompletedTour(true);
        },
        onDestroyStarted: () => {
          if (driverInstance.current) {
            driverInstance.current.destroy();
          }
          localStorage.setItem(`tour_completed_${pageName}`, 'true');
          setHasCompletedTour(true);
        },
        onCloseClick: () => {
          if (driverInstance.current) {
            driverInstance.current.destroy();
          }
          localStorage.setItem(`tour_completed_${pageName}`, 'true');
          setHasCompletedTour(true);
        },
        onPopoverRender: (popover) => {
          const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              if (driverInstance.current) {
                driverInstance.current.destroy();
              }
              localStorage.setItem(`tour_completed_${pageName}`, 'true');
              setHasCompletedTour(true);
            });
          }
        },
        popoverClass: 'driverjs-theme-custom',
      };

      // Recrear la instancia del driver con la nueva configuración
      driverInstance.current = driver(config);
      driverInstance.current.drive();
      
      // Agregar event listener al overlay para permitir cerrar haciendo click fuera
      setTimeout(() => {
        const overlay = document.querySelector('.driver-overlay');
        if (overlay) {
          overlay.addEventListener('click', () => {
            if (driverInstance.current) {
              driverInstance.current.destroy();
              localStorage.setItem(`tour_completed_${pageName}`, 'true');
              setHasCompletedTour(true);
            }
          });
        }
      }, 100);
    }
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_completed_${pageName}`);
    setHasCompletedTour(false);
    startTour();
  };

  return { startTour, resetTour, hasCompletedTour };
};
