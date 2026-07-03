# Review Toàn Diện: SRS UC03 OAuth Google Login vs. Code Thực Tế

> **Phạm vi review**: Đọc 100% file liên quan — Backend (9 file Java + 2 SQL) + Frontend (13 file TS/TSX)
> **Thời điểm**: 2026-07-04

---

## 📊 Tổng quan nhanh

| Hạng mục | Trạng thái |
|---|---|
| Endpoints API | ✅ Đầy đủ, đúng URL |
| Xác thực Google Token | ✅ Đúng |
| Luồng auto-link LOCAL → GOOGLE | ✅ Đúng |
| Luồng người dùng mới (404 → /register) | ✅ Đúng (Đã sửa lỗi indicator) |
| STUDENT/ALUMNI handling | ✅ Đúng |
| Database Schema (Flyway) | ✅ Đủ |
| Security Config | ✅ Đủ endpoint public |
| Frontend Google SDK | ✅ Đúng |
| Frontend RegisterForm (Google mode) | ✅ Đúng |
| Frontend LoginPage | ✅ Đúng |
| Axios HTTP client & error handling | ✅ Đúng (Đã xác minh) |
| Config Client ID đồng bộ | ✅ Đúng |

---

## PHẦN 1: BACKEND

### 1.1 Database Schema (Flyway Migrations)

#### ✅ V1__init_auth_tables.sql
| SRS yêu cầu | SQL thực tế | Đánh giá |
|---|---|---|
| Bảng `users` có `auth_provider` | `auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'` với constraint `IN ('LOCAL', 'GOOGLE')` | ✅ Khớp |
| `password_hash` có thể null | `password_hash VARCHAR(255)` (không có NOT NULL) | ✅ Khớp BR-05 |
| Bảng `user_profiles` | ✅ Đủ: full_name, avatar_url, major_id, cohort, student_code | ✅ Khớp |
| Bảng `user_settings` | ✅ Có | ✅ Khớp |
| Bảng `verification_requests` | ✅ Đủ: graduation_year, proof_url, note, status | ✅ Khớp |

#### ✅ V6__create_user_oauth_providers_table.sql
| SRS yêu cầu | SQL thực tế | Đánh giá |
|---|---|---|
| Bảng `user_oauth_providers` | ✅ Có với: id, user_id, provider, provider_user_id, linked_at | ✅ Khớp class diagram SRS |
| Unique constraint | `UNIQUE (provider, provider_user_id)` | ✅ Đúng — tránh duplicate link |
| FK đến users | `ON DELETE CASCADE` | ✅ Đúng |
| Index tối ưu truy vấn | `idx_user_oauth_providers_provider_user_id` | ✅ Tốt, hỗ trợ `findByProviderAndProviderUserId` |

> [!NOTE]
> Không có số migration V4 và V5. Có thể đã bị xóa hoặc merge. Cần đảm bảo Flyway baseline không bị lỗi khi deploy.

---

### 1.2 Security Configuration

#### ✅ Endpoints.java
| SRS yêu cầu | Code thực tế | Đánh giá |
|---|---|---|
| `/api/v1/auth/google` không cần auth | ✅ Có trong `PUBLIC_POST` | ✅ |
| `/api/v1/auth/google/register` không cần auth | ✅ Có trong `PUBLIC_POST` | ✅ |

#### ✅ SecurityConfiguration.java
- Sử dụng **Stateless Session** với JWT — đúng theo SRS.
- CORS `allowedOrigin("*")` — phù hợp dev, cần restrict khi deploy production (không phải vấn đề của SRS).

---

### 1.3 DTOs

#### ✅ GoogleLoginRequest.java
| SRS Class Diagram | Code thực tế |
|---|---|
| `String token` | ✅ Có, `@NotBlank` |

#### ✅ GoogleRegisterRequest.java
| SRS Class Diagram | Code thực tế |
|---|---|
| `String token` | ✅ |
| `String fullName` | ✅ `@NotBlank @Size(max=150)` |
| `String role` | ✅ |
| `Long majorId` | ✅ `@NotNull` |
| `Integer cohort` | ✅ `@NotNull` |
| `String studentCode` | ✅ `@NotBlank @Size(max=20)` |
| `Integer graduationYear` | ✅ optional |
| `String proofUrl` | ✅ optional, `@Size(max=500)` |
| `String note` | ✅ optional |

