# Stage 1: Build Engine
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Maven wrapper and project configuration
COPY .mvn/ .mvn/
COPY mvnw mvnw.cmd pom.xml ./

# Ensure line endings and permissions are compatible with Unix environment
RUN chmod +x mvnw

# Resolve dependencies to leverage Docker cache
RUN ./mvnw dependency:go-offline -B

# Copy source code and build package
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal Runtime
FROM eclipse-temurin:21-jre-alpine
# Copy AWS Lambda Web Adapter extension binary
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=8081
ENV AWS_LWA_PORT=8081
WORKDIR /app

# Create a secure, non-root system user and group
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy build artifact
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
