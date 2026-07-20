# syntax=docker/dockerfile:1
# Build context is apps/backend (its own Gradle root, own wrapper).

# --- build ---
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /build
# Wrapper + build scripts first, so the dependency layer survives source edits.
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle/ gradle/
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
# Then the sources.
COPY src/ src/
RUN ./gradlew --no-daemon buildFatJar

# --- runtime ---
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /build/build/libs/*-all.jar app.jar
USER app
# Netty reads $PORT (application.conf: ktor.deployment.port = ${?PORT}); Railway injects it.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
