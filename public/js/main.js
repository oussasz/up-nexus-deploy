/* =============================================
   UP-NEXUS - Main JavaScript
   Professional interactions and animations
   ============================================= */

"use strict";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];

const debounce = (func, wait = 100) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const throttle = (func, limit = 100) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ==========================================
// NAVIGATION
// ==========================================

class Navigation {
  constructor() {
    this.navbar = $("#navbar");
    this.navLinks = $("#navLinks");
    this.mobileToggle = $("#mobileMenuToggle");
    this.lastScroll = 0;

    this.init();
  }

  init() {
    // Scroll effects
    window.addEventListener(
      "scroll",
      throttle(() => this.handleScroll(), 50)
    );

    // Mobile menu toggle
    this.mobileToggle?.addEventListener("click", () => this.toggleMobileMenu());

    // Close mobile menu on link click
    $$(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => this.closeMobileMenu());
    });

    // Close mobile menu on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeMobileMenu();
    });

    // Active link highlighting
    this.setupActiveLinks();
  }

  handleScroll() {
    const currentScroll = window.pageYOffset;

    // Add/remove scrolled class
    if (currentScroll > 50) {
      this.navbar.classList.add("scrolled");
    } else {
      this.navbar.classList.remove("scrolled");
    }

    // Hide/show navbar on scroll direction
    if (currentScroll > this.lastScroll && currentScroll > 500) {
      this.navbar.style.transform = "translateY(-100%)";
    } else {
      this.navbar.style.transform = "translateY(0)";
    }

    this.lastScroll = currentScroll;
  }

  toggleMobileMenu() {
    this.navLinks.classList.toggle("active");
    const icon = this.mobileToggle.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-times");
    document.body.style.overflow = this.navLinks.classList.contains("active")
      ? "hidden"
      : "";
  }

  closeMobileMenu() {
    this.navLinks.classList.remove("active");
    const icon = this.mobileToggle.querySelector("i");
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
    document.body.style.overflow = "";
  }

  setupActiveLinks() {
    const sections = $$("section[id]");

    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrollPosition = window.scrollY + 150;

        sections.forEach((section) => {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          const id = section.getAttribute("id");
          const link = $(`.nav-links a[href="#${id}"]`);

          if (link && scrollPosition >= top && scrollPosition < top + height) {
            $$(".nav-links a").forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      }, 100)
    );
  }
}

// ==========================================
// SMOOTH SCROLL
// ==========================================

class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href");
        if (href !== "#") {
          e.preventDefault();
          const target = $(href);
          if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
          }
        }
      });
    });
  }
}

// ==========================================
// COUNTER ANIMATION
// ==========================================

class Counter {
  constructor() {
    this.counters = $$("[data-target], [data-count]");
    this.observed = new Set();
    this.init();
  }

  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.observed.has(entry.target)) {
            this.observed.add(entry.target);
            this.animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.counters.forEach((counter) => observer.observe(counter));
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.target || element.dataset.count);
    const duration = 2000;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(target * easeProgress);

      element.textContent =
        current.toLocaleString() + (progress === 1 ? "+" : "");

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================

class ScrollAnimations {
  constructor() {
    this.init();
  }

  init() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");

          // Animate children with stagger
          const children = entry.target.querySelectorAll(".animate-child");
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add("animate-in");
            }, index * 100);
          });
        }
      });
    }, observerOptions);

    // Observe cards and other elements
    $$(
      ".stat-card, .benefit-card, .pricing-card, .step, .testimonial-card"
    ).forEach((el, index) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = `opacity 0.6s ease ${
        index * 0.1
      }s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(el);
    });

    // Add animation class when in view
    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                .animate-in {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            </style>
        `
    );
  }
}

// ==========================================
// STEPS PROGRESS LINE
// ==========================================

class StepsProgress {
  constructor() {
    this.progressLine = $("#stepsProgress");
    this.steps = $$(".step");
    this.init();
  }

