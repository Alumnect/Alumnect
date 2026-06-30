# ALUMNECT — REQUIREMENT SPECIFICATION (SRS) BASELINE

This document contains the primary Software Requirement Specification (SRS) for the AlumNect project.

---

## 1. PRODUCT OVERVIEW
AlumNect (Alumni Community Connection Platform, project code ACCP) is a verified, web-based social platform that reconnects the alumni of FPT University (FPTU) with one another, with current students, and with the university. It replaces the fragmented and unverified channels graduates currently rely on — Facebook groups, Zalo and email lists — with a single, trustworthy "home" that centralises verified profiles and connections, a community feed, events, recruitment and jobs with paid posting packages, a Q&A forum, an anonymous salary board, career-path visualisation, an interactive alumni map, direct messaging, and an administrative dashboard for verification, moderation, and analytics. 

The platform is delivered as a responsive web application built on a ReactJS + TailwindCSS front-end and a Java Spring Boot RESTful API backed by PostgreSQL, with identity verification and role-based access control (RBAC) keeping the community authentic and well governed.

### Key Objectives of the System
*   Provide an official, verified digital home for the FPTU alumni community, with identity-verified accounts and RBAC governing Guest, Student, Alumni, and Admin permissions.
*   Support students' career orientation by connecting them with alumni through the social feed, direct messaging, the Q&A forum, career-path charts, and the anonymous salary board.
*   Increase job and internship opportunities through the alumni network via verified job/recruitment posts, content moderation, and online payment for posting packages — creating a sustainable revenue stream.
*   Centralise and structure community information (people, posts, events, jobs, questions) in one verified, searchable place instead of scattered informal channels.
*   Empower the university with insight and control through the alumni map, admin dashboards, KPIs, and moderation tools to evaluate engagement and strengthen alumni relations.
*   Ensure security, scalability, and maintainability through JWT/OAuth authentication, a layered Spring Boot architecture, and a responsive web client that grows with the community.

---

## 2. USER REQUIREMENTS

### 2.1 Actors
| # | Actor | Description |
|---|---|---|
| 1 | Guest | An unauthenticated visitor who accesses AlumNect without logging in. Limited to publicly available, read-only content; cannot interact, message, post, or access personalised features. |
| 2 | Student | A current FPTU student using AlumNect in a support/mentee capacity. Can connect, browse feed, attend events, message, ask/answer questions, and view stats. Cannot post jobs, contribute salary, or get verified badge. |
| 3 | Alumni | A verified FPTU graduate — the primary user. After Admin verification, receives the verified badge and full privileges: profile timeline, feed posting, event creation, job posting via packages, salary contribution, and map listing. |
| 4 | Admin | The platform operator (FPTU staff). Manages the system: verifies/approves accounts, moderates content, manages topics, oversees payments, broadcasts notifications, and monitors KPIs. |

---

### 2.2 Use Cases
Below is the list of use cases across six modules, prioritized with MoSCoW.

#### Module 1 - Authentication & Account
| ID | Use Case | Actors | Description | MoSCoW |
|---|---|---|---|---|
| UC01 | Register a new account | Guest | Provide full name, email, password, cohort and major; verify via email. | M |
| UC02 | Log in with email & password | Student, Alumni, Admin | Authenticate with email + password and obtain a session. | M |
| UC03 | Log in with Google (OAuth 2.0) | Student, Alumni | Sign in / register quickly via Google OAuth 2.0. | M |
| UC04 | Forgot password | Student, Alumni, Admin | Send a password-reset link by email. | M |
| UC05 | Change password | Student, Alumni, Admin | Set a new password via the reset link or while signed in. | M |
| UC06 | Log out | Student, Alumni, Admin | End the session and revoke the token. | M |

#### Module 2 - Profile
| ID | Use Case | Actors | Description | MoSCoW |
|---|---|---|---|---|
| UC07 | Edit personal profile | Student, Alumni | Update avatar, basic information, and biography. | M |
| UC08 | View another profile | Guest, Student, Alumni | Open and read another alumnus's public profile. | M |
| UC09 | Search users | Guest, Student, Alumni | Search by name, cohort, major, or skills. | S |
| UC10 | Connection suggestions | Student, Alumni | System suggests alumni in same major/cohort. | S |
| UC11 | Follow / unfollow | Student, Alumni | Follow or unfollow another user. | S |
| UC12 | View notifications | Student, Alumni | View in-app notifications and mark as read. | S |
| UC13 | View followers/following | Student, Alumni | View follower lists. | S |

