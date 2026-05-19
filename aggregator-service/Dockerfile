FROM gradle:8.8-jdk21 AS builder
WORKDIR /app
COPY src src/
RUN gradle bootJar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder --chown=spring:spring /app/build/libs/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]



