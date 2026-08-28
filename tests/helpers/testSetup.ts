import 'fake-indexeddb/auto';
import { checkTestEnvironmentSafety } from './envGuard';

// Run fail-fast safety check before unit test suite
checkTestEnvironmentSafety();

// Global mock cleanup setup
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = (blob: Blob) => `blob:mock-url-${Math.random()}`;
  window.URL.revokeObjectURL = () => {};
}