  init() {
    if (!this.progressLine) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateProgress();
            this.activateSteps();
          }
        });
      },
      { threshold: 0.3 }
    );

    const stepsWrapper = $(".steps-wrapper");
    if (stepsWrapper) observer.observe(stepsWrapper);
  }

  animateProgress() {
    setTimeout(() => {
      this.progressLine.style.width = "100%";
    }, 300);
  }

  activateSteps() {
    this.steps.forEach((step, index) => {
      setTimeout(() => {
        step.classList.add("active");
      }, 500 + index * 400);
    });
  }
}

// ==========================================
// BENEFITS FILTER TABS
// ==========================================

class BenefitsFilter {
  constructor() {
    this.tabs = $$(".benefit-tab");
    this.cards = $$(".benefit-card");
    this.init();
  }

  init() {
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.filterCards(tab));
    });
  }

  filterCards(activeTab) {
    const filter = activeTab.dataset.filter;

    // Update active tab
    this.tabs.forEach((tab) => tab.classList.remove("active"));
    activeTab.classList.add("active");

    // Filter cards
    this.cards.forEach((card) => {
      const category = card.dataset.category;

      if (filter === "all" || category === filter) {
        card.style.display = "block";
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 50);
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  }
}

// ==========================================
// BACK TO TOP BUTTON
// ==========================================

class BackToTop {
  constructor() {
    this.button = $("#backToTop");
    this.init();
  }

  init() {
    if (!this.button) return;

    window.addEventListener(
      "scroll",
      throttle(() => {
        if (window.pageYOffset > 500) {
          this.button.classList.add("visible");
        } else {
          this.button.classList.remove("visible");
        }
      }, 100)
    );

    this.button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
}

// ==========================================
// BUTTON RIPPLE EFFECT
// ==========================================

class RippleEffect {
  constructor() {
    this.init();
  }

  init() {
    $$(".btn").forEach((button) => {
      button.addEventListener("click", (e) => this.createRipple(e, button));
    });

    // Add ripple styles
    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                }
                
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            </style>
        `
    );
  }

  createRipple(event, button) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

    button.style.position = "relative";
    button.style.overflow = "hidden";

    // Remove existing ripple
    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) existingRipple.remove();

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }
}

// ==========================================
// PARALLAX EFFECTS
// ==========================================

class Parallax {
  constructor() {
    this.elements = $$(".hero-orb");
    this.init();
  }

  init() {
    window.addEventListener(
      "scroll",
      throttle(() => {
        const scrolled = window.pageYOffset;

        this.elements.forEach((el, index) => {
          const speed = 0.3 + index * 0.1;
          el.style.transform = `translateY(${scrolled * speed}px)`;
        });
      }, 16)
    );
  }
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

class Notifications {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container
    this.container = document.createElement("div");
    this.container.className = "notification-container";
    this.container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
    document.body.appendChild(this.container);

    // Add notification styles
    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                .notification {
                    padding: 16px 24px;
                    background: var(--color-bg-tertiary);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    color: var(--color-text-primary);
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                    max-width: 350px;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification.success {
                    border-left: 4px solid var(--color-accent-green);
                }
                
                .notification.error {
                    border-left: 4px solid var(--color-accent-red);
                }
                
                .notification.info {
                    border-left: 4px solid var(--color-accent-blue);
                }
                
                .notification-icon {
                    font-size: 1.25rem;
                }
                
                .notification.success .notification-icon { color: var(--color-accent-green); }
                .notification.error .notification-icon { color: var(--color-accent-red); }
                .notification.info .notification-icon { color: var(--color-accent-blue); }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .notification-message {
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--color-text-tertiary);
                    cursor: pointer;
                    padding: 4px;
                }
            </style>
        `
    );
  }

  show(type, title, message, duration = 5000) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
    };

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <i class="fas ${icons[type]} notification-icon"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    this.container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    // Close button
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        this.close(notification);
      });

    // Auto close
    if (duration > 0) {
      setTimeout(() => this.close(notification), duration);
    }

    return notification;
  }

  close(notification) {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }
}

