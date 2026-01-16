/* =============================================
   UP-NEXUS Configuration
   API URL for up-nexus.com
   ============================================= */

// Auto-detect API URL based on current origin (works for www and non-www)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : window.location.origin + "/api";

// Export for use in other scripts
window.UP_NEXUS_CONFIG = {
  API_URL: API_BASE_URL,
};

console.log("UP-NEXUS Config loaded. API URL:", API_BASE_URL);
