### 3.6.6 Search / Filter Career Path
(Covers UC58 - Career Path Directory Filters)

**Function trigger**
*   **Navigation path:** Sidebar / AppShell Header -> Menu "Career Path" -> `/career-path` -> Interact with the search bar or the filter dropdowns located at the top or side of the directory.
*   **Timing / Frequency:** On demand, whenever the user wants to narrow down the extensive alumni directory to find specific individuals, roles, companies, or academic peers.

**Function description**
*   **Actors/Roles:** Guest (unauthenticated visitor), Student, Alumni, Admin (Public access / Open to all roles).
*   **Purpose:** To empower users to efficiently navigate and drill down into the large alumni database. It facilitates targeted networking, allowing students to find potential mentors at specific companies, or alumni to reconnect with peers from their exact cohort or major.
*   **Interface:** 
    *   **Global Search Bar:** A prominent, debounced text input field supporting full-text search.
    *   **Filter Controls:** Dropdowns, select menus, or a collapsible filter drawer containing options for Academic Major, Cohort (Intake/Graduation Year), Location (City), and Current Industry/Company.
    *   **Active Filter Chips:** A row of small visual tags (chips) displaying the currently applied filters, each with a close ("x") icon for quick removal, alongside a "Clear All" (Xóa tất cả) button.
*   **UI States:** 
    *   Skeleton loading grids or a subtle progress bar while data is being fetched over the network.
    *   An empty-state placeholder illustration when the combination of filters yields zero matching alumni.

**Data processing**
1.  The user types a keyword into the search bar or selects an option from a filter dropdown.
2.  The frontend applies a debounce strategy (typically 300ms - 500ms) on text inputs to prevent excessive API requests while typing.
3.  The frontend serializes the active filters into the browser's URL query string (e.g., `/career-path?search=Data&majorId=3&cohort=15`). This ensures the filtered view is bookmarkable and shareable.
4.  The client sends a `GET` request to the backend endpoint (e.g., `/api/v1/career-paths`) appending these query parameters.
5.  The backend controller validates the parameters and delegates to the service layer.
6.  The backend executes a dynamic database query (e.g., using JPA Specifications or Criteria Builder), applying a logical `AND` between different filter categories (e.g., matches search keyword AND matches exact major ID).
7.  The backend returns an HTTP 200 OK with the paginated and filtered array of alumni summaries.
8.  The frontend updates its state, replacing the current grid/list with the newly fetched data, and updates the active filter chips UI.

**Screen layout:** 
[Figure — Search / Filter Career Path screen layout (Web)]

**Function details**
*   **Data:** Filter parameters sent to the API include: `search` (String), `majorId` (Integer), `cohort` (Integer), `location` (String), `company` (String).
*   **Validation:** 
    *   Search text inputs are sanitized and trimmed to prevent injection or erroneous blank searches.
    *   ID-based filters (like `majorId`, `cohort`) must be valid positive integers. If invalid, the backend ignores them or throws a 400 Bad Request.

*   **Business rules:** 
    *   **Combinatorial Filtering (Logical AND):** Selecting multiple different filters narrows the results. For instance, filtering by Major = "Software Engineering" AND Cohort = "15" guarantees that all returned alumni satisfy both conditions simultaneously.
    *   **Debounce Strategy:** Immediate API calls on every keystroke are prohibited to maintain system performance and respect database limits.
    *   **URL State Synchronization (Deep Linking):** The application must sync the active filter state with the URL parameters. If a user refreshes the page or sends the link to a friend, the application must read the URL on load and immediately apply those specific filters.

*   **Error Handling:**
    *   **No Results Found:** If the filter combination is too restrictive and returns no records, the UI replaces the grid with an empty state illustration stating: "Không tìm thấy cựu sinh viên nào khớp với bộ lọc." (No alumni found matching the filters) and prominently displays a "Clear filters" button to help the user recover.

*   **Normal case:** A student wants to work at VNG. They navigate to `/career-path`, type "VNG" into the search bar, and select the "Software Engineering" major from the dropdown. After a brief loading skeleton, the grid updates to display only Software Engineering alumni who currently (or previously) have "VNG" listed in their employment history. The URL updates automatically to reflect these filters.

*   **Abnormal case:** 
    *   **Network Failure During Filter:** If the user applies a filter but their internet connection drops, the API request fails. The frontend catches the exception, displays a toast notification: "Không thể áp dụng bộ lọc lúc này. Vui lòng kiểm tra kết nối." (Cannot apply filters at this time. Please check your connection), and retains the last successfully loaded grid of alumni to prevent a blank screen.
