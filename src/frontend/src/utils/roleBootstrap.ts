// Per-principal role persistence for flicker-free admin UI
// Stores the last known role for each authenticated principal to enable instant UI rendering

import { UserRole } from '../backend';

const ROLE_BOOTSTRAP_PREFIX = 'conceptdelta_role_';

// Get storage key for a specific principal
function getRoleKey(principal: string): string {
  return `${ROLE_BOOTSTRAP_PREFIX}${principal}`;
}

// Save role for a specific principal
export function saveRoleForPrincipal(principal: string, role: UserRole): void {
  try {
    if (!principal) return;
    // Only persist admin/user roles, not guest
    if (role === 'admin' || role === 'user') {
      localStorage.setItem(getRoleKey(principal), role);
    }
  } catch (error) {
    console.warn('Failed to save role bootstrap:', error);
  }
}

// Get saved role for a specific principal
export function getRoleForPrincipal(principal: string): UserRole | null {
  try {
    if (!principal) return null;
    const saved = localStorage.getItem(getRoleKey(principal));
    // Validate that it's a valid role
    if (saved === 'admin' || saved === 'user') {
      return saved as UserRole;
    }
    return null;
  } catch (error) {
    console.warn('Failed to read role bootstrap:', error);
    return null;
  }
}

// Clear role for a specific principal (on logout)
export function clearRoleForPrincipal(principal: string): void {
  try {
    if (!principal) return;
    localStorage.removeItem(getRoleKey(principal));
  } catch (error) {
    console.warn('Failed to clear role bootstrap:', error);
  }
}

// Clear all role bootstrap data (optional cleanup)
export function clearAllRoleBootstrap(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(ROLE_BOOTSTRAP_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all role bootstrap:', error);
  }
}