// ==========================================
// FORM HANDLERS
// ==========================================

class FormHandlers {
  constructor(notifications) {
    this.notifications = notifications;
    this.init();
  }

  init() {
    // Newsletter form
    const newsletterForm = $("#newsletterForm");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        this.notifications.show(
          "success",
          "Subscribed!",
          `You've been subscribed with ${email}`
        );
        newsletterForm.reset();
      });
    }

    // Button click handlers
    $("#loginBtn")?.addEventListener("click", () => {
      window.location.href = "/auth/login";
    });

    $("#joinBtn")?.addEventListener("click", () => {
      window.location.href = "/auth/register";
    });

    $("#heroJoinBtn")?.addEventListener("click", () => {
      window.location.href = "/auth/register";
    });

    $("#notificationBtn")?.addEventListener("click", () => {
      this.notifications.show(
        "info",
        "Notifications",
        "You have 3 new notifications"
      );
    });

    // Pricing buttons
    $$(".pricing-card .btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const plan = btn
          .closest(".pricing-card")
          .querySelector(".pricing-title").textContent;
        this.notifications.show(
          "success",
          "Great Choice!",
          `You selected the ${plan} plan`
        );
      });
    });
  }
}

// ==========================================
// LAZY LOADING IMAGES
// ==========================================

class LazyLoader {
  constructor() {
    this.init();
  }

  init() {
    const images = $$("img[data-src]");

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }
}

// ==========================================
// KEYBOARD NAVIGATION
// ==========================================

class KeyboardNav {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener("keydown", (e) => {
      // Alt + H = Go to home
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Alt + T = Toggle theme (future feature)
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        console.log("Theme toggle - coming soon!");
      }
    });
  }
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

class Performance {
  constructor() {
    this.init();
  }

  init() {
    // Log performance metrics
    window.addEventListener("load", () => {
      setTimeout(() => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(
          `%c UP-NEXUS loaded in ${loadTime}ms`,
          "color: #F4B000; font-weight: bold;"
        );
      }, 0);
    });
  }
}

// ==========================================
// ECOSYSTEM BACKGROUND ANIMATION
// ==========================================

class EcosystemBackground {
  constructor() {
    this.canvas = document.getElementById("ecosystemCanvas");
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.nodes = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.draggedNode = null;
    this.animationId = null;
    this.isVisible = true;
    this.opacity = 0; // Start invisible for smooth fade-in
    this.isLoaded = false;
    this.logoImages = {}; // Cache for preloaded logo images

    // API URL for entities - use config or fallback
    this.apiUrl =
      window.UP_NEXUS_CONFIG?.API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : window.location.origin + "/api");

    // Type colors matching the admin dashboard
    this.typeColors = {
      "Project Holder": "#ff6b00",
      Startup: "#ff8c00",
      Incubator: "#f4b000",
      Accelerator: "#9c27b0",
      Investor: "#4caf50",
      "Public Funder": "#2196f3",
      Freelancer: "#00bcd4",
      "Research Center": "#673ab7",
      "Mentor & Advisor": "#ffc107",
      "Service Provider": "#e91e63",
      "Coworking Space": "#795548",
      "Community & Network": "#607d8b",
    };

    // Type icons
    this.typeIcons = {
      "Project Holder": "💡",
      Startup: "🚀",
      Incubator: "🏢",
      Accelerator: "⚡",
      Investor: "💰",
      "Public Funder": "🏛️",
      Freelancer: "👨‍💻",
      "Research Center": "🔬",
      "Mentor & Advisor": "🎓",
      "Service Provider": "🛠️",
      "Coworking Space": "🪑",
      "Community & Network": "👥",
    };

    this.entities = [];

    // Detect mobile for responsive config
    this.isMobile = window.innerWidth <= 768;

