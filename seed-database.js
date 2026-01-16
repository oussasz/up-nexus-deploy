/**
 * UP-NEXUS Database Seeder Script
 *
 * This script reads all JSON data files and intelligently inserts them
 * into the MongoDB database, transforming them to match the backend schemas.
 *
 * Usage: node seed-database.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://brahimioussamaa_db_user:FA720QE3nn9pt8Kk@cluster0.rk8n2wp.mongodb.net/upnexus?retryWrites=true&w=majority&appName=Cluster0";

// ============================================
// SCHEMAS (matching api/index.js)
// ============================================

const entitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: [
      "Project Holder",
      "Startup",
      "Incubator",
      "Accelerator",
      "Investor",
      "Public Funder",
      "Freelancer",
      "Research Center",
      "Mentor & Advisor",
      "Service Provider",
      "Coworking Space",
      "Community & Network",
    ],
  },
  icon: { type: String, default: "🏢" },
  logo: { type: String, trim: true },
  color: { type: String, default: "#F4B000" },
  description: { type: String, trim: true },
  shortDescription: { type: String, trim: true, maxlength: 200 },
  website: { type: String, trim: true },
  location: { type: String, trim: true },
  address: { type: String, trim: true },
  wilaya: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  socialMedia: {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
  },
  foundedYear: { type: Number },
  teamSize: { type: String, trim: true },
  sector: { type: String, trim: true },
  stage: { type: String, trim: true },
  investmentRange: { type: String, trim: true },
  investmentStages: [{ type: String, trim: true }],
  portfolioCount: { type: Number },
  programDuration: { type: String, trim: true },
  batchSize: { type: Number },
  successStories: { type: Number },
  services: [{ type: String, trim: true }],
  expertise: [{ type: String, trim: true }],
  hourlyRate: { type: String, trim: true },
  researchAreas: [{ type: String, trim: true }],
  publications: { type: Number },
  capacity: { type: Number },
  amenities: [{ type: String, trim: true }],
  pricing: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  achievements: [{ type: String, trim: true }],
  partners: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  excerpt: { type: String, trim: true, maxlength: 300 },
  category: {
    type: String,
    required: true,
    enum: ["Funding", "Job", "Event", "Program", "News", "Other"],
    default: "News",
  },
  author: { type: String, trim: true, default: "UP-NEXUS Team" },
  authorAvatar: { type: String, trim: true },
  image: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  eventDate: { type: Date },
  eventLocation: { type: String, trim: true },
  eventLink: { type: String, trim: true },
  company: { type: String, trim: true },
  jobType: { type: String, trim: true },
  salary: { type: String, trim: true },
  deadline: { type: Date },
  fundingAmount: { type: String, trim: true },
  eligibility: { type: String, trim: true },
  externalLink: { type: String, trim: true },
  applyLink: { type: String, trim: true },
  isPublished: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: Date.now },
});

const Entity = mongoose.model("Entity", entitySchema);
const Announcement = mongoose.model("Announcement", announcementSchema);

// ============================================
// DATA LOADING & TRANSFORMATION
// ============================================

const dataDir = path.join(__dirname, "..", "data");

function loadJSON(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
}

// Category ID to name mapping
function loadStartupCategories() {
  const categories = loadJSON("startup_categories.json");
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.id] = cat.name;
  });
  return categoryMap;
}

// Entity type icons and colors
const entityConfig = {
  Startup: { icon: "🚀", color: "#10B981" },
  Incubator: { icon: "🏢", color: "#6366F1" },
  Accelerator: { icon: "⚡", color: "#F59E0B" },
  "Coworking Space": { icon: "💼", color: "#8B5CF6" },
  "Community & Network": { icon: "🌐", color: "#EC4899" },
  Investor: { icon: "💰", color: "#14B8A6" },
  "Public Funder": { icon: "🏛️", color: "#3B82F6" },
};

// Transform startups data to Entity schema
function transformStartups(startups, categoryMap) {
  return startups.map((startup) => {
    // Map category IDs to category names
    const tags = (startup.categoryIds || [])
      .map((id) => categoryMap[id] || id)
      .filter(Boolean);

    // Determine sector from first category
    const sector = tags.length > 0 ? tags[0] : "Technology";

    return {
      name: startup.name,
      type: "Startup",
      icon: entityConfig.Startup.icon,
      color: entityConfig.Startup.color,
      website: startup.website || "",
      foundedYear: startup.foundedYear,
      sector: sector,
      tags: tags,
      socialMedia: {
        linkedin: startup.linkedin || "",
      },
      description:
        startup.description ||
        `${startup.name} is an Algerian startup${
          startup.foundedYear ? ` founded in ${startup.foundedYear}` : ""
        }, operating in ${tags.join(", ") || "the technology sector"}.`,
      shortDescription: `${startup.name} - ${
        tags.slice(0, 2).join(", ") || "Startup"
      }`,
      isActive: true,
      isFeatured: false,
      isVerified: false,
    };
  });
}

// Transform incubators data to Entity schema
function transformIncubators(incubators) {
  return incubators.map((inc) => ({
    name: inc.name,
    type: "Incubator",
    icon: entityConfig.Incubator.icon,
    color: entityConfig.Incubator.color,
    website: inc.website || "",
    foundedYear: inc.foundedYear,
    location: inc.city || "",
    wilaya: inc.city || "",
    address: inc.mapLocation || "",
    socialMedia: {
      linkedin: inc.linkedin || "",
    },
    description:
      inc.description ||
      `${inc.name} is a startup incubator based in ${
        inc.city || "Algeria"
      }, providing support and resources for early-stage entrepreneurs.`,
    shortDescription: `Incubator in ${inc.city || "Algeria"}`,
    tags: ["Incubator", "Startup Support", inc.city].filter(Boolean),
    isActive: true,
    isFeatured: inc.name.toLowerCase().includes("anpt") ? true : false,
    isVerified: true,
  }));
}

// Transform accelerators data to Entity schema
function transformAccelerators(accelerators) {
  return accelerators.map((acc) => ({
    name: acc.name,
    type: "Accelerator",
    icon: entityConfig.Accelerator.icon,
    color: entityConfig.Accelerator.color,
    website: acc.website || "",
    foundedYear: acc.foundedYear,
    location: acc.city || "",
    wilaya: acc.city || "",
    address: acc.mapLocation || "",
    socialMedia: {
      linkedin: acc.linkedin || "",
    },
    description:
      acc.description ||
      `${acc.name} is a startup accelerator helping founders scale their businesses.`,
    shortDescription: `Accelerator in ${acc.city || "Algeria"}`,
    tags: ["Accelerator", "Growth", "Funding", acc.city].filter(Boolean),
    isActive: true,
    isFeatured: ["Algeria Startup Fund", "Algeria Venture"].includes(acc.name),
    isVerified: true,
  }));
}

// Transform coworking spaces data to Entity schema
function transformCoworkingSpaces(spaces) {
  return spaces.map((space) => ({
    name: space.name,
    type: "Coworking Space",
    icon: entityConfig["Coworking Space"].icon,
    color: entityConfig["Coworking Space"].color,
    website: space.website || "",
    foundedYear:
      space.foundedYear && space.foundedYear > 0 ? space.foundedYear : null,
    location: space.city || "",
    wilaya: space.city || "",
    address: space.mapLocation || "",
    socialMedia: {
      linkedin: space.linkedin || "",
    },
    description: `${space.name} is a coworking space located in ${
      space.city || "Algeria"
    }, offering flexible workspace solutions for entrepreneurs and professionals.`,
    shortDescription: `Coworking space in ${space.city || "Algeria"}`,
    tags: ["Coworking", "Workspace", space.city].filter(Boolean),
    amenities: ["WiFi", "Meeting Rooms", "Coffee"],
    isActive: true,
    isFeatured: false,
    isVerified: true,
  }));
}

// Transform communities data to Entity schema
function transformCommunities(communities) {
  return communities.map((comm) => ({
    name: comm.name,
    type: "Community & Network",
    icon: entityConfig["Community & Network"].icon,
    color: entityConfig["Community & Network"].color,
    website: comm.url || "",
    description:
      comm.description ||
      `${comm.name} is a community network for tech enthusiasts and entrepreneurs in Algeria.`,
    shortDescription: `Tech community in Algeria`,
    tags: ["Community", "Tech", "Network"],
    isActive: true,
    isFeatured: false,
    isVerified: true,
  }));
}

// Transform events data to Announcements
function transformEvents(events) {
  return events.map((event) => ({
    title: event.name,
    content:
      event.description ||
      `Join us at ${event.name} - a major event for the Algerian tech ecosystem.`,
    excerpt: event.description
      ? event.description.substring(0, 280)
      : `${event.name} - Tech Event`,
    category: "Event",
    author: "UP-NEXUS Team",
    tags: ["Event", "Tech", "Algeria"],
    externalLink: event.url || "",
    eventLink: event.url || "",
    isPublished: true,
    isPinned: false,
  }));
}

// Transform jobs data to Announcements
function transformJobs(jobs) {
  return jobs.map((job) => ({
    title: `Jobs at ${job.name}`,
    content: `${
      job.description || job.name
    } - Find exciting career opportunities in Algeria's tech sector.`,
    excerpt: job.description || `Explore job opportunities at ${job.name}`,
    category: "Job",
    author: "UP-NEXUS Team",
    company: job.name,
    tags: ["Jobs", "Career", "Tech"],
    externalLink: job.url || "",
    applyLink: job.url || "",
    isPublished: true,
    isPinned: false,
  }));
}

// Transform resources data to Announcements
function transformResources(resources) {
  return resources.map((resource) => ({
    title: resource.name,
    content:
      resource.description ||
      `${resource.name} - A valuable resource for the Algerian startup ecosystem.`,
    excerpt: resource.description
      ? resource.description.substring(0, 280)
      : resource.name,
    category: "News",
    author: "UP-NEXUS Team",
    tags: ["Resource", "Government", "Startup"],
    externalLink: resource.url || "",
    isPublished: true,
    isPinned: ["Startup DZ", "Algeria Startup Fund"].includes(resource.name),
  }));
}

// Transform media data to Announcements
function transformMedia(media, mediaCategories) {
  const categoryMap = {};
  mediaCategories.forEach((cat) => {
    categoryMap[cat.id] = cat.name;
  });

  return media.map((item) => {
    const categoryName = categoryMap[item.categoryId] || "Other";

    return {
      title: item.title,
      content:
        item.description ||
        `${item.title} - Algerian media content for the startup ecosystem.`,
      excerpt: item.description
        ? item.description.substring(0, 280)
        : item.title,
      category: "News",
      author: "UP-NEXUS Team",
      image: item.image || "",
      tags: ["Media", categoryName, "Content"],
      externalLink: item.url || "",
      isPublished: true,
      isPinned: false,
    };
  });
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  await Entity.deleteMany({});
  await Announcement.deleteMany({});
  console.log("✅ Database cleared!");
}

async function insertEntities(entities, typeName) {
  if (entities.length === 0) {
    console.log(`⏭️  No ${typeName} to insert.`);
    return 0;
  }

  try {
    const result = await Entity.insertMany(entities, { ordered: false });
    console.log(`✅ Inserted ${result.length} ${typeName}`);
    return result.length;
  } catch (error) {
    if (error.writeErrors) {
      console.log(
        `⚠️  Inserted ${error.insertedDocs?.length || 0} ${typeName} (${
          error.writeErrors.length
        } duplicates skipped)`
      );
      return error.insertedDocs?.length || 0;
    }
    console.error(`❌ Error inserting ${typeName}:`, error.message);
    return 0;
  }
}

async function insertAnnouncements(announcements, typeName) {
  if (announcements.length === 0) {
    console.log(`⏭️  No ${typeName} to insert.`);
    return 0;
  }

  try {
    const result = await Announcement.insertMany(announcements, {
      ordered: false,
    });
    console.log(`✅ Inserted ${result.length} ${typeName}`);
    return result.length;
  } catch (error) {
    if (error.writeErrors) {
      console.log(
        `⚠️  Inserted ${error.insertedDocs?.length || 0} ${typeName} (${
          error.writeErrors.length
        } duplicates skipped)`
      );
      return error.insertedDocs?.length || 0;
    }
    console.error(`❌ Error inserting ${typeName}:`, error.message);
    return 0;
  }
}

// ============================================
// MAIN SEEDER FUNCTION
// ============================================

async function seedDatabase() {
  console.log("\n🌱 UP-NEXUS Database Seeder");
  console.log("============================\n");

  try {
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB!\n");

    // Clear existing data
    await clearDatabase();
    console.log("");

    // Load category mappings
    const categoryMap = loadStartupCategories();
    const mediaCategories = loadJSON("media_category.json");

    // Load all data
    console.log("📂 Loading data files...");
    const startups = loadJSON("startups.json");
    const incubators = loadJSON("incubators.json");
    const accelerators = loadJSON("accelerators.json");
    const coworkingSpaces = loadJSON("coworking-spaces.json");
    const communities = loadJSON("communities.json");
    const events = loadJSON("events.json");
    const jobs = loadJSON("jobs.json");
    const resources = loadJSON("resources.json");
    const media = loadJSON("media.json");
    console.log("✅ Data files loaded!\n");

    // Transform data
    console.log("🔄 Transforming data...\n");

    const transformedStartups = transformStartups(startups, categoryMap);
    const transformedIncubators = transformIncubators(incubators);
    const transformedAccelerators = transformAccelerators(accelerators);
    const transformedCoworkingSpaces =
      transformCoworkingSpaces(coworkingSpaces);
    const transformedCommunities = transformCommunities(communities);
    const transformedEvents = transformEvents(events);
    const transformedJobs = transformJobs(jobs);
    const transformedResources = transformResources(resources);
    const transformedMedia = transformMedia(media, mediaCategories);

    // Insert Entities
    console.log("📥 Inserting Entities...");
    let totalEntities = 0;

    totalEntities += await insertEntities(transformedStartups, "Startups");
    totalEntities += await insertEntities(transformedIncubators, "Incubators");
    totalEntities += await insertEntities(
      transformedAccelerators,
      "Accelerators"
    );
    totalEntities += await insertEntities(
      transformedCoworkingSpaces,
      "Coworking Spaces"
    );
    totalEntities += await insertEntities(
      transformedCommunities,
      "Communities"
    );

    console.log(`\n📊 Total Entities inserted: ${totalEntities}\n`);

    // Insert Announcements
    console.log("📥 Inserting Announcements...");
    let totalAnnouncements = 0;

    totalAnnouncements += await insertAnnouncements(
      transformedEvents,
      "Events"
    );
    totalAnnouncements += await insertAnnouncements(
      transformedJobs,
      "Job Listings"
    );
    totalAnnouncements += await insertAnnouncements(
      transformedResources,
      "Resources"
    );
    totalAnnouncements += await insertAnnouncements(
      transformedMedia,
      "Media Content"
    );

    console.log(`\n📊 Total Announcements inserted: ${totalAnnouncements}\n`);

    // Summary
    console.log("============================");
    console.log("🎉 DATABASE SEEDING COMPLETE!");
    console.log("============================\n");
    console.log(`📈 Summary:`);
    console.log(`   - Startups: ${transformedStartups.length}`);
    console.log(`   - Incubators: ${transformedIncubators.length}`);
    console.log(`   - Accelerators: ${transformedAccelerators.length}`);
    console.log(`   - Coworking Spaces: ${transformedCoworkingSpaces.length}`);
    console.log(`   - Communities: ${transformedCommunities.length}`);
    console.log(`   - Events: ${transformedEvents.length}`);
    console.log(`   - Job Listings: ${transformedJobs.length}`);
    console.log(`   - Resources: ${transformedResources.length}`);
    console.log(`   - Media Content: ${transformedMedia.length}`);
    console.log(`\n   Total Entities: ${totalEntities}`);
    console.log(`   Total Announcements: ${totalAnnouncements}`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
