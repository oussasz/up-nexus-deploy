/* =============================================
   UP-NEXUS Admin Dashboard JavaScript
   ============================================= */

// Get API URL from config (loaded from config.js) or fallback
const API_URL =
  window.UP_NEXUS_CONFIG?.API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : window.location.origin + "/api");

// State
let entities = [];
let announcements = [];
let users = [];
let pendingUsers = [];
let pendingClaims = [];
let currentEditId = null;
let currentAnnouncementEditId = null;
let deleteEntityId = null;
let deleteAnnouncementId = null;
let rejectItemId = null;
let rejectItemType = null; // 'user' or 'claim'

// DOM Elements
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const pageTitle = document.getElementById("pageTitle");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// Check authentication
function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }

  // Set admin info
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
  document.getElementById("adminName").textContent =
    adminUser.username || "Admin";
  document.getElementById("adminRole").textContent =
    adminUser.role || "Administrator";

  return true;
}

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Show toast notification
function showToast(message, type = "success") {
  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  toast.querySelector(".toast-icon").className = `toast-icon fas fa-${
    type === "success" ? "check-circle" : "exclamation-circle"
  }`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Show section
function showSection(sectionId) {
  // Update nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === sectionId);
  });

  // Update sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.toggle("active", section.id === `section-${sectionId}`);
  });

  // Update page title
  const titles = {
    dashboard: "Dashboard",
    entities: "Manage Entities",
    "add-entity": currentEditId ? "Edit Entity" : "Add New Entity",
    announcements: "Manage Announcements",
    "add-announcement": currentAnnouncementEditId
      ? "Edit Announcement"
      : "Add New Announcement",
    "pending-reviews": "Pending Reviews",
    users: "Manage Users",
  };
  pageTitle.textContent = titles[sectionId] || "Dashboard";

  // Load data for specific sections
  if (sectionId === "pending-reviews") {
    fetchPendingUsers();
    fetchPendingClaims();
  }
  if (sectionId === "users") {
    fetchUsers();
  }

  if (sectionId === "add-entity") {
    document.getElementById("formTitle").textContent = currentEditId
      ? "Edit Entity"
      : "Add New Entity";
  }

  if (sectionId === "add-announcement") {
    document.getElementById("announcementFormTitle").textContent =
      currentAnnouncementEditId ? "Edit Announcement" : "Add New Announcement";
    document.getElementById("announcementSubmitBtnText").textContent =
      currentAnnouncementEditId ? "Update Announcement" : "Create Announcement";
  }

  // Close mobile sidebar
  sidebar.classList.remove("open");
}

