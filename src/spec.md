# Specification

## Summary
**Goal:** Fix the ViewActivationOverlay so it never blocks interaction on Landing/About and cannot get stuck during or after navigation.

**Planned changes:**
- Restrict ViewActivationOverlay rendering to only when the currently mounted view matches the activation target; ensure it does not appear or persist on Landing/About.
- Harden the activation lifecycle so activation reliably finishes when the target view (e.g., Dashboard) has rendered and its initial loading settles, and is cancelled immediately on navigation away from the target view or on logout.
- Add defensive safeguards to prevent “stuck” activation state (including safety-timeout cleanup that cannot leave a blocking overlay), plus minimal development-only console debug logs for start/finish/cancel/timeout transitions.

**User-visible outcome:** Landing and About remain fully clickable with no fullscreen overlay blocking input; Dashboard activation overlay appears only while Dashboard is actually being activated and reliably disappears on completion, navigation away, or logout.
