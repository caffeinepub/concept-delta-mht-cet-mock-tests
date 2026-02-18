# Specification

## Summary
**Goal:** Implement persistent backend Question Gallery CRUD (with image support) and wire the Admin Question Gallery UI to use the real APIs for listing, creating, and editing questions.

**Planned changes:**
- Add Motoko Question Gallery APIs for admin-only create/update/delete and authenticated read/list, including listing questions filtered by subject.
- Persist Question Gallery state in stable storage so questions and ID counters survive upgrades without collisions.
- Support storing and returning question-level and option-level images via the existing blob-storage mixin, returning `Storage.ExternalBlob` references usable by the frontend.
- Update frontend React Query hooks and AdminPanel components so selecting a subject fetches questions from the backend and renders the existing empty state when none exist.
- Add Admin UI create/edit flows in the Question Management area (including optional image upload) wired to backend create/update APIs, and hide create/edit controls for non-admin users.

**User-visible outcome:** Admins can browse questions by subject in the Question Gallery, create new questions (optionally with images), and edit existing questions with changes reflected immediately; non-admin authenticated users can view/list questions but cannot modify them, and gallery data persists across upgrades.