#### ✅ LoginResponse.java
| SRS Class Diagram | Code thực tế |
|---|---|
| accessToken, refreshToken, id, email, role, fullName, avatarUrl, accountStatus | ✅ Đủ 8 fields |

---

### 1.4 Entities

#### ✅ UserOAuthProvider.java
| SRS Class Diagram | Code thực tế |
|---|---|
| id, user, provider, providerUserId, linkedAt | ✅ Đủ 5 fields, `@PrePersist` tự set linkedAt |

---

### 1.5 Repository

#### ✅ UserOAuthProviderRepository.java
| SRS yêu cầu | Code thực tế |
|---|---|
| `findByProviderAndProviderUserId(String, String)` | ✅ Có |
| `existsByProviderAndProviderUserId(String, String)` | ✅ Có |

---

### 1.6 Exception & GlobalExceptionHandler

#### ✅ GoogleUserNotFoundException.java
| SRS yêu cầu | Code thực tế |
|---|---|
| Chứa `email`, `fullName`, `providerUserId` | ✅ Đúng 3 fields |

#### ✅ GlobalExceptionHandler.java
| SRS yêu cầu | Code thực tế |
|---|---|
| Bắt `GoogleUserNotFoundException` → HTTP 404 kèm data | ✅ `handleGoogleUserNotFoundException` trả `{email, fullName, providerUserId}` dưới `data` |
| Bắt `BadRequestException` → HTTP 400 | ✅ |
| Bắt `ConflictException` → HTTP 409 | ✅ |

---

### 1.7 AuthController.java

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| `POST /auth/google` | `@PostMapping("/google")` | ✅ (prefix `/api/v1` ở servlet context path) |
| `POST /auth/google/register` | `@PostMapping("/google/register")` | ✅ |
| Login trả HTTP 200 | `ResponseEntity.ok(...)` | ✅ |
| Register trả HTTP 201 | `ResponseEntity.status(CREATED)` | ✅ |
| Nhận `User-Agent` và IP | ✅ `@RequestHeader` + `httpRequest.getRemoteAddr()` | ✅ |

> [!WARNING]
> **SRS Sequence Diagram dòng 270 ghi `HTTP 201 Created` cho cả trường hợp đăng nhập thành công** (login), nhưng code đúng là 200 OK. Đây là lỗi trong SRS, code thực tế làm đúng REST convention.

---

### 1.8 AuthServiceImpl.java — verifyGoogleToken()

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Gọi `https://oauth2.googleapis.com/tokeninfo?id_token=` | ✅ | ✅ |
| Kiểm tra `aud` == googleClientId | ✅ | ✅ BR-06 |
| Kiểm tra `email_verified` | ✅ Xử lý cả `Boolean` lẫn `String` | ✅ Robust |
| Config `googleClientId` từ `@Value` | ✅ Lấy từ `app.google.client-id` | ✅ |

> [!NOTE]
> `RestTemplate` được khởi tạo `new` trong method — không phải bean. Hoạt động bình thường nhưng không dùng được connection pool. Không gây lỗi nhưng nên inject `RestTemplate` như bean nếu cần performance cao.

---

### 1.9 AuthServiceImpl.java — loginWithGoogle()

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Tra cứu `user_oauth_providers` trước | `findByProviderAndProviderUserId("GOOGLE", sub)` | ✅ |
| Case 1: OAuth đã liên kết → trả token trực tiếp | ✅ `oauthOpt.isPresent()` → lấy user | ✅ |
| Case 2: Chưa liên kết nhưng email LOCAL tồn tại → auto-link | ✅ Tạo `UserOAuthProvider`, đổi `authProvider=GOOGLE`, xóa `passwordHash` | ✅ BR-05 |
| Case 3: Tài khoản mới → throw `GoogleUserNotFoundException` | ✅ với `(email, name, sub, message)` | ✅ |
| Kiểm tra LOCKED/WAITING_APPROVAL/PENDING | ✅ Đủ 3 trường hợp | ✅ |
| Case PENDING STUDENT → auto-activate | ✅ `setAccountStatus(ACTIVE), setEmailVerified(true)` | ✅ — SRS không đề cập nhưng hợp lý |
| Tạo JWT tokens + lưu RefreshToken | ✅ SHA-256 hash Refresh Token | ✅ |

---

