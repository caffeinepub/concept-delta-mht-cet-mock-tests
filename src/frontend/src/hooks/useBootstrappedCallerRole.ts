import { useState, useEffect } from 'react';
import { useGetCallerRole } from './useQueries';
import { useInternetIdentity } from './useInternetIdentity';
import { UserRole } from '../backend';
import { getRoleForPrincipal, saveRoleForPrincipal } from '../utils/roleBootstrap';

export function useBootstrappedCallerRole() {
  const { identity } = useInternetIdentity();
  const { data: backendRole, isLoading, isFetched } = useGetCallerRole();
  const [bootstrappedRole, setBootstrappedRole] = useState<UserRole | null>(null);

  // Load bootstrapped role on mount
  useEffect(() => {
    if (identity) {
      const principalString = identity.getPrincipal().toString();
      const savedRole = getRoleForPrincipal(principalString);
      if (savedRole) {
        setBootstrappedRole(savedRole);
      }
    } else {
      setBootstrappedRole(null);
    }
  }, [identity]);

  // Sync backend role with bootstrap when available
  useEffect(() => {
    if (isFetched && backendRole && identity) {
      const principalString = identity.getPrincipal().toString();
      
      // Convert 'guest' string to UserRole.guest enum
      const roleToSave: UserRole = backendRole === 'guest' 
        ? UserRole.guest 
        : backendRole as UserRole;
      
      saveRoleForPrincipal(principalString, roleToSave);

      // Only update state if different
      if (bootstrappedRole !== roleToSave) {
        setBootstrappedRole(roleToSave);
      }
    }
  }, [backendRole, isFetched, identity, bootstrappedRole]);

  // Determine current role with proper type handling
  const currentRole: UserRole = (() => {
    if (backendRole && backendRole !== 'guest') {
      return backendRole as UserRole;
    }
    if (bootstrappedRole) {
      return bootstrappedRole;
    }
    return UserRole.guest;
  })();

  const isAdmin = currentRole === UserRole.admin;
  const isRoleKnown = !!bootstrappedRole || isFetched;

  return {
    role: currentRole,
    isAdmin,
    isRoleKnown,
    isLoading,
  };
}
