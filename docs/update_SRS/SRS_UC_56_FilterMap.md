### 3.6.2 Filter Map
(Covers UC56 - Filter Alumni Map)

**Function trigger**
*   **Navigation path:** Sidebar / AppShell Header -> Menu "Alumni Map" -> /app/map -> Click on the "Filter" button or interact with the Major selection dropdown.
*   **Timing / Frequency:** On demand, whenever the user wants to narrow down the alumni displayed on the map by specific academic major.

**Function description**
*   **Actors/Roles:** Guest (unauthenticated visitor), Student, Alumni, Admin (Public access / Open to all roles).
*   **Purpose:** Allows users to dynamically refine the geospatial dataset of alumni based on their Academic Major without full-page reloads. This enables targeted networking and discovering peers who graduated from the same industry.
*   **Interface:** 
    *   **Major Filter Popover:** A popover/drawer containing a dropdown selector for Academic Major.
    *   **Active Filters Bar:** A section displaying chips/tags for the currently applied Major filter, along with a quick "remove" (x) button or a "Clear all" action.
*   **UI States:** 
    *   Subtle loading indicators (progress bar or spinner) during data fetching.
    *   Fluid animations (fade in/out) as map markers appear or disappear upon filter application.
    *   An empty-state placeholder when the selected major yields no matching results on the map.

**Data processing**
1.  The user selects a specific Academic Major from the filter dropdown.
2.  The client sends a `GET` request to the `/api/v1/alumni-map` endpoint with the `majorId` query parameter corresponding to the selected major (e.g., `?majorId=1`).
3.  The backend controller delegates the request to the `AlumniMapService` (no JWT authentication required).
4.  The backend executes a dynamic projection query on the `Experience` repository joined with `User` and `UserProfile`:
    *   Maintains the base map filters: `accountStatus = ACTIVE`, role `ALUMNI`, `isPrimary = true`, `isCurrent = true`, and coordinates are NOT NULL.
    *   Performs an exact match against the `majorId` field in the `UserProfile` data.
5.  The backend returns HTTP 200 OK with the filtered array of `AlumniMapResponse` DTOs.
6.  The frontend processes the response: Updates the React state, MapLibre engine removes non-matching markers, and plots the newly filtered set of avatar pins.
7.  The frontend recalculates the Top Hubs statistical rankings in the right sidebar based purely on the newly filtered dataset (alumni of the selected major).

**Screen layout:** 
[Figure — Filter Map screen layout (Web)]

**Function details**
*   **Data:** Filter parameters include: `majorId` (Integer).
*   **Validation:** 
    *   **Query parameters:** `majorId` must be a valid positive integer.
    *   If the query parameter is empty or omitted, the system ignores it and returns the unfiltered map data.

*   **Business rules:** 
    *   **Dynamic Analytics Recalculation:** The Top Hubs analytics (cities with the highest concentration of alumni) and percentage distribution bars must dynamically recalculate in real-time to reflect only the currently filtered markers.
    *   **Map Bounds Fitting:** (Optional UI behavior) Depending on the result set, the map camera may automatically zoom and fit its bounds to encompass the remaining filtered markers for the selected major.

*   **Error Handling:**
    *   **No matching records found:** When the selected major yields no records, the map displays an inline empty state message overlay: "Không tìm thấy cựu sinh viên nào khớp với bộ lọc." (No alumni found matching the filters) along with a "Clear filters" button.
    *   **Network disconnection:** Displays an empty state card indicating a connection failure.

*   **Normal case:** The user selects the "Software Engineering" major. The map instantly updates—unrelated pins disappear, leaving only the avatar pins of Software Engineering alumni. The Top Hubs analytics sidebar updates to rank cities based only on these specific alumni.

*   **Abnormal case:** 
    *   **Malformed query parameters:** If a user manually alters the URL to inject invalid types (e.g., `?majorId=abc`), the backend rejects the request with HTTP 400 Bad Request. The frontend catches the error, resets the invalid filter to keep the UI intact, and displays a mild toast notification to the user without crashing the map engine.
