### 3.6.4 View Career Path on Map
(Covers UC58 - View Career Path / Map Spatial Integration)

**Function trigger**
*   **Navigation path:** Sidebar / AppShell Header -> Menu "Alumni Map" -> /app/map -> Click on an Alumni Avatar Pin -> Click the "Career Path" (Lộ trình sự nghiệp) action button inside the summary popover.
*   **Timing / Frequency:** On demand, whenever a user wants to visually trace the geographical and chronological employment journey of a specific alumni directly on the map.

**Function description**
*   **Actors/Roles:** Guest (unauthenticated visitor), Student, Alumni, Admin (Public access / Open to all roles).
*   **Purpose:** Elevates the standard list-based resume by visualizing an alumni's career progression spatially. It helps users see physical relocations and career mobility over time (e.g., studying in Da Nang -> working in Ho Chi Minh -> relocating to Singapore) through connected paths on the map.
*   **Interface:** 
    *   **Path Visualization (Polyline):** A curved, dashed, or gradient vector line (GeoJSON LineString) connecting past and current job locations on the map canvas.
    *   **Stepped Location Markers:** Numbered or chronologically scaled mini-markers indicating the sequence of companies/roles.
    *   **Timeline Overlay:** A minimalist timeline widget floating at the bottom or side of the screen, mapping the chronological sequence of roles to the points on the map.
    *   **Exit/Reset Button:** A button (e.g., "Thoát lộ trình" or "X") to exit the career path view and return to the global alumni distribution view.
*   **UI States:** 
    *   A loading spinner inside the popover while fetching the full employment history.
    *   A smooth line-drawing animation (dasharray transition) from the earliest experience to the current one.
    *   Fading out (opacity reduction) of other unrelated alumni pins to focus the user's attention solely on the selected journey.

**Data processing**
1.  The user clicks the "Career Path" button on an active marker's popover.
2.  The frontend triggers a `GET` request to `/api/v1/users/{alumniId}/experiences` to fetch the complete employment history (including non-primary and past roles).
3.  The backend verifies the request and returns an HTTP 200 OK with the array of `ExperienceResponse` DTOs, strictly sorted by `startDate` ascending (oldest to newest).
4.  The frontend processes the returned data:
    *   Filters out any experiences that lack `latitude` and `longitude` coordinates.
    *   Constructs a GeoJSON LineString feature connecting the valid coordinates chronologically.
5.  The MapLibre engine adds the new GeoJSON layer, rendering the directional path and the step-markers.
6.  The frontend calculates the bounding box (bounds) of all points in the path and triggers a `fitBounds` camera animation to ensure the entire career trajectory is visible on screen.

**Screen layout:** 
[Figure — View Career Path on Map (Web)]

**Function details**
*   **Data:** The API payload includes an array of experiences containing: `title`, `company`, `startDate`, `endDate`, `latitude`, `longitude`, `isCurrent`.
*   **Validation:** 
    *   Experiences missing valid `latitude` and `longitude` values are silently excluded from the spatial map path, though they may still appear in the floating timeline overlay.

*   **Business rules:** 
    *   **Chronological Integrity:** The spatial path must strictly connect points from the oldest `startDate` to the newest/current role. Overlapping locations (e.g., working at two companies in the same city sequentially) should be handled by slightly offsetting the markers or clustering them into a multi-role step.
    *   **Visual Direction:** The connecting line must visually indicate directionality (e.g., using chevron arrows along the path or a color gradient from light to dark) to make the journey's timeline intuitive without forcing the user to read the dates.
    *   **Exclusive Focus View:** Activating the Career Path view automatically suppresses (hides or dims) all other alumni markers on the map to prevent visual noise.

*   **Error Handling:**
    *   **Insufficient Spatial Data:** If the alumni only has one mapped location or no past mapped locations (e.g., their previous jobs didn't have coordinates), the system displays an inline toast message: "Không đủ dữ liệu vị trí để vẽ lộ trình sự nghiệp." (Insufficient location data to draw spatial career path) and prevents the map transformation.
    *   **Network Failure:** If the API fails to fetch experiences, the frontend displays an error toast: "Không thể tải lộ trình sự nghiệp lúc này." (Cannot load career path at this time) and maintains the current map state.

*   **Normal case:** The user clicks "Career Path" for an alumni. The API fetches 3 locations. Unrelated map pins fade out. The map camera zooms out to cover both Da Nang and HCM. A dynamic line draws from the FPT University Da Nang campus (Step 1), to an agency in Da Nang (Step 2), and finally to VNG Corporation in HCM (Step 3). The floating timeline shows the specific dates and job titles for these 3 steps.

*   **Abnormal case:** 
    *   **Server Timeout:** The API returns HTTP 504. The frontend catches the error, stops the loading spinner on the button, and alerts the user to try again later.
