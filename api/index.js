const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

// Environment variables (set these in cPanel Node.js App settings)
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://brahimioussamaa_db_user:FA720QE3nn9pt8Kk@cluster0.rk8n2wp.mongodb.net/upnexus?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "upnexus_admin_secret_key_2026";

// CORS configuration - allow up-nexus.com (www and non-www)
const allowedOrigins = [
  "https://up-nexus.com",
  "https://www.up-nexus.com",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, "..", "public")));

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("Connected to MongoDB:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    isConnected = false;
    throw error;
  }
};

// ============================================
// MODELS
// ============================================

// Entity Model
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
  logo: { type: String, trim: true }, // URL to logo/image
  color: { type: String, default: "#F4B000" },

  // Basic Info
  description: { type: String, trim: true },
  shortDescription: { type: String, trim: true, maxlength: 200 },
  website: { type: String, trim: true },

  // Location
  location: { type: String, trim: true },
  address: { type: String, trim: true },
  wilaya: { type: String, trim: true },

  // Contact Information
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },

  // Social Media
  socialMedia: {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
  },

  // Additional Details
  foundedYear: { type: Number },
  teamSize: { type: String, trim: true },
  sector: { type: String, trim: true },
  stage: { type: String, trim: true }, // For startups: idea, MVP, growth, etc.

  // For Investors/Funders
  investmentRange: { type: String, trim: true },
  investmentStages: [{ type: String, trim: true }],
  portfolioCount: { type: Number },

  // For Incubators/Accelerators
  programDuration: { type: String, trim: true },
  batchSize: { type: Number },
  successStories: { type: Number },

  // For Freelancers/Service Providers
  services: [{ type: String, trim: true }],
  expertise: [{ type: String, trim: true }],
  hourlyRate: { type: String, trim: true },

  // For Research Centers
  researchAreas: [{ type: String, trim: true }],
  publications: { type: Number },

  // For Coworking Spaces
  capacity: { type: Number },
  amenities: [{ type: String, trim: true }],
  pricing: { type: String, trim: true },

  // General
  tags: [{ type: String, trim: true }],
  achievements: [{ type: String, trim: true }],
  partners: [{ type: String, trim: true }],

  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

entitySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Entity = mongoose.models.Entity || mongoose.model("Entity", entitySchema);

// Announcement Model
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

  // Event specific fields
  eventDate: { type: Date },
  eventLocation: { type: String, trim: true },
  eventLink: { type: String, trim: true },

  // Job specific fields
  company: { type: String, trim: true },
  jobType: { type: String, trim: true }, // Full-time, Part-time, Remote, etc.
  salary: { type: String, trim: true },
  deadline: { type: Date },

  // Funding specific fields
  fundingAmount: { type: String, trim: true },
  eligibility: { type: String, trim: true },

  // Links
  externalLink: { type: String, trim: true },
  applyLink: { type: String, trim: true },

  // Status
  isPublished: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  views: { type: Number, default: 0 },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: Date.now },
});

announcementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (!this.excerpt && this.content) {
    this.excerpt =
      this.content.substring(0, 280) + (this.content.length > 280 ? "..." : "");
  }
  next();
});

const Announcement =
  mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);

// Admin Model
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

// ============================================
// AUTH MIDDLEWARE
// ============================================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "UP-NEXUS API is running",
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  await connectDB();

  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    admin.lastLogin = Date.now();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/auth/verify", authMiddleware, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

app.post("/api/auth/setup", async (req, res) => {
  await connectDB();

  try {
    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists. Use login instead.",
      });
    }

    const { username, password, email } = req.body;
    const admin = new Admin({ username, password, email, role: "superadmin" });
    await admin.save();

    res
      .status(201)
      .json({ success: true, message: "Admin account created successfully" });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Public Stats Route (no auth required)