#### Module 3 - Social: Feed, Posts, Events, Packages & Messaging
| ID | Use Case | Actors | Description | MoSCoW |
|---|---|---|---|---|
| UC14 | Create a post | Student, Alumni | Publish achievement, normal post, recruitment, or event. | M |
| UC15 | View Feed | Guest, Student, Alumni | Browse community posts. | M |
| UC16 | View post detail | Guest, Student, Alumni | Read full post. | M |
| UC17 | Like a post | Student, Alumni | Like / unlike a post. | M |
| UC18 | Comment | Student, Alumni | Add comment under post. | M |
| UC19 | Edit comment | Student, Alumni | Edit own comment. | S |
| UC20 | Delete comment | Student, Alumni | Delete own comment. | S |
| UC21 | Repost / share | Student, Alumni | Share post to own feed. | S |
| UC22 | Edit post | Student, Alumni | Edit own post. | M |
| UC23 | Delete post | Student, Alumni | Remove own post. | M |
| UC24 | Report post | Student, Alumni | Report post breaching standards. | M |
| UC25 | RSVP event | Student, Alumni | Confirm event attendance. | M |
| UC26 | Cancel RSVP | Student, Alumni | Withdraw from attendee list. | S |
| UC27 | Cancel event | Alumni | Mark event as cancelled and notify. | M |
| UC28 | Attended history | Student, Alumni | Look up past events. | C |
| UC29 | Attendee list | Student, Alumni | List alumni registered. | S |
| UC30 | Select package | Alumni | View posting packages. | M |
| UC31 | Pay for package | Alumni | Purchase package via PayOS. | M |
| UC32 | Submit complaint | Alumni | Complain about transaction. | S |
| UC33 | Send DM | Student, Alumni | Send direct messages. | S |
| UC34 | View conversations | Student, Alumni | Browse conversation list. | S |
| UC35 | Search posts | Guest, Student, Alumni | Search by keyword/type. | S |
| UC36 | Save post | Student, Alumni | Bookmark post. | C |
| UC37 | View saved posts | Student, Alumni | View bookmarked posts. | C |

#### Module 4 - Q&A Forum & Salary Board
*Includes UC38 to UC54 (View question list, Ask/Answer, Vote, Salary contribution, Salary stats).*

#### Module 5 - Alumni Map & Career Path
*Includes UC55 to UC59 (View Map, Filter, Marker Profile, Career Path Chart).*

#### Module 6 - Admin Dashboard & System
*Includes UC60 to UC89 (Stats, Lock/Unlock, Approve account, Moderate feed/jobs/events, Payments, Broadcast notifications, Analytics).*

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Screen Authorization Matrix
| Screen | Guest | Student | Alumni | Admin |
|---|---|---|---|---|
| Sign In / Sign Up | ✓ | | | ✓ |
| Confirm Email | ✓ | | | |
| Forgot Password | ✓ | | | |
| Change Password | | ✓ | ✓ | ✓ |
| Account Menu | | ✓ | ✓ | ✓ |
| View Profile | | ✓ | ✓ | ✓ |
| Edit Profile | | ✓ | ✓ | |
| Settings | | ✓ | ✓ | ✓ |
| Home Feed | ✓ | ✓ | ✓ | |
| Main Navigation | ✓ | ✓ | ✓ | |
| Post Composer | | ✓ | ✓ | |
| Post Detail | ✓ | ✓ | ✓ | |
| Notifications | | ✓ | ✓ | |
| Alumni Directory | ✓ | ✓ | ✓ | |
| Public Profile | ✓ | ✓ | ✓ | |
| Job Board | ✓ | ✓ | ✓ | |
| Event Board | ✓ | ✓ | ✓ | |
| Question List | ✓ | ✓ | ✓ | |
| Alumni Map | ✓ | ✓ | ✓ | |
| Message | | ✓ | ✓ | |
| Salary Statistics | | ✓ | ✓ | |
| My Salary | | | ✓ | |
| Subscription | | | ✓ | |
| Admin Dashboard | | | | ✓ |

