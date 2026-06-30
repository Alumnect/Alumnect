# CẤU TRÚC THƯ MỤC DỰ ÁN (FOLDER STRUCTURE)

Tài liệu này định nghĩa chi tiết cấu trúc thư mục tiêu chuẩn của cả hai phần **Backend** và **Frontend** trong dự án **AlumNect**.

---

## 1. CẤU TRÚC THƯ MỤC TỔNG QUAN (ROOT STRUCTURE)

Thư mục gốc của dự án chứa các cấu hình hệ thống tổng quát và hai thư mục dự án con:

```text
Alumnect/
│
├── alumnect-backend/           # Dự án Spring Boot Java Backend
├── alumnect-frontend/          # Dự án React Vite Frontend
├── database/                   # Thư mục chứa các tệp cơ sở dữ liệu ban đầu
│   ├── init.sql                # Tệp cấu hình khởi tạo PostgreSQL
│   └── README.md
├── docs/                       # Thư mục chứa toàn bộ tài liệu dự án (.md)
│   ├── update_SRS/             # Thư mục con chứa các tệp cập nhật SRS & Use Case
│   └── ...
├── docker-compose.yml          # File Docker Compose khởi chạy toàn bộ hệ thống
├── rule.md                     # File quy định quy trình làm việc chính của dự án
├── README.md                   # File giới thiệu dự án (chứa tài liệu SRS đầy đủ)
└── .gitignore
```

---

## 2. CHI TIẾT CẤU TRÚC BACKEND (`alumnect-backend`)

Mã nguồn Java Backend nằm trong gói `com.alumnect.alumnect_backend`. Cấu trúc các gói (packages) được phân chia theo kiến trúc Layered kết hợp với phân chia Feature như sau:

```text
alumnect-backend/
├── src/
│   ├── main/
│   │   ├── java/com/alumnect/alumnect_backend/
│   │   │   ├── common/         # Chứa các lớp dùng chung (Base DTO, Response, Paging...)
│   │   │   ├── config/         # Cấu hình ứng dụng (Security, Cloudinary, Cors, AppConfig...)
│   │   │   ├── controller/     # Tiếp nhận request và điều hướng API (phân chia theo Module)
│   │   │   │   ├── auth/       # AuthController.java
│   │   │   │   ├── post/       # PostController.java
│   │   │   │   └── ...
│   │   │   ├── dao/            # Tương tác database (Repository interfaces)
│   │   │   │   ├── user/       # UserRepository.java
│   │   │   │   └── ...
│   │   │   ├── dto/            # Các đối tượng truyền dữ liệu (Data Transfer Objects)
│   │   │   │   ├── request/    # Nhận dữ liệu từ Client gửi lên (chứa JSR-380 Validation)
│   │   │   │   └── response/   # Dữ liệu sạch trả về cho Client
│   │   │   ├── entity/         # Các JPA Entities ánh xạ trực tiếp xuống cơ sở dữ liệu
│   │   │   │   ├── user/       # User.java, Profile.java
│   │   │   │   └── ...
│   │   │   ├── exception/      # Custom Exceptions và Global Exception Handler toàn cục
│   │   │   ├── integration/    # Tích hợp dịch vụ bên ngoài (PayOS SDK, Google OAuth, S3...)
│   │   │   ├── mapper/         # Chuyển đổi dữ liệu Entity <-> DTO (sử dụng MapStruct)
│   │   │   ├── scheduler/      # Các cron job chạy ẩn danh (VD: quét gói tin hết hạn...)
│   │   │   ├── security/       # JWT Filter, User Details Service, RBAC Utilities
│   │   │   ├── service/        # Chứa Logic nghiệp vụ (Phân tách Interface và ServiceImp)
│   │   │   │   ├── user/       # UserService.java, UserServiceImp.java
│   │   │   │   └── ...
│   │   │   ├── specification/  # Các bộ lọc tìm kiếm động (JPA Specification)
│   │   │   ├── websocket/      # Xử lý kết nối Real-time Chat, thông báo tức thời
│   │   │   └── AlumnectBackendApplication.java # Điểm khởi chạy của Backend
│   │   │
│   │   └── resources/
│   │       ├── application.properties   # File cấu hình môi trường chính
│   │       └── application-dev.properties
│   └── test/                   # Thư mục chứa các tệp kiểm thử Unit Test/Integration Test
│
├── pom.xml                     # Tệp cấu hình các thư viện Maven
└── Dockerfile                  # Đóng gói Docker Container cho Backend
```

