# UP-NEXUS Frontend

The frontend website for UP-NEXUS - Algeria's Innovation Ecosystem Platform.

## Structure

```
up-nexus-frontend/
├── index.html          # Main landing page
├── logo.png            # Site logo
├── css/
│   ├── styles.css      # Main styles
│   ├── components.css  # Component styles
│   └── admin.css       # Admin dashboard styles
├── js/
│   ├── main.js         # Main JavaScript (ecosystem animation)
│   └── admin.js        # Admin dashboard functionality
└── pages/
    ├── about.html
    ├── announcements.html
    ├── contact.html
    ├── ecosystem.html
    ├── news.html
    ├── pricing.html
    ├── admin/
    │   ├── login.html
    │   └── dashboard.html
    ├── auth/
    │   ├── login.html
    │   ├── register.html
    │   └── forgot.html
    └── dashboard/
        └── index.html
```

## Deployment on Vercel

1. Push this folder to a GitHub repository
2. Import the repo on Vercel
3. Deploy!

## Configuration

The frontend is configured to connect to the backend at:

- **Production**: `https://up-nexus-backend.vercel.app/api`
- **Development**: `http://localhost:3000/api`

API URL is auto-detected based on environment in these files:

- `pages/admin/login.html`
- `js/admin.js`
- `js/main.js`

## Features

- Interactive ecosystem background with animated nodes
- Galaxy rotation effect
- Admin dashboard for managing entities
- Responsive design
