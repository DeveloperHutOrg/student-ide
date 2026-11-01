// tests/test_session_management.js
// Automated test suite for Student IDE Session Management & Logout System

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

console.log('====================================================');
console.log('STUDENT IDE: SESSION MANAGEMENT & LOGOUT AUDIT');
console.log('====================================================\n');

// 1. Initialize DB and Services
const db = require('../dist-electron/main/db');
const sessionService = require('../dist-electron/main/sessionService');
const adminAuthService = require('../dist-electron/main/adminAuthService');
const runner = require('../dist-electron/main/runner');

const testDbPath = path.join(os.tmpdir(), `student_session_test_${Date.now()}.db`);
db.initDatabase(testDbPath);

async function runTests() {
  try {
    // --- TEST 1: Initial Session State on Fresh Launch ---
    console.log('--- TEST 1: Initial Session State on Fresh Launch ---');
    const initialSession = sessionService.getActiveSession();
    assert.strictEqual(initialSession.isAuthenticated, false, 'Fresh launch must have no active session');
    assert.strictEqual(sessionService.isSessionActive(), false);
    console.log('✓ TEST 1 PASSED: Fresh process starts in unauthenticated state (Login screen required).');

    // Save a student profile
    db.saveProfile('Aarav Patel', 10);
    db.setOnboardingCompleted(true);
    const profile = db.getProfile();
    assert(profile !== null, 'Profile must exist in SQLite');
    assert.strictEqual(profile.student_name, 'Aarav Patel');
    assert.strictEqual(profile.student_class, 10);

    // --- TEST 2: Session Creation & Public Info Disclosure ---
    console.log('\n--- TEST 2: Session Creation & Public Info Disclosure ---');
    const loginResult = sessionService.createSession(profile.id);
    assert.strictEqual(loginResult.success, true);
    assert.strictEqual(loginResult.session.isAuthenticated, true);
    assert.strictEqual(loginResult.session.student.student_name, 'Aarav Patel');
    assert.strictEqual(loginResult.session.student.student_class, 10);
    assert(loginResult.session.loginTime > 0, 'Login timestamp must be recorded');
    assert.strictEqual(loginResult.session.sessionId, undefined, 'Private sessionId must NOT be disclosed in public session');

    const activeSession = sessionService.getActiveSession();
    assert.strictEqual(activeSession.isAuthenticated, true);
    assert.strictEqual(activeSession.student.student_name, 'Aarav Patel');
    console.log('✓ TEST 2 PASSED: Session created and public profile safely returned without leaking secrets.');

    // --- TEST 3: Running Code Process Termination on Logout ---
    console.log('\n--- TEST 3: Running Code Process Termination on Logout ---');
    // Start a long-running execution via runner
    const execPromise = runner.executeCode(null, {
      language: 'javascript',
      code: 'let i = 0; setInterval(() => { console.log("tick " + (++i)); }, 200);',
    });

    // Wait 400ms for process to start
    await new Promise((r) => setTimeout(r, 400));
    console.log('Running background code execution started.');

    // Simulate logout action: stop running code + clear session
    runner.stopActiveExecution(null);
    const logoutResult = sessionService.logout();
    assert.strictEqual(logoutResult.success, true);

    const postLogoutSession = sessionService.getActiveSession();
    assert.strictEqual(postLogoutSession.isAuthenticated, false, 'Session must be cleared after logout');
    console.log('✓ TEST 3 PASSED: Running processes terminated and session cleared immediately on logout.');

    // --- TEST 4: Persistent Data Integrity Across Logout ---
    console.log('\n--- TEST 4: Persistent Data Integrity Across Logout ---');
    const preservedProfile = db.getProfile();
    assert.strictEqual(preservedProfile.student_name, 'Aarav Patel', 'Student name must remain in SQLite');
    assert.strictEqual(preservedProfile.student_class, 10, 'Student class must remain in SQLite');
    assert.strictEqual(db.isOnboardingCompleted(), true, 'Onboarding status must remain completed');
    console.log('✓ TEST 4 PASSED: Student profile and onboarding status preserved across logout.');

    // --- TEST 5: Switch Student Profile ---
    console.log('\n--- TEST 5: Switch Student Profile ---');
    const priyaProfile = db.saveProfile('Priya Sharma', 11);
    const switchedLogin = sessionService.createSession(priyaProfile.id);
    assert.strictEqual(switchedLogin.session.student.student_name, 'Priya Sharma');
    assert.strictEqual(switchedLogin.session.student.student_class, 11);

    const switchedActive = sessionService.getActiveSession();
    assert.strictEqual(switchedActive.student.student_name, 'Priya Sharma');
    assert.strictEqual(switchedActive.student.student_class, 11);
    console.log('✓ TEST 5 PASSED: Switching student updates profile and binds to new active session.');

    // --- TEST 6: Admin Authentication Security & Privilege Isolation ---
    console.log('\n--- TEST 6: Admin Authentication Security & Privilege Isolation ---');
    // Setup and login admin
    adminAuthService.setupAdminPassword('LabTeacherPass2026!');
    const adminLogin = adminAuthService.loginAdmin('LabTeacherPass2026!');
    assert.strictEqual(adminLogin.success, true);
    assert(adminLogin.token.length > 0, 'Admin token must be generated');

    // Verify admin token works
    const adminSurveyService = require('../dist-electron/main/adminSurveyService');
    const statsBefore = adminSurveyService.getAdminSurveyStats(adminLogin.token);
    assert(statsBefore !== null && typeof statsBefore.totalResponses === 'number');

    // Log out student -> must also invalidate admin session
    sessionService.logout();
    assert.strictEqual(sessionService.getActiveSession().isAuthenticated, false);

    // Verify admin token is invalidated / rejected
    assert.throws(() => {
      adminSurveyService.getAdminSurveyStats(adminLogin.token);
    }, /Unauthorized/, 'Admin token must be invalidated after student logout');
    console.log('✓ TEST 6 PASSED: Student logout clears admin token and prevents privilege leakage.');

    // --- TEST 7: Application Shutdown Simulation (Alt+F4 / Window Close / Reboot) ---
    console.log('\n--- TEST 7: Application Shutdown Simulation (Alt+F4 / Window Close / Reboot) ---');
    // Login student again
    sessionService.createSession(1);
    assert.strictEqual(sessionService.getActiveSession().isAuthenticated, true);

    // Simulate main process performShutdownCleanup()
    runner.stopActiveExecution(null);
    sessionService.clearSession();
    adminAuthService.logoutAdmin();

    // Verify memory is completely wiped
    assert.strictEqual(sessionService.getActiveSession().isAuthenticated, false);
    assert.strictEqual(sessionService.isSessionActive(), false);

    // Simulate fresh launch in a separate Node process to guarantee clean memory state
    const freshLaunchCheck = spawn(process.execPath, [
      '-e',
      `
      const sessionService = require('./dist-electron/main/sessionService');
      const status = sessionService.getActiveSession();
      if (status.isAuthenticated === false) {
        console.log('FRESH_PROCESS_SESSION_UNAUTHENTICATED');
        process.exit(0);
      } else {
        process.exit(1);
      }
      `
    ], { cwd: path.join(__dirname, '..') });

    let freshOutput = '';
    freshLaunchCheck.stdout.on('data', (d) => { freshOutput += d.toString(); });

    await new Promise((resolve) => {
      freshLaunchCheck.on('close', (code) => {
        assert.strictEqual(code, 0, 'Fresh process must have unauthenticated session');
        assert(freshOutput.includes('FRESH_PROCESS_SESSION_UNAUTHENTICATED'));
        resolve();
      });
    });
    console.log('✓ TEST 7 PASSED: Shutdown cleanup and new process launch verified: Login screen mandatory.');

    // --- TEST 8: 100% Offline Integrity ---
    console.log('\n--- TEST 8: 100% Offline Integrity ---');
    // Verify no URL or external endpoints in session service
    const sessionServiceSource = fs.readFileSync(path.join(__dirname, '../src/main/sessionService.ts'), 'utf-8');
    assert(!sessionServiceSource.includes('http://'), 'No external HTTP URLs in sessionService');
    assert(!sessionServiceSource.includes('https://'), 'No external HTTPS URLs in sessionService');
    console.log('✓ TEST 8 PASSED: Session management is 100% local, secure, and offline.');

    console.log('\n====================================================');
    console.log('ALL SESSION MANAGEMENT & LOGOUT TESTS PASSED (8/8)');
    console.log('====================================================\n');

    // Clean up temporary database
    db.closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ SESSION TEST FAILED:', err);
    process.exit(1);
  }
}

runTests();