app.get("/api/stats", async (req, res) => {
  try {
    await connectDB();

    // Get actual counts by type from database
    const stats = await Entity.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // Build counts object from actual database data
    const byType = {};
    stats.forEach((s) => {
      byType[s._id] = s.count;
    });

    // Only return REAL counts from the database
    const result = {
      // Total active entities in the platform
      totalEntities: await Entity.countDocuments({ isActive: true }),

      // Individual type counts (all from database)
      startups: byType["Startup"] || 0,
      incubators: byType["Incubator"] || 0,
      accelerators: byType["Accelerator"] || 0,
      investors: byType["Investor"] || 0,
      publicFunders: byType["Public Funder"] || 0,
      coworkingSpaces: byType["Coworking Space"] || 0,
      communities: byType["Community & Network"] || 0,
      freelancers: byType["Freelancer"] || 0,
      researchCenters: byType["Research Center"] || 0,
      mentors: byType["Mentor & Advisor"] || 0,
      serviceProviders: byType["Service Provider"] || 0,
      projectHolders: byType["Project Holder"] || 0,

      // Raw breakdown by type
      byType,
    };

    res.json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Entity Routes
app.get("/api/entities", async (req, res) => {
  try {
    await connectDB();

    const { type, active, all } = req.query;
    let filter = {};

    if (type) filter.type = type;

    // If 'all' is passed, don't filter by active status (for admin view)
    // If 'active' has a value, use it; otherwise default to showing only active
    if (all !== "true") {
      if (active === "true") {
        filter.isActive = true;
      } else if (active === "false") {
        filter.isActive = false;
      } else {
        // Default: show only active entities for public view
        filter.isActive = true;
      }
    }

    const entities = await Entity.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: entities.length, entities });
  } catch (error) {
    console.error("Get entities error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

app.get("/api/entities/admin/stats", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const stats = await Entity.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    const totalEntities = await Entity.countDocuments();
    const activeEntities = await Entity.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: { total: totalEntities, active: activeEntities, byType: stats },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/entities/:id", async (req, res) => {
  await connectDB();

  try {
    const entity = await Entity.findById(req.params.id);

    if (!entity) {
      return res
        .status(404)
        .json({ success: false, message: "Entity not found" });
    }

    res.json({ success: true, entity });
  } catch (error) {
    console.error("Get entity error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/entities", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const entityData = req.body;
    const entity = new Entity(entityData);
    await entity.save();

    res
      .status(201)
      .json({ success: true, message: "Entity created successfully", entity });
  } catch (error) {
    console.error("Create entity error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

app.put("/api/entities/:id", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const entityData = { ...req.body, updatedAt: Date.now() };

    const entity = await Entity.findByIdAndUpdate(req.params.id, entityData, {
      new: true,
      runValidators: true,
    });

    if (!entity) {
      return res
        .status(404)
        .json({ success: false, message: "Entity not found" });
    }

    res.json({ success: true, message: "Entity updated successfully", entity });
  } catch (error) {
    console.error("Update entity error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/entities/:id", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const entity = await Entity.findByIdAndDelete(req.params.id);

    if (!entity) {
      return res
        .status(404)
        .json({ success: false, message: "Entity not found" });
    }

    res.json({ success: true, message: "Entity deleted successfully" });
  } catch (error) {
    console.error("Delete entity error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================
// ANNOUNCEMENT ROUTES
// ============================================

// Get all announcements (public)
app.get("/api/announcements", async (req, res) => {
  try {
    await connectDB();

    const { category, all, limit } = req.query;
    let filter = {};

    if (category && category !== "all") filter.category = category;

    // If 'all' is not true, only show published announcements (for public view)
    if (all !== "true") {
      filter.isPublished = true;
    }

    let query = Announcement.find(filter).sort({
      isPinned: -1,
      publishedAt: -1,
    });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const announcements = await query;
    res.json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    console.error("Get announcements error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// Get announcement stats (admin)
app.get("/api/announcements/admin/stats", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const stats = await Announcement.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const totalAnnouncements = await Announcement.countDocuments();
    const publishedAnnouncements = await Announcement.countDocuments({
      isPublished: true,
    });
    const pinnedAnnouncements = await Announcement.countDocuments({
      isPinned: true,
    });

    res.json({
      success: true,
      stats: {
        total: totalAnnouncements,
        published: publishedAnnouncements,
        pinned: pinnedAnnouncements,
        byCategory: stats,
      },
    });
  } catch (error) {
    console.error("Announcement stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get single announcement
app.get("/api/announcements/:id", async (req, res) => {
  await connectDB();

  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    // Increment view count
    announcement.views += 1;
    await announcement.save();

    res.json({ success: true, announcement });
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create announcement (admin)
app.post("/api/announcements", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const announcementData = req.body;
    const announcement = new Announcement(announcementData);
    await announcement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// Update announcement (admin)
app.put("/api/announcements/:id", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const announcementData = { ...req.body, updatedAt: Date.now() };

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      announcementData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete announcement (admin)
app.delete("/api/announcements/:id", authMiddleware, async (req, res) => {
  await connectDB();

  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Serve frontend for all non-API routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Export for Vercel/cPanel
module.exports = app;

// Start server (works for cPanel and local development)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
