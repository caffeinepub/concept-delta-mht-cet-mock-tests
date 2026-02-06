# Specification

## Summary
**Goal:** Fix the mobile header menu (three-dot/three-line button) so opening/closing it never causes a transparent/blank screen, and ensure the sheet + overlay stack and render correctly across the app.

**Planned changes:**
- Ensure the mobile sheet panel renders with an opaque background (theme-aware for light/dark) and the dimmed overlay always appears behind it without the page turning transparent/blank.
- Add a defensive global CSS override in `frontend/src/index.css` to force correct Radix/Sheet overlay + content background and z-index stacking on mobile, without editing any files under `frontend/src/components/ui`.
- Harden menu open/close behavior to avoid intermediate visual states (e.g., close the menu on navigation and handle conflicts with `ViewActivationOverlay`) and verify repeated open/close cycles remain stable across landing, about, dashboard, and admin views.

**User-visible outcome:** On mobile, tapping the header menu reliably opens a right-side panel over a full-viewport dimmed overlay (no blank/transparent screen), and closing or navigating from the menu always returns to the intended view without visual corruption.
