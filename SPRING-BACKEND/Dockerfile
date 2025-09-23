# Dockerfile optimizado para Railway
# Etapa de construcción
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app

# Copiar archivos de configuración de Maven primero (para cache de layers)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Hacer mvnw ejecutable
RUN chmod +x ./mvnw

# Descargar dependencias (se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Construir la aplicación (saltando tests para deploy más rápido)
RUN mvn clean package -DskipTests -B

# Etapa de ejecución (imagen más liviana)
FROM openjdk:17-jdk-slim
WORKDIR /app

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar el JAR construido desde la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Crear usuario no-root por seguridad
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Exponer puerto que Railway espera
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Variables de entorno por defecto
ENV JAVA_OPTS="-Xmx512m -Xms256m" \
    SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod

# Comando de inicio optimizado
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -Dserver.port=$PORT -jar app.jar"]