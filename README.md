<!-- README generated from Report3_SRS_AlumNect_revised.docx. -->
<!-- This Markdown keeps the SRS content and ordering as the project README/reference. -->

# AlumNect (ACCP) — Project README

> Source document: `Report3_SRS_AlumNect_revised.docx` — Report 3 Requirement Specification (SRS).
> This README preserves the SRS structure, use cases, functional requirements, non-functional requirements, business rules, and message catalogue for implementation reference.

---

## README Table of Contents

- [III. Requirement Specification](#iii-requirement-specification)
- [1. Product Overview](#1-product-overview)
  - [Key Objectives of the System](#key-objectives-of-the-system)
- [2. User Requirements](#2-user-requirements)
  - [2.1 Actors](#21-actors)
  - [2.2 Use Cases](#22-use-cases)
    - [2.2.1 Use Case Diagrams](#221-use-case-diagrams)
    - [2.2.2 Use Case Descriptions](#222-use-case-descriptions)
      - [Module 1 - Authentication & Account](#module-1---authentication-account)
      - [Module 2 - Profile](#module-2---profile)
      - [Module 3 - Social: Feed, Posts, Events, Packages & Messaging](#module-3---social-feed-posts-events-packages-messaging)
      - [Module 4 - Q&A Forum & Salary Board](#module-4---qa-forum-salary-board)
      - [Module 5 - Alumni Map & Career Path](#module-5---alumni-map-career-path)
      - [Module 6 - Admin Dashboard & System](#module-6---admin-dashboard-system)
    - [2.2.3 Business Workflow](#223-business-workflow)
- [3. Functional Requirements](#3-functional-requirements)
  - [3.1 System Functional Overview](#31-system-functional-overview)
    - [3.1.1 Screen Flow](#311-screen-flow)
    - [3.1.2 Screen Descriptions](#312-screen-descriptions)
    - [3.1.3 Screen Authorization](#313-screen-authorization)
    - [3.1.4 Non-Screen Functions](#314-non-screen-functions)
    - [3.1.5 Entity Relationship Diagram](#315-entity-relationship-diagram)
  - [3.2 Authentication & Account](#32-authentication-account)
    - [3.2.1 Register a New Account](#321-register-a-new-account)
    - [3.2.2 Sign In Email & Password](#322-sign-in-email-password)
    - [3.2.3 Sign In with Google OAuth 2.0](#323-sign-in-with-google-oauth-20)
    - [3.2.4 Manage Password Forgot / Reset & Change](#324-manage-password-forgot-reset-change)
      - [3.2.4.1 Forgot & Reset Password](#3241-forgot-reset-password)
      - [3.2.4.2 Change Password](#3242-change-password)
    - [3.2.5 Logout](#325-logout)
    - [3.2.6 Submit Alumni Verification](#326-submit-alumni-verification)
  - [3.3 Profile](#33-profile)
    - [3.3.1 Edit Profile](#331-edit-profile)
    - [3.3.2 Manage Career Timeline](#332-manage-career-timeline)
    - [3.3.3 Manage Skills & Tags](#333-manage-skills-tags)
    - [3.3.4 View Profile](#334-view-profile)
    - [3.3.5 Search Alumni](#335-search-alumni)
    - [3.3.6 Connection Suggestions](#336-connection-suggestions)
    - [3.3.7 Follow / Unfollow a User](#337-follow-unfollow-a-user)
    - [3.3.8 View Notifications](#338-view-notifications)
    - [3.3.9 View Followers / Following](#339-view-followers-following)
  - [3.4 Social - Feed, Posts, Events, Packages & Messaging](#34-social---feed-posts-events-packages-messaging)
    - [3.4.1 Publish Post](#341-publish-post)
    - [3.4.2 View Feed](#342-view-feed)
    - [3.4.3 View Post Detail](#343-view-post-detail)
    - [3.4.4 Like Post](#344-like-post)
    - [3.4.5 Manage Comments](#345-manage-comments)
    - [3.4.6 Repost](#346-repost)
    - [3.4.7 Manage Own Post](#347-manage-own-post)
    - [3.4.8 Report Content](#348-report-content)
    - [3.4.9 Post Job Listing](#349-post-job-listing)
    - [3.4.10 Browse & Search Jobs](#3410-browse-search-jobs)
    - [3.4.11 Save / Unsave Job](#3411-save-unsave-job)
    - [3.4.12 Manage Own Job Listing](#3412-manage-own-job-listing)
    - [3.4.13 Posting Packages](#3413-posting-packages)
    - [3.4.14 Pay for Package](#3414-pay-for-package)
    - [3.4.15 Payment Complaint](#3415-payment-complaint)
    - [3.4.16 Direct Messaging](#3416-direct-messaging)
    - [3.4.17 Create Event](#3417-create-event)
    - [3.4.18 Browse & Search Events](#3418-browse-search-events)
    - [3.4.19 RSVP / Cancel Attendance](#3419-rsvp-cancel-attendance)
    - [3.4.20 Event Reminder](#3420-event-reminder)
    - [3.4.21 Share Event](#3421-share-event)
    - [3.4.22 Manage Own Event](#3422-manage-own-event)
    - [3.4.23 Attended-Event History](#3423-attended-event-history)
  - [3.5 Q&A Forum & Salary Board](#35-qa-forum-salary-board)
    - [3.5.1 Ask Question](#351-ask-question)
    - [3.5.2 Answer Question](#352-answer-question)
    - [3.5.3 Vote on Question or Answer](#353-vote-on-question-or-answer)
    - [3.5.4 Browse, Search & Filter Questions](#354-browse-search-filter-questions)
    - [3.5.5 Manage Own Question Edit / Delete](#355-manage-own-question-edit-delete)
    - [3.5.6 Manage Own Answer Edit / Delete](#356-manage-own-answer-edit-delete)
    - [3.5.7 Contribute Salary Data](#357-contribute-salary-data)
    - [3.5.8 Manage Own Salary Data Edit / Delete](#358-manage-own-salary-data-edit-delete)
    - [3.5.9 View & Filter Salary Statistics](#359-view-filter-salary-statistics)
  - [3.6 Alumni Map & Career Path](#36-alumni-map-career-path)
    - [3.6.1 View Alumni Map](#361-view-alumni-map)
    - [3.6.2 Filter Map](#362-filter-map)
    - [3.6.3 View Profile from Marker](#363-view-profile-from-marker)
    - [3.6.4 View Career Path](#364-view-career-path)
    - [3.6.5 Search / Filter Career Path](#365-search-filter-career-path)
  - [3.7 Admin Dashboard & System](#37-admin-dashboard-system)
    - [3.7.1 Admin Dashboard KPIs](#371-admin-dashboard-kpis)
    - [3.7.2 Manage Users](#372-manage-users)
    - [3.7.3 Approve Alumni Verification](#373-approve-alumni-verification)
    - [3.7.4 Moderate Feed Posts](#374-moderate-feed-posts)
    - [3.7.5 Moderate Job Listings](#375-moderate-job-listings)
    - [3.7.6 Manage Events](#376-manage-events)
    - [3.7.7 Manage Forum Topics & Moderate Q&A](#377-manage-forum-topics-moderate-qa)
    - [3.7.8 Manage Payments & Revenue](#378-manage-payments-revenue)
    - [3.7.9 Notifications & Analytics](#379-notifications-analytics)
- [4. Non-Functional Requirements](#4-non-functional-requirements)
  - [4.1 External Interfaces](#41-external-interfaces)
  - [User Interfaces](#user-interfaces)
  - [External Systems & Services](#external-systems-services)
  - [4.2 Quality Attributes](#42-quality-attributes)
    - [4.2.1 Usability](#421-usability)
    - [4.2.2 Reliability](#422-reliability)
    - [4.2.3 Performance](#423-performance)
    - [4.2.4 Security](#424-security)
    - [4.2.5 Maintainability](#425-maintainability)
- [5. Requirement Appendix](#5-requirement-appendix)
  - [5.1 Business Rules](#51-business-rules)
  - [5.2 Common Requirements](#52-common-requirements)
  - [5.3 Application Messages List](#53-application-messages-list)
  - [5.4 Other Requirements](#54-other-requirements)

---

# Report 3 — Requirement Specification (SRS)

_AlumNect (ACCP) — FPT University SEP490 Capstone Project_

Table of Contents

Numbering note: Figures and tables in this SRS are numbered from 1. When you merge this chapter into the full capstone document (after Report 1 "Project Introduction" and Report 2 "Project Management Plan"), renumber figures/tables to continue from the previous chapters. [Figure n: …] markers indicate a diagram/screenshot to be inserted; draw them in draw.io / PlantUML / Figma. The conceptual entity list in 3.1.5 is for traceability; the full physical ERD and schema are produced in the SDS (Report 4).

## III. Requirement Specification

## 1. Product Overview

AlumNect (Alumni Community Connection Platform, project code ACCP) is a verified, web-based social platform that reconnects the alumni of FPT University (FPTU) with one another, with current students, and with the university. It replaces the fragmented and unverified channels graduates currently rely on — Facebook groups, Zalo and email lists — with a single, trustworthy "home" that centralises verified profiles and connections, a community feed, events, recruitment and jobs with paid posting packages, a Q&A forum, an anonymous salary board, career-path visualisation, an interactive alumni map, direct messaging, and an administrative dashboard for verification, moderation, and analytics. The platform is delivered as a responsive web application built on a ReactJS + TailwindCSS front-end and a Java Spring Boot RESTful API backed by PostgreSQL, with identity verification and role-based access control (RBAC) keeping the community authentic and well governed.

### Key Objectives of the System

- Provide an official, verified digital home for the FPTU alumni community, with identity-verified accounts and RBAC governing Guest, Student, Alumni, and Admin permissions.
- Support students' career orientation by connecting them with alumni through the social feed, direct messaging, the Q&A forum, career-path charts, and the anonymous salary board.
- Increase job and internship opportunities through the alumni network via verified job/recruitment posts, content moderation, and online payment for posting packages — creating a sustainable revenue stream.
- Centralise and structure community information (people, posts, events, jobs, questions) in one verified, searchable place instead of scattered informal channels.
- Empower the university with insight and control through the alumni map, admin dashboards, KPIs, and moderation tools to evaluate engagement and strengthen alumni relations.
- Ensure security, scalability, and maintainability through JWT/OAuth authentication, a layered Spring Boot architecture, and a responsive web client that grows with the community.
[Figure 1: System Context Diagram — AlumNect, its four actors, and external services (Google OAuth, PayOS payment gateway, email service, map provider, object storage)]

Figure 1 System Context Diagram

## 2. User Requirements

### 2.1 Actors

<!-- Source table 1 from SRS DOCX -->
| # | Actor | Description |
| --- | --- | --- |
| 1 | Guest | An unauthenticated visitor who accesses AlumNect without logging in. Limited to publicly available, read-only content (e.g. public feed posts, public profiles, public events and job listings); cannot interact, message, post, or access personalised features. |
| 2 | Student | A current FPTU student using AlumNect in a support/mentee capacity. Can connect with alumni, browse and interact with the feed, attend events, message verified members, ask and answer questions, and view salary statistics and career paths. Cannot post job listings or contribute salary data, and does not receive the verified-alumni badge. |
| 3 | Alumni | A verified FPTU graduate — the primary user of the platform. After identity verification by an Admin, an alumnus receives the verified badge and full member privileges: rich profile and career timeline, posting on the feed, creating events, posting jobs through paid packages, contributing anonymous salary data, mentoring via the forum and messaging, and appearing on the alumni map. |
| 4 | Admin | The platform operator (FPTU staff). Manages the system through the admin dashboard: verifies/approves alumni accounts, moderates reported content (posts, jobs, events, Q&A), manages forum topics, oversees payments and revenue, sends broadcast notifications, and monitors KPIs, growth, and alumni-distribution analytics. |

Table 1 Actors

### 2.2 Use Cases

#### 2.2.1 Use Case Diagrams

The use-case model is organised into six functional modules. Each module's use-case diagram shows the actors involved (Guest, Student, Alumni, Admin) and the use cases they perform, with <<include>> / <<extend>> relationships where applicable. In the diagrams the actor "User" denotes any authenticated member (Student or Alumni).

[Figure 2: Use Case Diagram - Module 1 (Authentication & Account)] Figure 2 Use Case Diagram - Module 1 (Authentication & Account)

[Figure 3: Use Case Diagram - Module 2 (Profile)] Figure 3 Use Case Diagram - Module 2 (Profile)

[Figure 4: Use Case Diagram - Module 3 (Social: Feed, Posts, Events, Packages & Messaging)] Figure 4 Use Case Diagram - Module 3 (Social: Feed, Posts, Events, Packages & Messaging)

[Figure 5: Use Case Diagram - Module 4 (Q&A Forum & Salary Board)] Figure 5 Use Case Diagram - Module 4 (Q&A Forum & Salary Board)

[Figure 6: Use Case Diagram - Module 5 (Alumni Map & Career Path)] Figure 6 Use Case Diagram - Module 5 (Alumni Map & Career Path)

[Figure 7: Use Case Diagram - Module 6 (Admin Dashboard & System)] Figure 7 Use Case Diagram - Module 6 (Admin Dashboard & System)

#### 2.2.2 Use Case Descriptions

The system comprises 89 use cases across six modules, prioritised with MoSCoW (M = Must-have, S = Should-have, C = Could-have). Use-case identifiers (UC01-UC89) follow the project's authoritative use-case list. Note that recruitment listings and events are created as Feed post types via UC14, so they have no separate "create" use case; the dedicated recruitment/event use cases cover RSVP, attendee lists, posting packages, payment and moderation.

##### Module 1 - Authentication & Account

<!-- Source table 2 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC01 | Register a new account | Guest | Provide full name, email, password, cohort and major; verify via email. | M |
| UC02 | Log in with email & password | Student, Alumni, Admin | Authenticate with email + password and obtain a session. | M |
| UC03 | Log in with Google (OAuth 2.0) | Student, Alumni | Sign in / register quickly via Google OAuth 2.0. | M |
| UC04 | Forgot password | Student, Alumni, Admin | Send a password-reset link by email. | M |
| UC05 | Change password | Student, Alumni, Admin | Set a new password via the reset link or while signed in. | M |
| UC06 | Log out | Student, Alumni, Admin | End the session and revoke the token. | M |

Table 2 Use Cases - Module 1 (Authentication & Account)

##### Module 2 - Profile

<!-- Source table 3 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC07 | Edit personal profile (incl. career timeline) | Student, Alumni | Update avatar, basic information, and biography. | M |
| UC08 | View another user's profile | Guest, Student, Alumni | Open and read another alumnus's public profile. | M |
| UC09 | Search users | Guest, Student, Alumni | Search by name, cohort, major, or skills. | S |
| UC10 | View connection suggestions | Student, Alumni | The system suggests alumni in the same major / cohort. | S |
| UC11 | Follow / unfollow another user | Student, Alumni | Follow or unfollow another alumnus; status shown on the profile. | S |
| UC12 | View notifications | Student, Alumni | View in-app notifications received in the system; mark them as read. | S |
| UC13 | View followers / following | Student, Alumni | View one’s own or another member’s public followers and following lists; open a profile from the list. | S |

Table 3 Use Cases - Module 2 (Profile)

##### Module 3 - Social: Feed, Posts, Events, Packages & Messaging

<!-- Source table 4 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC14 | Create a post on the Feed | Student, Alumni | Publish an achievement, a normal post, a recruitment post, or an event. | M |
| UC15 | View community Feed | Guest, Student, Alumni | Browse the list of posts from the alumni community. | M |
| UC16 | View post detail | Guest, Student, Alumni | Open and read the full content of a post. | M |
| UC17 | Like a post | Student, Alumni | Like / unlike a post. | M |
| UC18 | Comment on a post | Student, Alumni | Add a comment under a post. | M |
| UC19 | Edit a comment | Student, Alumni | Edit one's own comment. | S |
| UC20 | Delete a comment | Student, Alumni | Delete one's own comment. | S |
| UC21 | Repost / share a post | Student, Alumni | Repost a post to one's own Feed. | S |
| UC22 | Edit a post | Student, Alumni | Edit one's own post. | M |
| UC23 | Delete a post | Student, Alumni | Remove one's own post from the Feed. | M |
| UC24 | Report a violating post | Student, Alumni | Report a post that breaches community standards. | M |
| UC25 | Register to attend an event (RSVP) | Student, Alumni | Confirm attendance for an event. | M |
| UC26 | Cancel event attendance | Student, Alumni | Withdraw from an event's attendee list. | S |
| UC27 | Cancel an event | Alumni | Mark an event as cancelled and notify registrants. | M |
| UC28 | View attended-event history | Student, Alumni | Look up events attended in the past. | C |
| UC29 | View event attendee list | Student, Alumni | List the alumni registered for an event. | S |
| UC30 | View & select a posting package | Alumni | View posting packages and compare features. | M |
| UC31 | Pay for a posting package | Alumni | Pay to purchase a posting package. | M |
| UC32 | Submit a payment complaint | Alumni | Raise a complaint about a payment transaction. | S |
| UC33 | Send a direct message | Student, Alumni | Send and receive direct messages with another user. | S |
| UC34 | View conversation list (inbox) | Student, Alumni | Browse existing conversations. | S |
| UC35 | Search posts | Guest, Student, Alumni | Search posts by keyword, author, or type. | S |
| UC36 | Save a post | Student, Alumni | Bookmark a post to read later. | C |
| UC37 | View saved posts | Student, Alumni | Look up the list of saved posts. | C |

Table 4 Use Cases - Module 3 (Social: Feed, Posts, Events, Packages & Messaging)

##### Module 4 - Q&A Forum & Salary Board

<!-- Source table 5 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC38 | View question list | Guest, Student, Alumni | Browse the list of forum questions. | S |
| UC39 | View question detail | Guest, Student, Alumni | Open a question and read its answers. | S |
| UC40 | Ask a question | Student, Alumni | Post a question to the forum under a topic / category. | S |
| UC41 | Answer a question | Student, Alumni | Submit an answer to a posted question. | S |
| UC42 | Vote on a question | Student, Alumni | Upvote / downvote a question. | C |
| UC43 | Vote on an answer | Student, Alumni | Upvote / downvote an answer. | C |
| UC44 | Search questions | Guest, Student, Alumni | Search questions by keyword. | S |
| UC45 | Filter questions by topic | Guest, Student, Alumni | Filter the question list by tag / topic. | S |
| UC46 | Edit a question | Student, Alumni | Edit one's own question. | M |
| UC47 | Delete a question | Student, Alumni | Delete one's own question. | S |
| UC48 | Edit an answer | Student, Alumni | Edit one's own answer. | M |
| UC49 | Delete an answer | Student, Alumni | Delete one's own answer. | S |
| UC50 | Contribute salary data | Alumni | Share anonymous salary information into the system. | C |
| UC51 | Edit salary contribution | Alumni | Update previously contributed salary data. | C |
| UC52 | Delete salary contribution | Alumni | Remove previously contributed salary data. | C |
| UC53 | View salary statistics | Student, Alumni | View aggregated salary charts. | C |
| UC54 | Filter salary data | Student, Alumni | Filter statistics by industry, position, or region. | C |

Table 5 Use Cases - Module 4 (Q&A Forum & Salary Board)

##### Module 5 - Alumni Map & Career Path

<!-- Source table 6 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC55 | View Alumni Map | Guest, Student, Alumni | View the geographic distribution of alumni on a map. | S |
| UC56 | Filter map (by cohort / major) | Student, Alumni | Narrow the map view using filters. | C |
| UC57 | View profile from map marker | Guest, Student, Alumni | Click a marker to view an alumnus's profile. | C |
| UC58 | View Career Path chart | Guest, Student, Alumni | View typical career paths of FPTU alumni. | S |
| UC59 | Search & filter Career Path | Student, Alumni | Filter career paths by industry, position, timeline. | C |

Table 6 Use Cases - Module 5 (Alumni Map & Career Path)

##### Module 6 - Admin Dashboard & System

<!-- Source table 7 from SRS DOCX -->
| ID | Use Case | Actors | Description | MoSCoW |
| --- | --- | --- | --- | --- |
| UC60 | Overview statistics dashboard | Admin | View overall system KPIs and statistics. | M |
| UC61 | View user list | Admin | Look up and paginate the list of accounts. | M |
| UC62 | View user profile detail | Admin | Open the full profile of an account. | M |
| UC63 | Lock / unlock account | Admin | Disable or re-activate an account. | S |
| UC64 | Approve alumni account | Admin | Review FPTU-related proof and approve / reject. | M |
| UC65 | View all Feed posts | Admin | Browse every post in the system. | M |
| UC66 | Search & filter Feed posts | Admin | Filter posts by status, keyword, or author. | S |
| UC67 | View Feed post detail | Admin | Open and read a specific post in full. | M |
| UC68 | Hide a violating Feed post | Admin | Hide a post that breaches community standards. | M |
| UC69 | View reported-post list | Admin | List posts awaiting report resolution. | M |
| UC70 | View Feed report detail | Admin | Read the content and reason of a report. | M |
| UC71 | Resolve a reported post | Admin | Resolve a report: hide the post or dismiss it. | M |
| UC72 | View all events | Admin | Browse all events created in the system. | S |
| UC73 | View event detail | Admin | Open full event information and the registrant list. | S |
| UC74 | Hide / remove a violating event | Admin | Hide or delete a non-compliant event. | S |
| UC75 | View all job listings | Admin | Browse all recruitment posts in the system. | S |
| UC76 | View job listing detail | Admin | Open full information and posting-package status. | S |
| UC77 | Hide a violating job listing | Admin | Hide a non-compliant job listing. | S |
| UC78 | View violating questions | Admin | Filter reported / violating questions. | S |
| UC79 | View violating answers | Admin | Filter reported / violating answers. | S |
| UC80 | View forum topic catalogue | Admin | Look up all existing forum topics. | S |
| UC81 | Create a new forum topic | Admin | Add a new topic to classify questions. | S |
| UC82 | Edit a forum topic | Admin | Rename or update a topic's description. | S |
| UC83 | View payment transaction list | Admin | Look up the system-wide transaction history. | M |
| UC84 | View revenue statistics | Admin | View revenue charts over time. | M |
| UC85 | View recruiter package history | Admin | Look up packages purchased by each account. | S |
| UC86 | Resolve a payment complaint | Admin | Review and respond to a transaction complaint. | S |
| UC87 | Send a broadcast notification | Admin | Broadcast a notification to all or a group of users. | S |
| UC88 | View all sent notifications | Admin | Look up the history of sent notifications. | S |
| UC89 | View post / event / recruitment analytics | Admin | View activity analytics reports per module. | M |

Table 7 Use Cases - Module 6 (Admin Dashboard & System)

#### 2.2.3 Business Workflow

Beyond the per-actor use-case views, the platform is driven by a number of cross-cutting business processes that span several actors and modules. The workflow (BPMN-style) diagrams below describe these end-to-end flows; they are referenced again by the detailed functional specifications in Section 3.2 onward and by the business rules in Section 5.1.

[Figure 8: Business Workflow — Alumni Verification (registered user submits FPTU proof → request queued as PENDING → Admin reviews evidence → approve grants the verified badge and Alumni privileges / reject returns the request with a reason → applicant is notified in-app)] Figure 8 Business Workflow — Alumni Verification

[Figure 9: Business Workflow — Job Posting & Online Payment (Alumni selects a posting package → checkout via PayOS → signed callback verified server-side → transaction marked PAID and package activated → job listing becomes ACTIVE → package-expiry job later sets the listing to EXPIRED/hidden)] Figure 9 Business Workflow — Job Posting & Online Payment

[Figure 10: Business Workflow — Content Reporting & Moderation (a member reports a post / job / question / answer → report queued for review → Admin inspects the report detail → hide the content and notify the author / dismiss the report → reporter and author states updated)] Figure 10 Business Workflow — Content Reporting & Moderation

[Figure 11: Business Workflow — Event Lifecycle (Alumni creates an event → event published to the community → members RSVP / cancel attendance → reminder dispatched before start → organiser may edit or cancel, on cancellation all registrants are notified in-app)] Figure 11 Business Workflow — Event Lifecycle

[Figure 12: Business Workflow — Anonymous Salary Contribution & Aggregation (verified Alumni contributes a salary record stored without identity linkage → aggregation service recomputes statistics per industry/position/region filter → statistics are exposed only once the minimum-contribution threshold is met → Students and Alumni view aggregate-only charts)] Figure 12 Business Workflow — Anonymous Salary Contribution & Aggregation

## 3. Functional Requirements

### 3.1 System Functional Overview

#### 3.1.1 Screen Flow

The screen-flow diagrams below describe the navigation paths available to each actor after entering the platform, from the landing/login page through to each module's screens.

[Figure 13: Screen Flow — Guest] Figure 13 Screen Flow — Guest

[Figure 14: Screen Flow — Student] Figure 14 Screen Flow — Student

[Figure 15: Screen Flow — Alumni] Figure 15 Screen Flow — Alumni

[Figure 16: Screen Flow — Admin] Figure 16 Screen Flow — Admin

#### 3.1.2 Screen Descriptions

<!-- Source table 8 from SRS DOCX -->
| # | Feature | Screen | Description |
| --- | --- | --- | --- |
| 1 | Authentication & Account | Sign In / Sign Up | Entry screen for email/password login, Google OAuth 2.0 sign-in, and new-account registration (full name, email, password, cohort, major). |
| 2 | Authentication & Account | Confirm Email | Shown after registration; prompts the user to verify the account through the link sent to their email. |
| 3 | Authentication & Account | Forgot Password | Lets a user request a password-reset link by entering their registered email. |
| 4 | Authentication & Account | Change Password | Sets a new password via the reset link or while signed in. |
| 5 | Authentication & Account | Account Menu | Quick-access panel routing to View Profile, Settings and Logout. |
| 6 | Authentication & Account | View Profile | Displays the current user’s own profile and career timeline. |
| 7 | Authentication & Account | Edit Profile | Updates avatar, basic information, biography and career timeline. |
| 8 | Authentication & Account | Settings | Settings hub: change theme, change language and change password (Alumni also access Subscription and Transaction History here). |
| 9 | Authentication & Account | Logout | Ends the session and revokes the access token. |
| 10 | Community Feed | Home Feed | Landing screen showing the community post stream; read-only for Guests. |
| 11 | Community Feed | Main Navigation | Primary navigation hub routing to every major module. |
| 12 | Community Feed | Post Composer | Creates an achievement, a normal post, a recruitment post or an event. |
| 13 | Community Feed | Post Detail | Full content of a post with like, comment, repost and report actions. |
| 14 | Community Feed | Edit Post | Edits the user’s own post. |
| 15 | Community Feed | Delete Post | Removes the user’s own post from the feed. |
| 16 | Community Feed | Notifications | Lists in-app notifications and lets the user mark them as read. |
| 17 | Alumni Network | Alumni Search & Directory | Searches alumni by name, cohort, major or skills and shows connection suggestions. |
| 18 | Alumni Network | Public Profile | Read-only profile of another member with follow / unfollow. |
| 19 | Alumni Network | Following | List of accounts the member is following. |
| 20 | Alumni Network | Followers | List of the member’s followers. |
| 21 | Alumni Network | Alumni Profile | Alumnus profile opened from an Alumni Map marker. |
| 22 | Recruitment & Jobs | Job Board | Lists verified job and internship postings. |
| 23 | Recruitment & Jobs | Job Detail | Full job description, posting-package status and application information. |
| 24 | Events | Event Board | Lists community events. |
| 25 | Events | Event Detail | Event information with RSVP, cancellation and the attendee list. |
| 26 | Q&A Forum | Question List (Q&A Forum) | Browses, searches and filters forum questions by topic. |
| 27 | Q&A Forum | Add Question | Posts a new question under a topic / category. |
| 28 | Q&A Forum | Question Detail | Opens a question with its answers and voting. |
| 29 | Q&A Forum | Answer Question | Submits an answer to a question. |
| 30 | Q&A Forum | Edit Question | Edits the user’s own question. |
| 31 | Q&A Forum | Delete Question | Deletes the user’s own question. |
| 32 | Q&A Forum | Edit Answer | Edits the user’s own answer. |
| 33 | Q&A Forum | Vote Question | Upvotes / downvotes a question. |
| 34 | Q&A Forum | Vote Answer | Upvotes / downvotes an answer. |
| 35 | Q&A Forum | Q&A History | Lists the user’s own questions and answers. |
| 36 | Career Path | Alumni Career Paths | Visualises typical FPTU alumni career paths with search and filter. |
| 37 | Career Path | Career Path Detail | Detailed view of a selected career path. |
| 38 | Alumni Map | Alumni Map | Interactive geographic distribution of alumni with cohort / major filters; markers open profiles. |
| 39 | Messaging | Message | Direct-message inbox and conversation view. |
| 40 | Salary Board | Salary Statistics | Aggregated anonymous salary charts with industry / position / region filters. |
| 41 | Salary Board | My Salary | Alumni hub for their own salary contributions. |
| 42 | Salary Board | Add Salary | Contributes an anonymous salary record. |
| 43 | Salary Board | Edit Salary | Updates a previous salary contribution. |
| 44 | Salary Board | Delete Salary | Removes a previous salary contribution. |
| 45 | Subscription & Payment | Subscription | Views and compares posting packages. |
| 46 | Subscription & Payment | Get Package | Selects and purchases a posting package. |
| 47 | Subscription & Payment | QR Code / Banking App | Completes the package payment via QR code / banking app. |
| 48 | Subscription & Payment | Transaction History | Lists the user’s package purchases and payment transactions. |
| 49 | Admin Dashboard | Overview Dashboard | System KPIs and statistics overview for the Admin. |
| 50 | Admin Dashboard | User Management | Lists accounts; opens profile detail; locks / unlocks accounts; approves or rejects alumni verification. |
| 51 | Admin Dashboard | Feed Post Management | Browses, searches, opens and hides Feed posts that breach community standards. |
| 52 | Admin Dashboard | Reported Post Management | Lists reported posts, reads report detail and resolves each report (hide or dismiss). |
| 53 | Admin Dashboard | Event Management | Browses all events, opens detail and hides / removes non-compliant events. |
| 54 | Admin Dashboard | Job Management | Browses all job listings, opens detail and hides non-compliant listings. |
| 55 | Admin Dashboard | Q&A Moderation | Filters and handles reported / violating questions and answers. |
| 56 | Admin Dashboard | Forum Topic Management | Lists, creates and edits forum topics used to classify questions. |
| 57 | Admin Dashboard | Payment & Revenue Management | Views transaction history, revenue charts and per-account package history. |
| 58 | Admin Dashboard | Payment Complaint Resolution | Reviews and responds to payment-transaction complaints. |
| 59 | Admin Dashboard | Broadcast Notification | Sends notifications to all or a group of users and reviews sent-notification history. |
| 60 | Admin Dashboard | Module Analytics | Activity analytics reports for the post, event and recruitment modules. |

#### 3.1.3 Screen Authorization

The matrix below maps every major screen to the actors permitted to access it. A tick (✓) means the role may open the screen. Guests have read-only access to public content and cannot perform any create/update/delete or personalised action; Students have full member access except job posting, posting-package purchase, salary contribution, and event creation (which are reserved for verified Alumni); Admin operations are carried out through the dedicated admin screens rather than the member-facing screens. Access is enforced server-side by RBAC (Spring Security @PreAuthorize) in addition to client-side route guards.

<!-- Source table 9 from SRS DOCX -->
| Screen | Guest | Student | Alumni | Admin |
| --- | --- | --- | --- | --- |
| Sign In / Sign Up | X |  |  | X |
| Confirm Email | X |  |  |  |
| Forgot Password | X |  |  |  |
| Change Password |  | X | X | X |
| Account Menu |  | X | X | X |
| View Profile |  | X | X | X |
| Edit Profile |  | X | X |  |
| Settings |  | X | X | X |
| Home Feed | X | X | X |  |
| Main Navigation | X | X | X |  |
| Post Composer |  | X | X |  |
| Post Detail | X | X | X |  |
| Notifications |  | X | X |  |
| Alumni Search & Directory | X | X | X |  |
| Public Profile | X | X | X |  |
| Following |  | X | X |  |
| Followers |  | X | X |  |
| Alumni Profile | X | X | X |  |
| Job Board | X | X | X |  |
| Job Detail | X | X | X |  |
| Event Board | X | X | X |  |
| Event Detail | X | X | X |  |
| Question List (Q&A Forum) | X | X | X |  |
| Question Detail | X | X | X |  |
| Answer Question |  | X | X |  |
| Q&A History |  | X | X |  |
| Alumni Career Paths | X | X | X |  |
| Career Path Detail | X | X | X |  |
| Alumni Map | X | X | X |  |
| Message |  | X | X |  |
| Salary Statistics |  | X | X |  |
| My Salary |  |  | X |  |
| Subscription |  |  | X |  |
| Get Package |  |  | X |  |
| QR Code / Banking App |  |  | X |  |
| Transaction History |  |  | X |  |
| Admin – Overview Dashboard |  |  |  | X |
| Admin – User Management |  |  |  | X |
| Admin – Feed Post Management |  |  |  | X |
| Admin – Reported Post Management |  |  |  | X |
| Admin – Event Management |  |  |  | X |
| Admin – Job Management |  |  |  | X |
| Admin – Q&A Moderation |  |  |  | X |
| Admin – Forum Topic Management |  |  |  | X |
| Admin – Payment & Revenue Management |  |  |  | X |
| Admin – Payment Complaint Resolution |  |  |  | X |
| Admin – Broadcast Notification |  |  |  | X |
| Admin – Module Analytics |  |  |  | X |

#### 3.1.4 Non-Screen Functions

In addition to the user-facing screens, AlumNect relies on a set of server-side functions that run without a dedicated screen — scheduled jobs, asynchronous workers, and cross-cutting services in the Spring Boot back end. They are listed here for completeness and traceability.

<!-- Source table 10 from SRS DOCX -->
| # | Feature | System Function | Description |
| --- | --- | --- | --- |
| 1 | Authentication & Account | Email Verification Service | Generates a verification token and sends the confirmation email on registration; activates the account when the link is opened. |
| 2 | Authentication & Account | Password-Reset Mailer | Generates a time-limited reset token and emails the reset link on a Forgot-password request. |
| 3 | Authentication & Account | Google OAuth 2.0 Handler | Server-side OAuth callback that validates the Google token and signs in or provisions the account. |
| 4 | Authentication & Account | JWT Issuance & Refresh Service | Issues, validates and refreshes JWT access tokens and revokes them on logout, enforcing RBAC on every request. |
| 5 | Alumni Verification | Verification Review Workflow | Routes submitted FPTU proof to the admin queue and updates the verified-badge status on approval or rejection. |
| 6 | Subscription & Payment | Payment Gateway Webhook | Receives asynchronous payment-status callbacks, confirms the transaction and activates the purchased posting package. |
| 7 | Subscription & Payment | Package Expiry Cron | Scheduled job that deactivates expired posting packages and flags upcoming renewals. |
| 8 | Salary Board | Salary Aggregation Job | Recomputes anonymous salary statistics per industry / position / region and applies the minimum-contribution threshold before exposing charts. |
| 9 | Notifications | Notification Dispatch Service | Creates and pushes in-app notifications for follows, likes, comments, answers and event RSVPs. |
| 10 | Notifications | Broadcast Notification Job | Fans out an admin broadcast to all or a targeted group of users. |
| 11 | Events | Event Reminder Cron | Sends scheduled reminders to registrants before an event and notifies them when an event is cancelled. |
| 12 | Content Moderation | Report Escalation Service | Aggregates user reports, escalates content past a threshold to the moderation queue and hides it on resolution. |
| 13 | Search | Search Indexing Service | Maintains the search index for users, posts, jobs, events and questions to support keyword and filter search. |
| 14 | Analytics | KPI Aggregation Job | Periodically rolls up engagement, growth, revenue and alumni-distribution metrics for the admin dashboards and module analytics. |
| 15 | Connections | Connection Suggestion Service | Computes same-major / same-cohort alumni suggestions shown on the directory and feed. |

#### 3.1.5 Entity Relationship Diagram

This sub-section summarises the conceptual data model for traceability between the functional requirements and the data they manipulate. The full physical Entity Relationship Diagram and column-level schema (data types, keys, indexes, constraints) are produced in the Software Design Document (Report 4 — SDS), in line with the project's document plan; the table below lists the principal entities referenced throughout Section 3.

[Figure 17: Entity Relationship Diagram — AlumNect (conceptual). The detailed physical ERD is delivered in the SDS (Report 4)] Figure 17 Entity Relationship Diagram (conceptual)

<!-- Source table 11 from SRS DOCX -->
| # | Entity | Description |
| --- | --- | --- |
| 1 | User | PK user_id. A platform account: email, BCrypt password hash, Google OAuth link, role context (Student/Alumni) or Admin, status (PENDING_VERIFICATION/ACTIVE/LOCKED), verified-alumni flag. Relationships: 1–1 Profile; 1–N Post, Comment, Reaction, SavedPost, Vote, Transaction, Subscription, Notification, VerificationRequest, SalaryContribution; self-referencing N–N via Follow; N–N peers via Conversation. |
| 2 | Profile | PK profile_id; FK user_id –> User (unique). One-to-one extension of User (avatar, biography, cohort, major/campus, contact details). N–N SkillTag through ProfileSkill. |
| 3 | CareerTimelineEntry | PK entry_id; FK user_id –> User. A work or education milestone (organisation, title, period) on a user’s career timeline; edited within the profile editor. User 1–N CareerTimelineEntry. |
| 4 | SkillTag | PK skill_id. A skill / area-of-expertise tag. N–N Profile through ProfileSkill. |
| 5 | ProfileSkill | PK (profile_id, skill_id); FK profile_id –> Profile, FK skill_id –> SkillTag. Junction implementing the Profile N–N SkillTag relationship. |
| 6 | VerificationRequest | PK request_id; FK requester_id –> User, FK reviewed_by –> User (Admin). An alumni-verification submission collected during Alumni-role registration: graduation year, student ID, major/campus, full name on record, evidence-image reference(s), status (PENDING/APPROVED/REJECTED), submitted_at, reviewed_at, rejection_reason. User 1–N VerificationRequest (at most one PENDING); Admin 1–N reviewed requests. |
| 7 | Post | PK post_id; FK author_id –> User. A community-feed post: type in {achievement, normal, recruitment, event}, text, media references, status. 1–1 JobListing (optional, when type = recruitment); 1–1 Event (optional, when type = event); 1–N Comment, Reaction, SavedPost. |
| 8 | Comment | PK comment_id; FK post_id –> Post, FK author_id –> User. A comment under a Post. Post 1–N Comment. |
| 9 | Reaction | PK reaction_id; FK post_id –> Post, FK user_id –> User (unique per user/post). A like on a Post. Post 1–N Reaction. |
| 10 | SavedPost | PK (user_id, post_id); FK user_id –> User, FK post_id –> Post. A bookmarked post. User N–N Post. |
| 11 | JobListing | PK job_id; FK post_id –> Post (unique). The recruitment detail (1–1) of a Post whose type = recruitment: title, description, field, location, job type, status; made publicly visible by an active Subscription. Post 1–1 JobListing. |
| 12 | Event | PK event_id; FK post_id –> Post (unique). The event detail (1–1) of a Post whose type = event: title, description, start/end time, location, status (upcoming/cancelled/past). Post 1–1 Event; Event 1–N EventAttendee. |
| 13 | EventAttendee | PK (event_id, user_id); FK event_id –> Event, FK user_id –> User. The RSVP association (attending/cancelled). Event 1–N EventAttendee. |
| 14 | PostingPackage | PK package_id. A purchasable posting package: name, price, duration, active-listing quota, features. PostingPackage 1–N Subscription and 1–N Transaction. |
| 15 | Subscription | PK subscription_id; FK user_id –> User, FK package_id –> PostingPackage. A purchased package with start_at, expiry_at, remaining quota and status (ACTIVE/EXPIRED); drives the package-expiry flow. User 1–N Subscription; PostingPackage 1–N Subscription. |
| 16 | Transaction | PK transaction_id; FK buyer_id –> User, FK package_id –> PostingPackage. A payment record: amount, PayOS order / payment-link reference, status (PENDING/PAID/FAILED), optional linked complaint. User 1–N Transaction. |
| 17 | ForumTopic | PK topic_id. A Q&A category/topic managed by Admin. ForumTopic 1–N Question. |
| 18 | Question | PK question_id; FK author_id –> User, FK topic_id –> ForumTopic. A forum question with vote tally and status. ForumTopic 1–N Question; Question 1–N Answer. |
| 19 | Answer | PK answer_id; FK question_id –> Question, FK author_id –> User. An answer to a Question with vote tally and status. Question 1–N Answer. |
| 20 | Vote | PK vote_id; FK voter_id –> User; polymorphic target (target_type in {question, answer}, target_id); value (up/down). One vote per user per target. User 1–N Vote. |
| 21 | SalaryContribution | PK contribution_id; FK owner_id –> User (PRIVATE). An anonymous salary record (industry, position, region, amount, years of experience). owner_id is private – used only for ownership checks on edit/delete and never exposed in public display or aggregate statistics. User 1–N SalaryContribution. |
| 22 | Conversation | PK conversation_id; FK user_a_id –> User, FK user_b_id –> User. A direct-message thread between two members (User N–N User). Conversation 1–N Message. |
| 23 | Message | PK message_id; FK conversation_id –> Conversation, FK sender_id –> User. An individual text message (body, sent_at, read flag). Conversation 1–N Message. |
| 24 | Follow | PK (follower_id, followee_id); FK follower_id –> User, FK followee_id –> User. A one-directional follow relationship (self-referencing User N–N); self-follow and duplicate follows are not allowed. |
| 25 | Report | PK report_id; FK reporter_id –> User; polymorphic target (target_type in {post, joblisting, question, answer}, target_id); reason; status (pending/resolved/dismissed). User 1–N Report. |
| 26 | Notification | PK notification_id; FK recipient_id –> User. An in-app notification for a recipient: type, payload, read flag, timestamp. User 1–N Notification. |

Table 11 Principal Entities

### 3.2 Authentication & Account

This section specifies the functions that allow users to create and access their AlumNect account, recover and change their password, sign out securely, and submit FPTU-related proof to obtain verified alumni status.

#### 3.2.1 Register a New Account

_(Covers UC01)_

**Function trigger**

- Navigation path: /register
- Timing / Frequency: On demand / whenever a Guest wants to create a new account.
**Function description**

- Actors/Roles: Guest.
- Purpose: Allows an unauthenticated visitor to create a new AlumNect account and triggers an email-verification step before the account is activated. When the Alumni role is selected, the form additionally collects FPTU proof (graduation year, student ID, evidence image) stored as a VerificationRequest for later Admin review (UC64); Students register without any proof (BR-25).
**Interface:** The Registration screen presents a form with the following labelled fields and controls: Full name (text input), Email (text input), Password (masked input with show/hide toggle), Confirm password (masked input), Role context (selector: Student or Alumni), an agree to Terms checkbox, a Register button, and a Sign in link for users who already have an account.

**Data processing**

- The client validates all fields locally; on submit it calls POST /api/auth/register with the full name, email, password, confirm password and selected role context.
- The Service layer normalises the email, checks the users table for an existing account with the same email, and rejects duplicates.
- On success the Service creates a users row with status PENDING_VERIFICATION, the chosen role context, the password stored as a BCrypt hash, and a unique verification token persisted (e.g. in email_verifications); the Email service then sends a verification link to the supplied address.
- No JWT is issued at this stage; the account remains inactive until the email is verified through the link, which the back end validates and flips the account status to ACTIVE.
**Screen layout:** [Figure — Register a New Account screen layout (Web)]

**Function details**

- Data: full name, email, password (hash), confirm password, role context (Student/Alumni), account status, verification token.
- Validation: all fields required; email must be a valid email format and unique; password must be ≥ 8 characters with mixed character types; confirm password must equal password; a role context must be selected; the Terms checkbox must be ticked.
- Business rules: BR-01 (valid unique email, must be verified before activation), BR-19 (password strength and BCrypt storage), BR-23 (one role context per account: Student or Alumni).
- Error Handling: empty required field → inline MSG01; invalid email format → inline MSG02; password mismatch → inline MSG25; email already registered → inline error stating the email is already in use; back-end/API failure → toast MSG05.
- Normal case: the Guest completes a valid form, submits, the account is created in PENDING_VERIFICATION, and toast MSG06 confirms that a verification email has been sent.
- Abnormal case: validation fails and the corresponding inline message is shown without submission; the email already exists and registration is blocked; the email service is unavailable, in which case MSG05 is shown and no active account is created.
#### 3.2.2 Sign In (Email & Password)

_(Covers UC02)_

**Function trigger**

- Navigation path: /login
- Timing / Frequency: On demand / whenever a registered user needs to authenticate.
**Function description**

- Actors/Roles: Student, Alumni, Admin.
- Purpose: Authenticates a registered user with their email and password and establishes an authenticated session via JWT.
**Interface:** The Sign In screen presents a form with Email (text input), Password (masked input with show/hide toggle), a Remember me checkbox, a Sign in button, a Forgot password? link, a Sign in with Google button, and a Register link.

**Data processing**

- The client validates that both fields are present and calls POST /api/auth/login with the email and password.
- The Service loads the matching users row, verifies the submitted password against the stored BCrypt hash, and checks that the account is ACTIVE and not locked.
- On success the back end issues a short-lived JWT access token plus a refresh token and returns the user's role context for RBAC; the client stores the tokens and attaches Authorization: Bearer <JWT> to subsequent requests.
- If the credentials match but the email is not yet verified, the back end rejects the login and signals the unverified state.
**Screen layout:** [Figure — Sign In screen layout (Web)]

**Function details**

- Data: email, password, JWT access token, refresh token, role context, account status.
- Validation: email and password are required; email must be a valid format.
- Business rules: BR-01 (email must be verified before login), BR-19 (passwords compared against BCrypt hash, never logged), BR-20 (access token expiry; refresh token issued for session continuity), BR-23 (role context returned for RBAC).
- Error Handling: empty required field → inline MSG01; invalid email format → inline MSG02; wrong email or password → inline MSG03; account exists but email not verified → modal MSG07; account locked by Admin → modal MSG28 indicating the account cannot sign in; system/API failure → toast MSG05.
- Normal case: valid credentials for an active, verified account return a JWT and route the user to their home feed.
- Abnormal case: incorrect credentials show MSG03; an unverified account shows MSG07 with the option to resend verification; a locked account is denied; the authentication service is unavailable and MSG05 is shown.
#### 3.2.3 Sign In with Google (OAuth 2.0)

_(Covers UC03)_

**Function trigger**

- Navigation path: /login (the Sign in with Google control)
- Timing / Frequency: On demand / whenever a user chooses federated sign-in.
**Function description**

- Actors/Roles: Student, Alumni.
- Purpose: Authenticates a user through Google OAuth 2.0, creating an AlumNect account on first sign-in or linking to an existing one, without requiring a local password.
**Interface:** The Sign in with Google button on the Sign In screen opens the Google OAuth consent flow in a hosted Google window; on return, first-time users are shown a brief Complete your account panel with a Role context selector (Student or Alumni) and a Continue button.

**Data processing**

- The client initiates the OAuth flow and, after consent, the back end receives the Google authorization result and calls POST /api/auth/google with the Google identity token.
- The Service validates the token with Google, extracts the verified email and profile name, and looks up the users table: if a matching account exists it signs the user in; otherwise it provisions a new users row (email already considered verified by Google) and stores the OAuth provider link.
- For a brand-new account the user must choose a role context before completion, after which the back end issues a JWT access token and refresh token exactly as in email/password sign-in.
- RBAC role context is returned with the session for @PreAuthorize checks on later requests.
**Screen layout:** [Figure — Sign In with Google screen layout (Web)]

**Function details**

- Data: Google identity token, verified email, display name, OAuth provider link, role context, JWT access token, refresh token.
- Validation: the Google token must be valid and verified; a role context must be selected on first sign-in.
- Business rules: BR-01 (Google-verified email satisfies the verification requirement), BR-20 (JWT/refresh token issuance and expiry), BR-23 (one role context per account; Admin is not provisioned through this flow).
- Error Handling: Google flow cancelled or token invalid → toast MSG05 (or an inline notice that Google sign-in could not be completed); locked account → modal MSG28; system/API failure → toast MSG05.
- Normal case: the user authorises with Google, a session is established (after choosing a role context on first sign-in), and the user lands on their home feed.
- Abnormal case: the user cancels the consent screen and returns to /login unauthenticated; the Google token fails validation; the linked account is locked and access is denied.
#### 3.2.4 Manage Password (Forgot / Reset & Change)

_(Covers UC04, UC05)_

This function groups password recovery for users who cannot sign in (Forgot/Reset) and in-session password change for authenticated users.

##### 3.2.4.1 Forgot & Reset Password

**Function trigger**

- Navigation path: /forgot-password then /reset-password
- Timing / Frequency: On demand / whenever a user has forgotten their password.
**Function description**

- Actors/Roles: Student, Alumni, Admin.
- Purpose: Lets a user who cannot sign in request a password-reset email and set a new password via a secure tokenised link.
**Interface:** The Forgot Password screen has an Email (text input) and a Send reset link button. The Reset Password screen (opened from the emailed link) has New password (masked input), Confirm new password (masked input) and a Reset password button.

**Data processing**

- On the Forgot screen the client calls POST /api/auth/forgot-password with the email; the Service looks up the users table and, if an account exists, generates a single-use, time-limited reset token (persisted, e.g. in password_resets) and the Email service sends a reset link. The same confirmation is shown regardless of whether the email exists, to avoid account enumeration.
- The emailed link opens /reset-password carrying the token; on submit the client calls POST /api/auth/reset-password with the token and the new password.
- The Service validates the token (existence, not expired, not already used), updates the users password as a new BCrypt hash, marks the token consumed, and invalidates existing refresh tokens so old sessions are revoked.
**Screen layout:** [Figure — Forgot & Reset Password screen layout (Web)]

**Function details**

- Data: email, reset token, token expiry/used flag, new password (hash), confirm new password.
- Validation: email required and valid format on the Forgot screen; on the Reset screen new password ≥ 8 characters with mixed character types and confirm must match; reset token must be valid and unexpired.
- Business rules: BR-19 (password strength and BCrypt storage), BR-20 (refresh tokens revoked on password change).
- Error Handling: empty email → inline MSG01; invalid email format → inline MSG02; new-password rules not met → inline MSG02; passwords do not match → inline MSG25; expired/invalid/used token → inline error indicating the link is invalid or expired with a prompt to request a new one; system/API failure → toast MSG05.
- Normal case: the user requests a link, receives toast MSG08, opens the link, sets a valid new password, and is confirmed and routed to sign in.
- Abnormal case: the reset link has expired or was already used and the reset is refused; the email service is unavailable and MSG05 is shown.
##### 3.2.4.2 Change Password

**Function trigger**

- Navigation path: /settings/security
- Timing / Frequency: On demand / whenever a signed-in user wants to change their password.
**Function description**

- Actors/Roles: Student, Alumni, Admin.
- Purpose: Lets an authenticated user change their password by confirming the current one.
**Interface:** The Change Password panel has Current password (masked input), New password (masked input), Confirm new password (masked input) and a Update password button.

**Data processing**

- The authenticated client sends the request with Authorization: Bearer <JWT> to the user-scoped endpoint POST /api/users/change-password (RBAC restricts it to the token owner).
- The Service verifies the current password against the stored BCrypt hash, then saves the new password as a fresh BCrypt hash in the users table.
- On success the back end optionally revokes existing refresh tokens so other sessions must re-authenticate.
**Screen layout:** [Figure — Change Password screen layout (Web)]

**Function details**

- Data: current password, new password (hash), confirm new password, authenticated user id (from JWT).
- Validation: all three fields required; new password ≥ 8 characters with mixed character types; confirm must match new password; the new password should differ from the current one.
- Business rules: BR-19 (password strength, BCrypt storage, never logged), BR-20 (sessions/refresh tokens may be revoked on change).
- Error Handling: empty field → inline MSG01; new-password rules not met → inline MSG02; confirm does not match → inline MSG25; current password incorrect → inline MSG03; unauthenticated/expired token → redirect to /login; system/API failure → toast MSG05.
- Normal case: the user supplies the correct current password and a valid new password; the password is updated and toast MSG04 confirms the change.
- Abnormal case: the current password is wrong and the change is refused (MSG03); validation fails on the new password; the session has expired and the user is redirected to sign in.
#### 3.2.5 Logout

_(Covers UC06)_

**Function trigger**

- Navigation path: /logout (the Sign out control in the account menu)
- Timing / Frequency: On demand / whenever a signed-in user ends their session.
**Function description**

- Actors/Roles: Student, Alumni, Admin.
- Purpose: Ends the user's authenticated session and revokes the refresh token so the session cannot be silently renewed.
**Interface:** The account menu exposes a Sign out item; selecting it may show a brief confirmation and then returns the user to the public landing/sign-in page.

**Data processing**

- The client calls POST /api/auth/logout with Authorization: Bearer <JWT>; the Service revokes the associated refresh token (e.g. deletes/blacklists it in refresh_tokens).
- The client clears the locally stored access and refresh tokens and removes the Authorization header from subsequent requests.
- After logout, protected routes are no longer accessible and any attempt to use the old refresh token is rejected.
**Screen layout:** [Figure — Logout flow screen layout (Web)]

**Function details**

- Data: JWT access token, refresh token, authenticated user id.
- Validation: a valid session/token must be present for the revoke step (an already-expired session simply clears client state).
- Business rules: BR-20 (logout revokes the refresh token; access token expires on its own).
- Error Handling: logout API failure → client still clears local tokens and shows toast MSG05; expired session → client clears state and routes to /login without error.
- Normal case: the user signs out, the refresh token is revoked server-side, local tokens are cleared, and the user is returned to the public page.
- Abnormal case: the logout endpoint is unreachable; the client nonetheless clears local tokens to terminate the session locally and shows MSG05.
#### 3.2.6 Submit Alumni Verification

_(Covers UC01 - verification evidence; reviewed by Admin via UC64)_

**Function trigger**

- Navigation path: part of the Register / Sign Up flow when the Alumni role is selected (no separate screen)
- Timing / Frequency: On demand / whenever a registered user wants to obtain verified alumni status.
**Function description**

- Actors/Roles: a user registering (or registered) with the Alumni role context. Students do not submit proof or undergo verification (BR-25).
- Purpose: Lets a user registering with the Alumni role submit FPTU-related proof (graduation year and a student-ID/evidence image) for Admin review so the verified alumni badge and Alumni privileges can be granted on approval.
**Interface:** As part of the Alumni-role registration step, the form presents Graduation year (year selector/number input), Major/Campus (optional selector), Student ID (text input), Evidence image (file upload control accepting JPG/PNG/JPEG), an inline display of the current verification status, and a Submit for review button.

**Data processing**

- The signed-in client uploads the evidence image and submits the form with Authorization: Bearer <JWT> to POST /api/users/verification (RBAC scopes it to the requesting user).
- The Service stores the uploaded image in object storage, persists a verification request (graduation year, student ID, image reference, requester id) with status PENDING in the verification_requests table, and prevents duplicate active submissions.
- The request is queued for Admin review (paired with Admin UC64); only an Admin approval flips the user's account to verified Alumni and grants the badge — this function does not itself grant verification.
**Screen layout:** [Figure — Alumni-role registration: proof submission step (Web)]

**Function details**

- Data: graduation year, major/campus, student ID, evidence image, requester user id, verification request status.
- Validation: graduation year and student ID required; evidence image required and must be JPG/PNG/JPEG and ≤ 10MB; a year must be a plausible value; no other request may already be pending for the same user.
- Business rules: BR-02 (verified badge/alumni status granted only after Admin approves the submitted FPTU proof), BR-16 (uploaded images must be JPG/PNG/JPEG ≤ 10MB).
- Error Handling: empty required field → inline MSG01; invalid image type or size → modal MSG12; a request is already pending → notice that a submission is already under review; unauthenticated/expired session → redirect to /login; system/API failure → toast MSG05.
- Normal case: the user submits valid proof; the request is stored as PENDING and modal MSG09 confirms it has been submitted for Admin approval (the user later receives MSG10 when an Admin approves).
- Abnormal case: the image violates format/size limits (MSG12) and the upload is rejected; a duplicate request is blocked; the storage or API service is unavailable and MSG05 is shown.
### 3.3 Profile

This section specifies the profile-management functions of AlumNect, covering personal profile editing, the career timeline, skills and expertise tags, viewing other members' profiles, alumni search, and rule-based connection suggestions (UC07–UC39).

#### 3.3.1 Edit Profile

_(Covers UC07)_

**Function trigger**

- Navigation path: /profile/me/edit
- Timing / Frequency: On demand, whenever an authenticated user wants to update their own personal information.
**Function description**

- Actors/Roles: Student, Alumni (own profile only).
- Purpose: Allows an authenticated user to update their personal information (display name, headline, bio, cohort, major, location, contact links) and replace their avatar/cover image, keeping their public profile current.
**Interface:** The Edit Profile screen displays a form pre-filled with the current profile. Fields/controls: "Avatar" (image upload control with preview), "Cover Image" (image upload control with preview), "Full Name" (text), "Headline" (text), "Bio / About" (multi-line text), "Graduation Year / Cohort" (numeric/select), "Major" (select), "Current Location" (text), "Website / Social Links" (text inputs), "Visibility" (toggle public/members-only), and "Save Changes" and "Cancel" buttons.

**Data processing**

- The client loads the current profile via GET /api/users/me and renders the pre-filled form.
- On image selection, the client validates the file type and size, then uploads to object storage; the returned URL is bound to the avatar/cover field.
- On "Save Changes", the client sends PUT /api/users/me with the JWT in the Authorization: Bearer <JWT> header.
- The Controller passes the request to the Service, which validates input and updates the users row (and related user_profiles entity) via Spring Data JPA/Hibernate; updated_at is refreshed.
- RBAC: Spring Security @PreAuthorize confirms the caller is an authenticated Student/Alumni; the Service enforces that the user can only modify their own record (the user id is taken from the JWT, never from the request body).
**Screen layout:** [Figure — Edit Profile screen layout (Web)]

**Function details**

- Data: user id, full name, headline, bio, avatar URL, cover image URL, graduation year/cohort, major, location, website/social links, visibility flag, updated_at.
- Validation: Full Name required and 2–100 characters; Bio ≤ 1000 characters; graduation year a valid 4-digit year not in the future; URLs must be valid URL format; uploaded images must be JPG/PNG/JPEG ≤ 10MB.
- Business rules: BR-11 (only the author/owner may edit their own profile); BR-16 (image type/size); BR-23 (the role context Student/Alumni is fixed and cannot be self-changed here).
- Error Handling: Empty required field → MSG01; invalid format (year/URL) → MSG02; invalid or oversized image → MSG12; backend/API failure → MSG05; unauthenticated/expired session → redirect to login per MSG07 if email-unverified state is detected.
- Normal case: The user edits one or more fields, optionally uploads a new avatar/cover, clicks "Save Changes"; the system persists the data and shows MSG04 ("Profile updated successfully.").
- Abnormal case: Validation fails (inline messages shown and save blocked); image upload rejected (MSG12); network/server error (MSG05) with the form state preserved.
#### 3.3.2 Manage Career Timeline

_(Covers UC07 - career timeline)_

**Function trigger**

- Navigation path: Part of the profile editor (My Profile › Timeline tab)
- Timing / Frequency: On demand, whenever a user adds or revises a work/education milestone.
**Function description**

- Actors/Roles: Student, Alumni (own timeline only).
- Purpose: Allows a user to build a chronological career/education timeline by adding new entries and editing existing ones (role/title, organisation, period, description), which feeds the public profile and the Career Path chart.
**Interface:** Within the profile editor, the Timeline section lists existing entries in reverse-chronological order, each with "Edit" and "Delete" actions, plus an "Add Entry" button. The add/edit form (modal or inline) contains: "Entry Type" (select: Work / Education), "Title / Role" (text), "Organisation / School" (text), "Start Date" (month-year picker), "End Date" (month-year picker), "Currently here" (checkbox that disables End Date), "Description" (multi-line text), and "Save" and "Cancel" buttons.

**Data processing**

- Sub-function 3.3.2.1 Add entry: on save, the client sends POST /api/users/me/timeline; the Service inserts a new row into the career_timeline table linked to the user id from the JWT.
- Sub-function 3.3.2.2 Edit entry: the client loads the entry via GET /api/users/me/timeline/{id} and on save sends PUT /api/users/me/timeline/{id}; the Service updates the matching career_timeline row.
- RBAC: @PreAuthorize confirms an authenticated Student/Alumni; the Service verifies the timeline entry's owner id equals the JWT user id before any update.
- Hibernate persists start_date, end_date (nullable when "Currently here"), and refreshes updated_at; the profile and Career Path views read these rows.
**Screen layout:** [Figure — Profile editor: Career Timeline section (Web)]

**Function details**

- Data: entry id, user id, entry type, title/role, organisation/school, start date, end date (nullable), is_current flag, description, created_at, updated_at.
- Validation: Title and Organisation required; Start Date required and not in the future; End Date (when present) must be ≥ Start Date; "Currently here" clears/forbids End Date; Description ≤ 1000 characters.
- Business rules: BR-11 (only the owner may add/edit their own timeline entries); BR-23 (entries are attached to the single role-context account).
- Error Handling: Empty required field → MSG01; End Date earlier than Start Date or otherwise invalid → MSG02; backend/API failure → MSG05; attempting to edit an entry that is not the user's own → MSG28.
- Normal case: The user adds a new milestone or edits an existing one with valid dates and clicks "Save"; the entry is persisted and the list refreshes, showing MSG04 ("Timeline entry updated successfully.").
- Abnormal case: Validation fails (inline messages, save blocked); ownership check fails (MSG28); server error (MSG05) leaving the existing list unchanged.
#### 3.3.3 Manage Skills & Tags

_(Covers UC07 - skills & tags)_

**Function trigger**

- Navigation path: Part of the profile editor (My Profile › Skills tab)
- Timing / Frequency: On demand, whenever a user adds or removes skills/expertise tags.
**Function description**

- Actors/Roles: Student, Alumni (own profile only).
- Purpose: Allows a user to attach skills and expertise tags to their profile, improving discoverability in search and the relevance of rule-based connection suggestions.
**Interface:** Within the profile editor, the Skills & Tags section shows the current set of tags as removable chips and a "Add Skill" input with an auto-complete dropdown of existing tags. Controls: "Skill Input" (text with suggestions), "Add" button, per-chip "Remove" (x) control, and "Save Changes" button.

**Data processing**

- As the user types, the client calls GET /api/skills?query=<text> to suggest existing tags.
- On "Save Changes", the client sends PUT /api/users/me/skills with the full list of selected skill ids/labels.
- The Service normalises and de-duplicates the labels, creates any new tag in the skills table if it does not exist, and synchronises the join table user_skills for the JWT user id via Hibernate.
- RBAC: @PreAuthorize confirms an authenticated Student/Alumni; only the owner's user_skills rows are modified.
**Screen layout:** [Figure — Profile editor: Skills & Tags section (Web)]

**Function details**

- Data: user id, skill id, skill label, the set of user-skill associations.
- Validation: Each skill label 1–50 characters, trimmed; duplicates within the user's set are rejected; a reasonable maximum number of tags per user is enforced (e.g. ≤ 30).
- Business rules: BR-11 (only the owner edits their own skills); BR-13 (Students may use this feature like Alumni).
- Error Handling: Empty/invalid label → MSG02; duplicate tag ignored or flagged inline; backend/API failure → MSG05; unauthorised modification attempt → MSG28.
- Normal case: The user adds one or more tags, removes any unwanted chips, clicks "Save Changes"; the associations are updated and MSG04 ("Skills updated successfully.") is shown.
- Abnormal case: Invalid label blocked inline (MSG02); server error (MSG05) with the previous tag set preserved.
#### 3.3.4 View Profile

_(Covers UC08)_

**Function trigger**

- Navigation path: /profile/{userId}
- Timing / Frequency: On demand, whenever any visitor opens another member's profile.
**Function description**

- Actors/Roles: Guest, Student, Alumni.
- Purpose: Displays another user's public profile, including personal details, verified badge (if Alumni), career timeline, skills, and a contextual action area (e.g. message/connect for authenticated members), so visitors can learn about the member.
**Interface:** The Profile screen shows the cover image, avatar, full name with verified badge for approved Alumni, headline, cohort/major, location, bio, the career-timeline list, and the skills chip list, with follower / following counts that open the Followers / Following lists (3.3.9). For authenticated viewers a "Message" button and "Report" action are shown; for Guests these personalised actions are hidden or prompt sign-in.

**Data processing**

- The client requests GET /api/users/{userId}; the Service loads the users/user_profiles, career_timeline, and user_skills/skills records for that id.
- RBAC: the endpoint is publicly readable for visible profiles; the Service applies the profile's visibility flag — a members-only profile returns limited data to Guests.
- The verified badge is rendered from the is_verified_alumni flag set when an Admin approves verification.
- Personalised controls (Message/Report) are gated client-side and server-side to authenticated members.
**Screen layout:** [Figure — View Profile screen layout (Web)]

**Function details**

- Data: target user id, full name, verified-alumni flag, headline, cohort, major, location, bio, avatar/cover URLs, career-timeline entries, skills.
- Validation: userId must be a valid, existing user id; visibility flag determines which fields are returned.
- Business rules: BR-02 (verified badge shown only for Admin-approved Alumni); BR-12 (Guests may view public profiles but cannot message, connect, or use personalised actions); BR-13 (Students/Alumni may use personalised actions).
- Error Handling: Unknown/invalid userId → "Profile not found" empty state; Guest attempting a personalised action (message/connect) → prompted to sign in (MSG12-style gating is not used here; the gate is a login prompt); backend/API failure → MSG05.
- Normal case: The visitor opens a valid profile and sees the public details; an authenticated member additionally sees Message/Report controls.
- Abnormal case: Profile does not exist or is restricted (limited/empty view); server error (MSG05).
#### 3.3.5 Search Alumni

_(Covers UC09)_

**Function trigger**

- Navigation path: /alumni/search
- Timing / Frequency: On demand, whenever a visitor searches the alumni/member directory.
**Function description**

- Actors/Roles: Guest, Student, Alumni.
- Purpose: Lets visitors search and filter the member directory by keyword, graduation year/cohort, major, location, and skills to find specific alumni or students.
**Interface:** The Search Alumni screen contains a "Keyword" search box (name/headline), filter controls "Graduation Year / Cohort" (select), "Major" (select), "Location" (text/select), "Skills" (multi-select tags), a "Search" button, a "Clear filters" link, and a paginated results list where each result card shows avatar, name with verified badge, cohort/major, and a link to the full profile.

**Data processing**

- On search/filter change, the client calls GET /api/users?query=<kw>&cohort=<year>&major=<m>&location=<l>&skills=<ids>&page=<n> with optional JWT if authenticated.
- The Service builds a parameterised query against users/user_profiles joined with user_skills, applies the filters and pagination, and returns the result page ordered by relevance/name.
- RBAC: the directory is publicly searchable; only public/visible profiles are returned to Guests, while members-only profiles are excluded for unauthenticated callers.
**Screen layout:** [Figure — Search Alumni screen layout (Web)]

**Function details**

- Data: search keyword, cohort, major, location, selected skill ids, page number; result fields: user id, name, verified flag, cohort, major, avatar URL.
- Validation: Keyword trimmed and ≤ 100 characters; cohort a valid year; page a positive integer; empty filters allowed (returns the full directory paginated).
- Business rules: BR-12 (Guests may browse/search public profiles only); BR-02 (verified badge displayed per approval status); BR-13 (Students/Alumni have full search access).
- Error Handling: Invalid filter value → MSG02; no matches → "No alumni found for your criteria" empty state; backend/API failure → MSG05.
- Normal case: The visitor enters criteria, clicks "Search", and a paginated list of matching members is displayed; clicking a card opens that profile (3.3.4).
- Abnormal case: No results (empty state shown); invalid filter (MSG02); server error (MSG05).
#### 3.3.6 Connection Suggestions

_(Covers UC10)_

**Function trigger**

- Navigation path: /connections/suggestions
- Timing / Frequency: On demand and on profile/dashboard load, refreshed periodically.
**Function description**

- Actors/Roles: Student, Alumni (authenticated only).
- Purpose: Presents a rule-based list of suggested members to connect with, computed from shared attributes (same cohort/graduation year, same major, overlapping skills), to help members expand their network. Suggestions are rule-based only (no AI/ML).
**Interface:** The Connection Suggestions screen/widget shows suggestion cards, each with avatar, name with verified badge, cohort/major, the matching reason (e.g. "Same cohort", "Same major"), and "View Profile" plus "Connect/Message" actions, with a "Refresh"/"Show more" control.

**Data processing**

- The client calls GET /api/users/suggestions with the JWT.
- The Service reads the caller's cohort, major, and skills from user_profiles/user_skills, then selects candidate users matching the same cohort and/or major and/or overlapping skills, excludes the caller and already-connected/blocked users, ranks by number of shared attributes, and returns a paginated list.
- RBAC: @PreAuthorize requires an authenticated Student/Alumni; the computation always uses the JWT user id as the seed.
**Screen layout:** [Figure — Connection Suggestions screen layout (Web)]

**Function details**

- Data: caller user id, caller cohort/major/skills; per suggestion: user id, name, verified flag, cohort, major, match reason, shared-attribute count.
- Validation: Suggestions are generated only when the caller has at least a cohort or major set; page/limit parameters must be positive integers.
- Business rules: BR-12 (feature unavailable to Guests, a personalised feature); BR-13 (available to Students and Alumni); rule-based matching uses same cohort/major/skills (consistent with the project's "no AI/ML" constraint).
- Error Handling: Caller profile lacks cohort/major → empty state prompting the user to complete their profile; backend/API failure → MSG05; unauthenticated access → blocked/redirected to login.
- Normal case: An authenticated member opens the suggestions and sees a ranked list of relevant members with match reasons; selecting a card opens the profile (3.3.4) or starts a message.
- Abnormal case: No suggestions available (empty state with a prompt to complete profile/skills); server error (MSG05).
#### 3.3.7 Follow / Unfollow a User

_(Covers UC08)_

**Function trigger**

- Navigation path: A "Follow" / "Following" toggle on another member's profile (3.3.4) and on user cards.
- Timing / Frequency: On demand, whenever a member wants to follow or stop following another member.
**Function description**

- Actors/Roles: Student, Alumni (authenticated only).
- Purpose: Lets a member follow another member to keep track of their public activity, or unfollow to stop. The follow relationship is one-directional and is reflected on the profile.
**Interface:** The target profile shows a primary Follow button that switches to a Following state once active; the profile also shows follower / following counts that link to the Followers / Following lists (3.3.9).

**Data processing**

- To follow, the client sends POST /api/users/{id}/follow with the JWT; to unfollow, DELETE /api/users/{id}/follow.
- The Service creates or removes a row in user_follows (follower id, followee id, created-at), preventing self-follow and duplicate follows, and updates the cached counts.
- RBAC: @PreAuthorize requires an authenticated Student/Alumni; the follower id is always taken from the JWT.
**Function details**

- Data: follower user id (from JWT), followee user id, follow state, follower/following counts.
- Validation: a user cannot follow themselves; a duplicate follow is idempotent; the followee must exist and not be locked.
- Business rules: BR-13 (available to Students and Alumni; not to Guests).
- Error Handling: followee not found -> MSG04; self-follow attempt -> blocked with a validation message; backend/API failure -> MSG05; unauthenticated access -> redirected to login.
- Normal case: a member opens another profile, taps Follow, the button switches to Following and the follower count increments; tapping again unfollows.
- Abnormal case: target account locked/not found (MSG04); server error (MSG05).
#### 3.3.8 View Notifications

_(Covers UC12)_

**Function trigger**

- Navigation path: The bell icon in the top navigation bar opens the Notifications screen (3.1.2 #6); also reachable at /notifications.
- Timing / Frequency: On demand; the unread badge updates whenever new notifications arrive.
**Function description**

- Actors/Roles: Student, Alumni (authenticated only).
- Purpose: Lets a member review in-app notifications (verification approved, report resolved, new follower, event updates, broadcasts), mark items as read, and clear the unread badge.
**Interface:** A reverse-chronological list of notification items, each showing an icon, text, a source link, and a timestamp; unread items are highlighted and counted by an unread badge on the bell. Controls include a per-item Mark as read action and a Mark all as read button.

**Data processing**

- On open, the client calls GET /api/notifications (paginated) with the JWT; the Service returns the member’s notifications together with the unread count.
- Marking one item read calls PUT /api/notifications/{id}/read; Mark all as read calls PUT /api/notifications/read-all; the Service updates the read flag on the matching Notification rows.
- RBAC: @PreAuthorize requires an authenticated Student/Alumni; the recipient id is always taken from the JWT, so a member sees only their own notifications.
**Screen layout:** [Figure — Notifications screen layout (Web)]

**Function details**

- Data: recipient id (from JWT), notification id, type, payload/source reference, read flag, created-at, unread count.
- Validation: a member may mark only their own notifications; the notification id must exist; marking an already-read item is idempotent.
- Business rules: BR-13 (available to Students and Alumni; not to Guests).
- Error Handling: notification not found -> MSG04; empty notification centre -> MSG29 (“You have no new notifications.”); backend/API failure -> MSG05; unauthenticated access -> redirected to login.
- Normal case: a member opens the bell, sees the list with unread items highlighted, taps an item to open its source and mark it read, or taps Mark all as read to clear the badge.
- Abnormal case: no notifications yet (MSG29); server error (MSG05).
#### 3.3.9 View Followers / Following

_(Covers UC13)_

**Function trigger**

- Navigation path: The follower / following counts on a profile (3.3.4) open this screen; reachable at /users/{id}/followers and /users/{id}/following.
- Timing / Frequency: On demand, whenever a member explores another member’s (or their own) network.
**Function description**

- Actors/Roles: Student, Alumni (authenticated); Guests may view the public lists of a public profile in read-only mode.
- Purpose: Lets a member browse the followers and following of a profile, open any listed member’s profile, and follow or unfollow directly from the list.
**Interface:** Two tabs — Followers and Following — each a list of member cards (avatar, name, headline) with a Follow / Following toggle and a link to the profile. The active tab reflects the count the member selected on the profile.

**Data processing**

- The client calls GET /api/users/{id}/followers or GET /api/users/{id}/following (paginated); the Service returns the member cards and, for an authenticated viewer, whether the viewer already follows each listed member.
- Follow / unfollow from a row reuses POST /api/users/{id}/follow and DELETE /api/users/{id}/follow (see 3.3.7), updating the Follow relationship and the cached counts.
- RBAC: reading the public lists is open to Guests on public profiles; follow / unfollow actions require an authenticated Student/Alumni, with the follower id taken from the JWT.
**Screen layout:** [Figure — Followers / Following screen layout (Web)]

**Function details**

- Data: profile owner id, viewer id (from JWT, if any), member cards (id, name, avatar, headline), per-row follow state, follower/following counts.
- Validation: the target profile must exist and be visible; follow actions honour BR-24 (no self-follow, no duplicate follow).
- Business rules: BR-13 (members follow/unfollow; Guests are read-only), BR-24 (follow constraints).
- Error Handling: profile not found -> MSG04; backend/API failure -> MSG05; an unauthenticated follow attempt -> redirected to login.
- Normal case: a member taps a follower/following count, browses the tabbed lists, opens a profile, and follows or unfollows a member inline with the count updating.
- Abnormal case: target profile locked/not found (MSG04); server error (MSG05).
### 3.4 Social - Feed, Posts, Events, Packages & Messaging

This section specifies the social features of AlumNect - the activity feed and posts, post interactions (likes, comments, reposts), community events, job/recruitment listings, posting packages and PayOS payment, and member-to-member direct messaging.

#### 3.4.1 Publish Post

**Function trigger**

- Navigation path: /feed (composer) or /posts/new
- Timing / Frequency: On demand, whenever a member wants to share an update (Covers UC14)
**Function description**

- Actors/Roles: Student, Alumni (authenticated). Guests cannot post (BR-12).
- Purpose: Allows a verified member to create a text/image post that is published to the activity feed for the community to view and interact with.
**Interface:** The Feed screen shows a composer card at the top containing: an author avatar/name header, a multi-line Content text area ("Share something with the community…"), an Add Image upload control (drag-and-drop or file picker, with image previews and a remove button per image), an optional Visibility selector (Public / Connections), and a Post primary button (disabled while content is empty and during upload).

**Data processing**

- The client validates that content is non-empty (or at least one image is attached) and that each image meets type/size limits before enabling Post.
- On submit, images are uploaded to object storage; the returned URLs plus the text are sent via POST /api/posts with Authorization: Bearer <JWT>.
- Spring Security (@PreAuthorize) confirms the caller has role STUDENT or ALUMNI; the service applies the anti-spam quota check (BR-10) by counting the author's posts in the last hour.
- A new row is inserted into the posts table (author_id, content, visibility, created_at) and child rows into post_images; the post is returned and prepended to the feed.
**Screen layout:** [Figure — Publish Post screen layout (Web)]

**Function details**

- Data: post content (text), attached image URLs, author_id, visibility, created_at.
- Validation: content required if no image attached; each image must be JPG/PNG/JPEG and ≤ 10MB (BR-16); content length capped at a defined maximum.
- Business rules: BR-10 (≤ 10 posts per hour), BR-12 (guests cannot post), BR-16 (image constraints).
- Error Handling: empty content with no image → MSG01; invalid/oversized image → MSG12; hourly post limit exceeded → MSG05 with an inline notice that the limit was reached; unauthenticated/guest attempt → MSG28; server/API failure → MSG05.
- Normal case: the member enters content, optionally attaches valid images, taps Post; the post is persisted, MSG13 is shown, and the new post appears at the top of the feed.
- Abnormal case: image rejected (MSG12), quota exceeded, or network error (MSG05) — the post is not created and the composer retains the entered content.
#### 3.4.2 View Feed

**Function trigger**

- Navigation path: /feed (also the authenticated home/landing)
- Timing / Frequency: On demand and on scroll (infinite/paged loading) (Covers UC15)
**Function description**

- Actors/Roles: Guest (public posts only), Student, Alumni.
- Purpose: Displays a reverse-chronological stream of posts so users can keep up with community activity.
**Interface:** The Feed screen lists post cards, each showing author avatar/name, timestamp, content, image grid, like count, comment count, repost count, and action buttons (Like, Comment, Repost, Report, and an author-only "…" menu for Edit/Delete). A composer card appears at the top for authenticated members; an end-of-list loader handles pagination.

**Data processing**

- The client calls GET /api/posts?page={n}&size={m} (optionally sort=recent) with the Bearer token if present.
- The service returns a paginated set from the posts table joined with post_images, post_likes (count + whether the current user liked), and post_comments (count); for guests, only posts with visibility = PUBLIC are returned (BR-12).
- Hidden/removed posts (BR-08/BR-11) are excluded from the result set.
**Screen layout:** [Figure — View Feed screen layout (Web)]

**Function details**

- Data: paged posts, per-post like/comment/repost counts, viewer-specific liked flag, visibility.
- Validation: page/size parameters validated server-side and clamped to safe bounds.
- Business rules: BR-08 / BR-11 (hidden/removed content excluded), BR-12 (guests see public posts only).
- Error Handling: no posts available → empty-state message ("No posts yet"); load failure → MSG05 with a Retry control; expired token → silent refresh via /api/auth/refresh, else redirect to login.
- Normal case: posts load in pages; scrolling to the bottom fetches the next page until exhausted.
- Abnormal case: API error shows MSG05 and a Retry button; the already-loaded portion of the feed remains visible.
#### 3.4.3 View Post Detail

**Function trigger**

- Navigation path: /posts/{id}
- Timing / Frequency: On demand, when a user opens a single post (Covers UC16)
**Function description**

- Actors/Roles: Guest (public posts), Student, Alumni.
- Purpose: Shows the full content of one post together with its complete comment thread and interaction state.
**Interface:** A detail screen displaying the full post (author header, full content, all images, like/comment/repost counters and buttons), followed by the comment list (each with avatar, name, text, timestamp, and author-only edit/delete controls) and a comment input box at the bottom for authenticated members.

**Data processing**

- The client calls GET /api/posts/{id} and GET /api/posts/{id}/comments (paged).
- The service reads the posts, post_images, post_likes, and post_comments tables; for guests it enforces visibility = PUBLIC and returns 403 otherwise.
- A hidden/removed post (BR-08/BR-11) returns a not-available response.
**Screen layout:** [Figure — View Post Detail screen layout (Web)]

**Function details**

- Data: post fields, image URLs, comment list, like/repost counts, viewer liked flag.
- Validation: id must be a valid existing post identifier.
- Business rules: BR-08 / BR-11 (hidden/removed not shown), BR-12 (guest = public only).
- Error Handling: non-existent/removed post → "This post is no longer available"; access denied for a non-public post viewed by a guest → MSG28; load failure → MSG05.
- Normal case: the post and its comments load fully; authenticated members can immediately like or comment.
- Abnormal case: invalid id, hidden post, or network error — an appropriate not-available message or MSG05 is shown.
#### 3.4.4 Like Post

**Function trigger**

- Navigation path: /feed or /posts/{id} (Like button)
- Timing / Frequency: On demand, toggled per post (Covers UC17)
**Function description**

- Actors/Roles: Student, Alumni. Guests cannot like (BR-12).
- Purpose: Lets a member express appreciation for a post and toggle that like on/off.
**Interface:** A Like button (heart/thumb icon with a live count) on each post card and on the detail screen; the icon shows a filled/active state when the current user has liked the post.

**Data processing**

- Clicking toggles the state optimistically and calls POST /api/posts/{id}/like to like or DELETE /api/posts/{id}/like to unlike.
- RBAC requires STUDENT/ALUMNI; the service inserts/removes a row in post_likes (unique on post_id + user_id) and returns the updated count.
**Screen layout:** [Figure — Like Post interaction layout (Web)]

**Function details**

- Data: post_id, user_id, like state, like count.
- Validation: one like per user per post (enforced by a unique constraint); idempotent toggle.
- Business rules: BR-12 (guests cannot like).
- Error Handling: guest/unauthenticated attempt → prompt to sign in / MSG28; like on a removed post → "This post is no longer available"; API failure → revert the optimistic state and show MSG05.
- Normal case: the like is recorded/removed and the count updates immediately.
- Abnormal case: request fails — the UI rolls back to the previous like state and shows MSG05.
#### 3.4.5 Manage Comments

**Function trigger**

- Navigation path: /posts/{id} (comment box and per-comment menu)
- Timing / Frequency: On demand (Covers UC18 Comment, UC19 Edit comment, UC20 Delete comment)
**Function description**

- Actors/Roles: Student, Alumni. Only the comment author may edit/delete their own comment; an Admin may remove any comment (BR-11). Guests cannot comment (BR-12).
- Purpose: Enables members to add comments to a post and to edit or delete their own comments.
**Interface:** Under each post, a comment input box with a Send button; each existing comment shows the author, text, timestamp, and — for the comment owner — an inline Edit field (with Save/Cancel) and a Delete action.

**Data processing**

- Add: POST /api/posts/{id}/comments with { content }; inserts a row in post_comments and increments the displayed comment count.
- Edit: PUT /api/comments/{commentId} with { content }; the service verifies the caller is the author before updating.
- Delete: DELETE /api/comments/{commentId}; the service verifies ownership (or Admin) and removes the row.
- All write paths require STUDENT/ALUMNI (or Admin for removal) and a valid Bearer token.
**Screen layout:** [Figure — Manage Comments screen layout (Web)]

**Function details**

- Data: comment content, comment_id, post_id, author_id, created_at/updated_at.
- Validation: comment content required and non-empty (trimmed), length-capped; commentId must exist.
- Business rules: BR-11 (author edits/deletes own; Admin may remove any), BR-12 (guests cannot comment).
- Error Handling: empty comment → MSG01; edit/delete by a non-owner non-admin → MSG28; delete confirmation prompt → MSG14; comment removed successfully → MSG27; updated successfully → MSG04; API failure → MSG05.
- Normal case: member posts a comment (appears immediately and count increments); owner edits or deletes their comment with the change reflected at once.
- Abnormal case: empty input (MSG01), unauthorized edit/delete (MSG28), or network failure (MSG05) — the action is rejected and prior state preserved.
#### 3.4.6 Repost

**Function trigger**

- Navigation path: /feed or /posts/{id} (Repost button)
- Timing / Frequency: On demand (Covers UC21)
**Function description**

- Actors/Roles: Student, Alumni. Guests cannot repost (BR-12).
- Purpose: Lets a member share an existing post to their own feed, optionally adding a short note, while attributing the original author.
**Interface:** A Repost button on each post; clicking opens a small modal with an optional Add a note text area, a read-only preview of the original post, and Repost / Cancel buttons.

**Data processing**

- On confirm, POST /api/posts/{id}/repost with the optional note is called; RBAC requires STUDENT/ALUMNI.
- The service creates a new row in posts of type REPOST referencing the original post id (original_post_id) and the optional note, and increments the original post's repost count.
- Reposting counts toward the hourly creation quota (BR-10).
**Screen layout:** [Figure — Repost modal layout (Web)]

**Function details**

- Data: original_post_id, repost note (optional), author_id, created_at.
- Validation: the original post must exist and be visible/not removed; optional note is length-capped.
- Business rules: BR-10 (creation quota), BR-11 (original author attribution retained), BR-12 (guests cannot repost).
- Error Handling: repost of a removed post → "This post is no longer available"; quota exceeded → MSG05 with limit notice; unauthenticated → MSG28; API failure → MSG05.
- Normal case: the repost is created, MSG13 is shown, and it appears on the member's feed showing the original author and the added note.
- Abnormal case: original gone, quota exceeded, or network failure — no repost is created and the relevant message is shown.
#### 3.4.7 Manage Own Post

**Function trigger**

- Navigation path: /posts/{id} or feed card "…" menu (Edit / Delete)
- Timing / Frequency: On demand (Covers UC22 Edit post, UC23 Delete post)
**Function description**

- Actors/Roles: Student, Alumni (post author only). An Admin may hide/remove any post (BR-11).
- Purpose: Allows the author to update the content/images of their own post or delete it permanently.
**Interface:** An author-only "…" menu on each owned post with Edit and Delete options. Edit opens the composer pre-filled with current content and images (add/remove images, edit text, Save/Cancel). Delete shows a confirmation modal.

**Data processing**

- Edit: PUT /api/posts/{id} with updated content/image set; the service verifies the caller is the author, validates images, updates the posts/post_images rows, and sets updated_at.
- Delete: DELETE /api/posts/{id}; the service verifies ownership (or Admin) then removes the post and its dependent likes/comments/images.
- RBAC and ownership checks reject any non-owner non-admin caller.
**Screen layout:** [Figure — Manage Own Post screen layout (Web)]

**Function details**

- Data: post_id, updated content, image set, author_id, updated_at.
- Validation: content/image rules as in 3.4.1 (BR-16); id must exist and belong to the caller.
- Business rules: BR-11 (only author edits/deletes; Admin may remove), BR-16 (image constraints).
- Error Handling: edit/delete by non-owner → MSG28; bad image on edit → MSG12; delete confirmation → MSG14; successful update → MSG04; successful delete → MSG27; API failure → MSG05.
- Normal case: the author edits and saves (MSG04, feed reflects the change) or confirms deletion (MSG27, post removed from the feed).
- Abnormal case: unauthorized attempt (MSG28), invalid image (MSG12), or network error (MSG05) — the change is not applied.
#### 3.4.8 Report Content

**Function trigger**

- Navigation path: /posts/{id} or /jobs/{id} ("Report" action in the "…" menu)
- Timing / Frequency: On demand (Covers UC24)
**Function description**

- Actors/Roles: Student, Alumni. Guests cannot report (BR-12).
- Purpose: Lets a member flag a post or job listing that violates community rules so an Admin can review it.
**Interface:** A Report action that opens a modal with a Reason selector (e.g. Spam, Inappropriate, Misinformation, Scam/Fraud, Other), an optional Details text area, and Submit / Cancel buttons.

**Data processing**

- On submit, POST /api/reports with { targetType: POST|JOB, targetId, reason, details }; RBAC requires STUDENT/ALUMNI.
- The service enforces the anti-abuse limit (BR-09) by counting the reporter's reports in the last 10 minutes, then inserts a row into the reports table with status PENDING and queues it for Admin review (BR-08).
**Screen layout:** [Figure — Report Content modal layout (Web)]

**Function details**

- Data: target type (post/job), target_id, reporter_id, reason, optional details, status, created_at.
- Validation: reason required; the target must exist; reporter must not exceed 5 reports / 10 minutes (BR-09).
- Business rules: BR-08 (reports queued for Admin; content hidden on confirmed violation), BR-09 (≤ 5 reports per 10 minutes), BR-12 (guests cannot report).
- Error Handling: missing reason → MSG01; rate limit exceeded → MSG05 with an inline "You have submitted too many reports. Please try again later." notice; guest attempt → MSG28; API failure → MSG05; success → MSG15.
- Normal case: the member selects a reason and submits; the report is queued and MSG15 is shown.
- Abnormal case: rate limit hit, missing reason, or network error — the report is not stored and the relevant message is shown.
#### 3.4.9 Post Job Listing

**Function trigger**

- Navigation path: /jobs/new
- Timing / Frequency: On demand, when an Alumni recruiter creates a listing (Covers UC14 - recruitment post type; UC30, UC31 - package & payment)
**Function description**

- Actors/Roles: Alumni only (verified). Students and Guests cannot post jobs (BR-03, BR-13).
- Purpose: Enables a verified Alumni recruiter to create a job/recruitment listing; the listing becomes publicly visible only after a posting package is paid (BR-04).
**Interface:** A job form with fields: Job Title, Company, Location, Employment Type (Full-time/Part-time/Internship/Contract), Salary Range (optional), Description (rich text), Requirements, Application Link / Contact Email, Closing Date, and a Save Draft / Publish action pair.

**Data processing**

- The client validates required fields; on Publish, POST /api/jobs is called and RBAC enforces role ALUMNI with a verified badge (BR-02/BR-03) — non-verified or non-alumni callers are rejected.
- The service inserts a row into the jobs table with status DRAFT/PENDING (poster_id, title, company, etc.). It then checks for an active posting package with remaining quota (BR-04/BR-05): if one exists, the listing is set to PUBLISHED; otherwise it stays pending and the user is prompted to buy a package (MSG16).
**Screen layout:** [Figure — Post Job Listing screen layout (Web)]

**Function details**

- Data: title, company, location, employment type, salary range, description, requirements, application link/contact, closing date, poster_id, status.
- Validation: title, company, location, description, and closing date required; closing date must be in the future; application link must be a valid URL or the contact a valid email.
- Business rules: BR-03 (only verified Alumni post jobs), BR-04 (publicly visible only after a package is paid), BR-05 (package quota/duration), BR-13 (students cannot post jobs).
- Error Handling: missing required field → MSG01; invalid link/email/date → MSG02; non-verified/non-alumni attempt → MSG11; no active package on publish → MSG16 (offering to view packages); API failure → MSG05.
- Normal case: a verified Alumni with an active package fills the form and publishes; the job is saved and becomes publicly visible.
- Abnormal case: no active package — the job is saved as pending/draft and MSG16 routes the user to packages; permission/validation failures show MSG11/MSG01/MSG02.
#### 3.4.10 Browse & Search Jobs

**Function trigger**

- Navigation path: /jobs
- Timing / Frequency: On demand, with live filtering (Covers UC15, UC16, UC35 - recruitment posts)
**Function description**

- Actors/Roles: Guest, Student, Alumni (read-only browsing for all).
- Purpose: Lets users discover published job listings via keyword search and filters, and open a listing to view full details.
**Interface:** A Jobs screen with a Search box (keyword across title/company), filter controls (Location, Employment Type, Salary Range, Date Posted), a sortable result list of job cards (title, company, location, type, posted date, Save button), and pagination. Selecting a card opens the Job Detail view showing the full description, requirements, application link/contact, closing date, recruiter, plus Save and Report actions.

**Data processing**

- List/search: GET /api/jobs?keyword=&location=&type=&page= returns only PUBLISHED and non-expired, non-hidden listings (BR-04/BR-05/BR-08) from the jobs table.
- Detail: GET /api/jobs/{id} returns the full record; a not-published/expired/hidden job returns not-available.
- Guests may read but cannot Save or Report (BR-12).
**Screen layout:** [Figure — Browse & Search Jobs screen layout (Web)]

**Function details**

- Data: job list and detail fields, filter parameters, saved flag (for authenticated viewers).
- Validation: filter/sort parameters validated server-side; id must be a valid published job.
- Business rules: BR-04 (only paid/published jobs are public), BR-05 (expired jobs hidden), BR-08 (hidden jobs excluded), BR-12 (guests read-only).
- Error Handling: no matches → empty-state ("No jobs match your filters"); detail of an expired/removed job → "This listing is no longer available"; load failure → MSG05.
- Normal case: the user searches/filters, browses results, and opens a job to read full details.
- Abnormal case: no results (empty state) or API error (MSG05); the page remains usable.
#### 3.4.11 Save / Unsave Job

**Function trigger**

- Navigation path: /jobs, /jobs/{id} (Save toggle) and /jobs/saved
- Timing / Frequency: On demand (Covers UC36, UC37 - saved posts)
**Function description**

- Actors/Roles: Student, Alumni. Guests cannot save (BR-12).
- Purpose: Lets a member bookmark interesting job listings for later and remove them from their saved list.
**Interface:** A Save (bookmark) toggle on each job card and on the detail view; a dedicated Saved Jobs page (/jobs/saved) listing all bookmarked jobs with an Unsave action each.

**Data processing**

- Save: POST /api/jobs/{id}/save; Unsave: DELETE /api/jobs/{id}/save; both require STUDENT/ALUMNI.
- The service inserts/removes a row in saved_jobs (unique on user_id + job_id). The saved list is read via GET /api/jobs/saved.
**Screen layout:** [Figure — Saved Jobs screen layout (Web)]

**Function details**

- Data: user_id, job_id, saved_at.
- Validation: one save per user per job (unique constraint); the job must exist and be published.
- Business rules: BR-12 (guests cannot save).
- Error Handling: guest attempt → prompt to sign in / MSG28; save of an unavailable job → "This listing is no longer available"; API failure → revert toggle and show MSG05.
- Normal case: the member toggles Save/Unsave and the saved list updates accordingly.
- Abnormal case: request fails — the toggle reverts and MSG05 is shown.
#### 3.4.12 Manage Own Job Listing

**Function trigger**

- Navigation path: /jobs/my then /jobs/{id}/edit (Edit / Remove)
- Timing / Frequency: On demand (Covers UC22, UC23 - recruitment post)
**Function description**

- Actors/Roles: Alumni only (listing owner). An Admin may hide/remove any job (BR-11). Students/Guests excluded (BR-03/BR-13).
- Purpose: Lets the recruiter who created a listing update its details or remove it.
**Interface:** A My Job Listings page showing each owned listing with status (Draft/Published/Expired) and Edit / Remove actions. Edit reopens the job form pre-filled; Remove shows a confirmation modal.

**Data processing**

- Edit: PUT /api/jobs/{id} with updated fields; the service verifies the caller is the listing owner (and Alumni) before updating the jobs row and updated_at.
- Remove: DELETE /api/jobs/{id}; ownership (or Admin) is verified, then the listing is removed/withdrawn and excluded from public results.
- Editing does not change a published listing's package/quota consumption (BR-05).
**Screen layout:** [Figure — Manage Own Job Listing screen layout (Web)]

**Function details**

- Data: job_id, updated fields, owner_id, status, updated_at.
- Validation: same field rules as 3.4.9; id must exist and belong to the caller.
- Business rules: BR-03 (Alumni-only), BR-05 (package quota unaffected by edit), BR-11 (owner edits/removes; Admin may remove), BR-13 (students excluded).
- Error Handling: edit/remove by non-owner → MSG28; non-alumni attempt → MSG11; invalid field → MSG01/MSG02; remove confirmation → MSG14; update success → MSG04; remove success → MSG27; API failure → MSG05.
- Normal case: the owner edits and saves (MSG04) or confirms removal (MSG27); public listings reflect the change.
- Abnormal case: unauthorized attempt (MSG28/MSG11), validation error, or network error (MSG05) — no change applied.
#### 3.4.13 Posting Packages

**Function trigger**

- Navigation path: /packages
- Timing / Frequency: On demand, before publishing a job or when prompted by MSG16 (Covers UC30)
**Function description**

- Actors/Roles: Alumni only. Students/Guests excluded (BR-03/BR-13).
- Purpose: Lets a verified Alumni recruiter view available posting packages and select one to purchase, enabling public job publication (BR-04).
**Interface:** A Packages screen presenting package cards, each showing Name, Price, Duration (days), Active-listing quota, and feature list, with a Select / Buy button per card. An optional summary panel shows the recruiter's current active package and remaining quota.

**Data processing**

- The client calls GET /api/packages to list active packages from the packages table; RBAC restricts purchase actions to ALUMNI.
- Selecting a package routes to the payment step (3.4.14), passing the chosen package_id; the current active package/quota is read from package_subscriptions.
**Screen layout:** [Figure — Posting Packages screen layout (Web)]

**Function details**

- Data: package_id, name, price, duration_days, listing_quota, features; recruiter's active subscription and remaining quota.
- Validation: the selected package must be active and available; only verified Alumni may proceed to purchase.
- Business rules: BR-03 (Alumni-only), BR-04 (job public only after package paid), BR-05 (each package defines duration + quota), BR-13 (students excluded).
- Error Handling: non-alumni/non-verified attempt → MSG11; package list load failure → MSG05; selecting an inactive package → "This package is no longer available".
- Normal case: the recruiter reviews packages and selects one to proceed to payment.
- Abnormal case: load failure (MSG05) or permission failure (MSG11) — selection cannot proceed.
#### 3.4.14 Pay for Package

**Function trigger**

- Navigation path: /packages/{id}/checkout → PayOS redirect → /payments/return
- Timing / Frequency: On demand, once per purchase (Covers UC31)
**Function description**

- Actors/Roles: Alumni only.
- Purpose: Processes payment for a selected posting package through PayOS and, on success, activates the package so the recruiter can publish jobs (BR-04/BR-22).
**Interface:** A Checkout screen summarising the selected package (name, price, duration, quota), a Payment Method selector (PayOS), and a Pay Now button that redirects to PayOS; on return, a result screen shows success or failure.

**Data processing**

- On Pay Now, POST /api/payments creates a payments row (status PENDING, user_id, package_id, amount) and returns the PayOS payment-link / redirect URL; RBAC requires ALUMNI.
- The user completes payment in PayOS and is redirected to /payments/return; the server verifies the PayOS webhook/signature, then either marks the payment SUCCESS and creates/extends a row in package_subscriptions (start, expiry per BR-05) or marks it FAILED.
- On success, any of the recruiter's pending job listings may be set to PUBLISHED within quota (BR-04).
**Screen layout:** [Figure — Pay for Package checkout layout (Web)]

**Function details**

- Data: payment_id, user_id, package_id, amount, gateway, status, transaction_ref, paid_at; subscription start/expiry.
- Validation: package must be active; amount matches the package price; PayOS webhook signature verified server-side.
- Business rules: BR-04 (publish only after paid), BR-05 (duration/quota set on activation), BR-22 (payments processed via PayOS).
- Error Handling: payment failed/cancelled at PayOS → MSG18 (status FAILED, package not activated); successful payment → MSG17; callback verification failure → MSG18 and the payment is not confirmed; system error → MSG05.
- Normal case: the recruiter pays via PayOS, the webhook verifies, the package activates, and MSG17 is shown.
- Abnormal case: the user cancels or PayOS declines — MSG18 is shown, the package is not activated, and the recruiter may retry.
#### 3.4.15 Payment Complaint

**Function trigger**

- Navigation path: /payments/history → /payments/{id}/complaint
- Timing / Frequency: On demand, within the allowed window after purchase (Covers UC32)
**Function description**

- Actors/Roles: Alumni only (the transaction owner).
- Purpose: Lets the buyer of a transaction raise a complaint about a payment (e.g. charged but package not activated) for Admin resolution.
**Interface:** A payment history list with a File Complaint action on eligible transactions; the action opens a modal with a read-only transaction summary, a Complaint Type selector, a Description text area, an optional evidence image upload, and Submit / Cancel buttons.

**Data processing**

- The client calls POST /api/payments/{id}/complaint with the complaint details; RBAC requires ALUMNI.
- The service verifies the caller owns the transaction and that the purchase is still within the allowed complaint window (BR-21), then inserts a row in payment_complaints with status OPEN for Admin handling (BR-22).
**Screen layout:** [Figure — Payment Complaint modal layout (Web)]

**Function details**

- Data: complaint_id, payment_id, owner_id, type, description, evidence image, status, created_at.
- Validation: description required; the complainant must own the transaction; submission must be within the defined window (BR-21); evidence image must satisfy BR-16.
- Business rules: BR-21 (owner-only, within window), BR-22 (Admin resolves complaints).
- Error Handling: complaint by non-owner → MSG28; window expired → "The complaint window for this transaction has closed."; missing description → MSG01; invalid evidence image → MSG12; success → MSG04 (complaint submitted); API failure → MSG05.
- Normal case: the owner files a complaint within the window; it is recorded and queued for Admin, with a success confirmation.
- Abnormal case: non-owner (MSG28), window closed, or validation/network error — the complaint is not stored.
#### 3.4.16 Direct Messaging

**Function trigger**

- Navigation path: /messages (inbox) and /messages/{conversationId}
- Timing / Frequency: On demand and on new-message arrival (Covers UC33, UC34)
**Function description**

- Actors/Roles: Student, Alumni (authenticated members only). Guests excluded (BR-12, BR-15).
- Purpose: Lets authenticated members exchange one-to-one direct messages and review their conversation inbox.
**Interface:** A two-pane Messaging screen: a left Inbox list of conversations (counterpart avatar/name, last message preview, timestamp, unread badge) and a right Conversation pane showing the message thread, a Message input box, attachment control, and a Send button. A new conversation can be started from a user's profile ("Message" button).

**Data processing**

- Inbox: GET /api/conversations lists the member's conversations from the conversations table (with last-message and unread counts).
- Thread: GET /api/conversations/{id}/messages (paged) reads the messages table.
- Send: POST /api/conversations/{id}/messages (or POST /api/messages with a recipient to auto-create the conversation) inserts a messages row; RBAC requires STUDENT/ALUMNI.
- Before delivery, the service checks the block relationship (BR-15): if either party has blocked the other, the message is rejected/not delivered.
**Screen layout:** [Figure — Direct Messaging screen layout (Web)]

**Function details**

- Data: conversation_id, participants, message content, attachment, sender_id, sent_at, read_at, unread count.
- Validation: message content (or attachment) required and non-empty; recipient must be an existing authenticated member; attachment images satisfy BR-16.
- Business rules: BR-12 (guests excluded), BR-15 (messaging only between authenticated members; blocked users' messages not delivered).
- Error Handling: empty message → MSG01; messaging a user who has blocked the sender / is blocked → MSG22 (message not delivered); guest attempt → MSG28; invalid attachment → MSG12; API failure → MSG05.
- Normal case: the member opens the inbox, selects or starts a conversation, types a message, and sends it; it appears in the thread and the recipient's inbox updates.
- Abnormal case: blocked relationship (MSG22), empty input (MSG01), or network error (MSG05) — the message is not delivered.
Events (part of Module 3 - Social). AlumNect lets verified Alumni organise alumni events (created as event-type Feed posts) while Students and Alumni discover, register for, are reminded about, share, and review their history of community events.

#### 3.4.17 Create Event

_(Covers UC14 - event post type)_

**Function trigger**

- Navigation path: /events/create
- Timing / Frequency: On demand, whenever a verified Alumnus organises a new event.
**Function description**

- Actors/Roles: Alumni (verified).
- Purpose: Allows a verified Alumnus to publish a new alumni event so that the community can browse and register for it.
**Interface:** The "Create Event" screen presents a form with the following labelled controls: "Event Title" (text input), "Description" (rich-text area), "Cover Image" (image upload), "Category" (dropdown, e.g. networking/seminar/reunion), "Location Type" (radio: Online / Offline), "Venue / Meeting Link" (text input, shown per location type), "Start Date & Time" (datetime picker), "End Date & Time" (datetime picker), "Capacity" (numeric input, optional), and the "Publish Event" and "Cancel" buttons.

**Data processing**

- The client validates required fields and the date range, then submits the form as POST /api/events.
- Spring Security verifies the JWT and enforces @PreAuthorize so that only an authenticated user holding the verified Alumni role context may proceed (BR-03-style organiser restriction; role per BR-23).
- The Service layer validates the payload, persists a new row in the events table (organiser set to the caller's user id, initial status upcoming), and stores the uploaded cover image in object storage, saving its URL on the events record.
- On success the API returns the created event; the client redirects to the event detail page and shows MSG04.
**Screen layout:** [Figure — Create Event screen layout (Web)]

**Function details**

- Data: title, description, category, location type, venue/link, start datetime, end datetime, capacity, cover image URL, organiser id, status.
- Validation: title required (MSG01); start and end datetimes required and start must be in the future and before end (MSG02); capacity, if provided, must be a positive integer; cover image must be JPG/PNG/JPEG ≤ 10MB (BR-16).
- Business rules: BR-03 (only verified Alumni may organise events), BR-16 (image constraints), BR-23 (single role context).
- Error Handling: empty required field → inline MSG01; invalid date order/format → inline MSG02; invalid image type/size → MSG12; caller is not a verified Alumnus → MSG11; server/API failure → MSG05.
- Normal case: the Alumnus fills valid data, publishes, the event is created with status upcoming, and MSG04 confirms.
- Abnormal case: validation fails (event not saved), the image upload is rejected, the user lacks verified-Alumni rights, or the API errors — no event is created and the corresponding message is shown.
#### 3.4.18 Browse & Search Events

_(Covers UC15, UC16, UC35 - event posts)_

**Function trigger**

- Navigation path: /events
- Timing / Frequency: On demand, whenever a user explores upcoming or past events.
**Function description**

- Actors/Roles: Guest, Student, Alumni.
- Purpose: Displays the list of events and lets users search by keyword and filter so they can find relevant events. (UC42 search/filter is Should-have.)
**Interface:** The "Events" screen shows a search bar ("Search events" text input), filter controls ("Category" dropdown, "Location Type" filter, "Status" filter for upcoming/past, "Date Range" picker), a sort selector, and a paginated grid of event cards (cover image, title, date/time, location, RSVP count). A "Create Event" action is shown only to verified Alumni.

**Data processing**

- The client requests GET /api/events with query parameters for keyword, category, location type, status, date range, sort, and pagination.
- No authentication is required for reading (BR-12 — Guests may view public content); if a JWT is present, the response also marks events the caller has already registered for.
- The Service queries the events table (joining RSVP counts from event_rsvps) applying the filters, and returns a paginated result set ordered by the chosen sort.
- The client renders cards; selecting one navigates to event detail.
**Screen layout:** [Figure — Browse & Search Events screen layout (Web)]

**Function details**

- Data: event title, cover image, category, location type, start/end datetime, status, RSVP count; query parameters keyword, category, status, date range, sort, page.
- Validation: date-range filter must have start ≤ end (MSG02); keyword length bounded; invalid page falls back to the first page.
- Business rules: BR-12 (Guests may browse public content read-only).
- Error Handling: invalid filter value → ignored or inline MSG02 on the date range; no results → empty-state message (not an error); server/API failure → MSG05.
- Normal case: the user applies filters/keyword and a matching, paginated list of events is displayed.
- Abnormal case: the search returns nothing (empty state) or the API fails (MSG05) and the list is not rendered.
#### 3.4.19 RSVP / Cancel Attendance

_(Covers UC25, UC26)_

**Function trigger**

- Navigation path: /events/{id} (RSVP / Cancel buttons on the event detail screen)
- Timing / Frequency: On demand, while an event is upcoming/open.
**Function description**

- Actors/Roles: Student, Alumni.
- Purpose: Lets an authenticated member register attendance for an event and later cancel that registration. (UC44 cancel attendance is Should-have.)
**Interface:** On the event detail screen, an "RSVP / Register" button is shown when the user is not registered; once registered it changes to a "Cancel Attendance" button with a confirmation prompt. The current registration status and attendee count are displayed alongside.

**Data processing**

- To register, the client calls POST /api/events/{id}/rsvp; to cancel, DELETE /api/events/{id}/rsvp.
- Spring Security verifies the JWT and enforces @PreAuthorize so only authenticated Student/Alumni may act (Guests are blocked per BR-12).
- The Service checks the event status is upcoming/open before allowing RSVP (BR-17); on register it inserts a row into event_rsvps (unique per user+event) and increments the count; on cancel it deletes that row.
- On successful registration the API returns the updated state and the client shows MSG19; on cancellation it confirms removal.
**Screen layout:** [Figure — RSVP / Cancel Attendance screen layout (Web)]

**Function details**

- Data: event id, user id, RSVP record (created timestamp), event status, attendee count, capacity.
- Validation: the event must exist and be in upcoming/open status; duplicate RSVP by the same user is rejected; capacity, if set, must not be exceeded.
- Business rules: BR-17 (RSVP allowed only while upcoming/open; disabled once cancelled or past), BR-12 (Guests cannot RSVP), BR-13 (Students may use events).
- Error Handling: event past or cancelled → RSVP control disabled, attempt rejected with MSG20 context; capacity full → inline notice; Guest attempts RSVP → prompted to sign in / MSG28; server/API failure → MSG05.
- Normal case: the member registers, the count increments, and MSG19 confirms; cancelling removes the registration after confirmation.
- Abnormal case: the event is no longer open (BR-17), capacity is reached, or the API fails — registration does not change and the relevant message is shown.
#### 3.4.20 Event Reminder

_(Covers UC25; reminder is system-generated - see 3.1.4)_

**Function trigger**

- Navigation path: /events/{id} (reminder toggle) and in-app /notifications
- Timing / Frequency: Set on demand; reminder delivered automatically before the event start. (Should-have.)
**Function description**

- Actors/Roles: Student, Alumni.
- Purpose: Notifies a registered member ahead of an event they have RSVP'd to, so that they do not miss it.
**Interface:** On the event detail screen a "Remind me" toggle lets a registered user enable or disable reminders. Delivered reminders appear in the in-app notification panel as a notification item with the event title and start time.

**Data processing**

- Toggling calls PUT /api/events/{id}/rsvp (reminder flag) updating the user's row in event_rsvps.
- A scheduled server job scans upcoming events with reminder-enabled RSVPs and creates in-app notification rows in notifications for the affected users before the start time; the front-end polls/loads GET /api/notifications.
- RBAC ensures only the registrant may set their own reminder preference.
**Screen layout:** [Figure — Event Reminder screen layout (Web)]

**Function details**

- Data: RSVP record, reminder-enabled flag, event start datetime, notification record (type "event reminder").
- Validation: the user must have an active RSVP for the event before a reminder can be enabled; the event must still be upcoming.
- Business rules: BR-17 (reminders apply only to upcoming events), BR-13 (Students may use events).
- Error Handling: user not registered → reminder toggle disabled / MSG28 on attempt; event already past or cancelled → no reminder scheduled; server/API failure → MSG05.
- Normal case: a registered user enables reminders and receives an in-app notification before the event begins.
- Abnormal case: the user is not registered, the event is cancelled/past, or the scheduling job/API fails — no reminder is delivered.
#### 3.4.21 Share Event

_(Covers UC21 - repost/share)_

**Function trigger**

- Navigation path: /events/{id} (Share button)
- Timing / Frequency: On demand, whenever a user wants to share an event. (Should-have.)
**Function description**

- Actors/Roles: Guest, Student, Alumni.
- Purpose: Lets a user share a public event via a copyable link or by reposting it into the internal feed, increasing event reach.
**Interface:** A "Share" button opens a small panel with a "Copy Link" control (showing the canonical event URL) and a "Share to Feed" action (available to authenticated Student/Alumni) with an optional caption field.

**Data processing**

- "Copy Link" is a client-side action that copies the canonical URL /events/{id}; no server call is required.
- "Share to Feed" calls POST /api/posts with a reference to the event id (a repost-style post), persisting a row in the posts table linked to the events record; RBAC requires an authenticated Student/Alumni JWT.
- A success confirmation is shown after sharing to the feed.
**Screen layout:** [Figure — Share Event screen layout (Web)]

**Function details**

- Data: event id, canonical event URL, optional caption, generated feed post referencing the event.
- Validation: the event must exist and be public; caption length bounded when sharing to feed.
- Business rules: BR-12 (Guests may copy/share a public link but cannot post to the feed), BR-13 (Students may share to feed).
- Error Handling: Guest attempts "Share to Feed" → prompted to sign in / MSG28; event not found → not-found state; server/API failure → MSG05.
- Normal case: the user copies the link or successfully shares the event into the feed with a confirmation.
- Abnormal case: an unauthenticated user tries to post to the feed, or the share API fails — the action is blocked and the relevant message is shown.
#### 3.4.22 Manage Own Event

_(Covers UC22, UC23, UC27)_

**Function trigger**

- Navigation path: /events/{id}/edit and the manage controls on /events/{id} (Edit / Cancel / Delete)
- Timing / Frequency: On demand, by the organising Alumnus.
**Function description**

- Actors/Roles: Alumni (event organiser).
- Purpose: Lets the organising Alumnus update event details, cancel an event (notifying registrants), or delete an event. (UC47 edit and UC48 cancel are Must-have; UC49 delete is Should-have.)
**Interface:** The "Edit Event" screen reuses the create form pre-filled with current values plus a "Save Changes" button. The event detail screen also shows a "Cancel Event" button (with a reason field) and a "Delete Event" button, both shown only to the organiser; each opens a confirmation modal.

**Data processing**

- Editing submits PUT /api/events/{id}; cancelling submits PUT /api/events/{id}/cancel; deleting submits DELETE /api/events/{id}.
- Spring Security and the Service layer enforce that the caller is the event's organiser (ownership per BR-11) before any change; an Admin may also act on any event (BR-11/BR-14, specified in the Admin module).
- Edit updates the events row; cancel sets the event status to cancelled and, per BR-18, generates in-app notifications in the notifications table for every user with an RSVP in event_rsvps; delete removes the event (and cascades its RSVP records).
- Successful edit shows MSG04; cancel sets the public banner MSG20 on the event; delete shows MSG27 after the MSG14 confirmation.
**Screen layout:** [Figure — Manage Own Event screen layout (Web)]

**Function details**

- Data: event id, editable fields (title, description, category, location, datetimes, capacity, cover image), status, cancellation reason, organiser id, registrant list.
- Validation: same field/date rules as create (title required MSG01; valid date order MSG02; image JPG/PNG/JPEG ≤ 10MB BR-16); cancellation/deletion require confirmation.
- Business rules: BR-11 (only the author/organiser may edit/delete; Admin may remove any content), BR-18 (cancelling auto-notifies all registrants in-app), BR-16 (image constraints), BR-03/BR-23 (organiser is a verified Alumnus).
- Error Handling: non-owner attempts to manage → MSG28; invalid field/date → MSG01/MSG02; bad image → MSG12; delete/cancel confirmation declined → no change (MSG14 dismissed); server/API failure → MSG05.
- Normal case: the organiser edits and saves (MSG04); cancelling marks the event cancelled, displays MSG20, and notifies all registrants (BR-18); deleting (after MSG14) removes the event and shows MSG27.
- Abnormal case: a non-owner is denied (MSG28), validation fails on edit, the confirmation is cancelled, or the API errors — the event is left unchanged.
#### 3.4.23 Attended-Event History

_(Covers UC28, UC29)_

**Function trigger**

- Navigation path: /events/history (also reachable from the user profile)
- Timing / Frequency: On demand, whenever a member reviews events they have attended. (Could-have.)
**Function description**

- Actors/Roles: Student, Alumni.
- Purpose: Shows the authenticated member a chronological list of events they registered for and that have already taken place, for personal record-keeping.
**Interface:** The "My Events / History" screen lists past events the user RSVP'd to, each card showing title, date, location, and status; tabs separate "Upcoming" registrations from "Attended" (past) events. Each item links to the event detail.

**Data processing**

- The client calls GET /api/events?filter=attended (the member's own history); RBAC requires the caller's JWT and scopes results to that user.
- The Service joins event_rsvps for the caller with events where the event start is in the past (status past), returning the list ordered by date descending.
- The client renders the history list; an empty result shows an empty state.
**Screen layout:** [Figure — Attended-Event History screen layout (Web)]

**Function details**

- Data: user id, RSVP records, event title/date/location/status.
- Validation: results are scoped to the authenticated user; only events with a matching RSVP and a past start datetime are included.
- Business rules: BR-13 (Students may use events), BR-12 (Guests have no personalised history).
- Error Handling: Guest/unauthenticated access → redirected to sign in / MSG28; no attended events → empty-state message; server/API failure → MSG05.
- Normal case: the member opens history and sees the list of past events they attended, newest first.
- Abnormal case: the user has no attended events (empty state) or the API fails (MSG05) and no list is shown.
### 3.5 Q&A Forum & Salary Board

This module lets members ask and answer career questions, vote and moderate Q&A content organised by topic, and contribute or browse anonymous, aggregate-only salary statistics.

#### 3.5.1 Ask Question

**Function trigger**

- Navigation path: /forum/ask
- Timing / Frequency: On demand / whenever a member wants to post a new question to the forum.
**Function description**

- Actors/Roles: Student, Alumni (Covers UC40)
- Purpose: Allows an authenticated member to publish a new question (title, body, topic, tags) to the Q&A forum so the community can answer it.
**Interface:** The "Ask a Question" screen contains: a Title text field, a Details rich-text/multiline body field, a Topic single-select dropdown (populated from the Admin-managed topic catalogue), an optional Tags multi-select/chip input, a Post Question primary button, and a Cancel button.

**Data processing**

- The client validates required fields, then sends POST /api/questions with Authorization: Bearer <JWT>; Spring Security @PreAuthorize confirms the caller is an authenticated Student/Alumni (Guests are rejected).
- The server validates payload, resolves the selected topic_id against the topics table, inserts a row into questions (author_id, title, body, topic_id, created_at, status=active, vote_count=0), and links any tags via the question_tags join table.
- The created question and its author display name are returned; the client redirects to the new question detail page.
**Screen layout:** [Figure — Ask Question screen layout (Web)]

**Function details**

- Data: question_id, author_id, title, body, topic_id, tags[], created_at, status, vote_count, answer_count.
- Validation: Title required, 10–150 chars; Details required, ≥ 20 chars; Topic required and must exist; tags optional, max 5.
- Business rules: BR-12 (Guests cannot post); BR-10 (anti-spam posting rate cap applies); BR-11 (only the author may later edit/delete).
- Error Handling: Empty required field → MSG01; invalid length/format → MSG02; not authenticated/Guest → MSG28; server/API failure → MSG05.
- Normal case: Member fills the form, submits, the question is created and shown on its detail page with toast MSG04.
- Abnormal case: Missing topic or title fails validation (MSG01/MSG02) and no record is created; a network/server error returns MSG05 and the draft input is preserved.
#### 3.5.2 Answer Question

**Function trigger**

- Navigation path: /forum/questions/{id} (answer composer at the bottom of the question detail page)
- Timing / Frequency: On demand / whenever a member responds to an open question.
**Function description**

- Actors/Roles: Student, Alumni (Covers UC41)
- Purpose: Allows an authenticated member to post an answer to an existing question so the asker and community receive a response.
**Interface:** Below the question body, an Answer multiline/rich-text input with a Post Answer button. Existing answers are listed above the composer, each showing author, body, vote count, and timestamp.

**Data processing**

- The client sends POST /api/questions/{id}/answers with the JWT; @PreAuthorize confirms an authenticated member.
- The server verifies the parent question exists and is active, inserts a row into answers (question_id, author_id, body, created_at, vote_count=0), increments the question's answer_count, and may create an in-app notification to the question author.
- The new answer is appended to the answer list.
**Screen layout:** [Figure — Answer Question screen layout (Web)]

**Function details**

- Data: answer_id, question_id, author_id, body, created_at, vote_count.
- Validation: Answer body required, ≥ 10 chars.
- Business rules: BR-12 (Guests cannot answer); BR-11 (only the answer author may edit/delete it later).
- Error Handling: Empty body → MSG01; parent question not found/removed → MSG05; not authenticated → MSG28; server failure → MSG05.
- Normal case: Member types an answer, submits, and it appears immediately under the question with toast MSG04.
- Abnormal case: Empty answer is blocked by MSG01; answering a deleted question returns an error (MSG05) and nothing is saved.
#### 3.5.3 Vote on Question or Answer

**Function trigger**

- Navigation path: /forum/questions/{id} (up/down vote controls on each question and answer)
- Timing / Frequency: On demand / whenever a member finds a question or answer helpful or unhelpful.
**Function description**

- Actors/Roles: Student, Alumni (Covers UC42, UC43)
- Purpose: Lets authenticated members up-vote or down-vote questions and answers so the most useful content surfaces.
**Interface:** Each question and answer displays an up-arrow control, a numeric vote_count, and a down-arrow control. The active vote direction is highlighted for the current user.

**Data processing**

- Voting on a question calls POST /api/questions/{id}/vote and voting on an answer calls POST /api/answers/{id}/vote, each with a direction (up/down) and the JWT; @PreAuthorize confirms an authenticated member.
- The server records or updates the user's vote in votes (user_id, target_type, target_id, direction), recomputes the target's vote_count, and prevents a user from voting on their own content and from double-counting (re-voting toggles/replaces the previous vote).
- The updated count is returned and re-rendered.
**Screen layout:** [Figure — Vote on Q&A screen layout (Web)]

**Function details**

- Data: vote_id, user_id, target_type (question/answer), target_id, direction, vote_count.
- Validation: direction must be up or down; one effective vote per user per target.
- Business rules: BR-12 (Guests cannot vote); a user may not vote on their own question/answer.
- Error Handling: Guest/unauthenticated attempt → MSG28; voting on own content → MSG28; target not found → MSG05; server failure → MSG05.
- Normal case: Member clicks up/down, the vote is recorded, and the count updates instantly.
- Abnormal case: A Guest clicking vote is prompted to sign in (MSG28); a server error leaves the previous count unchanged and shows MSG05.
#### 3.5.4 Browse, Search & Filter Questions

**Function trigger**

- Navigation path: /forum
- Timing / Frequency: On demand / whenever a user explores the forum, searches keywords, or filters by topic.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC38, UC39, UC44, UC45)
- Purpose: Provides a paginated, searchable, topic-filterable list of forum questions; public read access for everyone including Guests.
**Interface:** The forum list screen contains a Search keyword box, a Topic filter dropdown/sidebar, sort controls (Newest, Most Voted, Unanswered), and a results list where each row shows title, topic, vote count, answer count, author, and timestamp. Pagination/infinite-scroll at the bottom.

**Data processing**

- The client calls GET /api/questions?keyword=&topic=&sort=&page=; this endpoint is publicly readable (no role restriction), but the JWT, when present, enables personalised vote-state highlighting.
- The server queries the questions table (joined with topics and question_tags), applying a case-insensitive keyword match on title/body, an optional topic_id filter, the chosen sort order, and pagination.
- Results are returned and rendered.
**Screen layout:** [Figure — Browse & Search Questions screen layout (Web)]

**Function details**

- Data: question list rows (question_id, title, topic, vote_count, answer_count, author, created_at), keyword, topic filter, sort, page.
- Validation: Search keyword trimmed, ≤ 100 chars; Topic must be a valid catalogue value or "All".
- Business rules: BR-12 (Guests may read public content but cannot post/vote); topics are the Admin-managed catalogue (BR-14).
- Error Handling: No results → friendly empty-state message (not an error); invalid filter value ignored and reset to "All"; server failure → MSG05.
- Normal case: User enters a keyword and/or selects a topic; the list refreshes with matching questions.
- Abnormal case: A search with no matches shows the empty-state; a backend error shows MSG05 and retains the last good list.
#### 3.5.5 Manage Own Question (Edit / Delete)

**Function trigger**

- Navigation path: /forum/questions/{id} (Edit/Delete actions on a question owned by the current user)
- Timing / Frequency: On demand / whenever the author corrects or removes their question.
**Function description**

- Actors/Roles: Student, Alumni (author); Admin may remove any question (Covers UC46, UC47)
- Purpose: Lets a question's author update its content or delete it; Admins may also remove violating questions.
**Interface:** On questions owned by the user, an Edit button opens the same form as Ask Question pre-filled with title/body/topic/tags plus Save Changes and Cancel; a Delete button opens a confirmation modal with Confirm/Cancel.

**Data processing**

- Edit sends PUT /api/questions/{id}; delete sends DELETE /api/questions/{id}, both with the JWT.
- The server enforces ownership: @PreAuthorize plus a service check that author_id equals the caller (or the caller has the Admin role); editing updates the questions row and question_tags; deleting soft-deletes the question (status=deleted) and detaches/cascades its answers.
- The updated/removed state is reflected in the UI.
**Screen layout:** [Figure — Manage Own Question screen layout (Web)]

**Function details**

- Data: question_id, author_id, title, body, topic_id, tags[], status, updated_at.
- Validation: Same field rules as 3.5.1 (Title 10–150 chars, Details ≥ 20 chars, valid Topic).
- Business rules: BR-11 (only the author may edit/delete; Admin may remove any content); BR-08 (Admin-confirmed violations are hidden).
- Error Handling: Non-owner non-Admin attempt → MSG28; delete confirmation → MSG14; validation failure on edit → MSG01/MSG02; server failure → MSG05.
- Normal case: Author edits and saves (toast MSG04) or confirms delete (toast MSG27); the change is applied.
- Abnormal case: A user editing someone else's question is blocked by MSG28; cancelling the delete modal aborts with no change; a server error returns MSG05.
#### 3.5.6 Manage Own Answer (Edit / Delete)

**Function trigger**

- Navigation path: /forum/questions/{id} (Edit/Delete actions on an answer owned by the current user)
- Timing / Frequency: On demand / whenever the author corrects or removes their answer.
**Function description**

- Actors/Roles: Student, Alumni (author); Admin may remove any answer (Covers UC48, UC49)
- Purpose: Lets an answer's author update or delete their answer; Admins may also remove violating answers.
**Interface:** On answers owned by the user, an inline Edit toggle turns the answer body into an editable input with Save/Cancel; a Delete button opens a confirmation modal with Confirm/Cancel.

**Data processing**

- Edit sends PUT /api/answers/{id}; delete sends DELETE /api/answers/{id}, both with the JWT.
- The server enforces ownership (author_id equals caller, or caller is Admin); editing updates the answers.body and updated_at; deleting soft-deletes the answer (status=deleted) and decrements the parent question's answer_count.
- The list re-renders.
**Screen layout:** [Figure — Manage Own Answer screen layout (Web)]

**Function details**

- Data: answer_id, question_id, author_id, body, status, vote_count, updated_at.
- Validation: Answer body required, ≥ 10 chars (same as 3.5.2).
- Business rules: BR-11 (only the author may edit/delete; Admin may remove any content); BR-08 (Admin-confirmed violations are hidden).
- Error Handling: Non-owner non-Admin attempt → MSG28; delete confirmation → MSG14; empty body on edit → MSG01; server failure → MSG05.
- Normal case: Author edits and saves (toast MSG04) or confirms delete (toast MSG27).
- Abnormal case: Editing another user's answer is blocked by MSG28; cancelling delete aborts; a server error returns MSG05.
#### 3.5.7 Contribute Salary Data

**Function trigger**

- Navigation path: /salary/contribute
- Timing / Frequency: On demand / whenever a verified Alumni adds a salary data point.
**Function description**

- Actors/Roles: Alumni (verified only) (Covers UC50)
- Purpose: Lets a verified Alumni anonymously contribute a salary record (role, company/industry, level, location, amount, currency, period) to feed aggregate statistics; the contributor's identity is never linked to a displayed record.
**Interface:** The "Contribute Salary" screen contains: Job Title/Role field, Industry dropdown, Experience Level/Years field, Location dropdown, Gross Salary Amount numeric field, Currency dropdown, Pay Period dropdown (monthly/annual), an anonymity notice, a Submit button, and a Cancel button.

**Data processing**

- The client sends POST /api/salaries with the JWT; @PreAuthorize plus a service check confirm the caller is a verified Alumni (Students and unverified users are rejected).
- The server inserts a row into salaries storing only the data fields plus a non-displayable owner reference (kept solely for the contributor's own edit/delete, never exposed in any aggregate); no identity is attached to records returned by statistics endpoints.
- A success toast is shown.
**Screen layout:** [Figure — Contribute Salary Data screen layout (Web)]

**Function details**

- Data: salary_id, role, industry, experience_level, location, amount, currency, pay_period, created_at, owner_ref (hidden, never displayed).
- Validation: Amount required, positive numeric; Role, Industry, Location, Currency, Pay Period required; Experience Level numeric ≥ 0.
- Business rules: BR-03 (only verified Alumni may contribute salary data); BR-06 (salary contributions are stored anonymously; identity never linked to a displayed record); BR-13 (Students cannot contribute salary data).
- Error Handling: Student/unverified attempt → MSG11; empty required field → MSG01; non-numeric/negative amount → MSG02; server failure → MSG05.
- Normal case: Verified Alumni completes the form, submits, and the anonymous record is stored with toast MSG04.
- Abnormal case: A Student or unverified user is blocked by MSG11 and no record is saved; invalid amount triggers MSG02.
#### 3.5.8 Manage Own Salary Data (Edit / Delete)

**Function trigger**

- Navigation path: /salary/my-contributions
- Timing / Frequency: On demand / whenever a contributor corrects or removes their own salary record.
**Function description**

- Actors/Roles: Alumni (the contributing owner) (Covers UC51, UC52)
- Purpose: Lets a contributor update or delete their own previously submitted salary record while preserving full anonymity in any public view.
**Interface:** A private "My Salary Contributions" list (visible only to the owner) where each entry shows its own fields with an Edit button (re-opens the contribution form pre-filled) and a Delete button (confirmation modal Confirm/Cancel).

**Data processing**

- The list is fetched via GET /api/salaries/me; edit sends PUT /api/salaries/{id} and delete sends DELETE /api/salaries/{id}, all with the JWT.
- The server resolves records by the hidden owner_ref matching the caller, enforces that only the owner may edit/delete, updates or removes the salaries row, and recomputes affected aggregates; the owner reference is used only here and is never surfaced publicly.
- The list re-renders.
**Screen layout:** [Figure — Manage Own Salary Data screen layout (Web)]

**Function details**

- Data: salary_id, role, industry, experience_level, location, amount, currency, pay_period, owner_ref (hidden), updated_at.
- Validation: Same field rules as 3.5.7 (positive numeric amount; required role/industry/location/currency/period).
- Business rules: BR-03 (verified Alumni only); BR-06 (anonymity preserved; identity never linked to displayed records); BR-11 (only the owner may edit/delete their own contribution).
- Error Handling: Non-owner attempt → MSG28; delete confirmation → MSG14; validation failure → MSG01/MSG02; server failure → MSG05.
- Normal case: Owner edits and saves (toast MSG04) or confirms delete (toast MSG27); aggregates update.
- Abnormal case: Attempting to edit a record that is not the caller's is blocked by MSG28; cancelling delete aborts; a server error returns MSG05.
#### 3.5.9 View & Filter Salary Statistics

**Function trigger**

- Navigation path: /salary
- Timing / Frequency: On demand / whenever a member explores salary benchmarks.
**Function description**

- Actors/Roles: Student, Alumni (Covers UC53, UC54)
- Purpose: Displays anonymous, aggregate-only salary statistics (averages, medians, ranges, distribution charts) for a chosen filter, shown only when the anonymity threshold is met.
**Interface:** The Salary Board screen contains filter controls (Role, Industry, Experience Level, Location, Currency/Pay Period), an Apply Filters button, and a results panel showing aggregate metrics (average, median, min–max range, sample size, distribution chart). No individual salary rows or contributor identities are ever displayed.

**Data processing**

- The client sends GET /api/salaries/stats?role=&industry=&level=&location=&... with the JWT; @PreAuthorize confirms an authenticated Student/Alumni.
- The server aggregates matching rows in the salaries table for the filter and first counts the number of contributions; if the count is below the anonymity threshold (< 5), it returns no statistics and a threshold flag; otherwise it returns only aggregate metrics with no per-record or identity data.
- The panel renders charts/metrics, or the threshold notice.
**Screen layout:** [Figure — Salary Statistics screen layout (Web)]

**Function details**

- Data: filter criteria (role, industry, level, location, currency, period), aggregate outputs (average, median, min, max, percentile/distribution, sample_count).
- Validation: Filter values must be valid catalogue options or "All"; numeric ranges sanity-checked.
- Business rules: BR-06 (data is anonymous and aggregate-only); BR-07 (statistics are shown only when ≥ 5 contributions exist for the filter); BR-13 (Students may view salary/career features).
- Error Handling: Fewer than 5 contributions for the filter → MSG21 (statistics hidden); invalid filter ignored/reset to "All"; server failure → MSG05.
- Normal case: Member applies a filter with sufficient data and sees aggregate metrics and charts.
- Abnormal case: A filter with fewer than 5 contributions returns no statistics and shows MSG21; a backend error shows MSG05.
### 3.6 Alumni Map & Career Path

This module provides geographic and chronological visualisations of the alumni community, rendering aggregated alumni location data on an interactive client-side map and presenting rule-based career-timeline charts so users can explore where graduates live and how their careers have progressed.

#### 3.6.1 View Alumni Map

**Function trigger**

- Navigation path: /alumni-map
- Timing / Frequency: On demand / whenever a user opens the Alumni Map page from the main navigation.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC55)
- Purpose: Display an interactive world/region map populated with markers (or clustered markers) representing the geographic distribution of FPTU alumni, so users can visually explore where graduates are located.
**Interface:** The "Alumni Map" screen renders a full-width interactive map canvas powered by a client-side map library. Controls include a Zoom In / Zoom Out control, a Pan / drag gesture on the map canvas, a Marker cluster badge showing the count of alumni at a location, a Filter panel toggle (handled in 3.6.2), a Map legend describing marker/cluster meaning, and a Reset view button to return to the default extent. A summary counter label shows the total number of alumni currently plotted.

**Data processing**

- On page load, the React SPA issues GET /api/alumni-map/locations to retrieve aggregated location data; for Guests the request is unauthenticated, while Student/Alumni requests carry Authorization: Bearer <JWT>.
- The Spring Boot service queries the users (or user_profiles) and user_locations entities, selecting only users who have consented to appear and who have a resolvable location, and returns aggregated coordinates with per-location alumni counts (no precise personal address is exposed).
- The response is a list of { latitude, longitude, count, cohort, major } aggregate records; the client passes these to the map library, which renders markers and groups nearby markers into clusters.
- Public visibility follows RBAC: read access is open per BR-12, so no role check blocks rendering, but personalised actions remain disabled for Guests.
**Screen layout:** [Figure — View Alumni Map screen layout (Web)]

**Function details**

- Data: Aggregated alumni location records (latitude, longitude, alumni count per location, cohort, major); total plotted count.
- Validation: Coordinates returned by the API must be valid latitude (−90 to 90) and longitude (−180 to 180); records with missing/invalid coordinates are skipped client-side; the map library gracefully renders an empty map if zero records are returned.
- Business rules: BR-12 (Guests may view public content such as the map but cannot use personalised features); location data is shown only in aggregate, consistent with the platform's privacy posture.
- Error Handling: If the location API call fails or times out, the system shows MSG05 ("Something went wrong. Please try again later.") and offers a retry; if the map tile/library fails to load, a fallback message and retry control are shown.
- Normal case: The user opens the map, location data loads, and markers/clusters render; the user pans and zooms to explore alumni distribution.
- Abnormal case: The location service is unavailable (MSG05), the map library/tiles fail to load (fallback + retry), or no alumni location data exists yet (empty map with an informational placeholder).
#### 3.6.2 Filter Map

**Function trigger**

- Navigation path: /alumni-map (filter panel)
- Timing / Frequency: On demand / whenever a user applies or changes cohort/major filters on the map.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC56)
- Purpose: Narrow the alumni plotted on the map to a specific graduation cohort (year) and/or major so users can focus the geographic view on a relevant subset of alumni.
**Interface:** A Filter panel overlaid on the Alumni Map screen contains a Cohort / Graduation Year dropdown (single-select or range), a Major / Field dropdown, an Apply Filters button, and a Clear Filters button. The summary counter updates to reflect the filtered total.

**Data processing**

- When the user applies filters, the client issues GET /api/alumni-map/locations?cohort={year}&major={major} (parameters omitted when "All" is selected).
- The service applies the cohort/major predicates to the users/user_profiles query, recomputes aggregated coordinates and counts, and returns the filtered aggregate set.
- The map library re-renders markers/clusters in place and the client updates the plotted-count label; cohort and major option lists are sourced from reference data on the cohorts/majors (or enum) tables.
- No state is persisted server-side; filters are query parameters only. RBAC is unchanged (public read per BR-12).
**Screen layout:** [Figure — Filter Map screen layout (Web)]

**Function details**

- Data: Selected cohort (graduation year), selected major; filtered aggregated location records and filtered total count.
- Validation: Cohort must be a valid year present in the reference list; major must be a valid option from the reference list; invalid/unknown filter values are rejected and the previous valid view is retained.
- Business rules: BR-12 (filtering is a public read-only capability available to Guests as well as members); aggregate-only display is preserved under every filter.
- Error Handling: If the filtered query fails, the system shows MSG05 and retains the prior map state; if a filter combination yields zero alumni, an inline "No alumni match the selected filters." placeholder is shown and the map clears markers (no error toast).
- Normal case: The user selects a cohort and/or major, clicks Apply, and the map re-renders the matching subset with an updated count.
- Abnormal case: The filter query fails (MSG05, prior state kept) or the combination returns no results (empty-result placeholder, not an error).
#### 3.6.3 View Profile from Marker

**Function trigger**

- Navigation path: /alumni-map → marker pop-up → /profile/{userId}
- Timing / Frequency: On demand / whenever a user clicks a marker or a person entry within a cluster pop-up.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC57)
- Purpose: Allow a user who clicks a map marker (or expands a clustered location) to view the corresponding alumni and open their public profile.
**Interface:** Clicking a marker opens a Marker pop-up / info window showing the location label and, where the marker represents a single alumni or an expanded cluster, a short alumni list item with name, avatar, cohort, and major plus a View Profile link. For clusters, the pop-up lists the alumni at that location with paging where needed.

**Data processing**

- On marker click for a single-alumni marker, the client requests the public profile via GET /api/users/{id} (or navigates to the profile route which loads it); for a cluster the client may call GET /api/alumni-map/locations/{locationId}/users to list the alumni at that point before navigation.
- The service returns only public profile fields (name, avatar, cohort, major, verified badge) from the users/user_profiles entities; private fields are omitted for Guests.
- Selecting View Profile navigates to /profile/{userId}, reusing the View Profile capability of Module 2 (3.3.4); RBAC allows public read per BR-12 while gated actions (message, connect) remain hidden for Guests.
**Screen layout:** [Figure — View Profile from Marker screen layout (Web)]

**Function details**

- Data: Target user id, public profile summary (name, avatar, cohort, major, verified badge); for clusters, the list of users at the location.
- Validation: The user id resolved from a marker must exist and reference an active, visible account; markers referencing deleted/hidden accounts are filtered out before rendering.
- Business rules: BR-12 (Guests may view public profiles but cannot perform personalised actions); only public profile data is exposed via the marker pop-up.
- Error Handling: If the referenced profile is missing or the account is locked/hidden, the system shows MSG05 (or an inline "This profile is no longer available." note) and closes the pop-up; gated actions attempted by a Guest surface the relevant Module-2 prompt rather than executing.
- Normal case: The user clicks a marker, sees the alumni summary, clicks View Profile, and lands on the public profile page.
- Abnormal case: The profile no longer exists or is hidden (informational note / MSG05), or the cluster-user list call fails (MSG05 with retry).
#### 3.6.4 View Career Path

**Function trigger**

- Navigation path: /career-path
- Timing / Frequency: On demand / whenever a user opens the Career Path page to explore alumni career timelines.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC58)
- Purpose: Present a rule-based visualisation of aggregated alumni career timelines (e.g., common progression of roles and companies over the years after graduation) so users can understand typical career trajectories of FPTU graduates.
**Interface:** The "Career Path" screen renders a timeline/flow chart (a rule-based visualisation, not AI-generated) showing career stages along a time axis, with stage nodes labelled by role/title and transition edges indicating common progressions. Controls include a Chart legend, a Zoom / fit-to-view control, node hover/tooltip showing the aggregated count for that stage, and a Filter panel toggle (handled in 3.6.5).

**Data processing**

- On page load, the client issues GET /api/career-path (unauthenticated for Guests; Authorization: Bearer <JWT> for members) to retrieve aggregated career-timeline data.
- The service reads alumni career-timeline entries from the career_timeline (career_entries) entity created in Module 2, groups them by years-since-graduation and role/company using deterministic rules, and returns aggregated stage nodes and transitions with counts (no individual identity is attached to the aggregate chart).
- The client renders the chart with the map/chart visualisation library; data is computed by fixed business rules only (no AI/ML), consistent with the project's rule-based recommendation constraint.
- RBAC permits public read per BR-12; only aggregate data is returned, never a named individual's full timeline.
**Screen layout:** [Figure — View Career Path screen layout (Web)]

**Function details**

- Data: Aggregated career stages (role/title, company or industry, years-after-graduation bucket), transition counts between stages, total alumni contributing to each stage.
- Validation: Career-timeline entries with incomplete dates or roles are excluded from aggregation; stages with counts below the display threshold may be grouped into an "Other" node to preserve readability and privacy.
- Business rules: BR-12 (public read access); visualisation is rule-based and aggregate-only (no AI/ML, no per-person disclosure).
- Error Handling: If the career-path API fails, the system shows MSG05 with a retry; if no qualifying timeline data exists, an informational empty-state placeholder ("Not enough career data to display a path yet.") is shown instead of a chart.
- Normal case: The user opens the page, aggregated timeline data loads, and the rule-based career-path chart renders for exploration.
- Abnormal case: The career-path service is unavailable (MSG05) or there is insufficient data to build a chart (empty-state placeholder).
#### 3.6.5 Search / Filter Career Path

**Function trigger**

- Navigation path: /career-path (filter / search panel)
- Timing / Frequency: On demand / whenever a user searches or applies filters to the Career Path chart.
**Function description**

- Actors/Roles: Guest, Student, Alumni (Covers UC59)
- Purpose: Let users search by role/keyword and filter the career-path visualisation by cohort, major, or industry so the displayed trajectories reflect a chosen segment of alumni.
**Interface:** A Search / Filter panel on the Career Path screen contains a Keyword / Role search text input, a Cohort / Graduation Year dropdown, a Major / Field dropdown, an Industry / Company dropdown, an Apply button, and a Clear button. The chart re-renders to reflect the active criteria, and a result summary label states how many alumni timelines are reflected.

**Data processing**

- On search/apply, the client issues GET /api/career-path?q={keyword}&cohort={year}&major={major}&industry={industry} with only the supplied parameters.
- The service applies the predicates to the career_timeline aggregation query, recomputes the rule-based stage nodes and transitions for the matching subset, and returns the filtered aggregate set with a contributing-alumni count.
- The chart library re-renders the filtered career path in place; dropdown option lists are sourced from the cohorts/majors/industries reference data. No server-side state is persisted; criteria are query parameters only.
- RBAC is unchanged (public read per BR-12); aggregate-only output is preserved for every filter combination.
**Screen layout:** [Figure — Search / Filter Career Path screen layout (Web)]

**Function details**

- Data: Search keyword/role, selected cohort, selected major, selected industry; filtered aggregated stage nodes/transitions and contributing-alumni count.
- Validation: Keyword length is bounded (e.g., ≤ 100 characters) and sanitised; cohort/major/industry values must exist in the reference lists; invalid filter values are rejected and the previous valid chart is retained.
- Business rules: BR-12 (search/filter is a public read-only capability); the visualisation remains rule-based and aggregate-only under all criteria.
- Error Handling: If the filtered query fails, the system shows MSG05 and keeps the prior chart state; if the criteria yield no qualifying timelines, an inline "No career data matches your search." placeholder is shown (no error toast).
- Normal case: The user enters a keyword and/or selects filters, clicks Apply, and the career-path chart re-renders for the matching segment with an updated count.
- Abnormal case: The filtered query fails (MSG05, prior state kept) or the criteria return no qualifying data (empty-result placeholder).
### 3.7 Admin Dashboard & System

This module provides the Admin operator with the centralized back-office of AlumNect, covering platform KPIs, user and verification management, content moderation (feed/jobs/Q&A), event management, payment and revenue oversight, broadcast notifications, and module analytics; every function in this section is restricted to the Admin role through RBAC, served under /api/admin/..., and guarded by @PreAuthorize("hasRole('ADMIN')").

#### 3.7.1 Admin Dashboard (KPIs)

_(Covers UC60)_

**Function trigger**

- Navigation path: /admin/dashboard
- Timing / Frequency: On demand; loaded each time an Admin signs in to the back-office and refreshed on demand.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Present an at-a-glance overview of platform health through key performance indicators (KPIs) so the Admin can monitor growth and activity from a single landing page.
**Interface:** The Admin Dashboard screen, reachable after Admin login, displaying a left navigation rail (Users, Feed, Jobs, Events, Forum, Payments, Notifications, Analytics) and a main panel of summary KPI cards: "Total Users", "New Users (period)", "Verified Alumni", "Pending Verifications", "Total Posts", "Active Jobs", "Upcoming Events", "Total Revenue", and "Open Reports". Controls include a Time-range selector (Today / 7 days / 30 days / Custom), a Refresh button, and clickable cards that deep-link to the relevant management screen.

**Data processing**

- On load, the SPA issues GET /api/admin/dashboard/summary?range={range} carrying Authorization: Bearer <JWT>; Spring Security validates the token and @PreAuthorize("hasRole('ADMIN')") confirms the Admin role.
- The service runs aggregate count/sum queries across the users, verification_requests, posts, jobs, events, payments, and reports tables/entities, scoped by the selected date range.
- Results are returned as a single summary DTO; clicking a card routes to the corresponding sub-module (e.g., "Pending Verifications" → 3.7.3).
**Screen layout:** [Figure — Admin Dashboard (KPIs) screen layout (Web)]

**Function details**

- Data: total/new user counts, verified-alumni count, pending-verification count, post count, active-job count, upcoming-event count, aggregated revenue, open-report count, selected time range.
- Validation: the time-range selector must resolve to a valid range; a custom range requires from ≤ to and both not in the future.
- Business rules: BR-14 (only Admin may view analytics/revenue).
- Error Handling: invalid custom range → in-line MSG02; aggregation/API failure → toast MSG05; a non-Admin token reaching the endpoint → HTTP 403 with MSG28.
- Normal case: Admin opens the dashboard, KPI cards populate for the default range, and the Admin can switch range or drill into a card.
- Abnormal case: backend timeout or query error leaves cards empty with MSG05 and a retry option; expired JWT redirects to login.
#### 3.7.2 Manage Users

_(Covers UC61, UC62, UC63)_

**Function trigger**

- Navigation path: /admin/users, /admin/users/{id}
- Timing / Frequency: On demand whenever the Admin needs to browse, inspect, or restrict accounts.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Allow the Admin to list and search all accounts, view a full account detail, and lock or unlock an account to enforce platform policy. The Admin may also use the Alumni Search & Directory (3.3.5) to locate accounts.
**Interface:** 

- 3.7.2.1 User List: a paginated table-less card/list view of all accounts with Search (name/email), Role filter (Student/Alumni/Admin), Status filter (Active/Locked/Pending), and Verified filter; each row shows avatar, full name, email, role, verified badge, status, and join date, with a View detail action.
- 3.7.2.2 User Detail: a profile panel showing the account's identity fields, role context, verification status and submitted proof, activity counters (posts/jobs/events), report history, and current account status, with Lock account / Unlock account buttons.
- 3.7.2.3 Lock / Unlock: the Lock action opens a confirmation modal (MSG26) before applying.
**Data processing**

- User list: GET /api/admin/users?query=&role=&status=&verified=&page= returns a paged projection from the users entity.
- User detail: GET /api/admin/users/{id} joins users with verification_requests, reports, and activity counts.
- Lock: PUT /api/admin/users/{id}/lock; Unlock: PUT /api/admin/users/{id}/unlock; the service flips the account status field, and on lock it revokes the user's refresh token so the user is signed out and cannot log in. All endpoints require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Manage Users (list/detail/lock-unlock) screen layout (Web)]

**Function details**

- Data: user id, full name, email, role, verified flag, account status, join date, submitted proof, activity counters, report history.
- Validation: search/filter parameters must be valid enum/string values; pagination bounds enforced; an Admin account cannot lock itself.
- Business rules: BR-14 (only Admin may lock/unlock accounts); BR-11 (Admin authority over the platform); BR-23 (Admin is a separately provisioned role).
- Error Handling: lock/unlock confirmation uses MSG26; user not found → MSG05/404; attempt to lock self or another Admin without authority → MSG28; on success a toast MSG04 ("Account updated successfully.").
- Normal case: Admin filters the list, opens a user, confirms a lock via MSG26, and the account becomes Locked and signed out.
- Abnormal case: token of a now-locked user is rejected on next request; database error during status update rolls back and shows MSG05.
#### 3.7.3 Approve Alumni Verification

_(Covers UC64)_

**Function trigger**

- Navigation path: /admin/verifications
- Timing / Frequency: On demand whenever pending verification requests exist (pairs with the user-side "Submit Alumni Verification", FE-04).
**Function description**

- Actors/Roles: Admin only.
- Purpose: Review FPTU-related proof submitted by registered users and approve or reject the alumni status and verified badge.
**Interface:** The Verification Queue screen listing pending requests with submitter name, email, graduation year, major/cohort, and the submitted evidence image; selecting a request opens a detail panel showing the full proof, a zoomable evidence image, and Approve and Reject buttons, the latter opening a modal with a required Rejection reason field.

**Data processing**

- Queue: GET /api/admin/verifications?status=pending&page= reads verification_requests.
- Approve: PUT /api/admin/verifications/{id}/approve sets the request to approved, updates the linked users row to role/context Alumni and verified = true, and triggers an in-app notification (MSG10 "Your alumni account has been verified.") to the user.
- Reject: PUT /api/admin/verifications/{id}/reject with the reason records the outcome and notifies the user. Endpoints require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Approve Alumni Verification screen layout (Web)]

**Function details**

- Data: request id, submitter identity, graduation year, major/cohort, evidence image reference, request status, rejection reason.
- Validation: rejection requires a non-empty reason; only requests in pending state may be acted on; evidence image must be present.
- Business rules: BR-02 (alumni status and verified badge granted only after Admin approval); BR-14 (only Admin may verify accounts).
- Error Handling: empty rejection reason → in-line MSG01; acting on an already-resolved request → MSG05/conflict; success on approve → MSG10 to the user and MSG04 to the Admin.
- Normal case: Admin opens a pending request, reviews proof, clicks Approve, the user is upgraded to verified Alumni and notified.
- Abnormal case: evidence cannot be loaded from object storage → MSG05 and the request stays pending; concurrent approval by another Admin shows a stale-state error.
#### 3.7.4 Moderate Feed Posts

_(Covers UC65, UC66, UC67, UC68, UC69, UC70, UC71)_

**Function trigger**

- Navigation path: /admin/posts, /admin/reports/posts, /admin/reports/posts/{id}
- Timing / Frequency: On demand and reactively whenever community posts are reported.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Let the Admin browse and search all posts, review reported posts, inspect a report's detail, hide violating posts, and resolve reports.
**Interface:** 

- 3.7.4.1 All Posts: a list of every post with Search (keyword), Filter (author, date, status: visible/hidden), each row showing author, snippet, like/comment counts, status, and a Hide / Unhide action.
- 3.7.4.2 Reported Posts: a queue of posts with open reports, showing report count, latest reason, and reported-by.
- 3.7.4.3 Feed Report Detail: a panel showing the reported post in context, all report entries (reporter, reason, timestamp), and Hide content and Resolve report actions; Hide opens confirmation MSG24.
**Data processing**

- All posts: GET /api/admin/posts?query=&author=&status=&page= over posts.
- Reported list: GET /api/admin/reports/posts?page= over reports joined with posts.
- Report detail: GET /api/admin/reports/posts/{id}.
- Hide: PUT /api/admin/posts/{id}/hide sets the post status = hidden and notifies the author; Unhide: PUT /api/admin/posts/{id}/unhide.
- Resolve: PUT /api/admin/reports/posts/{id}/resolve with an outcome (confirmed-violation / dismissed) closes the report(s). All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Moderate Feed Posts (view/search/hide/reports/resolve) screen layout (Web)]

**Function details**

- Data: post id, author, content snippet, engagement counts, post status, report id, report reason, reporter, report status/outcome.
- Validation: filter/search params valid; resolve requires a chosen outcome; a post must exist before hide.
- Business rules: BR-08 (reported content queued for review and hidden once a violation is confirmed); BR-11 (Admin may hide/remove any content); BR-14 (Admin moderates content).
- Error Handling: hide confirmation via MSG24 ("Hide this content from the community? The author will be notified."); resolve with no outcome → MSG01; post/report not found → MSG05/404; success → MSG04.
- Normal case: Admin opens a report, confirms Hide via MSG24, the post is hidden, the author is notified, and the report is resolved as confirmed.
- Abnormal case: post already deleted by author → resolve still closes the report with a note; storage/DB error → MSG05 and no state change.
#### 3.7.5 Moderate Job Listings

_(Covers UC75, UC76, UC77)_

**Function trigger**

- Navigation path: /admin/jobs, /admin/reports/jobs, /admin/reports/jobs/{id}
- Timing / Frequency: On demand and reactively whenever job listings are reported.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Allow the Admin to view all job listings, review reported jobs, inspect a job report's detail, and hide violating job listings. Admins inspect full job detail from within the Content Moderation screen (no member Job Detail screen is granted to Admins).
**Interface:** 

- 3.7.5.1 All Jobs: a list of all job listings with Search (title/company) and Filter (status: active/draft/pending/expired/hidden, poster), each row showing title, company, poster, package status, visibility, and a Hide / Unhide action.
- 3.7.5.2 Reported Jobs: a queue of jobs with open reports, showing report count and reason.
- 3.7.5.3 Job Report Detail: a panel showing the reported job, all report entries, and Hide content (confirmation MSG24) plus Resolve actions.
**Data processing**

- All jobs: GET /api/admin/jobs?query=&status=&poster=&page= over jobs.
- Reported list: GET /api/admin/reports/jobs?page= over reports joined with jobs.
- Report detail: GET /api/admin/reports/jobs/{id}.
- Hide: PUT /api/admin/jobs/{id}/hide sets the job status = hidden, makes it non-public, and notifies the poster; resolve: PUT /api/admin/reports/jobs/{id}/resolve. All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Moderate Job Listings screen layout (Web)]

**Function details**

- Data: job id, title, company, poster, package/payment status, visibility, report id, reason, reporter, report outcome.
- Validation: filter/search params valid; resolve requires an outcome; job must exist before hide.
- Business rules: BR-08 (reported content hidden on confirmed violation); BR-11 (Admin may remove any content); BR-04 (hidden job is no longer publicly visible); BR-14.
- Error Handling: hide confirmation via MSG24; missing outcome → MSG01; job/report not found → MSG05/404; success → MSG04.
- Normal case: Admin reviews a reported job, confirms Hide via MSG24, the job becomes hidden and the poster is notified.
- Abnormal case: job already expired by package rules (BR-05) → hide still applied; DB error → MSG05 with rollback.
#### 3.7.6 Manage Events

_(Covers UC72, UC73, UC74)_

**Function trigger**

- Navigation path: /admin/events, /admin/events/{id}, /admin/events/new, /admin/events/{id}/edit, /admin/events/{id}/attendees
- Timing / Frequency: On demand whenever the Admin manages platform events or extracts attendee data.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Enable the Admin to view all events and details, create platform/official events, edit any event, view an event's attendee list, and export attendees.
**Interface:** 

- 3.7.6.1 All Events / Detail: a list of all events with Search/Filter (status, date, organiser), each opening a detail panel (title, description, date/time, location, organiser, RSVP count, status).
- 3.7.6.2 Create / Edit Event: a form with Title, Description, Date & Time, Location, Cover image (JPG/PNG/JPEG ≤ 10MB), and Capacity; available for new events and for editing any existing event.
- 3.7.6.3 Attendee List / Export: the detail panel's Attendees tab listing registered users (name, email, RSVP date) with an Export button producing a downloadable file.
**Data processing**

- List/detail: GET /api/admin/events?query=&status=&page=, GET /api/admin/events/{id} over events.
- Create: POST /api/admin/events; Edit: PUT /api/admin/events/{id} — both write events.
- Attendees: GET /api/admin/events/{id}/attendees over event_rsvps joined with users.
- Export: GET /api/admin/events/{id}/attendees/export streams a CSV/Excel file. All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Manage Events (view/create/edit/attendees/export) screen layout (Web)]

**Function details**

- Data: event id, title, description, date/time, location, cover image, capacity, organiser, RSVP count, attendee identity rows.
- Validation: title/date/location required; event date must be valid; cover image must be JPG/PNG/JPEG ≤ 10MB; capacity a positive integer when set.
- Business rules: BR-14 (Admin manages events); BR-16 (image type/size); BR-11 (Admin may edit any event).
- Error Handling: empty required field → MSG01; invalid date → MSG02; bad image → MSG12; create/edit success → MSG04; export with zero attendees → an empty-state notice; failure → MSG05.
- Normal case: Admin creates or edits an event, saves successfully (MSG04), then opens attendees and exports the list.
- Abnormal case: upload of an oversized image → MSG12 and form not submitted; export I/O failure → MSG05 with retry.
#### 3.7.7 Manage Forum Topics & Moderate Q&A

_(Covers UC78, UC79, UC80, UC81, UC82)_

**Function trigger**

- Navigation path: /admin/forum/topics, /admin/forum/topics/new, /admin/forum/topics/{id}/edit, /admin/reports/questions, /admin/reports/answers
- Timing / Frequency: On demand for topic catalogue maintenance and reactively when questions/answers are reported.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Let the Admin maintain the forum topic catalogue (view/create/edit) and moderate reported/violating questions and answers.
**Interface:** 

- 3.7.7.1 Topic Catalogue: a list of forum topics with name, slug, question count, and status; Create topic and Edit topic open a form with Topic name, Description, and Active toggle.
- 3.7.7.2 Violating Questions / Answers: queues of reported questions and reported answers, each entry showing content snippet, author, report reason, and a Hide content action (confirmation MSG24) plus Resolve.
**Data processing**

- Topics: GET /api/admin/forum/topics; create POST /api/admin/forum/topics; edit PUT /api/admin/forum/topics/{id} over the topics entity.
- Reported questions: GET /api/admin/reports/questions; reported answers: GET /api/admin/reports/answers over reports joined with questions / answers.
- Hide: PUT /api/admin/questions/{id}/hide and PUT /api/admin/answers/{id}/hide set the content status = hidden and notify the author; resolve closes the report. All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Manage Forum Topics & Moderate Q&A screen layout (Web)]

**Function details**

- Data: topic id, name, slug, description, active flag, question count; question/answer id, content snippet, author, report reason, content status.
- Validation: topic name required and unique; reported-content hide requires the item to exist; resolve requires an outcome.
- Business rules: BR-14 (Admin manages forum topics and moderates content); BR-08 (violating content hidden on confirmation); BR-11 (Admin may hide any content).
- Error Handling: empty/duplicate topic name → MSG01/MSG02 (in-line); hide confirmation via MSG24; success → MSG04; not found → MSG05/404.
- Normal case: Admin creates or edits a topic and saves (MSG04); separately, Admin hides a violating answer after MSG24 confirmation and resolves the report.
- Abnormal case: duplicate topic name on save → in-line error and no insert; deleting target content concurrently → resolve closes the report with a note.
#### 3.7.8 Manage Payments & Revenue

_(Covers UC83, UC84, UC85, UC86)_

**Function trigger**

- Navigation path: /admin/payments, /admin/payments/revenue, /admin/payments/recruiters/{id}, /admin/payments/complaints
- Timing / Frequency: On demand whenever the Admin reviews transactions, revenue, recruiter history, or payment complaints.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Provide oversight of all transactions, aggregated revenue statistics, per-recruiter package history, and resolution of payment complaints.
**Interface:** 

- 3.7.8.1 Transaction List: a list of all payments with Search/Filter (status: success/failed/pending, payer, date range, package), each row showing transaction id, payer, package, amount, gateway, status, and timestamp.
- 3.7.8.2 Revenue Stats: a panel of revenue charts/KPIs by period and package (total revenue, count of paid packages, trend), with a Period selector.
- 3.7.8.3 Recruiter Package History: a per-Alumni view listing that recruiter's purchased packages, durations, quotas, and statuses.
- 3.7.8.4 Resolve Complaint: a complaints queue; opening a complaint shows the linked transaction, the owner's message, and Resolve controls (uphold/refund-mark / reject) with a required Resolution note.
**Data processing**

- Transactions: GET /api/admin/payments?status=&payer=&from=&to=&page= over payments.
- Revenue: GET /api/admin/payments/revenue?period= aggregates payments (sum of successful payment amounts).
- Recruiter history: GET /api/admin/payments/recruiters/{id} joins payments with packages.
- Complaints: GET /api/admin/payments/complaints; resolve PUT /api/admin/payments/complaints/{id}/resolve records the outcome and note and notifies the owner. All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Manage Payments & Revenue screen layout (Web)]

**Function details**

- Data: transaction id, payer, package, amount, gateway, status, timestamp; aggregated revenue figures; recruiter package durations/quotas; complaint id, owner, message, resolution outcome/note.
- Validation: filter/period params valid; resolution requires a chosen outcome and note; only complaints linked to a real transaction may be resolved.
- Business rules: BR-22 (payments via PayOS; refunds/complaints resolved by Admin); BR-21 (complaint filed only by the transaction owner within the window); BR-14 (only Admin views revenue); BR-05 (package duration/quota reflected in recruiter history).
- Error Handling: missing resolution note/outcome → MSG01; transaction/complaint not found → MSG05/404; aggregation failure → MSG05; success → MSG04.
- Normal case: Admin filters transactions, reviews revenue for a period, opens a complaint, records a resolution with a note, and the owner is notified.
- Abnormal case: complaint outside the allowed window flagged read-only (BR-21); revenue query timeout → MSG05 with retry.
#### 3.7.9 Notifications & Analytics

_(Covers UC87, UC88, UC89)_

**Function trigger**

- Navigation path: /admin/notifications, /admin/notifications/history, /admin/analytics
- Timing / Frequency: On demand whenever the Admin broadcasts a notification, reviews sent history, or inspects module analytics.
**Function description**

- Actors/Roles: Admin only.
- Purpose: Allow the Admin to broadcast in-app notifications to a target audience, review the history of sent broadcasts, and analyze module-level metrics across posts, events, and recruitment.
**Interface:** 

- 3.7.9.1 Broadcast Notification: a composer with Audience selector (All / Students / Alumni / segment), Title, Message body, and an optional Link, plus a Send button with a confirmation step.
- 3.7.9.2 Sent-Notification History: a list of past broadcasts showing title, audience, recipient count, sender, and sent timestamp, with a View action.
- 3.7.9.3 Module Analytics: a dashboard of charts/KPIs for Posts (volume, engagement), Events (created, RSVPs, attendance), and Recruitment (jobs posted, packages sold), with a Time-range selector and Module tabs.
**Data processing**

- Broadcast: POST /api/admin/notifications/broadcast resolves the target audience from users, writes a notifications row per recipient (or a broadcast record fanned out), and returns the delivered count for the success message.
- History: GET /api/admin/notifications/history?page= over the broadcast records.
- Analytics: GET /api/admin/analytics?module=&range= aggregates posts, events/event_rsvps, and jobs/packages. All require @PreAuthorize("hasRole('ADMIN')").
**Screen layout:** [Figure — Notifications & Analytics screen layout (Web)]

**Function details**

- Data: audience selection, notification title/body/link, recipient count, sent timestamp; analytics metrics per module (post volume/engagement, event/RSVP counts, jobs/packages sold), selected range.
- Validation: title and message body required; audience must resolve to ≥ 1 recipient; analytics range valid (from ≤ to).
- Business rules: BR-14 (only Admin may broadcast and view analytics).
- Error Handling: empty title/body → in-line MSG01; audience resolving to zero recipients → MSG05/warning; successful send → toast MSG23 ("Notification sent to {count} users."); analytics failure → MSG05.
- Normal case: Admin composes a broadcast, confirms send, sees MSG23 with the recipient count, then reviews the entry in Sent history and inspects module analytics.
- Abnormal case: partial fan-out failure surfaces MSG05 while recording the broadcast as partially sent; analytics query timeout shows MSG05 with retry.
## 4. Non-Functional Requirements

### 4.1 External Interfaces

### User Interfaces

- Responsive Web Application (all roles): AlumNect is delivered as a single responsive web application built with ReactTS + TailwindCSS, optimised for modern desktop and mobile browsers (Chrome, Edge, Firefox, Safari). Guests, Students and Alumni share the same member-facing interface, with features progressively enabled by role.
- Admin Dashboard: A dedicated administrative area (same web app, Admin role) focused on data visualisation — KPI cards, growth and activity charts, moderation queues, and the alumni-distribution map — designed for clarity and fast operational workflows.
- Accessibility & consistency: A consistent TailwindCSS design system, no more than three font families per page, sufficient colour contrast, keyboard-navigable forms, and clear inline/toast/modal feedback for every action.
### External Systems & Services

- Google OAuth 2.0: Federated sign-in/registration; the backend exchanges the authorization code for the user's verified email and basic profile.
- PayOS: A Vietnamese payment gateway used to purchase job-posting packages; the backend creates payment requests / payment links and verifies signed PayOS webhooks. Real settlement is out of scope for the capstone (PayOS test mode is used during development).
- Email Service: Transactional email (SMTP/API provider) for account verification, password reset, and key notifications.
- Object Storage: Cloud object storage (e.g. AWS S3 / Cloudinary) for avatars, post images/videos, and verification evidence; the backend stores only object references in PostgreSQL.
- Map Provider: A web map library/API (e.g. Mapbox GL JS / Leaflet + OpenStreetMap / Google Maps) renders the interactive Alumni Map from aggregated, non-precise location data.
- There is no hardware, IoT, SMS, or push-notification integration; notifications are in-app and (optionally) by email.
### 4.2 Quality Attributes

#### 4.2.1 Usability

- Learnability: A first-time Student/Alumni should understand core navigation (feed, profile, search, events) without training. Admins should become productive with moderation and verification within 30–60 minutes using the user manual.
- Task efficiency: Core actions are short — publishing a post, sending a message, RSVPing to an event, or reporting content each take no more than 3 interactions.
- Consistency & feedback: Every create/update/delete action produces an explicit inline, toast, or modal message (see §5.3); destructive actions require a confirmation modal.
#### 4.2.2 Reliability

- Availability: The platform targets ≥ 99% uptime; maintenance is scheduled during off-peak hours and announced in advance.
- Data integrity & backup: PostgreSQL is backed up daily; transactions (payments, verification state changes) are atomic; foreign-key and unique constraints prevent orphaned or duplicate records.
- Graceful degradation: Failures of external services (email, payment, map, storage) are caught and surfaced as user-friendly messages (MSG05) without crashing the application.
#### 4.2.3 Performance

- API response time: Standard REST endpoints (feed pagination, lists, profile reads) respond within ~500 ms (p95) under normal load.
- Page load: Primary pages render within 2–3 seconds on a standard broadband connection; the feed and lists use pagination/infinite scroll rather than loading all records.
- Concurrency: The backend supports at least 1,000 concurrent users without degradation, with stateless JWT authentication enabling horizontal scaling.
- Media handling: Images are validated and size-limited (≤ 10MB, JPG/PNG/JPEG) and served from object storage/CDN to keep page weight low.
#### 4.2.4 Security

- Authentication: JWT access tokens (short-lived) with refresh tokens; Google OAuth 2.0 for federated login; tokens revoked on logout (BR-20).
- Authorization: Strict RBAC via Spring Security (@PreAuthorize role checks). Guests are read-only; Students cannot post jobs or contribute salary; only Admin can verify accounts, moderate content, and view analytics/revenue (BR-12, BR-13, BR-14).
- Data privacy: Passwords stored only as BCrypt hashes (BR-19); PII access restricted by role; salary contributions are stored anonymously and exposed only as aggregates above a contribution threshold (BR-06, BR-07).
- Transport & input security: All client–server traffic over HTTPS/TLS; server-side validation against SQL injection (parameterised JPA queries) and XSS (output encoding/sanitisation); CSRF protection on state-changing requests; rate limiting on sensitive actions (BR-09, BR-10).
- Payment security: Payment is delegated to PayOS; webhooks are verified by signature; the application never stores card data.
#### 4.2.5 Maintainability

- Modular architecture: The backend follows a layered Spring Boot architecture (Controller → Service → Repository) with clear separation of concerns and DTO boundaries; the frontend is organised by feature modules and reusable components.
- Deployability: The application is containerised with Docker, enabling reproducible builds and horizontal scaling; configuration is externalised via environment variables/profiles.
- Observability: Centralised structured logging captures API errors and key events; a health-check endpoint (/actuator/health) lets operators detect API/database problems proactively.
- Code quality: Version control via Git/GitHub with pull-request review; consistent naming and module boundaries support future feature growth.
## 5. Requirement Appendix

### 5.1 Business Rules

<!-- Source table 12 from SRS DOCX -->
| ID | Rule Definition |
| --- | --- |
| BR-01 | Registration requires a valid, unique email; the email must be verified before the account is activated. |
| BR-02 | Alumni status and the verified badge are granted only after an Admin approves the FPTU-related proof the user submits. |
| BR-03 | Only verified Alumni may post job/recruitment listings and contribute salary data. |
| BR-04 | A job listing becomes publicly visible only after a posting package is successfully paid; otherwise alumni can’t post job. |
| BR-05 | There is only one package available; you will not be able to post articles once the package expires. Articles that have expired will remain public. |
| BR-06 | Salary contributions are stored anonymously; a contributor's identity is never linked to a displayed salary record. |
| BR-07 | Salary statistics for a given filter are displayed only when at least 5 contributions exist for that filter (anonymity threshold).- |
| BR-08 | Reported content is queued for Admin review and is hidden once an Admin confirms a violation. |
| BR-09 | A user may submit at most 5 reports per 10 minutes (anti-abuse). |
| BR-10 | A user may create at most 10 posts per hour (anti-spam). |
| BR-11 | Only the author may edit or delete their own content; an Admin may hide or remove any content. |
| BR-12 | Guests may view public content but cannot like, comment, message, RSVP, post, or use personalised features. |
| BR-13 | Students may use social, messaging, events, Q&A, and view salary/career features, but cannot post jobs or contribute salary data. |
| BR-14 | Only Admin may verify accounts, lock/unlock accounts, moderate content, manage forum topics, and view analytics/revenue. |
| BR-15 | Messaging is available only between authenticated members; a blocked user's messages are not delivered. |
| BR-16 | Uploaded images must be in JPG/PNG/JPEG/MP4 format and must not exceed 100MB. |
| BR-17 | Event RSVP is allowed only while the event status is "upcoming/open"; it is disabled once the event is cancelled or past. |
| BR-18 | Cancelling an event automatically notifies all registrants (in-app). |
| BR-19 | Passwords must be at least 8 characters with mixed character types and are stored only as BCrypt hashes; plain passwords are never stored or logged. |
| BR-20 | A JWT access token expires after a defined period; logging out revokes the refresh token. |
| BR-21 | A payment complaint may be filed only by the transaction's owner |
| BR-22 | All payments are processed through PayOS; PayOS webhooks/callbacks are verified server-side; refunds and complaints are resolved by an Admin. |
| BR-23 | Each account holds exactly one role context (Student or Alumni); Admin is a separately provisioned role. |
| BR-24 | A member may follow another member at most once; self-follow is not allowed and following is one-directional. |
| BR-25 | FPTU proof for alumni verification is submitted as part of registration when the Alumni role is selected; Students are not required to submit proof or undergo verification. |

Table 12 Business Rules

### 5.2 Common Requirements

- The system supports PNG, JPG, and JPEG image formats, MP4 video, with a maximum image size of 100MB.
- Data presented as lists or tables is paginated (or infinite-scrolled) rather than loaded in full.
- No more than three font families are displayed on any single page.
- All create, update, and delete actions are confirmed to the user via inline messages, toasts, or modals; destructive actions require an explicit confirmation modal.
- All date/time values are displayed in the user's local time zone (Asia/Ho_Chi_Minh by default).
- The platform aims to be accessible 24/7, with maintenance scheduled during off-peak hours.
- All client–server communication is encrypted via HTTPS/TLS.
### 5.3 Application Messages List

<!-- Source table 13 from SRS DOCX -->
| # | Message Code | Message Type | Context | Content |
| --- | --- | --- | --- | --- |
| 1 | MSG01 | In-line (Red) | A required field is left empty on form submit. | The {field} is required. |
| 2 | MSG02 | In-line (Red) | A field is entered in an invalid format (email, URL, etc.). | Invalid format. Please enter a valid {field}. |
| 3 | MSG03 | In-line (Red) | Login fails due to wrong credentials. | Incorrect email or password. Please try again. |
| 4 | MSG04 | Toast (Success) | Data saved/updated (profile, settings, etc.). | {object} updated successfully. |
| 5 | MSG05 | Toast (Error) | System error or API failure (500). | Something went wrong. Please try again later. |
| 6 | MSG06 | Toast (Success) | Account registered. | Registration successful. Please check your email to verify your account. |
| 7 | MSG07 | Modal (Info) | User logs in with an unverified email. | Your email is not verified yet. Please verify to continue. |
| 8 | MSG08 | Toast (Success) | Password-reset email sent. | A password reset link has been sent to your email. |
| 9 | MSG09 | Modal (Info) | Alumni verification request submitted. | Your verification request has been submitted and is pending admin approval. |
| 10 | MSG10 | Toast (Success) | Alumni verification approved. | Your alumni account has been verified. |
| 11 | MSG11 | Modal (Error) | Action restricted to verified alumni. | Only verified alumni can perform this action. |
| 12 | MSG12 | Modal (Error) | Image upload invalid (format/size). | Upload failed. Image must be JPG/PNG/JPEG and under 10MB. |
| 13 | MSG13 | Toast (Success) | A post is published. | Your post has been published. |
| 14 | MSG14 | Modal (Confirm) | User deletes own content. | Are you sure you want to delete this {object}? This action cannot be undone. |
| 15 | MSG15 | Toast (Success) | Content reported. | Report submitted. Our moderators will review it shortly. |
| 16 | MSG16 | Modal (Alert) | Alumni tries to post a job without an active package. | You need an active posting package to publish this job. View packages? |
| 17 | MSG17 | Toast (Success) | Payment succeeds. | Payment successful! Your package is now active. |
| 18 | MSG18 | Toast (Error) | Payment fails or is cancelled. | Payment failed or was cancelled. Please try again. |
| 19 | MSG19 | Toast (Success) | RSVP to an event. | You have registered for this event. |
| 20 | MSG20 | Banner (Warning) | Event cancelled by organiser. | This event has been cancelled by the organiser. |
| 21 | MSG21 | Modal (Alert) | Salary statistics below the anonymity threshold. | Not enough data to display statistics for this filter yet. |
| 22 | MSG22 | Toast (Info) | Messaging a user who blocked the sender. | You cannot message this user. |
| 23 | MSG23 | Toast (Success) | Admin broadcast sent. | Notification sent to {count} users. |
| 24 | MSG24 | Modal (Confirm) | Admin hides community content. | Hide this content from the community? The author will be notified. |
| 25 | MSG25 | In-line (Red) | Password and confirm-password differ. | Passwords do not match. |
| 26 | MSG26 | Modal (Confirm) | Admin locks an account. | Lock this account? The user will be signed out and unable to log in. |
| 27 | MSG27 | Toast (Success) | Generic deletion succeeds. | {object} deleted successfully. |
| 28 | MSG28 | Modal (Error) | User attempts an action without permission / on a locked account. | You do not have permission to perform this action. |
| 29 | MSG29 | Toast (Info) | The notification centre is opened and contains no notifications. | You have no new notifications. |

Table 13 Application Messages List

### 5.4 Other Requirements

No additional requirements at this time. (Reserved for future regulatory, localisation, or integration requirements identified during development.)
