# Specification

## Summary
**Goal:** Add the missing backend APIs needed for role checks, YouTube verification, suggestions, and comments.

**Planned changes:**
- Add `getCallerUserRole()` to return a stable role string for the caller (`"admin"`, `"user"`, or `"guest"`) using the existing authorization/access-control state in `backend/main.mo`.
- Add `setYouTubeVerified()` to mark the caller’s existing `UserProfile` as YouTube-verified and store a verification timestamp.
- Add suggestions APIs backed by the existing `suggestions` map: submit suggestion (with id + timestamp), list all suggestions (matching `SuggestionsResponse`), and delete suggestion by id (admin-only).
- Add comments APIs backed by the existing `comments` map: list by `questionId`, post comment (with id + caller principal + timestamp), and delete comment by id (admin-only).

**User-visible outcome:** The frontend can determine the caller’s role, users can mark their profile as YouTube-verified, authenticated users can submit suggestions, and comments can be listed/posted per question with admin-only deletion for suggestions and comments.
