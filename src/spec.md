# Specification

## Summary
**Goal:** Remove the blocking Profile Setup overlay by implementing backend user profile methods and wiring the frontend React Query hooks to them.

**Planned changes:**
- Add `getCallerUserProfile()` and `saveCallerUserProfile(...)` as public shared methods in `backend/main.mo`, storing profiles in the existing `userProfiles` map keyed by the caller Principal and returning the created/updated profile.
- Ensure backend profile save behavior: create on first save (set `id = caller`, set `createdAt`, set/update `lastLogin`, initialize `testAttempts` as empty) and update on subsequent saves (update fields and `lastLogin` without resetting `createdAt` or overwriting `testAttempts`).
- Update `frontend/src/hooks/useQueries.ts` so `useGetCallerUserProfile` calls `getCallerUserProfile()` (query key remains `['currentUserProfile']`) and returns a `UserProfile` or `null`.
- Update `useSaveCallerUserProfile` to call `saveCallerUserProfile(...)`, invalidate/refetch `['currentUserProfile']` on success so `App.tsx` stops rendering `<ProfileSetup />`, and show an English error toast on failure while keeping the dialog open.

**User-visible outcome:** After signing in, users can create/save their profile successfully and the Profile Setup overlay closes, allowing normal app usage; if saving fails, an English error toast is shown and the overlay remains open.
