FROM gradle:8.8-jdk21 AS builder
WORKDIR /app
COPY build.gradle .
COPY src src/
RUN echo "rootProject.name = 'account-service'" > settings.gradle && \
    gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