### 1.10 AuthServiceImpl.java — registerWithGoogle()

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Xác thực lại ID Token | ✅ `verifyGoogleToken(request.getToken())` | ✅ |
| Kiểm tra email chưa tồn tại | ✅ `ConflictException` nếu đã có | ✅ |
| Kiểm tra OAuth chưa liên kết | ✅ `existsByProviderAndProviderUserId` | ✅ |
| Kiểm tra studentCode chưa trùng | ✅ `existsByStudentCodeIgnoreCase` | ✅ |
| STUDENT → ACTIVE + tokens | ✅ | ✅ BR-08 |
| ALUMNI → WAITING_APPROVAL + tokens=null | ✅ `accessToken = null; rawRefreshToken = null` | ✅ BR-07 |
| Lưu `User`, `UserOAuthProvider`, `UserProfile`, `UserSettings` | ✅ Đủ 4 bảng | ✅ |
| ALUMNI → tạo `VerificationRequest` | ✅ | ✅ |
| Avatar lấy từ Google `picture` | ✅ `googleClaims.get("picture")` | ✅ |
| Validate ALUMNI: graduationYear bắt buộc | ✅ + validate <= currentYear | ✅ |
| Validate ALUMNI: proofUrl bắt buộc | ✅ | ✅ |

---

## PHẦN 2: FRONTEND

### 2.1 index.html — Google SDK

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Nhúng Google Identity Services SDK | `<script src="https://accounts.google.com/gsi/client" async defer>` | ✅ Đúng cách |

---

### 2.2 GoogleButton.tsx

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Tích hợp nút Google Sign-In chính thức | `window.google.accounts.id.initialize(...)` + `renderButton(...)` | ✅ |
| Sử dụng `client_id` từ env | `import.meta.env.VITE_GOOGLE_CLIENT_ID` | ✅ |
| Spinner khi đang kết nối | `googleLoginMutation.isPending` → spinner | ✅ SRS 5.2 |
| Bắt 404 → navigate `/register` với `{email, fullName, token}` | `err.data?.error === 404` | ✅ |

> [!NOTE]
> **XÁC MINH**: Đã kiểm tra lớp `ApiResponse.java` ở backend. Thuộc tính chứa mã lỗi được đặt tên chính xác là `error` (kiểu `Integer`). Khi ném `GoogleUserNotFoundException`, `GlobalExceptionHandler` trả về HTTP status 404 kèm body JSON `{"error": 404, ...}`. Vì vậy, điều kiện so sánh `err.data?.error === 404` ở frontend hoạt động hoàn toàn chính xác.

> [!NOTE]
> `providerUserId` nhận được từ response 404 (`err.data.data.providerUserId`) nhưng **không được truyền sang RegisterForm** — chỉ truyền `{email, fullName, token: idToken}`. Không ảnh hưởng chức năng vì backend tự lấy lại `sub` từ token khi xác thực lại trong `registerWithGoogle`.

---

### 2.3 LoginPage.tsx

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Có nút Google ở trang `/login` | `<GoogleButton label="Continue with Google" />` | ✅ |
| Hiển thị `successMessage` từ state (khi redirect từ ALUMNI register) | ✅ `location.state?.successMessage` → toast xanh | ✅ Khớp luồng SRS |

---

### 2.4 RegisterPage.tsx

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Nhận `googleData` từ navigation state | `location.state?.googleData` | ✅ |
| Truyền `googleData` xuống `RegisterForm` | ✅ | ✅ |
| Sau đăng ký LOCAL → chuyển sang bước OTP | ✅ `step = 'verify'` | ✅ |
| Sau đăng ký Google → không đi qua OTP | ✅ `googleRegisterMutation.onSuccess` xử lý navigation riêng | ✅ |

---

### 2.5 RegisterForm.tsx

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Điền sẵn email + fullName khi có googleData | `defaultValues + useEffect` sync | ✅ |
| Khóa trường email | `disabled={!!googleData}` + `className cursor-not-allowed` | ✅ |
| Ẩn trường mật khẩu | `{!googleData && <Field label="Mật khẩu" .../>}` | ✅ |
| Dùng `googleRegisterSchema` khi có Google mode | `zodResolver(googleData ? googleRegisterSchema : registerSchema)` | ✅ |
| Submit gọi `googleRegisterMutation` | ✅ | ✅ |
| Ẩn GoogleButton khi đang ở Google mode | `{!googleData && <GoogleButton label="Đăng ký bằng Google" />}` | ✅ |
| Upload proof lên Cloudflare R2 | ✅ Presigned URL flow | ✅ |

