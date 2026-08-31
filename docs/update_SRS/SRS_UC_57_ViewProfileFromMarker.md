### 3.6.3 View Profile from Marker
(Covers UC57 - View Profile from Marker)

**Function trigger**
*   **Navigation path:** Sidebar / AppShell Header -> Menu "Alumni Map" -> /app/map -> Click on a specific Alumni Avatar Pin (Marker) on the interactive map canvas.
*   **Timing / Frequency:** On demand, whenever a user wants to view a quick summary of a specific alumni's current job role and details without leaving the map context.

**Function description**
*   **Actors/Roles:** Guest (unauthenticated visitor), Student, Alumni, Admin (Public access / Open to all roles).
*   **Purpose:** Provides a seamless and accessible way to view an alumni's concise career summary directly on the map. It bridges the gap between geospatial discovery and deep professional networking by offering a direct link to the full user profile.
*   **Interface:** 
    *   **Interactive Marker:** Avatar pins that enlarge or change style slightly on hover to indicate clickability.
    *   **Camera Animation (fly-to):** Smooth cinematic panning and zooming of the map camera to center the clicked marker.
    *   **Alumni Detail Popover / Summary Card:** A floating card anchored to the marker, displaying the alumni's avatar, display name, verified badge (if any), current job title, company name, and cohort.
    *   **Action Buttons:** Quick action buttons inside the popover such as "View Full Profile" (Xem hồ sơ) and "Career Path" (Lộ trình sự nghiệp).
*   **UI States:** 
    *   Hover state on the map marker to indicate interactivity.
    *   Active/Selected state for the clicked marker (e.g., highlighted border).
    *   Smooth transition/fade-in of the Summary Card.

**Data processing**
1.  The user clicks on an alumni's avatar marker on the map.
2.  The frontend MapLibre engine triggers a `flyTo` animation, calculating the optimal camera center and zoom level to ensure the marker and its upcoming popover are fully visible within the viewport.
3.  Simultaneously, the frontend changes the marker's visual state to "selected".
4.  The frontend mounts and displays the Popover/Summary Card component anchored to the marker's geographical coordinates.
5.  The Popover immediately populates its UI using the `AlumniMapItem` data already present in the frontend state (fetched previously during the map load via `/api/v1/alumni-map`), ensuring zero latency. No additional backend API call is required for this summary view.
6.  If the user clicks the "View Full Profile" button inside the popover, the frontend router pushes the navigation state to `/app/profile/{alumniId}` (or the respective profile route).

**Screen layout:** 
[Figure — View Profile from Marker Popover (Web)]

**Function details**
*   **Data:** Displayed fields include: `alumniId`, `displayName`, `avatarUrl`, `currentTitle`, `companyName`, `locationCity`, `cohort`.
*   **Validation:** 
    *   The frontend router must validate that the `alumniId` is not null or undefined before navigating to the full profile page.

*   **Business rules:** 
    *   **Single Active Popover:** Opening a new marker popover must automatically close any previously opened popover to prevent UI clutter on the map canvas.
    *   **Zero-Latency Rendering:** The summary card must render instantly using pre-fetched data from the global map state rather than triggering a new fetching process, ensuring a snappy user experience.
    *   **Viewport Boundary Constraints:** The map camera must adjust intelligently so that the opened popover does not get cut off by the edges of the screen or hidden behind the sidebars.

*   **Error Handling:**
    *   **Missing Data Fallback:** If non-mandatory fields (like `companyName` or `cohort`) are null or empty in the state, the UI gracefully omits them or displays a fallback text (e.g., "Not updated yet") without breaking the layout.

*   **Normal case:** The user clicks an avatar pin in Da Nang. The map smoothly pans to center the pin. A clean popover fades in above the pin, displaying "Nguyen Van Da Nang", his title "Senior Software Engineer at FPT Software", and his cohort "K15". The user clicks "View Full Profile" and is successfully navigated to his detailed profile page.

*   **Abnormal case:** 
    *   **Broken Avatar URL:** If the image URL provided in `avatarUrl` fails to load (404), the UI falls back to rendering a default placeholder avatar (or initials) instantly, ensuring the popover remains aesthetically pleasing.