---

## 3. CHI TIẾT CẤU TRÚC FRONTEND (`alumnect-frontend`)

Mã nguồn Frontend tuân thủ nghiêm ngặt mô hình **Enterprise Feature-Based Architecture** nhằm tăng tính đóng gói của các Module nghiệp vụ độc lập:

```text
alumnect-frontend/
├── public/                     # Tài nguyên tĩnh công khai (logo, favicon...)
├── src/
│   ├── app/                    # Cấu hình gốc của ứng dụng
│   │   ├── providers/          # Global context providers (React Query, Theme, Auth)
│   │   ├── routes/             # Định cấu hình router chính (createBrowserRouter)
│   │   ├── App.tsx             # Component gốc
│   │   └── index.css           # Cấu hình Tailwind CSS v4 và styles toàn cục
│   ├── assets/                 # Fonts, hình ảnh tĩnh dùng chung toàn dự án
│   ├── components/             # UI Components nền tảng dùng chung (Stateless, không mang nghiệp vụ)
│   │   ├── ui/                 # Button, Input, Modal, Badge, Dropdown, Table...
│   │   ├── layout/             # AppShell, AdminShell, Navbar, Sidebar
│   │   ├── motion/             # Framer Motion components (Fade, Stagger, MagneticButton...)
│   │   └── viz/                # Biểu đồ và Bản đồ (WorldMap, Charts)
│   ├── features/               # Các Modules nghiệp vụ độc lập (Feature-based)
│   │   ├── auth/               # Module Xác thực tài khoản
│   │   │   ├── components/     # Component riêng biệt (LoginForm, RegisterForm)
│   │   │   ├── hooks/          # Custom hooks riêng (useLoginMutation)
│   │   │   ├── api/            # Các cuộc gọi API liên quan (authApi.ts)
│   │   │   ├── model/          # Định nghĩa Zod Schema validate & Type interface
│   │   │   └── index.ts        # Cổng xuất khẩu (Barrel file) công khai của feature
│   │   ├── feed/               # Module Bản tin cộng đồng
│   │   ├── profile/            # Module Hồ sơ người dùng
│   │   └── ...                 # Các modules khác
│   ├── hooks/                  # Custom hooks dùng chung toàn dự án (useDebounce, useAuth...)
│   ├── lib/                    # Cấu hình các thư viện bên thứ 3 (Axios client, QueryClient...)
│   ├── pages/                  # Đại diện cho các Route chính (chỉ ghép nối các components từ features)
│   │   ├── auth/               # LoginPage.tsx, RegisterPage.tsx
│   │   ├── app/                # FeedPage.tsx, JobsPage.tsx, EventsPage.tsx
│   │   ├── admin/              # AdminOverviewPage.tsx, AdminUsersPage.tsx
│   │   └── LandingPage.tsx     # Trang chủ giới thiệu
│   ├── store/                  # Zustand stores quản lý Client State dùng chung (authStore.ts)
│   ├── types/                  # Định nghĩa các kiểu dữ liệu TypeScript dùng chung toàn cục
│   ├── utils/                  # Các hàm bổ trợ dùng chung (Định dạng tiền tệ, xử lý ngày tháng...)
│   ├── main.tsx                # Điểm khởi chạy chính ứng dụng (Root Mount)
│   └── vite-env.d.ts
│
├── package.json                # Quản lý thư viện và scripts chạy dự án
├── vite.config.ts              # Cấu hình công cụ Vite
├── tsconfig.json               # Cấu hình TypeScript compiler
└── eslint.config.js            # Cấu hình kiểm tra cú pháp ESLint v9
```
