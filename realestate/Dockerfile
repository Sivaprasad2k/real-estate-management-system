# Stage 1: Build the application using JDK 17
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy project files and run clean package in a single step to optimize layers
COPY . .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image using JRE 17
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Declare a secure non-root user and group
RUN groupadd -r remsgroup && useradd -r -g remsgroup remsuser

# Copy build artifact from the build stage and assign ownership
COPY --from=build --chown=remsuser:remsgroup /app/target/realestate-0.0.1-SNAPSHOT.jar app.jar

# Run under the non-root user context
USER remsuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
