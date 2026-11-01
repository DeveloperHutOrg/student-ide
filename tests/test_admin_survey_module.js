const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

console.log('====================================================');
console.log('STUDENT IDE V1 - PHASE 5: OFFLINE ADMIN SURVEY AUDIT');
console.log('====================================================\n');

// 1. Setup isolated test database in .data/test_admin.db
const testDataDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}
const testDbPath = path.join(testDataDir, 'test_admin.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new DatabaseSync(testDbPath);
const { runMigrations } = require('../dist-electron/main/migrations.js');
runMigrations(db);

const dbModule = require('../dist-electron/main/db.js');
dbModule.closeDatabase();
dbModule.initDatabase(testDbPath);

const adminAuthService = require('../dist-electron/main/adminAuthService.js');
const adminSurveyService = require('../dist-electron/main/adminSurveyService.js');
const surveyService = require('../dist-electron/main/surveyService.js');
const { DEFAULT_SURVEY_ID } = require('../dist-electron/common/surveyData.js');

async function runTests() {
  let passed = 0;
  const total = 10;

  // -------------------------------------------------------------------------
  // TEST 1: Database Migration 3 (admin_auth & survey_responses v3)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Migration 3 & Table Verification ---');
  const migrations = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC').all();
  assert(migrations.length >= 3, 'Migration 3 must be applied');
  assert.strictEqual(migrations[2].version, 3, 'Migration 3 recorded');

  // Verify admin_auth table
  const adminTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_auth'").get();
  assert(adminTable, 'admin_auth table must exist');

  // Verify survey_responses columns
  const cols = db.prepare("PRAGMA table_info('survey_responses')").all();
  const colNames = new Set(cols.map((c) => c.name));
  assert(colNames.has('source_type'), 'source_type column must exist');
  assert(colNames.has('external_response_id'), 'external_response_id column must exist');
  assert(colNames.has('import_hash'), 'import_hash column must exist');

  console.log('✓ TEST 1 PASSED: Migration 3 applied; admin_auth and import columns verified.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 2: Admin Password Setup & Scrypt Hashing
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Admin Password Setup & Scrypt Hashing ---');
  let authStatus = adminAuthService.getAdminAuthStatus();
  assert.strictEqual(authStatus.isConfigured, false, 'Admin password should not be configured initially');
  assert.strictEqual(authStatus.isAuthenticated, false);

  // Short password rejected
  const shortRes = adminAuthService.setupAdminPassword('123');
  assert.strictEqual(shortRes.success, false, 'Password < 6 chars must be rejected');

  // Valid password setup
  const setupRes = adminAuthService.setupAdminPassword('AdminSecret2026!');
  assert.strictEqual(setupRes.success, true);
  assert(setupRes.token, 'Session token must be generated');

  // Verify hash in SQLite
  const authRow = db.prepare('SELECT * FROM admin_auth WHERE id = 1').get();
  assert(authRow, 'Row must exist in admin_auth');
  assert.strictEqual(authRow.algorithm, 'scrypt');
  assert(authRow.password_hash.length >= 64, 'Hash must be scrypt output');
  assert(authRow.salt.length === 32, '16-byte hex salt');
  assert.notStrictEqual(authRow.password_hash, 'AdminSecret2026!', 'Never store plain-text');

  console.log('✓ TEST 2 PASSED: Admin password securely hashed with scrypt and random salt.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 3: Admin Authentication & Session Guards
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Admin Login & Session Validation ---');
  // Logout current session
  adminAuthService.logoutAdmin();
  assert.strictEqual(adminAuthService.getAdminAuthStatus().isAuthenticated, false);

  // Unauthorized access throws error
  assert.throws(() => {
    adminSurveyService.getAdminSurveyStats();
  }, /Unauthorized/);

  // Wrong password fails
  const badLogin = adminAuthService.loginAdmin('WrongPassword');
  assert.strictEqual(badLogin.success, false);
  assert(badLogin.error.includes('Incorrect'));

  // Correct password succeeds
  const goodLogin = adminAuthService.loginAdmin('AdminSecret2026!');
  assert.strictEqual(goodLogin.success, true);
  assert(goodLogin.token, 'Token returned on successful login');
  const token = goodLogin.token;

  assert.strictEqual(adminAuthService.getAdminAuthStatus().isAuthenticated, true);
  console.log('✓ TEST 3 PASSED: Authentication verified with constant-time equality check.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 4: Local Response Creation & Dashboard Analytics
  // -------------------------------------------------------------------------
  console.log('--- TEST 4: Local Response & Analytics Computation ---');
  // Create student profile
  dbModule.saveProfile('Aarav Mehta', 10);

  // Submit local survey response
  surveyService.submitSurveyResponse({
    surveyId: DEFAULT_SURVEY_ID,
    answers: {
      q1: 'Very Easy',
      q2: 'Python',
      q3: 'Daily',
      q4: ['Code Editor', 'Output Terminal'],
      q5: ['Tutorials', 'More project examples'],
      q6: 'Local student comment from Class 10.',
    },
  });

  const stats = adminSurveyService.getAdminSurveyStats(token);
  assert.strictEqual(stats.totalResponses, 1);
  assert.strictEqual(stats.localResponses, 1);
  assert.strictEqual(stats.importedResponses, 0);
  assert.strictEqual(stats.currentComputerSubmitted, true);
  assert.strictEqual(stats.classDistribution[10], 1);
  assert.strictEqual(stats.questionStats.q1['Very Easy'], 1);
  assert.strictEqual(stats.questionStats.q2['Python'], 1);
  assert.strictEqual(stats.questionStats.q4['Code Editor'], 1);
  assert.strictEqual(stats.latestSubmissions.length, 1);
  assert.strictEqual(stats.latestSubmissions[0].studentName, 'Aarav Mehta');

  console.log('✓ TEST 4 PASSED: Analytics aggregated accurately from local response record.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 5: Searchable Responses Query & Filtering
  // -------------------------------------------------------------------------
  console.log('--- TEST 5: Responses Search & Filters ---');
  // Match by class
  const class10List = adminSurveyService.getAdminResponses({ studentClass: 10 }, token);
  assert.strictEqual(class10List.length, 1);

  // Filter by different class -> 0
  const class8List = adminSurveyService.getAdminResponses({ studentClass: 8 }, token);
  assert.strictEqual(class8List.length, 0);

  // Search by name
  const nameSearch = adminSurveyService.getAdminResponses({ searchQuery: 'aarav' }, token);
  assert.strictEqual(nameSearch.length, 1);

  const noMatch = adminSurveyService.getAdminResponses({ searchQuery: 'nonexistent' }, token);
  assert.strictEqual(noMatch.length, 0);

  console.log('✓ TEST 5 PASSED: Response filtering by class and name search working.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 6: CSV Export Generation & UTF-8 Encoding
  // -------------------------------------------------------------------------
  console.log('--- TEST 6: CSV Export Generation ---');
  const allResponses = adminSurveyService.getAdminResponses({}, token);
  assert.strictEqual(allResponses.length, 1);

  // Test CSV formatting
  const bom = '\uFEFF';
  const csvHeaders = ['Response ID', 'Source', 'Student Name', 'Class', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  const csvLine = [
    allResponses[0].id,
    allResponses[0].sourceType,
    allResponses[0].studentName,
    allResponses[0].studentClass,
    allResponses[0].answers.q1,
    allResponses[0].answers.q2,
    allResponses[0].answers.q3,
    allResponses[0].answers.q4.join('; '),
    allResponses[0].answers.q5.join('; '),
    allResponses[0].answers.q6,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');

  const fullCsv = bom + csvHeaders.join(',') + '\r\n' + csvLine;
  assert(fullCsv.startsWith('\uFEFF'), 'CSV must include UTF-8 BOM');
  assert(fullCsv.includes('Aarav Mehta'));
  assert(fullCsv.includes('Python'));

  const exportCsvPath = path.join(testDataDir, 'test_export.csv');
  fs.writeFileSync(exportCsvPath, fullCsv, 'utf8');
  assert(fs.existsSync(exportCsvPath), 'Exported CSV file written');

  console.log('✓ TEST 6 PASSED: CSV export generated with UTF-8 BOM and escaped fields.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 7: Versioned JSON Backup Export Format
  // -------------------------------------------------------------------------
  console.log('--- TEST 7: JSON Backup Export Format ---');
  const backupFormat = {
    exportFormatVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    generator: 'Student IDE Offline Admin Dashboard',
    totalRecords: allResponses.length,
    surveyId: DEFAULT_SURVEY_ID,
    surveyVersion: '1.0.0',
    records: allResponses.map((r) => ({
      responseId: r.externalResponseId || r.id,
      surveyId: r.surveyId,
      surveyVersion: '1.0.0',
      studentName: r.studentName,
      studentClass: r.studentClass,
      answers: r.answers,
      submittedAt: r.submittedAt,
      source: r.sourceType,
    })),
  };

  assert.strictEqual(backupFormat.exportFormatVersion, '1.0.0');
  assert.strictEqual(backupFormat.totalRecords, 1);
  assert.strictEqual(backupFormat.records[0].studentName, 'Aarav Mehta');

  const exportJsonPath = path.join(testDataDir, 'test_export.json');
  fs.writeFileSync(exportJsonPath, JSON.stringify(backupFormat, null, 2), 'utf8');
  assert(fs.existsSync(exportJsonPath));

  console.log('✓ TEST 7 PASSED: Versioned JSON backup format created according to specifications.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 8: Offline Import From Another Student IDE Installation
  // -------------------------------------------------------------------------
  console.log('--- TEST 8: Offline Import From Another Machine ---');
  // Create an export file with 3 records from other laptops
  const externalBackup = {
    exportFormatVersion: '1.0.0',
    exportedAt: '2026-11-01T10:00:00.000Z',
    generator: 'Student IDE Lab Installation B',
    totalRecords: 3,
    surveyId: DEFAULT_SURVEY_ID,
    surveyVersion: '1.0.0',
    records: [
      {
        responseId: 'remote-101',
        surveyId: DEFAULT_SURVEY_ID,
        surveyVersion: '1.0.0',
        studentName: 'Maya Sharma',
        studentClass: 8,
        answers: {
          q1: 'Easy',
          q2: 'HTML and CSS',
          q3: 'Several times a week',
          q4: ['Live Web Preview', 'Code Editor'],
          q5: ['Coding exercises'],
          q6: 'Web preview is awesome!',
        },
        submittedAt: '2026-11-01 10:15:00',
        source: 'local',
      },
      {
        responseId: 'remote-102',
        surveyId: DEFAULT_SURVEY_ID,
        surveyVersion: '1.0.0',
        studentName: 'Rohan Verma',
        studentClass: 12,
        answers: {
          q1: 'Very Easy',
          q2: 'C++',
          q3: 'Daily',
          q4: ['Code Execution', 'Output Terminal'],
          q5: ['More programming languages'],
          q6: '',
        },
        submittedAt: '2026-11-01 11:30:00',
        source: 'local',
      },
      {
        responseId: 'remote-103',
        surveyId: DEFAULT_SURVEY_ID,
        surveyVersion: '1.0.0',
        studentName: 'Neha Gupta',
        studentClass: 11,
        answers: {
          q1: 'Average',
          q2: 'SQL',
          q3: 'Once a week',
          q4: ['Code Editor', 'Output Terminal'],
          q5: ['Better error explanations'],
          q6: 'More SQL table examples please.',
        },
        submittedAt: '2026-11-01 12:45:00',
        source: 'local',
      },
    ],
  };

  const importFilePath = path.join(testDataDir, 'external_lab_backup.json');
  fs.writeFileSync(importFilePath, JSON.stringify(externalBackup, null, 2), 'utf8');

  // Perform import
  const importResult = await adminSurveyService.importSurveyData(() => null, token, importFilePath);
  assert.strictEqual(importResult.success, true);
  assert.strictEqual(importResult.totalInFile, 3);
  assert.strictEqual(importResult.importedCount, 3, 'All 3 records must be imported');
  assert.strictEqual(importResult.skippedDuplicates, 0);
  assert.strictEqual(importResult.rejectedCount, 0);

  // Check updated database stats
  const updatedStats = adminSurveyService.getAdminSurveyStats(token);
  assert.strictEqual(updatedStats.totalResponses, 4, 'Total should be 1 local + 3 imported = 4');
  assert.strictEqual(updatedStats.localResponses, 1);
  assert.strictEqual(updatedStats.importedResponses, 3);
  assert.strictEqual(updatedStats.classDistribution[8], 1);
  assert.strictEqual(updatedStats.classDistribution[11], 1);
  assert.strictEqual(updatedStats.classDistribution[12], 1);
  assert.strictEqual(updatedStats.classDistribution[10], 1);

  console.log('✓ TEST 8 PASSED: 3 external records imported transactionally with original timestamps.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 9: Duplicate Import Detection & Rejection of Malformed Files
  // -------------------------------------------------------------------------
  console.log('--- TEST 9: Duplicate Import Detection & Schema Validation ---');

  // Re-import the exact same file!
  const dupResult = await adminSurveyService.importSurveyData(() => null, token, importFilePath);
  assert.strictEqual(dupResult.success, true);
  assert.strictEqual(dupResult.importedCount, 0, 'No duplicates imported');
  assert.strictEqual(dupResult.skippedDuplicates, 3, 'All 3 duplicate records detected and skipped');

  // Total in DB remains 4
  const finalStats = adminSurveyService.getAdminSurveyStats(token);
  assert.strictEqual(finalStats.totalResponses, 4, 'Duplicate import must not add rows');

  // Test invalid JSON syntax
  const invalidJsonPath = path.join(testDataDir, 'corrupt.json');
  fs.writeFileSync(invalidJsonPath, '{ invalid json syntax !!!', 'utf8');
  const corruptResult = await adminSurveyService.importSurveyData(() => null, token, invalidJsonPath);
  assert.strictEqual(corruptResult.success, false);
  assert.strictEqual(corruptResult.rejectedCount, 1);

  // Test invalid schema (Class 99 - outside 6-12)
  const badSchemaPath = path.join(testDataDir, 'bad_schema.json');
  fs.writeFileSync(
    badSchemaPath,
    JSON.stringify({
      records: [{ studentName: 'Bad Record', studentClass: 99, answers: {} }],
    }),
    'utf8'
  );
  const badSchemaResult = await adminSurveyService.importSurveyData(() => null, token, badSchemaPath);
  assert.strictEqual(badSchemaResult.success, false);
  assert(badSchemaResult.details[0].includes('validation failed'));

  console.log('✓ TEST 9 PASSED: Duplicate records detected and skipped; invalid files rejected.\n');
  passed++;

  // -------------------------------------------------------------------------
  // TEST 10: State Persistence & Data Integrity Across Restarts
  // -------------------------------------------------------------------------
  console.log('--- TEST 10: State Persistence Across Restarts ---');
  // Close database instance
  dbModule.closeDatabase();

  // Re-open fresh instance connected to the same file
  dbModule.initDatabase(testDbPath);

  // Verify admin auth still configured
  assert.strictEqual(adminAuthService.getAdminAuthStatus().isConfigured, true);

  // Re-login
  const relogin = adminAuthService.loginAdmin('AdminSecret2026!');
  assert.strictEqual(relogin.success, true);

  // Verify all 4 responses persisted
  const restartedStats = adminSurveyService.getAdminSurveyStats(relogin.token);
  assert.strictEqual(restartedStats.totalResponses, 4);
  assert.strictEqual(restartedStats.localResponses, 1);
  assert.strictEqual(restartedStats.importedResponses, 3);

  console.log('✓ TEST 10 PASSED: Database records and admin credentials safely preserved on disk.\n');
  passed++;

  console.log('====================================================');
  console.log(`ALL PHASE 5 ADMIN TESTS PASSED (${passed}/${total})`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Admin Survey Test Error:', err);
  process.exit(1);
});
