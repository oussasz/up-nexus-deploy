/* =============================================
   UP-NEXUS Configuration
   API URL for up-nexus.com
   ============================================= */

// Production URL - handles both www and non-www
const PRODUCTION_API_URL = "https://up-nexus.com/api";

// Auto-detect API URL based on environment
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : PRODUCTION_API_URL;

// Export for use in other scripts
window.UP_NEXUS_CONFIG = {
  API_URL: API_BASE_URL
};

console.log("UP-NEXUS Config loaded. API URL:", API_BASE_URL);