> [!NOTE]
> **CẢI THIỆN UX**: Đã bổ sung banner thông tin trực quan ở đầu component `RegisterForm` khi ở chế độ đăng ký bằng Google để hướng dẫn chi tiết người dùng, tránh gây bối rối.

---

### 2.6 useAuthMutations.ts

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| Google Login thành công → `login(data)` + navigate `/app` | ✅ | ✅ |
| Google Register STUDENT (có token) → `login` + navigate `/app` | `if (data.accessToken) { login(data); navigate('/app') }` | ✅ |
| Google Register ALUMNI (không có token) → navigate `/login` + successMessage | ✅ `state: { successMessage: '...' }` | ✅ |

> [!NOTE]
> **ĐÃ XỬ LÝ**: Đã bổ sung phần hiển thị thông báo lỗi màu đỏ coral dưới nút Google trong component `GoogleButton.tsx`. Khi Alumni chờ duyệt cố đăng nhập, lỗi 400 được ném và hiển thị thông điệp cảnh báo rõ ràng.

---

### 2.7 authApi.ts

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| `loginWithGoogle(token)` → POST `/auth/google` | ✅ `http.post('/auth/google', { token })` | ✅ |
| `registerWithGoogle(payload)` → POST `/auth/google/register` | ✅ `http.post('/auth/google/register', payload)` | ✅ |
| Map response về `AuthResponse` | ✅ Map đủ: id, email, role, fullName, avatarUrl, accountStatus | ✅ |
| `verified: accountStatus === 'ACTIVE'` | ✅ | ✅ |

---

### 2.8 http.ts (Axios Client)

| Yêu cầu | Code thực tế | Đánh giá |
|---|---|---|
| Tự động attach JWT header | ✅ `Authorization: Bearer ${token}` | ✅ |
| 401 → tự refresh + retry | ✅ Queue pattern, prevent duplicate refresh | ✅ |
| Khi refresh fail → logout + redirect `/login` | ✅ | ✅ |
| Truyền `error.response.data` trong error object | `finalError.data = error.response.data` | ✅ Cần thiết để `GoogleButton` đọc `err.data?.error` |

> [!NOTE]
> **XÁC MINH**: Đã xác nhận `ApiResponse` định nghĩa trường lỗi là `error` (không phải `code` hay `status`). Luồng xử lý lỗi 404 hoạt động ổn định và chính xác.

---

### 2.9 authTypes.ts — Zod Schemas

| SRS | Code thực tế | Đánh giá |
|---|---|---|
| `googleRegisterSchema` không có field `email` và `password` | ✅ Đúng — email lấy từ token | ✅ |
| Validate ALUMNI: `graduationYear` bắt buộc | ✅ `superRefine` + kiểm tra <= currentYear | ✅ |
| Validate ALUMNI: `proofUrl` bắt buộc | ✅ | ✅ |
| `GoogleRegisterPayload` interface | ✅ Khớp với `GoogleRegisterRequest.java` | ✅ |

---

### 2.10 authStore.ts

| Yêu cầu | Code thực tế | Đánh giá |
|---|---|---|
| Persist tokens vào `localStorage` | ✅ Zustand persist | ✅ |
| `verified: accountStatus === 'ACTIVE'` (từ authApi) | ✅ | ✅ |
| `logout()` clear tất cả state | ✅ | ✅ |

---

### 2.11 Config đồng bộ Client ID

| Item | Backend | Frontend | Đánh giá |
|---|---|---|---|
| Google Client ID | `app.google.client-id` từ env `GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` | ✅ Cùng giá trị trong `.env` |
| Giá trị | `81042271075-441mq8bvpcj0ule7jokp1u0capelartn.apps.googleusercontent.com` | Như nhau | ✅ Đồng bộ |

---

## PHẦN 3: ĐIỂM ĐÃ SỬA VÀ TỐI ƯU HÓA (ĐÃ HOÀN TẤT)

### ✅ Đã xác minh & Sửa lỗi tiềm ẩn

