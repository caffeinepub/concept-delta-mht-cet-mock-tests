import { AppView } from '../App';

const VIEW_KEY = 'app-current-view';
const NON_TEST_VIEW_KEY = 'app-last-non-test-view';

// Allowlist of valid views
const VALID_VIEWS: AppView[] = ['landing', 'dashboard', 'about', 'admin'];

// Type guard to check if a string is a valid AppView
export function isValidView(view: string): view is AppView {
  return VALID_VIEWS.includes(view as AppView);
}

export function saveView(view: AppView): void {
  try {
    sessionStorage.setItem(VIEW_KEY, view);
    // Also save as last non-test view for restoration
    sessionStorage.setItem(NON_TEST_VIEW_KEY, view);
  } catch (error) {
    console.error('Failed to save view to sessionStorage:', error);
  }
}

export function getLastView(): AppView | null {
  try {
    const view = sessionStorage.getItem(VIEW_KEY);
    if (view && isValidView(view)) {
      return view;
    }
    return null;
  } catch (error) {
    console.error('Failed to read view from sessionStorage:', error);
    return null;
  }
}

export function getLastNonTestView(): AppView | null {
  try {
    const view = sessionStorage.getItem(NON_TEST_VIEW_KEY);
    if (view && isValidView(view)) {
      return view;
    }
    return null;
  } catch (error) {
    console.error('Failed to read non-test view from sessionStorage:', error);
    return null;
  }
}

export function clearViewPersistence(): void {
  try {
    sessionStorage.removeItem(VIEW_KEY);
    sessionStorage.removeItem(NON_TEST_VIEW_KEY);
  } catch (error) {
    console.error('Failed to clear view persistence:', error);
  }
}
