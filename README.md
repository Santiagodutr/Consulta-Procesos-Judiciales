# Consulta de Procesos Judiciales

Sistema integral para la consulta y gestión de procesos judiciales con capacidades de automatización, notificaciones en tiempo real y análisis de datos procesales.

## ✅ ESTADO DEL PROYECTO: TERMINADO

Este proyecto ha sido completado y cuenta con todos los módulos implementados y funcionales: Backend (Spring Boot), Frontend Web (React) y Mobile App (React Native/Expo).

---

## 📖 Descripción General

El sistema de "Consulta de Procesos Judiciales" es una solución diseñada para facilitar el seguimiento, administración y análisis exhaustivo de procesos legales. Proporciona una plataforma centralizada donde tanto personas naturales como jurídicas y firmas de abogados pueden monitorear el progreso de sus casos, recibir alertas instantáneas sobre cualquier novedad, consultar documentos relacionados e interactuar con analíticas avanzadas, todo de manera segura y multiplataforma.

---

## ✨ Características Principales

- **Dashboard Analítico**: Representación visual y estadística de la actividad procesal (líneas de tiempo procesales, gráficas de barras, tortas, etc.).
- **Notificaciones en Tiempo Real**: Alertas instantáneas y seguras ante cualquier cambio de estado procesal.
- **Gestión Avanzada de Usuarios**: Sistema de autenticación y autorización seguro, soportando diferentes roles para personas naturales o firmas de abogados.
- **Visualización y Carga de Documentos**: Interfaz para buscar, visualizar y descargar documentación legal vinculada a los procesos.
- **Multiplataforma**: Disponible a través de un portal web responsivo y una aplicación móvil nativa (Android e iOS) para la gestión "on-the-go".
- **Sistema Seguro**: Manejo riguroso de credenciales mediante JWT y políticas de seguridad estrictas desde el backend.

---

## 🛠️ Tecnologías y Arquitectura

El ecosistema se divide en tres componentes principales que se comunican de forma integral mediante APIs RESTful:

### 1. Frontend Web (React)
Portal moderno y dinámico diseñado para brindar la mejor experiencia de usuario en navegadores web.
- **Librería Principal**: React 18
- **Enrutamiento**: React Router v6
- **Estilos y UI**: Tailwind CSS, Headless UI, Heroicons, Framer Motion (para animaciones)
- **Gestión de Estado y Datos**: React Query, Axios
- **Autenticación/BaaS**: Supabase JS
- **Gráficos**: Chart.js, Recharts
- **Otros**: React Hook Form (manejo de formularios), Zod / Yup (validaciones)

### 2. Backend (Spring Boot)
Motor de lógica de negocio, reglas de seguridad y API robusta y escalable.
- **Framework**: Spring Boot 3.2.0 (Java 17)
- **Seguridad**: Spring Security, JWT (JSON Web Tokens)
- **Cliente HTTP**: Spring WebFlux (WebClient)
- **Limitación de Peticiones**: Bucket4j (Rate Limiting)
- **Otras Herramientas**: Spring Boot Actuator, Spring Boot Mail

### 3. Aplicación Móvil (React Native / Expo)
Aplicación para dispositivos portátiles orientada a la gestión inmediata y consumo de notificaciones.
- **Framework Principal**: React Native (0.72.6), Expo SDK 49
- **Navegación**: React Navigation, Expo Router
- **Componentes UI**: React Native Paper, React Native Vector Icons, React Native Safe Area Context
- **Gestión de Datos y Estado**: React Query, Axios
- **Autenticación**: Supabase JS, Expo Local Authentication
- **Características nativas**: Expo Camera, Image Picker, Document Picker, Notifications, Secure Store

---

## 📂 Estructura del Repositorio

El proyecto se segmenta en las siguientes carpetas principales:

- `/FRONT-END-WEB/`: Contiene el código fuente de la aplicación web en React y TypeScript.
- `/SPRING-BACKEND/`: Contiene el ecosistema del servidor, lógica de negocio y configuraciones desarrolladas en Java 17.
- `/MOBILE-APP/`: Contiene el código fuente de la aplicación móvil nativa creada con React Native y Expo.
- `/DOCUMENTACION/`: Documentos orientados al manejo, requerimientos o diagramas adicionales.

---

## 🚀 Cómo Empezar

### Prerequisitos
- Node.js (v18 o superior)
- Java 17 o superior
- Maven
- Supabase (Cuenta o instancia local)

### 1. Variables de Entorno
Asegúrese de configurar los archivos `.env` o `application.properties` correspondientes en el backend, web frontend y mobile app con las credenciales necesarias, particularmente de base de datos o Supabase.

### 2. Ejecutar el Backend (Spring Boot)
```bash
cd SPRING-BACKEND
mvn spring-boot:run
```

### 3. Ejecutar el Frontend Web (React)
```bash
cd FRONT-END-WEB
npm install
npm start
```

### 4. Ejecutar la App Móvil (Expo)
```bash
cd MOBILE-APP
npm install
npx expo start
```

---

*Desarrollado integralmente para optimizar el acceso y seguimiento en el flujo de procesos judiciales. desarrollado por: Santiago Duarte  https://portafolio-santiago-duarte.vercel.app/*
