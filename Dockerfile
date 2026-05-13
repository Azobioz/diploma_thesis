FROM gradle:8.3-jdk17

WORKDIR /home/gradle/project

COPY . .

RUN chmod +x gradlew

CMD ["./gradlew", ":board_service:test"]