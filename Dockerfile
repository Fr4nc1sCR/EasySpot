# Etapa 1: Compilación (Build)
# Usamos una imagen de Maven con JDK 21 para compilar
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiamos solo el pom.xml primero para aprovechar la caché de capas de Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiamos el código fuente y compilamos
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de Ejecución (Runtime)
# Usamos JRE en lugar de JDK para reducir el tamaño y mejorar la seguridad
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Creamos un usuario de sistema para no ejecutar la app como root (Seguridad)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiamos el JAR desde la etapa de compilación
# El nombre 'app.jar' es un estándar para facilitar el despliegue
COPY --from=build /app/target/app.jar app.jar

# Exponemos el puerto definido en tu application.properties (80)
EXPOSE 80

# Parámetros de optimización de memoria para contenedores
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]