---

### 3.2 DETAILED FUNCTIONAL SPECIFICATION (MODULE 1)

#### 3.2.1 Register a New Account (Covers UC01)
*   **Function trigger**: Path `/register` on demand by Guest.
*   **Purpose**: Creates new AlumNect account, triggers email verification. For Alumni context, collects FPTU proof (graduation year, student ID, evidence image) saved as `VerificationRequest` for Admin review. Students register without proof (BR-25).
*   **Interface**: Full name (text), Email (text), Password (masked, toggle), Confirm password (masked), Role selector (Student/Alumni), Terms checkbox, Register button, Sign in link.
*   **Data processing**:
    1. Validate fields; call `POST /api/auth/register` with fields.
    2. Check users table for duplicate email (reject duplicates).
    3. Create user row as `PENDING_VERIFICATION`, store role, hash password (BCrypt), generate verification token, email verification link.
    4. Account remains inactive until email verified.
*   **Validation Rules**: All fields required. Email valid & unique. Password ≥ 8 characters with mixed character types. Confirm password equals password. Role must be selected. Terms checked.
*   **Business Rules**: BR-01 (unique, verify before active), BR-19 (strength & BCrypt), BR-23 (one role context).
*   **Error Handling**: Empty field -> MSG01; invalid email -> MSG02; mismatch -> MSG25; duplicate -> "Email already in use"; failure -> MSG05.
*   **Normal case**: Form submitted, account created as `PENDING_VERIFICATION`, toast MSG06 shows email sent.
*   **Abnormal case**: Validation fails (blocked); email exists (blocked); email service fails -> MSG05.

#### 3.2.2 Sign In (Email & Password) (Covers UC02)
*   **Function trigger**: Path `/login` on demand by registered user.
*   **Purpose**: Authenticates user with email/password, issues JWT session.
*   **Interface**: Email (text), Password (masked, toggle), Remember me, Sign in button, Forgot link, Sign in with Google, Register link.
*   **Data processing**:
    1. Call `POST /api/auth/login` with email and password.
    2. Load user, verify password against BCrypt, check account is `ACTIVE` and not locked.
    3. Return short-lived JWT access token + refresh token, and role context.
    4. Reject if unverified.
*   **Validation Rules**: Email and password required. Email valid format.
*   **Business Rules**: BR-01, BR-19, BR-20 (token expiry and session continuity), BR-23.
*   **Error Handling**: Empty -> MSG01; format -> MSG02; wrong credentials -> MSG03; unverified -> MSG07; locked -> MSG28; failure -> MSG05.

#### 3.2.3 Sign In with Google (OAuth 2.0) (Covers UC03)
*   **Function trigger**: Google button on `/login` screen.
*   **Purpose**: Sign in via Google OAuth, provisioning new user on first-time or linking existing one.
*   **Data processing**:
    1. Call `POST /api/auth/google` with Google token.
    2. Backend validates token, extracts email, display name, checks `users`.
    3. If exists, sign in. If new, provision user (Google email is automatically verified), prompt role context.
    4. Return JWT session.
*   **Validation**: Google token valid. Role selected on first-time login.

#### 3.2.4 Manage Password (Forgot / Reset & Change) (Covers UC04, UC05)
##### 3.2.4.1 Forgot & Reset Password
*   **Forgot Trigger**: POST `/api/auth/forgot-password` with email. Generates single-use reset token, emails link. Show same response whether email exists or not to prevent enumeration.
*   **Reset Trigger**: POST `/api/auth/reset-password` with token and new password. Updates password, invalidates old sessions.
*   **Validation**: New password ≥ 8 chars mixed. Token valid & unexpired.
##### 3.2.4.2 Change Password
*   **Trigger**: POST `/api/users/change-password` (authenticated).
*   **Processing**: Verify current password, save new BCrypt hash, revoke old sessions.

#### 3.2.5 Logout (Covers UC06)
*   **Trigger**: Sign out click (POST `/api/auth/logout` with JWT).
*   **Processing**: Revoke refresh token (blacklist), clear client-side state.
