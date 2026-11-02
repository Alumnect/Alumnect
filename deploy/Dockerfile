# Image runtime nhẹ: jar được build sẵn ở máy dev (mvn package), không build Maven trên VPS
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
