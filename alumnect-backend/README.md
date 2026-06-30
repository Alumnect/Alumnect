# AlumNect Backend — Spring Boot Service

Welcome to the backend service of **AlumNect** (FPT University Alumni Community Connection Platform).

## 🛠️ Technology Stack
- **Language & JDK:** Java 21
- **Framework:** Spring Boot 3.x
- **Database:** PostgreSQL (Spring Data JPA / Hibernate)
- **Security:** Spring Security with JWT & Google OAuth2
- **Data Mapping:** MapStruct
- **Build Tool:** Maven

## 📐 Architecture Overview
The backend is structured using a **Hybrid Package-by-Layer-with-Feature** architecture. The design is aligned with `BACKEND_STRUCTURE.md` and adapted to AlumNect domain requirements.

### Key Architecture Rules:
1. **Strict Layer Separation:** `Controller -> Service -> DAO/Repository -> Entity -> Database`.
2. **Controller Responsibility:** Controllers handle HTTP request routing, DTO validation (`@Valid`), and response formatting (`ResponseEntity`). Business logic is prohibited in controllers.
3. **Business Logic Isolation:** All domain rules and calculations reside exclusively within Service implementations (`*ServiceImp`).
4. **Data Privacy & Decoupling:** Entities are never exposed directly to clients; transfer objects (`DTO Request` & `DTO Response`) mapped via MapStruct are used for all endpoint boundaries.
5. **Database Configuration:** PostgreSQL is configured via `application.properties` / `application.yml`.

## 📂 Package Structure Summary
- `com.alumnect.alumnect_backend.common`: Standardized APIs (`ApiResponse`, `PageResponse`), shared Enums, constants, and custom validators.
- `com.alumnect.alumnect_backend.config`: Framework & 3rd-party bean configurations.
- `com.alumnect.alumnect_backend.security`: JWT authentication filters, OAuth2 handlers, and security principals.
- `com.alumnect.alumnect_backend.controller`: REST API endpoints grouped by domain feature module.
- `com.alumnect.alumnect_backend.service`: Business interfaces and implementations. Includes domain services, `search`, `analytics`, and `admin` orchestration services.
- `com.alumnect.alumnect_backend.dao`: Data access repositories interfacing with PostgreSQL.
- `com.alumnect.alumnect_backend.entity`: JPA persistence models.
- `com.alumnect.alumnect_backend.dto`: Request payloads (`dto.request`) and response representations (`dto.response`).
- `com.alumnect.alumnect_backend.mapper`: MapStruct interfaces for Entity <-> DTO conversions.
- `com.alumnect.alumnect_backend.integration`: External service adapters (PayOS, Google OAuth, Email SMTP, Object Storage, Map Providers).
- `com.alumnect.alumnect_backend.scheduler`: Automated background cron jobs (Event reminders, Payment expiration, Salary aggregation, Analytics rollup).
- `com.alumnect.alumnect_backend.websocket`: Real-time communication handlers (Direct messaging).
- `com.alumnect.alumnect_backend.specification`: Dynamic JPA Specifications for complex filtering queries.

## 🚀 Getting Started
Ensure PostgreSQL is running and configured according to `application.properties`. Run the application using Maven:
```bash
./mvnw spring-boot:run
```
