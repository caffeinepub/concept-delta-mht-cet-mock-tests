// View persistence helper using sessionStorage
// Saves and restores the last intended app view to support refresh-safe navigation

const VIEW_STORAGE_KEY = 'conceptdelta_last_view';
const LAST_NON_TEST_VIEW_KEY = 'conceptdelta_last_non_test_view';

export type PersistedView = 'landing' | 'dashboard' | 'test' | 'result' | 'admin' | 'about';

export function saveView(view: PersistedView): void {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
    // Also track last non-test view for better restoration
    if (view !== 'test' && view !== 'result') {
      sessionStorage.setItem(LAST_NON_TEST_VIEW_KEY, view);
    }
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Failed to save view to sessionStorage:', error);
  }
}

export function getLastView(): PersistedView | null {
  try {
    const view = sessionStorage.getItem(VIEW_STORAGE_KEY);
    return view as PersistedView | null;
  } catch (error) {
    console.warn('Failed to read view from sessionStorage:', error);
    return null;
  }
}

export function getLastNonTestView(): PersistedView | null {
  try {
    const view = sessionStorage.getItem(LAST_NON_TEST_VIEW_KEY);
    return view as PersistedView | null;
  } catch (error) {
    console.warn('Failed to read last non-test view from sessionStorage:', error);
    return null;
  }
}

export function clearPersistedView(): void {
  try {
    sessionStorage.removeItem(VIEW_STORAGE_KEY);
    sessionStorage.removeItem(LAST_NON_TEST_VIEW_KEY);
  } catch (error) {
    console.warn('Failed to clear persisted view:', error);
  }
}
