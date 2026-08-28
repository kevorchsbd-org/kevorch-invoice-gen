/**
 * Fail-Fast Production Environment Isolation Guard
 * Executes before any test suite to ensure automated tests never mutate production Firebase data.
 */
export function checkTestEnvironmentSafety(): void {
  const isTestEnv = process.env.VITE_TEST_ENV === 'true' || process.env.NODE_ENV === 'test';
  const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

  // Set test environment flag if not present for in-memory testing
  if (!process.env.VITE_TEST_ENV) {
    process.env.VITE_TEST_ENV = 'true';
  }

  // Safety check: Abort if production mode is set without test environment flags
  if (process.env.NODE_ENV === 'production' && !isTestEnv && !hasEmulator) {
    console.error('\n🚨 SAFETY ABORT: Attempted to run automated tests against production Firebase without isolation flag!');
    console.error('To run tests safely, set VITE_TEST_ENV=true or configure FIRESTORE_EMULATOR_HOST.\n');
    throw new Error('SAFETY ABORT: Production Firebase environment detected for automated test run.');
  }
}
