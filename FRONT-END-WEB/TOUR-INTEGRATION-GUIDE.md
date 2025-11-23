# Guía de Integración de Tours con Driver.js

## ✅ Completado

- [x] Instalación de driver.js
- [x] Hook personalizado `useTour` con persistencia en localStorage
- [x] Componente `HelpButton` con animación y notificación
- [x] Estilos CSS personalizados para tours
- [x] Configuraciones de tours para todas las páginas
- [x] Ejemplo completo en SimpleDashboard

## 📁 Archivos Creados

### Hooks
- `src/hooks/useTour.ts` - Hook para gestionar tours con Driver.js

### Componentes
- `src/components/HelpButton.tsx` - Botón flotante de ayuda

### Configuraciones de Tours
- `src/tours/homePageTour.ts` - Tour para la página principal
- `src/tours/dashboardTour.ts` - Tour para el dashboard
- `src/tours/myProcessesTour.ts` - Tour para mis procesos
- `src/tours/analyticsTour.ts` - Tour para analíticas
- `src/tours/profileTour.ts` - Tour para el perfil
- `src/tours/notificationsTour.ts` - Tour para notificaciones

## 🎯 Pasos para Integrar el Tour en Cada Página

### 1. Importar Dependencias

```tsx
import { useTour } from '../hooks/useTour.ts';
import { HelpButton } from '../components/HelpButton.tsx';
import { nombreDelTour } from '../tours/nombreDelTour.ts';
```

### 2. Inicializar el Hook

```tsx
export const MiPagina: React.FC = () => {
  const { startTour, hasCompletedTour } = useTour(tourSteps, 'nombreDeLaPagina');
  
  // ... resto del componente
}
```

### 3. Agregar Atributos `data-tour`

Agregar el atributo `data-tour="element-id"` a los elementos HTML que serán destacados en el tour:

```tsx
<div data-tour="elemento-principal">
  {/* Contenido */}
</div>

<button data-tour="boton-accion">Acción</button>
```

### 4. Agregar HelpButton

Agregar el botón de ayuda antes del footer:

```tsx
<HelpButton 
  onClick={startTour} 
  showNotification={!hasCompletedTour}
  position="top-right" // opcional: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
/>
<PublicFooter />
```

## 📄 Páginas Pendientes de Integración

### HomePage (/)
**Tour:** `homePageTour.ts`
**Elementos data-tour requeridos:**
- `search-form` - Formulario principal
- `search-type-selector` - Selector de tipo de búsqueda
- `search-input` - Campo de entrada
- `search-button` - Botón de búsqueda
- `result-card` - Tarjeta de resultado
- `download-buttons` - Botones de descarga
- `favorite-button` - Botón de favoritos
- `tabs-navigation` - Navegación de pestañas
- `actuaciones-tab` - Pestaña de actuaciones
- `sujetos-tab` - Pestaña de sujetos

### MyProcessesPage (/processes)
**Tour:** `myProcessesTour.ts`
**Elementos data-tour requeridos:**
- `favorites-header` - Encabezado de favoritos
- `process-card` - Tarjeta de proceso
- `view-details-btn` - Botón ver detalles
- `remove-favorite-btn` - Botón quitar favorito

### AnalyticsPage (/analytics)
**Tour:** `analyticsTour.ts`
**Elementos data-tour requeridos:**
- `analytics-header` - Encabezado de analíticas
- `export-pdf-btn` - Botón exportar PDF
- `summary-cards` - Tarjetas de resumen
- `process-list` - Lista de procesos
- `timeline-chart` - Gráfico de línea de tiempo
- `activity-details` - Detalles de actividad
- `consolidated-chart` - Gráfico consolidado

### ProfilePage (/profile)
**Tour:** `profileTour.ts`
**Elementos data-tour requeridos:**
- `profile-header` - Encabezado de perfil
- `personal-info` - Información personal
- `edit-button` - Botón editar
- `account-status` - Estado de cuenta
- `notification-preferences` - Preferencias de notificación

### NotificationsPage (/notifications)
**Tour:** `notificationsTour.ts`
**Elementos data-tour requeridos:**
- `notifications-header` - Encabezado de notificaciones
- `stats-badges` - Insignias de estadísticas
- `filter-unread` - Filtro de no leídas
- `refresh-button` - Botón refrescar
- `mark-all-read-btn` - Marcar todas como leídas
- `notification-item` - Item de notificación

## 🎨 Personalización del Tour

### Colores
Los tours usan el esquema de colores de la aplicación (azul/indigo) definido en `index.css`:
- Color primario: `#3b82f6` (blue-600)
- Color secundario: indigo
- Fondo: blanco con sombras

### Posición del HelpButton
El botón puede posicionarse en cualquier esquina:
```tsx
position="top-right"     // Arriba derecha (default)
position="top-left"      // Arriba izquierda
position="bottom-right"  // Abajo derecha
position="bottom-left"   // Abajo izquierda
```

### Notificación
La notificación amarilla (punto pulsante) se muestra automáticamente cuando el usuario no ha completado el tour. Se oculta después del primer tour.

## 🔄 Estado del Tour

Los tours se guardan en localStorage con la clave `tour_completed_{pageName}`:
- `true`: El usuario ya completó el tour
- No existe: El usuario nunca ha visto el tour

Para resetear todos los tours:
```javascript
localStorage.clear(); // O eliminar claves específicas
```

## 📝 Notas Importantes

1. **Orden de elementos**: Los pasos del tour se ejecutan en el orden definido en el array
2. **Elementos dinámicos**: Si un elemento no existe cuando se inicia el tour, ese paso se omitirá
3. **Responsive**: Los tours funcionan en todos los tamaños de pantalla
4. **Idioma**: Todos los textos están en español
5. **Accesibilidad**: Los tours son accesibles por teclado (ESC para salir, flechas para navegar)

## 🐛 Troubleshooting

**Problema:** El tour no se inicia
- Verificar que el elemento con `data-tour` existe en el DOM
- Revisar la consola del navegador para errores

**Problema:** El HelpButton no aparece
- Verificar que está importado correctamente
- Comprobar que está fuera de elementos con z-index alto

**Problema:** El tour se resetea constantemente
- Verificar que el `pageName` sea consistente
- Comprobar que localStorage está habilitado

## 📚 Recursos

- [Driver.js Documentation](https://driverjs.com/)
- [Lucide React Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última actualización:** Diciembre 2024
**Estado:** SimpleDashboard completamente integrado, resto de páginas pendiente
