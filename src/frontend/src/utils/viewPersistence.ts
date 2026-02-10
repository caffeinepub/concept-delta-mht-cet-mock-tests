import { AppView } from '../App';

const VIEW_STORAGE_KEY = 'concept-delta-last-view';
const NON_TEST_VIEW_STORAGE_KEY = 'concept-delta-last-non-test-view';

const VALID_VIEWS: AppView[] = ['landing', 'dashboard', 'about'];

function isValidView(view: string | null): view is AppView {
  return view !== null && VALID_VIEWS.includes(view as AppView);
}

export function saveView(view: AppView): void {
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
    
    // Also save as last non-test view if it's not a test
    if (view !== 'landing') {
      sessionStorage.setItem(NON_TEST_VIEW_STORAGE_KEY, view);
    }
  } catch (error) {
    console.warn('Failed to save view to sessionStorage:', error);
  }
}

export function getLastView(): AppView | null {
  try {
    const view = sessionStorage.getItem(VIEW_STORAGE_KEY);
    return isValidView(view) ? view : null;
  } catch (error) {
    console.warn('Failed to read view from sessionStorage:', error);
    return null;
  }
}

export function getLastNonTestView(): AppView | null {
  try {
    const view = sessionStorage.getItem(NON_TEST_VIEW_STORAGE_KEY);
    return isValidView(view) ? view : null;
  } catch (error) {
    console.warn('Failed to read non-test view from sessionStorage:', error);
    return null;
  }
}

export function clearViewPersistence(): void {
  try {
    sessionStorage.removeItem(VIEW_STORAGE_KEY);
    sessionStorage.removeItem(NON_TEST_VIEW_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear view persistence:', error);
  }
}
