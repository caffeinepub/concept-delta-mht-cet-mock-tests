# Navbar/Header Component File List

This document lists the navbar/header component file(s) and where they are used in the application.

## Header Component

**File:** `frontend/src/components/Header.tsx`

**Description:** The main navigation header component with responsive design, authentication controls, and role-based navigation items.

**Used in:**
- `frontend/src/pages/LandingPage.tsx` - Landing page header
- `frontend/src/pages/Dashboard.tsx` - Dashboard page header
- `frontend/src/pages/AdminPanel.tsx` - Admin panel page header
- `frontend/src/pages/AboutPage.tsx` - About page header

**Features:**
- Sticky top navigation bar
- Desktop navigation menu (Home, About, Dashboard, Admin Panel)
- Mobile responsive sheet menu
- User authentication controls (Login/Logout)
- User profile display with admin badge
- Role-based navigation (Admin Panel only visible to admins)

**Navigation Items:**
- **Home** - Always visible, navigates to landing page
- **About** - Always visible, navigates to about page
- **Dashboard** - Visible only when authenticated, navigates to dashboard
- **Admin Panel** - Visible only to admin users, navigates to admin panel

## Styling Notes

The header uses:
- `sticky top-0 z-50` - Stays at top of viewport
- Opaque background with subtle border for clear visibility
- Responsive sizing for mobile, tablet, and desktop
- Theme-aware colors using CSS variables