    // Configuration - adjust for mobile
    this.config = {
      nodeCount: this.isMobile ? 70 : 55,
      minRadius: this.isMobile ? 4 : 3,
      maxRadius: this.isMobile ? 8 : 6,
      expandedRadius: 38,
      connectionDistance: this.isMobile ? 180 : 220,
      nodeColor: "rgba(244, 176, 0, 0.4)",
      nodeGlowColor: "rgba(244, 176, 0, 0.8)",
      connectionColor: "rgba(244, 176, 0, 0.15)",
      activeConnectionColor: "rgba(244, 176, 0, 0.5)",
      parallaxStrength: 0.02,
      elasticReturn: 0.08,
      friction: 0.95,
    };

    this.init();
  }

  async init() {
    this.resize();

    // Start animation immediately with empty/placeholder nodes for smooth experience
    this.createPlaceholderNodes();
    this.bindEvents();
    this.animate();

    // Fetch real entities in background
    await this.fetchEntities();

    // Smoothly update nodes with real data
    if (this.entities.length > 0) {
      this.updateNodesWithRealData();
    }

    // Fade in the canvas smoothly
    this.fadeIn();
  }

  fadeIn() {
    const fadeAnimation = () => {
      if (this.opacity < 1) {
        this.opacity += 0.02; // Smooth fade-in over ~50 frames
        requestAnimationFrame(fadeAnimation);
      } else {
        this.opacity = 1;
        this.isLoaded = true;
      }
    };
    fadeAnimation();
  }

  async fetchEntities() {
    try {
      const response = await fetch(`${this.apiUrl}/entities`);
      const data = await response.json();

      if (data.success && data.entities.length > 0) {
        // Map API entities to visualization format
        this.entities = data.entities.map((e) => ({
          name: e.name,
          type: e.type,
          icon: e.icon || this.typeIcons[e.type] || "🏢",
          color: e.color || this.typeColors[e.type] || "#F4B000",
          sector: e.sector || "",
          wilaya: e.wilaya || "",
          logo: e.logo || null,
        }));

        // Preload logo images for entities that have them
        this.preloadLogos();

        console.log(
          `✅ Loaded ${this.entities.length} real entities from database`
        );

        // Update hero stats with real counts
        this.updateHeroStats(data.entities);
      } else {
        console.log(
          "ℹ️ No entities in database, showing placeholder animation"
        );
      }
    } catch (error) {
      console.log("ℹ️ API unavailable, showing placeholder animation");
    }
  }

  preloadLogos() {
    this.entities.forEach((entity) => {
      if (entity.logo && !this.logoImages[entity.logo]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          this.logoImages[entity.logo] = img;
        };
        img.onerror = () => {
          // Mark as failed so we don't retry
          this.logoImages[entity.logo] = null;
        };
        img.src = entity.logo;
      }
    });
  }

  updateHeroStats(entities) {
    // Count by type
    const counts = {
      total: entities.length,
      startups: entities.filter((e) => e.type === "Startup").length,
      incubators: entities.filter((e) => e.type === "Incubator").length,
      coworking: entities.filter((e) => e.type === "Coworking Space").length,
    };

    // Animate the stat counters
    this.animateCounter("stat-total", counts.total);
    this.animateCounter("stat-startups", counts.startups);
    this.animateCounter("stat-incubators", counts.incubators);
    this.animateCounter("stat-coworking", counts.coworking);

    // Also update mission section stats if they exist
    this.animateCounter("mission-startups", counts.startups);
    this.animateCounter("mission-incubators", counts.incubators);
  }

  animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1500;
    const start = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      element.textContent = current;
      element.setAttribute("data-count", target);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  createPlaceholderNodes() {
    this.nodes = [];
    const { nodeCount, minRadius, maxRadius } = this.config;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // On mobile, spread nodes more aggressively across the entire canvas
    const spreadFactor = this.isMobile ? 1.2 : 1;
    const edgePadding = this.isMobile ? 20 : 50;

    for (let i = 0; i < nodeCount; i++) {
      const radius = Math.random() * (maxRadius - minRadius) + minRadius;

      // Distribute nodes across entire canvas with edge padding
      const x =
        edgePadding + Math.random() * (this.canvas.width - edgePadding * 2);
      const y =
        edgePadding + Math.random() * (this.canvas.height - edgePadding * 2);

      const dx = x - centerX;
      const dy = y - centerY;
      const orbitRadius = Math.sqrt(dx * dx + dy * dy) * spreadFactor;
      const orbitAngle = Math.atan2(dy, dx);

      // Slower orbit speed on mobile for better visual effect
      const baseOrbitSpeed = this.isMobile ? 0.0001 : 0.00015;
      const orbitSpeed =
        (baseOrbitSpeed + Math.random() * 0.0001) *
        (1 -
          orbitRadius /
            (Math.max(this.canvas.width, this.canvas.height) * 0.9));

      this.nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        radius,
        baseRadius: radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        depth: Math.random() * 0.5 + 0.5,
        isActive: false,
        activeProgress: 0,
        entity: null, // Will be populated with real data
        rotation: Math.random() * Math.PI * 2,
        orbitRadius: orbitRadius,
        orbitAngle: orbitAngle,
        orbitSpeed: orbitSpeed,
        orbitCenterX: centerX,
        orbitCenterY: centerY,
      });
    }
  }

  updateNodesWithRealData() {
    // Shuffle entities for random distribution
    const shuffledEntities = [...this.entities].sort(() => Math.random() - 0.5);

    // Assign real entities to nodes
    this.nodes.forEach((node, i) => {
      if (shuffledEntities.length > 0) {
        node.entity = shuffledEntities[i % shuffledEntities.length];
      }
    });
  }

  resize() {
    const hero = this.canvas.parentElement;
    this.canvas.width = hero.offsetWidth;
    this.canvas.height = hero.offsetHeight;

    // Update mobile detection on resize
    this.isMobile = window.innerWidth <= 768;

    if (this.nodes.length > 0) {
      this.redistributeNodes();
    }
  }

  createNodes() {
    // This method is now replaced by createPlaceholderNodes and updateNodesWithRealData
    this.createPlaceholderNodes();
    if (this.entities.length > 0) {
      this.updateNodesWithRealData();
    }
  }

  redistributeNodes() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const spreadFactor = this.isMobile ? 1.3 : 1;
    const edgePadding = this.isMobile ? 20 : 50;

    this.nodes.forEach((node) => {
      // Recalculate position based on new canvas size
      const scaleX = this.canvas.width / (node.orbitCenterX * 2);
      const scaleY = this.canvas.height / (node.orbitCenterY * 2);

      // Update orbit center to new canvas center
      node.orbitCenterX = centerX;
      node.orbitCenterY = centerY;

      // Scale orbit radius proportionally - spread more on mobile
      node.orbitRadius *= Math.min(scaleX, scaleY) * spreadFactor;

      // Ensure nodes stay within bounds
      const maxOrbitRadius =
        Math.min(this.canvas.width, this.canvas.height) / 2 - edgePadding;
      if (node.orbitRadius > maxOrbitRadius) {
        node.orbitRadius = maxOrbitRadius * (0.5 + Math.random() * 0.5);
      }

      // Recalculate position
      node.baseX = centerX + Math.cos(node.orbitAngle) * node.orbitRadius;
      node.baseY = centerY + Math.sin(node.orbitAngle) * node.orbitRadius;
      node.x = node.baseX;
      node.y = node.baseY;
    });
  }

  bindEvents() {
    // Resize handler
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 200)
    );

    // Mouse move for proximity detection
    const hero = this.canvas.parentElement;
    hero.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    hero.addEventListener("mouseleave", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    // Optional drag interaction
    hero.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    window.addEventListener("mouseup", () => this.handleMouseUp());
    window.addEventListener("mousemove", (e) => this.handleDrag(e));

    // Visibility optimization
    const observer = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries[0].isIntersecting;
        if (this.isVisible && !this.animationId) {
          this.animate();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(hero);
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find closest node
    for (const node of this.nodes) {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < node.radius + 15) {
        this.draggedNode = node;
        break;
      }
    }
  }

  handleMouseUp() {
    this.draggedNode = null;
  }

  handleDrag(e) {
    if (!this.draggedNode) return;

    const rect = this.canvas.getBoundingClientRect();
    this.draggedNode.x = e.clientX - rect.left;
    this.draggedNode.y = e.clientY - rect.top;
  }

  updateNodes() {
    const { parallaxStrength, elasticReturn, friction, expandedRadius } =
      this.config;

    // First, find the closest node to mouse (only that one will be hovered)
    let hoveredNode = null;
    let minDistance = Infinity;

    if (this.mouse.x !== null && this.mouse.y !== null && !this.draggedNode) {
      this.nodes.forEach((node) => {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if mouse is close enough and this is the closest node
        const hoverThreshold = node.radius + 20;
        if (distance < hoverThreshold && distance < minDistance) {
          minDistance = distance;
          hoveredNode = node;
        }
      });
    }

    this.nodes.forEach((node) => {
      // Only the hovered node becomes active
      const isHovered = node === hoveredNode;

      // Smooth transition for active state - only for hovered node
      if (isHovered) {
        node.activeProgress = Math.min(node.activeProgress + 0.1, 1);
      } else {
        node.activeProgress = Math.max(node.activeProgress - 0.06, 0);
      }

      node.isActive = node.activeProgress > 0;

      // Galaxy rotation - update orbit angle
      node.orbitAngle += node.orbitSpeed;

      // Calculate new base position based on orbital motion
      const newBaseX =
        node.orbitCenterX + Math.cos(node.orbitAngle) * node.orbitRadius;
      const newBaseY =
        node.orbitCenterY + Math.sin(node.orbitAngle) * node.orbitRadius;

      // Update base position with galaxy rotation
      node.baseX = newBaseX;
      node.baseY = newBaseY;

      // Elastic return to base position (only if not dragged)
      if (node !== this.draggedNode) {
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        node.vx += dx * elasticReturn;
        node.vy += dy * elasticReturn;

        // Apply friction
        node.vx *= friction;
        node.vy *= friction;

        // Update position
        node.x += node.vx;
        node.y += node.vy;
      }

      // Rotate icon/entity display
      node.rotation += 0.002 * node.depth;

      // Update radius based on active state
      const targetRadius =
        node.baseRadius +
        (expandedRadius - node.baseRadius) * node.activeProgress;
      node.radius = node.radius + (targetRadius - node.radius) * 0.15;
    });
  }

  drawConnections() {
    const { connectionDistance } = this.config;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Always draw connections between nearby nodes (network effect)
        if (distance < connectionDistance) {
          // Higher opacity for more visible connections
          const baseOpacity = (1 - distance / connectionDistance) * 0.55;

          this.ctx.beginPath();
          this.ctx.moveTo(nodeA.x, nodeA.y);
          this.ctx.lineTo(nodeB.x, nodeB.y);

          // Gradient for all connections - more visible gold/orange
          const gradient = this.ctx.createLinearGradient(
            nodeA.x,
            nodeA.y,
            nodeB.x,
            nodeB.y
          );
          gradient.addColorStop(0, `rgba(255, 180, 50, ${baseOpacity})`);
          gradient.addColorStop(0.5, `rgba(255, 150, 0, ${baseOpacity * 0.9})`);
          gradient.addColorStop(1, `rgba(255, 180, 50, ${baseOpacity})`);

          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = 0.8 + (1 - distance / connectionDistance) * 0.7;
          this.ctx.stroke();
        }
      }
    }
  }

  drawNodes() {
    const { nodeColor, nodeGlowColor } = this.config;

    // Sort nodes so active ones are drawn on top
    const sortedNodes = [...this.nodes].sort(
      (a, b) => a.activeProgress - b.activeProgress
    );

    sortedNodes.forEach((node) => {
      this.ctx.save();

      if (node.activeProgress > 0.1) {
        // Draw expanded node with logo and name
        const progress = node.activeProgress;
        const entity = node.entity;

        // Outer glow
        const glowRadius = node.radius * 2;
        const glowGradient = this.ctx.createRadialGradient(
          node.x,
          node.y,
          node.radius * 0.5,
          node.x,
          node.y,
          glowRadius
        );
        glowGradient.addColorStop(0, `rgba(244, 176, 0, ${progress * 0.4})`);
        glowGradient.addColorStop(0.6, `rgba(255, 107, 0, ${progress * 0.15})`);
        glowGradient.addColorStop(1, "rgba(255, 107, 0, 0)");

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();

        // Main circle background (dark with border)
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Gradient background
        const bgGradient = this.ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius
        );
        bgGradient.addColorStop(0, `rgba(30, 20, 10, ${progress * 0.95})`);
        bgGradient.addColorStop(0.7, `rgba(50, 30, 10, ${progress * 0.9})`);
        bgGradient.addColorStop(1, `rgba(80, 50, 20, ${progress * 0.85})`);

        this.ctx.fillStyle = bgGradient;
        this.ctx.fill();

        // Border ring with entity color
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius - 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(244, 176, 0, ${progress * 0.8})`;
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // Draw logo or icon/emoji
        if (progress > 0.3) {
          const iconOpacity = Math.min(1, (progress - 0.3) * 2);
          this.ctx.globalAlpha = iconOpacity;

          // Check if entity has a logo and it's loaded
          const logoImg = entity.logo ? this.logoImages[entity.logo] : null;

          if (logoImg) {
            // Draw the logo image centered in the node
            const logoSize = node.radius * 1.1;
            const logoX = node.x - logoSize / 2;
            const logoY = node.y - logoSize / 2 - node.radius * 0.05;

            // Clip to circle for rounded logo
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(
              node.x,
              node.y - node.radius * 0.05,
              logoSize / 2,
              0,
              Math.PI * 2
            );
            this.ctx.closePath();
            this.ctx.clip();

            this.ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            this.ctx.restore();
          } else {
            // Fallback to emoji/icon
            const iconSize = Math.floor(node.radius * 0.65);
            this.ctx.font = `${iconSize}px Arial, sans-serif`;
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(entity.icon, node.x, node.y - node.radius * 0.12);
          }

          this.ctx.globalAlpha = 1;
        }

        // Draw name and type below the node
        if (progress > 0.4) {
          const textOpacity = Math.min(1, (progress - 0.4) * 2.5);

          // Background pill for text
          const nameWidth = this.ctx.measureText(entity.name).width;
          const pillPadding = 8;
          const pillHeight = 32;
          const pillWidth = Math.max(nameWidth + pillPadding * 2, 80);
          const pillY = node.y + node.radius + 10;

          // Semi-transparent background
          this.ctx.globalAlpha = textOpacity * 0.85;
          this.ctx.fillStyle = "rgba(20, 15, 10, 0.9)";
          this.roundRect(
            node.x - pillWidth / 2,
            pillY,
            pillWidth,
            pillHeight,
            6
          );
          this.ctx.fill();

          // Border for pill
          this.ctx.strokeStyle = `rgba(244, 176, 0, ${textOpacity * 0.5})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();

          this.ctx.globalAlpha = textOpacity;

          // Entity name
          const fontSize = Math.max(10, Math.floor(node.radius * 0.28));
          this.ctx.font = `600 ${fontSize}px 'Inter', -apple-system, sans-serif`;
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "top";
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          this.ctx.fillText(entity.name, node.x, pillY + 5);

          // Entity type - use the entity's color or fallback to type colors
          const typeColor =
            node.entity?.color || this.typeColors[entity.type] || "#F4B000";

          this.ctx.font = `500 ${Math.max(
            8,
            fontSize - 2
          )}px 'Inter', -apple-system, sans-serif`;
          this.ctx.fillStyle = typeColor;
          this.ctx.fillText(entity.type, node.x, pillY + 6 + fontSize + 2);

          this.ctx.globalAlpha = 1;
        }
      } else {
        // Simple calm node (default state)
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Subtle depth effect with glow
        const depthOpacity = 0.3 + node.depth * 0.4;

        // Small glow
        const smallGlow = this.ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 2.5
        );
        smallGlow.addColorStop(0, `rgba(244, 176, 0, ${depthOpacity * 0.5})`);
        smallGlow.addColorStop(0.5, `rgba(255, 152, 0, ${depthOpacity * 0.2})`);
        smallGlow.addColorStop(1, "rgba(255, 152, 0, 0)");

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = smallGlow;
        this.ctx.fill();

        // Core circle
        const coreGradient = this.ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius
        );
        coreGradient.addColorStop(0, `rgba(255, 220, 150, ${depthOpacity})`);
        coreGradient.addColorStop(
          1,
          `rgba(244, 176, 0, ${depthOpacity * 0.7})`
        );

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = coreGradient;
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  // Helper method for rounded rectangles
  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply global opacity for smooth fade-in
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;

    // Draw in order: connections first, then nodes
    this.drawConnections();
    this.drawNodes();

    this.ctx.restore();
  }

  animate() {
    if (!this.isVisible) {
      this.animationId = null;
      return;
    }

    this.updateNodes();
    this.render();

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// DYNAMIC STATS LOADER
// ==========================================

class StatsLoader {
  constructor() {
    // API URL - use config or fallback
    this.apiUrl =
      window.UP_NEXUS_CONFIG?.API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : window.location.origin + "/api");
  }

  async load() {
    try {
      const response = await fetch(`${this.apiUrl}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      if (data.success) {
        this.updateStats(data.stats);
      }
    } catch (error) {
      console.warn("Could not fetch live stats:", error.message);
    }
  }

  updateStats(stats) {
    // All these are REAL counts from the database
    const incubatorsTotal = stats.incubators + stats.accelerators;

    // Hero section stats (by ID)
    this.setStatValue("stat-total", stats.totalEntities);
    this.setStatValue("stat-startups", stats.startups);
    this.setStatValue("stat-incubators", incubatorsTotal);
    this.setStatValue("stat-coworking", stats.coworkingSpaces);

    // Mission section stats (by ID)
    this.setStatValue("mission-startups", stats.startups, "target");
    this.setStatValue("mission-incubators", incubatorsTotal, "target");
    this.setStatValue("mission-coworking", stats.coworkingSpaces, "target");
    this.setStatValue("mission-communities", stats.communities, "target");
  }

  setStatValue(id, value, attr = "count") {
    const element = document.getElementById(id);
    if (element) {
      element.dataset[attr] = value;
    }
  }
}

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

class App {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM
    document.addEventListener("DOMContentLoaded", async () => {
      // Core features
      new Navigation();
      new SmoothScroll();

      // Load stats from API before initializing counters
      const statsLoader = new StatsLoader();
      await statsLoader.load().catch(() => {});

      new Counter();
      new ScrollAnimations();
      new StepsProgress();
      new BenefitsFilter();
      new BackToTop();
      new RippleEffect();
      new Parallax();
      new LazyLoader();
      new KeyboardNav();
      new Performance();

      // Ecosystem background animation
      new EcosystemBackground();

      // Features requiring notifications
      const notifications = new Notifications();
      new FormHandlers(notifications);

      // Welcome message
      console.log(
        "%c 🚀 UP-NEXUS ",
        "background: linear-gradient(135deg, #FF6B00, #F4B000); color: white; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 5px;"
      );
      console.log(
        "%c Empowering Algeria's Entrepreneurial Ecosystem ",
        "color: #F4B000; font-size: 14px; font-weight: bold;"
      );
      console.log(
        "%c Build with ❤️ for Algeria ",
        "color: #B3B3B3; font-size: 12px;"
      );

      // Page loaded animation
      document.body.classList.add("loaded");
    });
  }
}

// Start the application
new App();
