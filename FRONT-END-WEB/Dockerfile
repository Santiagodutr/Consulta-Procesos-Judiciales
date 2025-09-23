# Dockerfile para Frontend React
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Servir con nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Configuración de nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]