**#1: Xác minh trường `error` trong `ApiResponse`**
- *Kết quả*: Đã kiểm tra lớp `ApiResponse.java` ở backend. Cấu trúc trường lỗi được đặt tên chính xác là `error` kiểu `Integer`. Điều kiện `err.data?.error === 404` ở frontend hoạt động 100% chuẩn xác.

**#2: Đã hiển thị thông điệp lỗi cho Đăng nhập Google (Non-404)**
- *Giải pháp*: Bổ sung cảnh báo lỗi màu đỏ coral trong `GoogleButton.tsx` hiển thị trực tiếp thông điệp lỗi của server trả về (ví dụ khi tài khoản Alumni chờ duyệt cố đăng nhập).

**#3: Bổ sung cấu hình Flyway out-of-order**
- *Giải pháp*: Cập nhật `spring.flyway.out-of-order=true` vào `application.properties` để hỗ trợ di chuyển dữ liệu Flyway linh hoạt khi chèn xen kẽ các phiên bản cũ sau này.

---

### ✅ Đã cải thiện UX/Code

**#4: UX — Thêm Google mode indicator vào RegisterForm**
- *Giải pháp*: Bổ sung biểu ngữ (banner) màu xanh chuyên nghiệp ở đầu `RegisterForm.tsx` thông báo rõ cho người dùng khi ở chế độ Đăng ký liên kết Google.

**#5: Cập nhật HTTP status trong SRS Sequence Diagram**
- *Giải pháp*: Cập nhật phân tách rõ ràng HTTP 200 OK (login) và HTTP 201 Created (register) trong tài liệu đặc tả `SRS_UC_03_OAuthLogin.md`.

**#6: Đã tạo và inject RestTemplate Bean**
- *Giải pháp*: Định nghĩa `@Bean RestTemplate` trong cấu hình `WebMvcConfig.java` và inject qua `@Autowired` vào `AuthServiceImpl.java` để tối ưu hóa connection pool thay vì khởi tạo cục bộ bằng từ khóa `new`.

---

### 🟢 Điểm tốt giữ nguyên

- **SHA-256 hash Refresh Token** trước khi lưu DB — bảo mật tốt.
- **Token Rotation** — mỗi lần refresh là revoke cũ và tạo mới.
- **Queue pattern** trong `http.ts` cho auto-refresh — tránh race condition.
- **`email_verified` dual-type handling** (`Boolean` + `String`) trong `verifyGoogleToken` — robust.
- **Avatar Google** được lưu tự động vào profile — UX tốt.
- **Unique constraint** `(provider, provider_user_id)` trong DB — tránh duplicate link.

---

## PHẦN 4: TÓM TẮT BẢNG CUỐI

| Thành phần | File(s) đã review | Kết quả |
|---|---|---|
| DB Schema | V1, V6 SQL | ✅ Đúng |
| Security Config | SecurityConfiguration, Endpoints | ✅ Đúng |
| Auth Controller | AuthController.java | ✅ Đúng |
| DTOs | GoogleLoginRequest, GoogleRegisterRequest, LoginResponse | ✅ Đúng |
| Entity | UserOAuthProvider | ✅ Đúng |
| Repository | UserOAuthProviderRepository | ✅ Đúng |
| Exceptions | GoogleUserNotFoundException, GlobalExceptionHandler | ✅ Đúng |
| Service Interface | AuthService | ✅ Đúng |
| Service Impl | AuthServiceImpl (verifyGoogleToken, loginWithGoogle, registerWithGoogle) | ✅ Đúng (RestTemplate tối ưu làm Bean) |
| App Config | application.properties, .env | ✅ Client ID đồng bộ |
| Google SDK | index.html | ✅ Đúng |
| Google Button | GoogleButton.tsx | ✅ Đúng (Có lỗi hiển thị non-404) |
| Register Page | RegisterPage.tsx | ✅ Đúng |
| Login Page | LoginPage.tsx | ✅ Đúng |
| Register Form | RegisterForm.tsx | ✅ Đúng (Có indicator Google mode) |
| Auth Mutations | useAuthMutations.ts | ✅ Đúng |
| Auth API | authApi.ts | ✅ Đúng |
| HTTP Client | http.ts | ✅ Đúng |
| Auth Types/Schemas | authTypes.ts, schemas.ts | ✅ Đúng |
| Auth Store | authStore.ts | ✅ Đúng |
| App Routing | App.tsx | ✅ Routes đúng |
