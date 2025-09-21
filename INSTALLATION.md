# Guía de Instalación y Despliegue

## 🚀 Instalación Completa del Sistema

### Prerrequisitos
- Node.js 18+ instalado
- Git instalado
- Cuenta de Supabase (gratis en supabase.com)
- Cuenta de Twilio (opcional, para SMS)
- Cuenta de email SMTP (Gmail, Outlook, etc.)

### Paso 1: Clonar y Configurar el Repositorio

```bash
# Clonar el repositorio
git clone <repository-url>
cd Consulta-Procesos-Judiciales
```

### Paso 2: Configurar Base de Datos (Supabase)

1. **Crear proyecto en Supabase**
   - Ir a https://supabase.com
   - Crear nuevo proyecto
   - Anotar la URL y las API Keys

2. **Ejecutar el esquema de base de datos**
   - Ir al SQL Editor en Supabase
   - Ejecutar todo el contenido de `BACKEND/database/schema.sql`
   - Verificar que se crearon todas las tablas

### Paso 3: Configurar Backend

```bash
cd BACKEND

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales reales

# Verificar configuración
npm run build

# Ejecutar en desarrollo
npm run dev
```

**Configuración del archivo .env del backend:**
```env
# Supabase (OBLIGATORIO)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email SMTP (OBLIGATORIO para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Twilio SMS (OPCIONAL)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Paso 4: Configurar Frontend Web

```bash
cd ../FRONT-END-WEB

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
copy .env.example .env.local
# Editar .env.local con la URL de tu backend

# Ejecutar en desarrollo
npm start
```

**Configuración del archivo .env.local del frontend:**
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 5: Configurar Mobile App

```bash
cd ../MOBILE-APP

# Instalar dependencias
npm install

# Instalar Expo CLI si no lo tienes
npm install -g @expo/cli

# Copiar y configurar variables de entorno
copy .env.example .env
# Editar .env con la URL de tu backend

# Ejecutar en desarrollo
npx expo start
```

## 📱 Probando el Sistema

### 1. Verificar Backend
- Abrir http://localhost:3000/api/health
- Debe mostrar: `{"status":"ok","timestamp":"..."}`

### 2. Verificar Frontend Web
- Abrir http://localhost:3001
- Debe mostrar la página de login
- Crear una cuenta de prueba

### 3. Verificar Mobile App
- Escanear el QR con Expo Go
- O usar un simulador Android/iOS
- Debe mostrar la pantalla de login

## 🛠️ Configuración de Producción

### Backend en Servidor

```bash
# Instalar PM2 para producción
npm install -g pm2

# Compilar
npm run build

# Ejecutar con PM2
pm2 start dist/server.js --name judicial-backend

# Ver logs
pm2 logs judicial-backend
```

### Frontend Web (Nginx)

```bash
# Compilar para producción
npm run build

# Servir con nginx
# Configurar nginx para servir desde build/
```

### Mobile App

```bash
# Compilar APK para Android
eas build --platform android

# Compilar para iOS (requiere cuenta de desarrollador)
eas build --platform ios
```

## 🔧 Solución de Problemas Comunes

### Error: "Supabase connection failed"
- Verificar URL y API keys en .env
- Verificar que la base de datos esté corriendo
- Verificar que el esquema SQL se ejecutó correctamente

### Error: "CORS policy"
- Verificar que el frontend esté corriendo en el puerto correcto
- Verificar configuración CORS en el backend

### Error: "Email service failed"
- Verificar credenciales SMTP
- Para Gmail, usar App Passwords (no la contraseña normal)

### Error: "Puppeteer failed to launch"
- En Windows: Verificar que Chrome esté instalado
- En Linux: Instalar dependencias de Chrome

### Error: "Module not found"
- Ejecutar `npm install` en el directorio correcto
- Verificar que Node.js versión 18+ esté instalado

## 📊 Monitoreo y Logs

### Backend Logs
```bash
# Ver logs en desarrollo
npm run dev

# Ver logs en producción
pm2 logs judicial-backend

# Logs están en BACKEND/logs/app.log
```

### Base de Datos
- Monitorear en el dashboard de Supabase
- Ver queries lentas y errores

## 🔒 Seguridad en Producción

### Variables de Entorno
- Nunca subir archivos .env al repositorio
- Usar secretos seguros para JWT_SECRET
- Rotar claves regularmente

### HTTPS
- Configurar SSL/TLS en producción
- Usar certificados Let's Encrypt

### Base de Datos
- Configurar Row Level Security (ya incluido)
- Hacer backups regulares

## 📈 Escalabilidad

### Backend
- Usar PM2 cluster mode para múltiples procesos
- Configurar load balancer (nginx)
- Usar Redis para sesiones

### Base de Datos
- Configurar réplicas de lectura
- Optimizar queries con índices
- Monitorear performance

### Frontend
- Usar CDN para assets estáticos
- Implementar lazy loading
- Optimizar imágenes

## 🆘 Soporte

Si tienes problemas:
1. Revisar esta guía paso a paso
2. Verificar logs del backend y frontend
3. Verificar configuración de Supabase
4. Crear un issue en el repositorio con:
   - Descripción del problema
   - Logs de error
   - Configuración utilizada (sin credenciales)