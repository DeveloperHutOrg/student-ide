// tests/test_multi_student_survey.js
// Automated verification suite for Multi-Student Survey Architecture in Student IDE

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { DatabaseSync } = require('node:sqlite');

console.log('================================================================');
console.log('STUDENT IDE: MULTI-STUDENT SURVEY ARCHITECTURE VERIFICATION');
console.log('================================================================');

const testDbDir = path.join(__dirname, '../.data/multi_student_test');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

const testDbPath = path.join(testDbDir, 'multi_student_test.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Set up fresh test database
const db = new DatabaseSync(testDbPath);
const { runMigrations, MIGRATIONS } = require('../dist-electron/main/migrations');
runMigrations(db);

const dbModule = require('../dist-electron/main/db');
const surveyService = require('../dist-electron/main/surveyService');
const adminSurveyService = require('../dist-electron/main/adminSurveyService');
const adminAuthService = require('../dist-electron/main/adminAuthService');
const sessionService = require('../dist-electron/main/sessionService');

// Initialize database instance in dbModule to point to our test database
dbModule.initDatabase(testDbPath);

async function runTestSuite() {
  let passed = 0;
  const total = 8;

  try {
    // -------------------------------------------------------------
    // TEST 1: Database Schema & Migration 4 Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Migration 4 & Schema Audit ---');
    const migrations = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all();
    console.log('Applied migrations:', migrations);
    assert(migrations.some(m => m.version === 4), 'Migration 4 must be applied');

    // Verify profile table allows multiple IDs (no CHECK (id = 1))
    const p1 = dbModule.saveProfile('Aarav Sharma', 9);
    const p2 = dbModule.saveProfile('Diya Patel', 10);
    const p3 = dbModule.saveProfile('Karan Gupta', 11);

    assert.strictEqual(p1.id, 1, 'First profile should have id 1');
    assert.strictEqual(p2.id, 2, 'Second profile should have id 2');
    assert.strictEqual(p3.id, 3, 'Third profile should have id 3');

    const allProfiles = dbModule.getAllProfiles();
    assert.strictEqual(allProfiles.length, 3, 'Must have 3 distinct student profiles in database');
    console.log('✓ TEST 1 PASSED: Migration 4 allows multiple student profiles without id=1 constraint.');
    passed++;

    // -------------------------------------------------------------
    // TEST 2: Complete Workflow (Student A -> Survey -> Logout)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Student A Login & Survey Submission ---');
    // Student A logs in
    const sessionA = sessionService.createSession(p1.id);
    assert.strictEqual(sessionA.session.isAuthenticated, true);
    assert.strictEqual(sessionA.session.student.student_name, 'Aarav Sharma');

    // Check survey status for Student A
    const statusA_before = surveyService.getSurveyStatus('student-feedback-v1', p1.id);
    assert.strictEqual(statusA_before.hasSubmitted, false, 'Student A should not have submitted yet');

    // Student A submits survey
    const payloadA = {
      surveyId: 'student-feedback-v1',
      answers: {
        q1: 'Very Easy',
        q2: 'Python',
        q3: 'Daily',
        q4: ['Code Editor', 'Code Execution'],
        q5: ['Tutorials'],
        q6: 'Loved the offline experience!',
      },
    };
    const submitResultA = surveyService.submitSurveyResponse(payloadA, p1.id);
    assert.strictEqual(submitResultA.success, true);
    console.log('Student A submission saved, ID:', submitResultA.responseId);

    // Verify Student A's status is now submitted
    const statusA_after = surveyService.getSurveyStatus('student-feedback-v1', p1.id);
    assert.strictEqual(statusA_after.hasSubmitted, true);
    assert(statusA_after.submittedAt !== undefined);

    // Student A logs out
    sessionService.logout();
    assert.strictEqual(sessionService.isSessionActive(), false);
    console.log('✓ TEST 2 PASSED: Student A logged in, submitted survey, and logged out.');
    passed++;

    // -------------------------------------------------------------
    // TEST 3: Student B on Same PC (Uncompleted Survey & Submission)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Student B on Same Computer (Independent State) ---');
    // Student B logs in on same computer
    const sessionB = sessionService.createSession(p2.id);
    assert.strictEqual(sessionB.session.isAuthenticated, true);
    assert.strictEqual(sessionB.session.student.student_name, 'Diya Patel');

    // CRITICAL: Student B opens Survey tab - MUST see uncompleted survey!
    const statusB_before = surveyService.getSurveyStatus('student-feedback-v1', p2.id);
    assert.strictEqual(
      statusB_before.hasSubmitted, 
      false, 
      'CRITICAL: Student B must NOT inherit Student A survey submission on same computer!'
    );
    console.log('Student B survey status verified: hasSubmitted = false (Uncompleted form displayed)');

    // Student B submits survey with their own distinct answers
    const payloadB = {
      surveyId: 'student-feedback-v1',
      answers: {
        q1: 'Easy',
        q2: 'C++',
        q3: 'Several times a week',
        q4: ['Output Terminal', 'Live Web Preview'],
        q5: ['Better error explanations'],
        q6: 'Great C++ compiler support.',
      },
    };
    const submitResultB = surveyService.submitSurveyResponse(payloadB, p2.id);
    assert.strictEqual(submitResultB.success, true);
    assert.notStrictEqual(submitResultB.responseId, submitResultA.responseId, 'Each submission must have unique response ID');
    console.log('Student B submission saved, ID:', submitResultB.responseId);

    // Verify Student B's status is now submitted
    const statusB_after = surveyService.getSurveyStatus('student-feedback-v1', p2.id);
    assert.strictEqual(statusB_after.hasSubmitted, true);

    // Student B logs out
    sessionService.logout();
    console.log('✓ TEST 3 PASSED: Student B independently submitted survey on the same computer.');
    passed++;

    // -------------------------------------------------------------
    // TEST 4: Student A Logs in Again (Data Integrity Across Logins)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Student A Relogin & Response Integrity ---');
    // Student A logs in again
    const sessionA2 = sessionService.createSession(p1.id);
    assert.strictEqual(sessionA2.session.student.student_name, 'Aarav Sharma');

    // Verify Student A's previous response is still recorded and retrieved
    const statusA2 = surveyService.getSurveyStatus('student-feedback-v1', p1.id);
    assert.strictEqual(statusA2.hasSubmitted, true, 'Student A previous submission must still be recorded');

    const responseA2 = surveyService.getSurveyResponse('student-feedback-v1', p1.id);
    assert(responseA2 !== null);
    assert.strictEqual(responseA2.studentName, 'Aarav Sharma');
    assert.strictEqual(responseA2.studentClass, 9);
    assert.strictEqual(responseA2.answers.q2, 'Python');
    assert.strictEqual(responseA2.answers.q6, 'Loved the offline experience!');
    console.log('✓ TEST 4 PASSED: Student A relogged in; original response perfectly preserved.');
    passed++;

    // -------------------------------------------------------------
    // TEST 5: Duplicate Submission Policy Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Duplicate Submission Prevention per Student ---');
    let duplicateRejected = false;
    try {
      surveyService.submitSurveyResponse(payloadA, p1.id);
    } catch (err) {
      duplicateRejected = true;
      console.log('Expected duplicate rejection caught:', err.message);
    }
    assert.strictEqual(duplicateRejected, true, 'Student A duplicate submission must be rejected');

    // Verify raw SQLite UNIQUE constraint also protects against duplicates
    let rawConstraintCaught = false;
    try {
      db.prepare(`
        INSERT INTO survey_responses (
          survey_id, survey_version, student_profile_id, student_name, student_class, answers_json, submitted_at, source_type
        ) VALUES ('student-feedback-v1', '1.0.0', ?, 'Aarav Sharma', 9, '{}', CURRENT_TIMESTAMP, 'local')
      `).run(p1.id);
    } catch (err) {
      rawConstraintCaught = true;
      console.log('SQLite constraint protection verified:', err.message);
    }
    assert.strictEqual(rawConstraintCaught, true, 'Database unique index must enforce one submission per student per version');
    console.log('✓ TEST 5 PASSED: Duplicate submissions prevented both in service and database constraint.');
    passed++;

    // -------------------------------------------------------------
    // TEST 6: Admin Dashboard Aggregation & Unique Students Count
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Admin Dashboard Multi-Student Analytics ---');
    // Set up admin password
    adminAuthService.setupAdminPassword('AdminSecretPass#2026');
    const adminToken = adminAuthService.loginAdmin('AdminSecretPass#2026').token;

    const stats = adminSurveyService.getAdminSurveyStats(adminToken);
    console.log('Admin Stats:', {
      totalResponses: stats.totalResponses,
      uniqueStudents: stats.uniqueStudents,
      localResponses: stats.localResponses,
      classDistribution: stats.classDistribution,
    });

    assert.strictEqual(stats.totalResponses, 2, 'Total responses must be 2');
    assert.strictEqual(stats.localResponses, 2, 'Local responses must be 2');
    assert.strictEqual(stats.uniqueStudents, 2, 'Unique participating students must be 2');
    assert.strictEqual(stats.classDistribution[9], 1, 'Class 9 must have 1 response (Student A)');
    assert.strictEqual(stats.classDistribution[10], 1, 'Class 10 must have 1 response (Student B)');

    const allResponses = adminSurveyService.getAdminResponses({}, adminToken);
    assert.strictEqual(allResponses.length, 2);
    const names = allResponses.map(r => r.studentName);
    assert(names.includes('Aarav Sharma'));
    assert(names.includes('Diya Patel'));
    console.log('✓ TEST 6 PASSED: Admin Dashboard reports both students with accurate counts.');
    passed++;

    // -------------------------------------------------------------
    // TEST 7: JSON Export & Import Deduping Across Students
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Export & Import Center Multi-Student Handling ---');
    const exportPath = path.join(testDbDir, 'backup_multi_student.json');
    
    // Test export by manually writing the backup format using getAdminResponses
    const backupRecords = allResponses.map(r => ({
      responseId: r.id,
      surveyId: r.surveyId,
      surveyVersion: r.surveyVersion || '1.0.0',
      studentName: r.studentName,
      studentClass: r.studentClass,
      answers: r.answers,
      submittedAt: r.submittedAt,
      source: r.sourceType,
    }));
    fs.writeFileSync(exportPath, JSON.stringify({
      exportFormatVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      generator: 'Student IDE Test',
      totalRecords: backupRecords.length,
      surveyId: 'student-feedback-v1',
      surveyVersion: '1.0.0',
      records: backupRecords,
    }, null, 2), 'utf8');

    // Attempt re-importing the export file: Both must be skipped as duplicates
    const importResult = await adminSurveyService.importSurveyData(() => null, adminToken, exportPath);
    console.log('Import result on duplicate file:', importResult);
    assert.strictEqual(importResult.importedCount, 0, 'No duplicate records should be imported');
    assert.strictEqual(importResult.skippedDuplicates, 2, 'Both duplicate records should be safely skipped');
    console.log('✓ TEST 7 PASSED: Multi-student export and duplicate detection verified.');
    passed++;

    // -------------------------------------------------------------
    // TEST 8: Migration of Legacy Databases (Preserving Overwritten Data)
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Legacy Database Migration Simulation ---');
    const legacyDbPath = path.join(testDbDir, 'legacy_simulation.db');
    if (fs.existsSync(legacyDbPath)) fs.unlinkSync(legacyDbPath);

    const legacyDb = new DatabaseSync(legacyDbPath);
    // Apply migrations 1, 2, 3 manually to simulate old state
    MIGRATIONS[0].up(legacyDb);
    MIGRATIONS[1].up(legacyDb);
    MIGRATIONS[2].up(legacyDb);
    legacyDb.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at DATETIME);
      INSERT INTO schema_migrations VALUES (1, '001', CURRENT_TIMESTAMP), (2, '002', CURRENT_TIMESTAMP), (3, '003', CURRENT_TIMESTAMP);
    `);

    // In legacy state: Profile was overwritten to "Aditha Sri", Class 11
    legacyDb.prepare(`
      INSERT INTO profile (id, student_name, student_class) VALUES (1, 'Aditha Sri', 11)
      ON CONFLICT(id) DO UPDATE SET student_name = excluded.student_name, student_class = excluded.student_class;
    `).run();

    // But survey was previously submitted by "vasu", Class 12
    legacyDb.prepare(`
      INSERT INTO survey_responses (
        id, survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, source_type
      ) VALUES (1, 'student-feedback-v1', 1, 'vasu', 12, '{"q1":"Easy"}', CURRENT_TIMESTAMP, 'local');
    `).run();

    // Now apply Migration 4
    console.log('Applying Migration 4 to legacy database...');
    MIGRATIONS[3].up(legacyDb);
    legacyDb.exec("INSERT INTO schema_migrations VALUES (4, '004_multi_student_survey', CURRENT_TIMESTAMP);");

    // Verify both "Aditha Sri" and "vasu" now exist in profile
    const migratedProfiles = legacyDb.prepare('SELECT id, student_name, student_class FROM profile ORDER BY id').all();
    console.log('Migrated profiles:', migratedProfiles);
    assert.strictEqual(migratedProfiles.length, 2, 'Both Aditha Sri and vasu must now have separate profile entries');
    
    // Verify survey response is now correctly linked to vasu's profile
    const migratedResponse = legacyDb.prepare('SELECT id, student_profile_id, student_name, student_class FROM survey_responses WHERE id = 1').get();
    console.log('Migrated survey response:', migratedResponse);
    assert.strictEqual(migratedResponse.student_name, 'vasu');
    
    const vasuProfile = migratedProfiles.find(p => p.student_name.toLowerCase() === 'vasu');
    assert(vasuProfile !== undefined);
    assert.strictEqual(migratedResponse.student_profile_id, vasuProfile.id, "vasu's response must link to vasu's profile id");

    legacyDb.close();
    console.log('✓ TEST 8 PASSED: Legacy database successfully upgraded without data loss!');
    passed++;

    console.log('\n================================================================');
    console.log(`ALL ${passed}/${total} MULTI-STUDENT SURVEY TESTS PASSED (100% SUCCESS)`);
    console.log('================================================================\n');

    db.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MULTI-STUDENT SURVEY TEST SUITE FAILED:', err);
    try { db.close(); } catch {}
    process.exit(1);
  }
}

runTestSuite();
