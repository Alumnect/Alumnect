# AlumNect Base Package (`com.alumnect.alumnect_backend`)

This directory represents the root Java package for the AlumNect backend application.

## 🏛️ Package Guidelines & Naming Conventions
1. **Lowercase Naming:** All package names must be strictly lowercase without spaces or camelCase. Avoid underscores in package names except for the base project package `alumnect_backend`.
2. **Feature Sub-packages:** Feature modules (`auth`, `user`, `verification`, `post`, `job`, `event`, `payment`, `message`, `forum`, `salary`, `alumnimap`, `careerpath`, `notification`, `report`) are organized consistently inside the primary layer packages (`controller`, `service`, `dao`, `entity`, `dto`, `mapper`).
3. **Domain Naming Rules:**
   - Use `alumnimap` instead of `map` to prevent collisions with `java.util.Map`.
   - `notification` and `report` are treated as independent domain feature modules.
   - `admin` packages exist in `controller/admin` and `service/admin` only for back-office orchestration and aggregations. Admin must not duplicate underlying domain logic or create redundant entity/dao layers.