// Fetch stats
async function fetchStats() {
  try {
    const response = await fetch(`${API_URL}/entities/admin/stats`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("statTotal").textContent = data.stats.total;
      document.getElementById("statProjectHolders").textContent = getTypeCount(
        data.stats.byType,
        "Project Holder"
      );
      document.getElementById("statStartups").textContent = getTypeCount(
        data.stats.byType,
        "Startup"
      );
      document.getElementById("statIncubators").textContent = getTypeCount(
        data.stats.byType,
        "Incubator"
      );
      document.getElementById("statAccelerators").textContent = getTypeCount(
        data.stats.byType,
        "Accelerator"
      );
      document.getElementById("statInvestors").textContent = getTypeCount(
        data.stats.byType,
        "Investor"
      );
      document.getElementById("statPublicFunders").textContent = getTypeCount(
        data.stats.byType,
        "Public Funder"
      );
      document.getElementById("statFreelancers").textContent = getTypeCount(
        data.stats.byType,
        "Freelancer"
      );
      document.getElementById("statResearchCenters").textContent = getTypeCount(
        data.stats.byType,
        "Research Center"
      );
      document.getElementById("statMentors").textContent = getTypeCount(
        data.stats.byType,
        "Mentor & Advisor"
      );
      document.getElementById("statServiceProviders").textContent =
        getTypeCount(data.stats.byType, "Service Provider");
      document.getElementById("statCoworkingSpaces").textContent = getTypeCount(
        data.stats.byType,
        "Coworking Space"
      );
      document.getElementById("statCommunities").textContent = getTypeCount(
        data.stats.byType,
        "Community & Network"
      );
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

function getTypeCount(byType, type) {
  const found = byType.find((t) => t._id === type);
  return found ? found.count : 0;
}

// Fetch entities
async function fetchEntities() {
  try {
    // Use 'all=true' to fetch all entities regardless of active status (for admin view)
    const response = await fetch(`${API_URL}/entities?all=true`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    console.log("Fetched entities:", data);

    if (data.success) {
      entities = data.entities;
      renderEntitiesTable();
      renderRecentEntities();
    } else {
      console.error("Failed to fetch entities:", data.message);
      document.getElementById(
        "entitiesTableBody"
      ).innerHTML = `<tr><td colspan="6" class="empty-message">Failed to load: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Error fetching entities:", error);
    document.getElementById("entitiesTableBody").innerHTML =
      '<tr><td colspan="6" class="empty-message">Failed to load entities. Is the server running?</td></tr>';
  }
}

// Render entities table
function renderEntitiesTable(filter = "") {
  const tbody = document.getElementById("entitiesTableBody");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const typeFilter = document.getElementById("filterType").value;

  let filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm) ||
      entity.type.toLowerCase().includes(searchTerm) ||
      (entity.sector && entity.sector.toLowerCase().includes(searchTerm));
    const matchesType = !typeFilter || entity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (filteredEntities.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-message">No entities found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredEntities
    .map(
      (entity) => `
    <tr>
      <td>
        <div class="entity-cell">
          ${
            entity.logo
              ? `<img src="${entity.logo}" alt="${
                  entity.name
                }" class="entity-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="entity-icon" style="display:none;">${
                  entity.icon || "🏢"
                }</div>`
              : `<div class="entity-icon">${entity.icon || "🏢"}</div>`
          }
          <div class="entity-info">
            <span class="entity-name">${entity.name}</span>
            ${
              entity.isVerified
                ? '<i class="fas fa-check-circle verified-badge" title="Verified"></i>'
                : ""
            }
            ${
              entity.isFeatured
                ? '<i class="fas fa-star featured-badge" title="Featured"></i>'
                : ""
            }
          </div>
        </div>
      </td>
      <td><span class="type-badge type-${entity.type.replace(
        /[^a-zA-Z]/g,
        ""
      )}">${entity.type}</span></td>
      <td>${entity.wilaya || entity.location || "-"}</td>
      <td>
        <span class="status-badge ${
          entity.isActive ? "status-active" : "status-inactive"
        }">
          ${entity.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td>${formatDate(entity.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editEntity('${
            entity._id
          }')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" onclick="confirmDelete('${
            entity._id
          }')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Render recent entities
function renderRecentEntities() {
  const container = document.getElementById("recentEntities");
  const recent = entities.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No entities yet. Add your first entity!</p>';
    return;
  }

  container.innerHTML = recent
    .map(
      (entity) => `
    <div class="recent-item">
      ${
        entity.logo
          ? `<img src="${entity.logo}" alt="${
              entity.name
            }" class="recent-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="recent-icon" style="display:none;">${
              entity.icon || "🏢"
            }</div>`
          : `<div class="recent-icon">${entity.icon || "🏢"}</div>`
      }
      <div class="recent-info">
        <p class="recent-name">${entity.name}</p>
        <p class="recent-type">${entity.type}</p>
      </div>
      <span class="recent-date">${formatDate(entity.createdAt)}</span>
    </div>
  `
    )
    .join("");
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Edit entity
function editEntity(id) {
  const entity = entities.find((e) => e._id === id);
  if (!entity) return;

  currentEditId = id;

  // Basic Info
  document.getElementById("entityId").value = id;
  document.getElementById("entityName").value = entity.name;
  document.getElementById("entityType").value = entity.type;
  document.getElementById("entityShortDescription").value =
    entity.shortDescription || "";
  document.getElementById("entityDescription").value = entity.description || "";

  // Logo & Branding
  document.getElementById("entityLogo").value = entity.logo || "";
  document.getElementById("entityIcon").value = entity.icon || "";
  document.getElementById("entityColor").value = entity.color || "#F4B000";
  if (entity.logo) {
    previewLogo();
  } else {
    resetLogoPreview();
  }

  // Location & Contact
  document.getElementById("entityWilaya").value = entity.wilaya || "";
  document.getElementById("entityLocation").value = entity.location || "";
  document.getElementById("entityAddress").value = entity.address || "";
  document.getElementById("entityEmail").value = entity.email || "";
  document.getElementById("entityPhone").value = entity.phone || "";
  document.getElementById("entityWebsite").value = entity.website || "";

  // Social Media
  document.getElementById("entityLinkedin").value =
    entity.socialMedia?.linkedin || "";
  document.getElementById("entityTwitter").value =
    entity.socialMedia?.twitter || "";
  document.getElementById("entityFacebook").value =
    entity.socialMedia?.facebook || "";
  document.getElementById("entityInstagram").value =
    entity.socialMedia?.instagram || "";

  // Additional Details
  document.getElementById("entityFoundedYear").value = entity.foundedYear || "";
  document.getElementById("entityTeamSize").value = entity.teamSize || "";
  document.getElementById("entitySector").value = entity.sector || "";
  document.getElementById("entityStage").value = entity.stage || "";
  document.getElementById("entityTags").value = (entity.tags || []).join(", ");

  // Type-specific fields
  document.getElementById("entityInvestmentRange").value =
    entity.investmentRange || "";
  document.getElementById("entityPortfolioCount").value =
    entity.portfolioCount || "";
  document.getElementById("entityInvestmentStages").value = (
    entity.investmentStages || []
  ).join(", ");

  document.getElementById("entityProgramDuration").value =
    entity.programDuration || "";
  document.getElementById("entityBatchSize").value = entity.batchSize || "";
  document.getElementById("entitySuccessStories").value =
    entity.successStories || "";

  document.getElementById("entityServices").value = (
    entity.services || []
  ).join(", ");
  document.getElementById("entityExpertise").value = (
    entity.expertise || []
  ).join(", ");
  document.getElementById("entityHourlyRate").value = entity.hourlyRate || "";

  document.getElementById("entityResearchAreas").value = (
    entity.researchAreas || []
  ).join(", ");
  document.getElementById("entityPublications").value =
    entity.publications || "";

  document.getElementById("entityCapacity").value = entity.capacity || "";
  document.getElementById("entityPricing").value = entity.pricing || "";
  document.getElementById("entityAmenities").value = (
    entity.amenities || []
  ).join(", ");

  // Status
  document.getElementById("entityActive").checked = entity.isActive;
  document.getElementById("entityFeatured").checked =
    entity.isFeatured || false;
  document.getElementById("entityVerified").checked =
    entity.isVerified || false;

  // Show type-specific fields
  toggleTypeSpecificFields();

  showSection("add-entity");
}

// Reset form
function resetForm() {
  currentEditId = null;
  document.getElementById("entityForm").reset();
  document.getElementById("entityId").value = "";
  document.getElementById("entityColor").value = "#F4B000";
  document.getElementById("entityActive").checked = true;
  document.getElementById("entityFeatured").checked = false;
  document.getElementById("entityVerified").checked = false;
  resetLogoPreview();
  hideAllTypeSpecificFields();
  showSection("entities");
}

// Reset logo preview
function resetLogoPreview() {
  const preview = document.getElementById("logoPreview");
  preview.innerHTML = '<i class="fas fa-image"></i><span>No logo</span>';
}

// Preview logo
function previewLogo() {
  const logoUrl = document.getElementById("entityLogo").value;
  const preview = document.getElementById("logoPreview");

  if (logoUrl) {
    preview.innerHTML = `<img src="${logoUrl}" alt="Logo preview" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-exclamation-triangle\\'></i><span>Invalid URL</span>'" />`;
  } else {
    resetLogoPreview();
  }
}

// Toggle type-specific fields
function toggleTypeSpecificFields() {
  const type = document.getElementById("entityType").value;

  hideAllTypeSpecificFields();

  if (type === "Investor" || type === "Public Funder") {
    document.getElementById("investorFields").style.display = "block";
  } else if (type === "Incubator" || type === "Accelerator") {
    document.getElementById("incubatorFields").style.display = "block";
  } else if (
    type === "Freelancer" ||
    type === "Service Provider" ||
    type === "Mentor & Advisor"
  ) {
    document.getElementById("freelancerFields").style.display = "block";
  } else if (type === "Research Center") {
    document.getElementById("researchFields").style.display = "block";
  } else if (type === "Coworking Space") {
    document.getElementById("coworkingFields").style.display = "block";
  }
}

// Hide all type-specific fields
function hideAllTypeSpecificFields() {
  document.querySelectorAll(".type-specific").forEach((el) => {
    el.style.display = "none";
  });
}

// Select emoji
function selectEmoji(emoji) {
  document.getElementById("entityIcon").value = emoji;
}

// Submit entity form
async function submitEntity(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  // Helper function to parse comma-separated values
  const parseCSV = (value) =>
    value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

  const entityData = {
    // Basic Info
    name: document.getElementById("entityName").value,
    type: document.getElementById("entityType").value,
    shortDescription: document.getElementById("entityShortDescription").value,
    description: document.getElementById("entityDescription").value,

    // Logo & Branding
    logo: document.getElementById("entityLogo").value,
    icon: document.getElementById("entityIcon").value || "🏢",
    color: document.getElementById("entityColor").value,

    // Location & Contact
    wilaya: document.getElementById("entityWilaya").value,
    location: document.getElementById("entityLocation").value,
    address: document.getElementById("entityAddress").value,
    email: document.getElementById("entityEmail").value,
    phone: document.getElementById("entityPhone").value,
    website: document.getElementById("entityWebsite").value,

    // Social Media
    socialMedia: {
      linkedin: document.getElementById("entityLinkedin").value,
      twitter: document.getElementById("entityTwitter").value,
      facebook: document.getElementById("entityFacebook").value,
      instagram: document.getElementById("entityInstagram").value,
    },

    // Additional Details
    foundedYear: document.getElementById("entityFoundedYear").value
      ? parseInt(document.getElementById("entityFoundedYear").value)
      : null,
    teamSize: document.getElementById("entityTeamSize").value,
    sector: document.getElementById("entitySector").value,
    stage: document.getElementById("entityStage").value,
    tags: parseCSV(document.getElementById("entityTags").value),

    // Type-specific: Investors/Funders
    investmentRange: document.getElementById("entityInvestmentRange").value,
    portfolioCount: document.getElementById("entityPortfolioCount").value
      ? parseInt(document.getElementById("entityPortfolioCount").value)
      : null,
    investmentStages: parseCSV(
      document.getElementById("entityInvestmentStages").value
    ),

    // Type-specific: Incubators/Accelerators
    programDuration: document.getElementById("entityProgramDuration").value,
    batchSize: document.getElementById("entityBatchSize").value
      ? parseInt(document.getElementById("entityBatchSize").value)
      : null,
    successStories: document.getElementById("entitySuccessStories").value
      ? parseInt(document.getElementById("entitySuccessStories").value)
      : null,

    // Type-specific: Freelancers/Service Providers
    services: parseCSV(document.getElementById("entityServices").value),
    expertise: parseCSV(document.getElementById("entityExpertise").value),
    hourlyRate: document.getElementById("entityHourlyRate").value,

    // Type-specific: Research Centers
    researchAreas: parseCSV(
      document.getElementById("entityResearchAreas").value
    ),
    publications: document.getElementById("entityPublications").value
      ? parseInt(document.getElementById("entityPublications").value)
      : null,

    // Type-specific: Coworking Spaces
    capacity: document.getElementById("entityCapacity").value
      ? parseInt(document.getElementById("entityCapacity").value)
      : null,
    pricing: document.getElementById("entityPricing").value,
    amenities: parseCSV(document.getElementById("entityAmenities").value),

    // Status
    isActive: document.getElementById("entityActive").checked,
    isFeatured: document.getElementById("entityFeatured").checked,
    isVerified: document.getElementById("entityVerified").checked,
  };

  try {
    const url = currentEditId
      ? `${API_URL}/entities/${currentEditId}`
      : `${API_URL}/entities`;

    const method = currentEditId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(entityData),
    });

    const data = await response.json();

    if (data.success) {
      showToast(
        currentEditId
          ? "Entity updated successfully!"
          : "Entity created successfully!"
      );
      resetForm();
      fetchEntities();
      fetchStats();
      showSection("entities");
    } else {
      showToast(data.message || "Failed to save entity", "error");
    }
  } catch (error) {
    console.error("Error saving entity:", error);
    showToast("Failed to save entity. Check server connection.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Entity';
  }
}

// Confirm delete
function confirmDelete(id) {
  deleteEntityId = id;
  document.getElementById("deleteModal").classList.add("show");
}

// Close delete modal
function closeDeleteModal() {
  deleteEntityId = null;
  document.getElementById("deleteModal").classList.remove("show");
}

// Delete entity
async function deleteEntity() {
  if (!deleteEntityId) return;

  const confirmBtn = document.getElementById("confirmDeleteBtn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Deleting...";

  try {
    const response = await fetch(`${API_URL}/entities/${deleteEntityId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Entity deleted successfully!");
      closeDeleteModal();
      fetchEntities();
      fetchStats();
    } else {
      showToast(data.message || "Failed to delete entity", "error");
    }
  } catch (error) {
    console.error("Error deleting entity:", error);
    showToast("Failed to delete entity", "error");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Delete";
  }
}

// Logout
function logout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  window.location.href = "login.html";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;

  // Fetch initial data
  fetchStats();
  fetchEntities();
  fetchAnnouncements();

  // Initialize user management
  initUserManagement();

  // Event listeners
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.dataset.section !== "add-entity") {
        currentEditId = null;
      }
      if (item.dataset.section !== "add-announcement") {
        currentAnnouncementEditId = null;
      }
      showSection(item.dataset.section);
    });
  });

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);

  document
    .getElementById("entityForm")
    .addEventListener("submit", submitEntity);

  document
    .getElementById("searchInput")
    .addEventListener("input", () => renderEntitiesTable());
  document
    .getElementById("filterType")
    .addEventListener("change", () => renderEntitiesTable());

  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", deleteEntity);

  // Announcement event listeners
  document
    .getElementById("announcementForm")
    .addEventListener("submit", submitAnnouncement);

  document
    .getElementById("searchAnnouncementInput")
    ?.addEventListener("input", () => renderAnnouncementsTable());
  document
    .getElementById("filterAnnouncementCategory")
    ?.addEventListener("change", () => renderAnnouncementsTable());
});

// Close modal on outside click
document.getElementById("deleteModal").addEventListener("click", (e) => {
  if (e.target.id === "deleteModal") {
    closeDeleteModal();
  }
});

// ============================================
// ANNOUNCEMENT FUNCTIONS
// ============================================

// Fetch announcements
async function fetchAnnouncements() {
  try {
    const response = await fetch(`${API_URL}/announcements?all=true`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    console.log("Fetched announcements:", data);

    if (data.success) {
      announcements = data.announcements;
      renderAnnouncementsTable();
    } else {
      console.error("Failed to fetch announcements:", data.message);
      document.getElementById(
        "announcementsTableBody"
      ).innerHTML = `<tr><td colspan="6" class="empty-message">Failed to load: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Error fetching announcements:", error);
    document.getElementById("announcementsTableBody").innerHTML =
      '<tr><td colspan="6" class="empty-message">Failed to load announcements.</td></tr>';
  }
}

// Render announcements table
function renderAnnouncementsTable() {
  const tbody = document.getElementById("announcementsTableBody");
  const searchTerm =
    document.getElementById("searchAnnouncementInput")?.value.toLowerCase() ||
    "";
  const categoryFilter =
    document.getElementById("filterAnnouncementCategory")?.value || "";

  let filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm) ||
      (announcement.content &&
        announcement.content.toLowerCase().includes(searchTerm)) ||
      (announcement.author &&
        announcement.author.toLowerCase().includes(searchTerm));
    const matchesCategory =
      !categoryFilter || announcement.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (filteredAnnouncements.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-message">No announcements found</td></tr>';
    return;
  }

  const categoryColors = {
    Funding: "#10b981",
    Job: "#3b82f6",
    Event: "#8b5cf6",
    Program: "#f4b000",
    News: "#f97316",
    Other: "#6b7280",
  };

  tbody.innerHTML = filteredAnnouncements
    .map(
      (announcement) => `
    <tr>
      <td>
        <div class="entity-cell">
          <div class="entity-info">
            <span class="entity-name">${announcement.title}</span>
            ${
              announcement.isPinned
                ? '<i class="fas fa-thumbtack" style="color: #f4b000; margin-left: 8px;" title="Pinned"></i>'
                : ""
            }
          </div>
        </div>
      </td>
      <td>
        <span class="type-badge" style="background: ${
          categoryColors[announcement.category] || categoryColors.Other
        }20; color: ${
        categoryColors[announcement.category] || categoryColors.Other
      };">
          ${announcement.category}
        </span>
      </td>
      <td>${announcement.author || "UP-NEXUS Team"}</td>
      <td>
        <span class="status-badge ${
          announcement.isPublished ? "status-active" : "status-inactive"
        }">
          ${announcement.isPublished ? "Published" : "Draft"}
        </span>
      </td>
      <td>${formatDate(announcement.publishedAt || announcement.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editAnnouncement('${
            announcement._id
          }')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" onclick="confirmDeleteAnnouncement('${
            announcement._id
          }')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Toggle announcement category-specific fields
function toggleAnnouncementFields() {
  const category = document.getElementById("announcementCategory").value;

  document.getElementById("eventFields").style.display =
    category === "Event" ? "block" : "none";
  document.getElementById("jobFields").style.display =
    category === "Job" ? "block" : "none";
  document.getElementById("fundingFields").style.display =
    category === "Funding" ? "block" : "none";
}

// Edit announcement
function editAnnouncement(id) {
  const announcement = announcements.find((a) => a._id === id);
  if (!announcement) return;

  currentAnnouncementEditId = id;

  // Basic Info
  document.getElementById("announcementId").value = id;
  document.getElementById("announcementTitle").value = announcement.title;
  document.getElementById("announcementCategory").value = announcement.category;
  document.getElementById("announcementAuthor").value =
    announcement.author || "";
  document.getElementById("announcementImage").value = announcement.image || "";
  document.getElementById("announcementExcerpt").value =
    announcement.excerpt || "";
  document.getElementById("announcementContent").value =
    announcement.content || "";
  document.getElementById("announcementTags").value = (
    announcement.tags || []
  ).join(", ");

  // Event fields
  if (announcement.eventDate) {
    document.getElementById("announcementEventDate").value = new Date(
      announcement.eventDate
    )
      .toISOString()
      .slice(0, 16);
  }
  document.getElementById("announcementEventLocation").value =
    announcement.eventLocation || "";
  document.getElementById("announcementEventLink").value =
    announcement.eventLink || "";

  // Job fields
  document.getElementById("announcementCompany").value =
    announcement.company || "";
  document.getElementById("announcementJobType").value =
    announcement.jobType || "";
  document.getElementById("announcementSalary").value =
    announcement.salary || "";
  if (announcement.deadline) {
    document.getElementById("announcementDeadline").value = new Date(
      announcement.deadline
    )
      .toISOString()
      .slice(0, 10);
  }

  // Funding fields
  document.getElementById("announcementFundingAmount").value =
    announcement.fundingAmount || "";
  if (announcement.deadline) {
    document.getElementById("announcementFundingDeadline").value = new Date(
      announcement.deadline
    )
      .toISOString()
      .slice(0, 10);
  }
  document.getElementById("announcementEligibility").value =
    announcement.eligibility || "";

  // Links
  document.getElementById("announcementExternalLink").value =
    announcement.externalLink || "";
  document.getElementById("announcementApplyLink").value =
    announcement.applyLink || "";

  // Status
  document.getElementById("announcementIsPublished").checked =
    announcement.isPublished !== false;
  document.getElementById("announcementIsPinned").checked =
    announcement.isPinned || false;

  // Toggle category fields
  toggleAnnouncementFields();

  // Navigate to form
  showSection("add-announcement");
}

// Submit announcement
async function submitAnnouncement(e) {
  e.preventDefault();

  const announcementData = {
    title: document.getElementById("announcementTitle").value,
    category: document.getElementById("announcementCategory").value,
    author:
      document.getElementById("announcementAuthor").value || "UP-NEXUS Team",
    image: document.getElementById("announcementImage").value,
    excerpt: document.getElementById("announcementExcerpt").value,
    content: document.getElementById("announcementContent").value,
    tags: document
      .getElementById("announcementTags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag),
    externalLink: document.getElementById("announcementExternalLink").value,
    applyLink: document.getElementById("announcementApplyLink").value,
    isPublished: document.getElementById("announcementIsPublished").checked,
    isPinned: document.getElementById("announcementIsPinned").checked,
  };

  // Category-specific fields
  const category = announcementData.category;

  if (category === "Event") {
    announcementData.eventDate =
      document.getElementById("announcementEventDate").value || null;
    announcementData.eventLocation = document.getElementById(
      "announcementEventLocation"
    ).value;
    announcementData.eventLink = document.getElementById(
      "announcementEventLink"
    ).value;
  }

  if (category === "Job") {
    announcementData.company = document.getElementById(
      "announcementCompany"
    ).value;
    announcementData.jobType = document.getElementById(
      "announcementJobType"
    ).value;
    announcementData.salary =
      document.getElementById("announcementSalary").value;
    announcementData.deadline =
      document.getElementById("announcementDeadline").value || null;
  }

  if (category === "Funding") {
    announcementData.fundingAmount = document.getElementById(
      "announcementFundingAmount"
    ).value;
    announcementData.deadline =
      document.getElementById("announcementFundingDeadline").value || null;
    announcementData.eligibility = document.getElementById(
      "announcementEligibility"
    ).value;
  }

  const isEdit = !!currentAnnouncementEditId;
  const url = isEdit
    ? `${API_URL}/announcements/${currentAnnouncementEditId}`
    : `${API_URL}/announcements`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(announcementData),
    });

    const data = await response.json();

    if (data.success) {
      showToast(
        isEdit ? "Announcement updated!" : "Announcement created!",
        "success"
      );
      resetAnnouncementForm();
      fetchAnnouncements();
      showSection("announcements");
    } else {
      showToast(data.message || "Failed to save announcement", "error");
    }
  } catch (error) {
    console.error("Error saving announcement:", error);
    showToast("Failed to save announcement", "error");
  }
}

// Reset announcement form
function resetAnnouncementForm() {
  currentAnnouncementEditId = null;
  document.getElementById("announcementForm").reset();
  document.getElementById("announcementId").value = "";
  document.getElementById("announcementIsPublished").checked = true;
  document.getElementById("announcementIsPinned").checked = false;
  toggleAnnouncementFields();

  document.getElementById("announcementFormTitle").textContent =
    "Add New Announcement";
  document.getElementById("announcementSubmitBtnText").textContent =
    "Create Announcement";
}

// Confirm delete announcement
function confirmDeleteAnnouncement(id) {
  deleteAnnouncementId = id;
  document.getElementById("deleteModal").classList.add("show");

  // Change the confirm button handler temporarily
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  confirmBtn.onclick = deleteAnnouncement;
}

// Delete announcement
async function deleteAnnouncement() {
  if (!deleteAnnouncementId) return;

  const confirmBtn = document.getElementById("confirmDeleteBtn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Deleting...";

  try {
    const response = await fetch(
      `${API_URL}/announcements/${deleteAnnouncementId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (data.success) {
      showToast("Announcement deleted successfully", "success");
      fetchAnnouncements();
      closeDeleteModal();
    } else {
      showToast(data.message || "Failed to delete announcement", "error");
    }
  } catch (error) {
    console.error("Error deleting announcement:", error);
    showToast("Failed to delete announcement", "error");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Delete";
    deleteAnnouncementId = null;

    // Reset confirm button handler
    confirmBtn.onclick = deleteEntity;
  }
}

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

// Fetch pending users
async function fetchPendingUsers() {
  try {
    const response = await fetch(`${API_URL}/users?status=pending_review`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (data.success) {
      pendingUsers = data.users;
      renderPendingUsers();
      updatePendingBadge();
    } else {
      console.error("Failed to fetch pending users:", data.message);
    }
  } catch (error) {
    console.error("Error fetching pending users:", error);
    document.getElementById("pendingUsersList").innerHTML =
      '<p class="empty-message">Failed to load pending users</p>';
  }
}

// Fetch pending claims
async function fetchPendingClaims() {
  try {
    const response = await fetch(`${API_URL}/entity-claims?status=pending`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (data.success) {
      pendingClaims = data.claims;
      renderPendingClaims();
      updatePendingBadge();
    } else {
      console.error("Failed to fetch pending claims:", data.message);
    }
  } catch (error) {
    console.error("Error fetching pending claims:", error);
    document.getElementById("pendingClaimsList").innerHTML =
      '<p class="empty-message">Failed to load pending claims</p>';
  }
}

// Fetch all users
async function fetchUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (data.success) {
      users = data.users;
      renderUsersTable();
    } else {
      console.error("Failed to fetch users:", data.message);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    document.getElementById("usersTableBody").innerHTML =
      '<tr><td colspan="6" class="empty-message">Failed to load users</td></tr>';
  }
}

// Update pending badge count
function updatePendingBadge() {
  const badge = document.getElementById("pendingBadge");
  const totalPending = pendingUsers.length + pendingClaims.length;
  
  if (totalPending > 0) {
    badge.textContent = totalPending;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// Render pending users
function renderPendingUsers() {
  const container = document.getElementById("pendingUsersList");

  if (pendingUsers.length === 0) {
    container.innerHTML = '<p class="empty-message">No pending user reviews</p>';
    return;
  }

  container.innerHTML = pendingUsers
    .map(
      (user) => `
    <div class="review-card">
      <div class="review-avatar">
        ${user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}${user.lastName ? user.lastName.charAt(0).toUpperCase() : ""}
      </div>
      <div class="review-info">
        <h4>${user.firstName || ""} ${user.lastName || ""}</h4>
        <p>${user.email}</p>
        <div class="review-meta">
          <span class="user-type-badge user-type-${user.userType}">${formatUserType(user.userType)}</span>
          ${user.publicRole ? `<span class="user-type-badge">${user.publicRole}</span>` : ""}
          <span>Joined ${formatDate(user.createdAt)}</span>
        </div>
      </div>
      <div class="review-actions">
        <button class="btn-approve" onclick="approveUser('${user._id}')">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn-reject" onclick="openRejectModal('${user._id}', 'user')">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// Render pending claims
function renderPendingClaims() {
  const container = document.getElementById("pendingClaimsList");

  if (pendingClaims.length === 0) {
    container.innerHTML = '<p class="empty-message">No pending entity claims</p>';
    return;
  }

  container.innerHTML = pendingClaims
    .map(
      (claim) => `
    <div class="review-card">
      <div class="review-avatar">
        ${claim.userId?.firstName ? claim.userId.firstName.charAt(0).toUpperCase() : "?"}${claim.userId?.lastName ? claim.userId.lastName.charAt(0).toUpperCase() : ""}
      </div>
      <div class="review-info">
        <h4>${claim.userId?.firstName || ""} ${claim.userId?.lastName || ""}</h4>
        <p>${claim.userId?.email || "Unknown user"}</p>
        <div class="review-meta">
          ${claim.isNewEntity 
            ? `<span class="user-type-badge user-type-entity_representative">New Entity: ${claim.newEntityData?.name || "Unknown"} (${claim.newEntityData?.type || "Unknown"})</span>`
            : `<span class="user-type-badge user-type-entity_representative">Claim: ${claim.entityId?.name || "Unknown Entity"}</span>`
          }
          <span>Role: ${formatClaimRole(claim.claimRole)}</span>
          ${claim.workEmail ? `<span>Work: ${claim.workEmail}</span>` : ""}
        </div>
        ${claim.linkedinProfile ? `<p style="font-size: 0.8rem; color: #0077b5;"><i class="fab fa-linkedin"></i> ${claim.linkedinProfile}</p>` : ""}
      </div>
      <div class="review-actions">
        <button class="btn-approve" onclick="approveClaim('${claim._id}')">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn-reject" onclick="openRejectModal('${claim._id}', 'claim')">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// Render users table
function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  const searchTerm = document.getElementById("searchUserInput")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("filterUserStatus")?.value || "";
  const typeFilter = document.getElementById("filterUserType")?.value || "";

  let filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || user.status === statusFilter;
    const matchesType = !typeFilter || user.userType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (filteredUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-message">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredUsers
    .map(
      (user) => `
    <tr>
      <td>
        <div class="entity-cell">
          <div class="entity-info">
            <span class="entity-name">${user.firstName || ""} ${user.lastName || ""}</span>
          </div>
        </div>
      </td>
      <td>${user.email}</td>
      <td><span class="user-type-badge user-type-${user.userType}">${formatUserType(user.userType)}</span></td>
      <td>
        <span class="status-badge status-${user.status}">
          ${formatStatus(user.status)}
        </span>
      </td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <div class="action-buttons">
          ${user.status === "pending_review" 
            ? `
              <button class="btn-icon" onclick="approveUser('${user._id}')" title="Approve">
                <i class="fas fa-check" style="color: #10b981;"></i>
              </button>
              <button class="btn-icon" onclick="openRejectModal('${user._id}', 'user')" title="Reject">
                <i class="fas fa-times" style="color: #ef4444;"></i>
              </button>
            `
            : user.status === "active"
            ? `
              <button class="btn-icon" onclick="suspendUser('${user._id}')" title="Suspend">
                <i class="fas fa-ban" style="color: #f97316;"></i>
              </button>
            `
            : user.status === "suspended"
            ? `
              <button class="btn-icon" onclick="reactivateUser('${user._id}')" title="Reactivate">
                <i class="fas fa-undo" style="color: #10b981;"></i>
              </button>
            `
            : ""
          }
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Format user type
function formatUserType(type) {
  const types = {
    browser: "Browser",
    entity_representative: "Entity Rep",
    individual_public: "Public Profile",
  };
  return types[type] || type;
}

// Format claim role
function formatClaimRole(role) {
  const roles = {
    owner: "Owner",
    founder: "Founder",
    admin: "Admin",
    manager: "Manager",
    team_member: "Team Member",
  };
  return roles[role] || role;
}

// Format status
function formatStatus(status) {
  const statuses = {
    active: "Active",
    pending_review: "Pending",
    rejected: "Rejected",
    suspended: "Suspended",
  };
  return statuses[status] || status;
}

// Approve user
async function approveUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "approve" }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("User approved successfully!");
      fetchPendingUsers();
      fetchUsers();
    } else {
      showToast(data.message || "Failed to approve user", "error");
    }
  } catch (error) {
    console.error("Error approving user:", error);
    showToast("Failed to approve user", "error");
  }
}

// Reject user
async function rejectUser(userId, reason = "") {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "reject", reason }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("User rejected");
      fetchPendingUsers();
      fetchUsers();
    } else {
      showToast(data.message || "Failed to reject user", "error");
    }
  } catch (error) {
    console.error("Error rejecting user:", error);
    showToast("Failed to reject user", "error");
  }
}

// Suspend user
async function suspendUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "suspend" }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("User suspended");
      fetchUsers();
    } else {
      showToast(data.message || "Failed to suspend user", "error");
    }
  } catch (error) {
    console.error("Error suspending user:", error);
    showToast("Failed to suspend user", "error");
  }
}

// Reactivate user
async function reactivateUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "reactivate" }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("User reactivated!");
      fetchUsers();
    } else {
      showToast(data.message || "Failed to reactivate user", "error");
    }
  } catch (error) {
    console.error("Error reactivating user:", error);
    showToast("Failed to reactivate user", "error");
  }
}

// Approve claim
async function approveClaim(claimId) {
  try {
    const response = await fetch(`${API_URL}/entity-claims/${claimId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "approve" }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Entity claim approved!");
      fetchPendingClaims();
    } else {
      showToast(data.message || "Failed to approve claim", "error");
    }
  } catch (error) {
    console.error("Error approving claim:", error);
    showToast("Failed to approve claim", "error");
  }
}

// Reject claim
async function rejectClaim(claimId, reason = "") {
  try {
    const response = await fetch(`${API_URL}/entity-claims/${claimId}/review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "reject", reason }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Entity claim rejected");
      fetchPendingClaims();
    } else {
      showToast(data.message || "Failed to reject claim", "error");
    }
  } catch (error) {
    console.error("Error rejecting claim:", error);
    showToast("Failed to reject claim", "error");
  }
}

// Open reject modal
function openRejectModal(itemId, itemType) {
  rejectItemId = itemId;
  rejectItemType = itemType;
  document.getElementById("rejectItemType").textContent = itemType === "user" ? "User" : "Entity Claim";
  document.getElementById("rejectReason").value = "";
  document.getElementById("rejectModal").classList.add("show");
}

// Close reject modal
function closeRejectModal() {
  rejectItemId = null;
  rejectItemType = null;
  document.getElementById("rejectModal").classList.remove("show");
}

// Confirm rejection
function confirmRejection() {
  const reason = document.getElementById("rejectReason").value;
  
  if (rejectItemType === "user") {
    rejectUser(rejectItemId, reason);
  } else if (rejectItemType === "claim") {
    rejectClaim(rejectItemId, reason);
  }
  
  closeRejectModal();
}

// Initialize user management event listeners
function initUserManagement() {
  // User search and filter listeners
  document.getElementById("searchUserInput")?.addEventListener("input", () => renderUsersTable());
  document.getElementById("filterUserStatus")?.addEventListener("change", () => renderUsersTable());
  document.getElementById("filterUserType")?.addEventListener("change", () => renderUsersTable());

  // Reject modal listeners
  document.getElementById("confirmRejectBtn")?.addEventListener("click", confirmRejection);
  
  // Close modal on outside click
  document.getElementById("rejectModal")?.addEventListener("click", (e) => {
    if (e.target.id === "rejectModal") {
      closeRejectModal();
    }
  });

  // Fetch pending data on load to update badge
  fetchPendingUsers();
  fetchPendingClaims();
}
