// Flicker-free role hook with per-principal bootstrap
// Returns bootstrapped role instantly, then reconciles with backend

import { useEffect, useState } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerRole } from './useQueries';
import { UserRole } from '../backend';
import { saveRoleForPrincipal, getRoleForPrincipal } from '../utils/roleBootstrap';

export interface BootstrappedRoleState {
  role: UserRole;
  isRoleKnown: boolean;
  isAdmin: boolean;
  roleLoading: boolean;
}

export function useBootstrappedCallerRole(): BootstrappedRoleState {
  const { identity } = useInternetIdentity();
  const { data: backendRole, isLoading: backendLoading, isFetched } = useGetCallerRole();
  
  const principalString = identity?.getPrincipal().toString() || '';
  
  // Bootstrap: load saved role synchronously on mount
  const [bootstrappedRole, setBootstrappedRole] = useState<UserRole | null>(() => {
    if (!principalString) return null;
    return getRoleForPrincipal(principalString);
  });

  // Update bootstrap when principal changes
  useEffect(() => {
    if (principalString) {
      const saved = getRoleForPrincipal(principalString);
      setBootstrappedRole(saved);
    } else {
      setBootstrappedRole(null);
    }
  }, [principalString]);

  // Reconcile: when backend role arrives, persist it and update if different
  useEffect(() => {
    if (principalString && backendRole && isFetched) {
      // Persist the backend role
      saveRoleForPrincipal(principalString, backendRole);
      
      // If bootstrap was different, update it
      if (bootstrappedRole !== backendRole) {
        setBootstrappedRole(backendRole);
      }
    }
  }, [principalString, backendRole, isFetched, bootstrappedRole]);

  // Determine current role: use backend if available, otherwise bootstrap, otherwise guest
  const currentRole: UserRole = backendRole || bootstrappedRole || ('guest' as UserRole);
  
  // Role is known if we have backend data OR a bootstrap
  const isRoleKnown = isFetched || bootstrappedRole !== null;
  
  // Admin status
  const isAdmin = currentRole === 'admin';
  
  // Loading state: only true if we're waiting for backend AND have no bootstrap
  const roleLoading = backendLoading && bootstrappedRole === null;

  return {
    role: currentRole,
    isRoleKnown,
    isAdmin,
    roleLoading,
  };
}
