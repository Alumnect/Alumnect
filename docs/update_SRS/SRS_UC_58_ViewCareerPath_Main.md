### 3.6.5 View Career Path
(Covers UC58 - View Career Path)

**Function trigger**
*   **Navigation path:** Sidebar / AppShell Header -> Menu "Career Path" -> `/career-path` (or `/app/career`).
*   **Timing / Frequency:** On demand, whenever a user wants to explore the alumni directory, search for specific roles/companies, and view detailed chronological employment timelines.

**Function description**
*   **Actors/Roles:** Guest (unauthenticated visitor), Student, Alumni, Admin (Public access / Open to all roles).
*   **Purpose:** To provide a comprehensive, searchable directory of alumni focused entirely on their professional journeys. It allows users to search, filter, and drill down into the chronological career timelines (from first job to current role) of specific alumni to gain insights into career mobility, promotions, and industry trends.
*   **Interface:** 
    *   **Search & Filter Bar:** Full-text search input and dropdown filters for Major, Cohort, Location, and Job Title.
    *   **Alumni Grid/List:** A responsive grid or list of cards summarizing each alumni (Avatar, Name, Current Role, Company, Location).
    *   **Career Timeline Drawer:** A side drawer (Desktop) or bottom sheet (Mobile) that slides in when an alumni card is clicked. It displays a vertical timeline of the alumni's experiences grouped by company, complete with dates, job titles, and descriptions.
    *   **Action Buttons:** A "View Full Profile" button inside the drawer.
*   **UI States:** 
    *   Skeleton loaders during the initial fetch and when applying filters.
    *   Smooth slide-in animations for the Timeline Drawer.
    *   Empty-state placeholder illustrations when no alumni match the filters.

**Data processing**
1.  The client loads `/career-path` and triggers a `GET` request to the alumni search/list endpoint (e.g., `/api/v1/alumni` or `/api/v1/career-paths`) with optional query parameters (`search`, `majorId`, `cohort`, `location`).
2.  The backend executes a paginated query filtering active alumni profiles (accountStatus = ACTIVE, role = ALUMNI) matching the criteria and returns an HTTP 200 OK with the array of alumni summaries.
3.  The frontend renders the Alumni Grid.
4.  When a user clicks on an alumni card, the frontend opens the Side Drawer and immediately triggers a `GET` request to `/api/v1/users/{alumniId}/experiences`.
5.  The backend returns the full array of `ExperienceResponse` DTOs for that user, sorted chronologically.
6.  The frontend processes the experiences, visually groups consecutive roles at the same company, and renders the vertical timeline inside the Drawer.

**Screen layout:** 
[Figure — View Career Path screen layout (Web)]

**Function details**
*   **Data:** 
    *   List API payload: `userId`, `fullName`, `avatarUrl`, `currentTitle`, `currentCompany`, `location`.
    *   Experience API payload: Array containing `title`, `company`, `startDate`, `endDate`, `description`, `isCurrent`.
*   **Validation:** 
    *   Query parameters are sanitized. Pagination parameters (page, size) must be valid positive integers.
*   **Business rules:** 
    *   **Timeline Grouping:** If an alumni has multiple sequential roles at the same company (e.g., promoted from Intern to Junior to Senior), the timeline should visually group these roles under a single company header to reduce visual clutter and show internal progression.
    *   **Chronological Order:** The timeline inside the drawer must display the most recent (or current) experience at the top and older experiences extending downwards.
    *   **Public Access Constraint:** This feature only exposes public work-related information. Sensitive private data (personal email, phone number) is excluded unless the user navigates to view the full profile (which enforces its own privacy visibility rules).

*   **Error Handling:**
    *   **Empty Search Results:** Displays an inline empty state message overlay: "Không tìm thấy cựu sinh viên nào khớp với bộ lọc." (No alumni found matching the criteria) and an option to clear filters.
    *   **Failed Timeline Fetch:** If the drawer opens but the experience API fails to load, the drawer displays an error state "Không thể tải chi tiết lộ trình lúc này." (Cannot load timeline details at this time) with a Retry button.

*   **Normal case:** The user navigates to `/career-path`, filters by "Software Engineering", and clicks on "Nguyen Van A". The Side Drawer smoothly slides in from the right. A loading spinner appears briefly, followed by a vertical timeline showing Nguyen Van A's journey: starting as an Intern at Enouvo, then a Junior Developer, and currently a Senior Developer at VNG. The user clicks "View Full Profile" to see more details.

*   **Abnormal case:** 
    *   **Server Timeout on List Fetch:** The API returns HTTP 504. React Query catches the error and displays a global user-friendly error state with a "Thử lại" (Retry) button instead of breaking the page layout.
