# Specification

## Summary
**Goal:** Restore Admin Panel data loading by adding backend queries for Question Gallery (questions by subject) and ensuring Suggestions moderation uses the real backend listSuggestions() API and refreshes correctly after deletes.

**Planned changes:**
- Add/restore backend query API to return all questions for a given subject (e.g., Physics/Chemistry/Mathematics) with fields required by the existing Question Gallery UI.
- Ensure backend listSuggestions() remains callable and returns the existing frontend-compatible response shape (suggestions array + count).
- Update the frontend React Query hook useGetQuestionsBySubject(subject) to call the new backend query and return fetched questions (using the existing stable query key pattern that includes subject).
- Ensure Suggestions Moderation loads from backend via useGetAllSuggestions and refreshes after deletion via query invalidation; enforce admin-only deletion in the backend.

**User-visible outcome:** In the Admin Panel, Question Gallery shows real questions when switching subjects, and Suggestions & Feedback displays stored suggestions and updates immediately after an admin deletes one (including the existing empty/error states when applicable).
