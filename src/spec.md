# Specification

## Summary
**Goal:** Fix the Dashboard so it never gets stuck in an infinite loading state when the tests API call fails, and stabilize the mobile menu overlay so it always dims the page correctly and doesn’t become transparent/blank during navigation or view activation.

**Planned changes:**
- Update Dashboard loading/activation flow so loading UI ends when the tests query settles (success or error), and render a clear error state with a Retry action when tests cannot be loaded.
- Ensure any view-activation overlay/state is cleared once relevant queries settle, not only on successful responses.
- Fix mobile menu (Sheet) backdrop/overlay to always cover the full viewport with a dark semi-transparent dim layer, with correct z-index stacking behind the panel but above page content (without modifying `frontend/src/components/ui`).
- Harden mobile menu open/close lifecycle: close/reset the mobile Sheet on navigation actions and when view activation starts, preventing intermediate blank/transparent states and avoiding desktop regressions.

**User-visible outcome:** The Dashboard stops showing an endless spinner if tests fail to load, instead showing an error with a Retry button that can recover without a hard refresh; on mobile, opening the menu reliably dims the page with a proper overlay, tapping outside closes it, and navigating/activating views won’t leave the UI in a blank or unstable state.
