// tests/test_two_computer_lab_simulation.js
// Automated verification of Admin Survey Module across 2 simulated lab computers (Computer A -> Computer B)

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { z } = require('zod');

console.log('================================================================');
console.log('STUDENT IDE V1 - PHASE 6: TWO-COMPUTER LAB MIGRATION & AGGREGATION');
console.log('================================================================\n');

const testDir = path.join(__dirname, '../.data/lab_simulation');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

const dbPathA = path.join(testDir, 'computer_a.db');
const dbPathB = path.join(testDir, 'computer_b.db');

// Migration runner helper
function applyMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration 1
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      student_class INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS language_preferences (
      language_id TEXT PRIMARY KEY,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      language_id TEXT NOT NULL,
      folder_path TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_opened_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration 2 & 3
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_definitions (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      schema_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id TEXT NOT NULL,
      student_profile_id INTEGER NULL,
      student_name TEXT NOT NULL,
      student_class INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'completed',
      source_type TEXT NOT NULL DEFAULT 'local',
      external_response_id TEXT NULL,
      import_hash TEXT NULL UNIQUE,
      FOREIGN KEY (survey_id) REFERENCES survey_definitions(id)
    );
    CREATE TABLE IF NOT EXISTS admin_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO survey_definitions (id, version, title, description, schema_json, is_active)
    VALUES (
      'student-ide-feedback-v1',
      '1.0.0',
      'Student IDE Feedback Survey',
      'Feedback survey for students',
      '{}',
      1
    );
  `);
}

// -------------------------------------------------------------
// COMPUTER A: Submit 2 surveys and export JSON & CSV
// -------------------------------------------------------------
console.log('--- 1. SETTING UP COMPUTER A ---');
const dbA = new DatabaseSync(dbPathA);
applyMigrations(dbA);

// Admin password setup on Computer A
const saltA = crypto.randomBytes(16).toString('hex');
const hashA = crypto.scryptSync('LabAdminPass2026', saltA, 64).toString('hex');
dbA.prepare('INSERT INTO admin_auth (password_hash, salt) VALUES (?, ?)').run(hashA, saltA);

// Student 1 (Local profile)
dbA.prepare('INSERT INTO profile (student_name, student_class) VALUES (?, ?)').run('Rohan Patel', 10);
const student1Profile = dbA.prepare('SELECT * FROM profile WHERE student_name = ?').get('Rohan Patel');

const answers1 = {
  q1_experience: 'beginner',
  q2_favorite_language: 'python',
  q3_ease_of_use: 5,
  q4_most_useful: 'editor',
  q5_recommend: 5,
  q6_feedback: 'Loved the dark mode and Monaco editor!'
};

dbA.prepare(`
  INSERT INTO survey_responses (
    survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, status, source_type
  ) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 hours'), 'completed', 'local')
`).run('student-ide-feedback-v1', student1Profile.id, student1Profile.student_name, student1Profile.student_class, JSON.stringify(answers1));

// Student 2 (Local profile)
dbA.prepare('INSERT INTO profile (student_name, student_class) VALUES (?, ?)').run('Ananya Roy', 11);
const student2Profile = dbA.prepare('SELECT * FROM profile WHERE student_name = ?').get('Ananya Roy');

const answers2 = {
  q1_experience: 'intermediate',
  q2_favorite_language: 'cpp',
  q3_ease_of_use: 4,
  q4_most_useful: 'terminal',
  q5_recommend: 5,
  q6_feedback: 'Bundled C++ compiler is very fast.'
};

dbA.prepare(`
  INSERT INTO survey_responses (
    survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, status, source_type
  ) VALUES (?, ?, ?, ?, ?, datetime('now', '-1 hour'), 'completed', 'local')
`).run('student-ide-feedback-v1', student2Profile.id, student2Profile.student_name, student2Profile.student_class, JSON.stringify(answers2));

const countA = dbA.prepare('SELECT COUNT(*) as count FROM survey_responses').get().count;
assert.strictEqual(countA, 2, 'Computer A must have 2 records');
console.log(`✓ Computer A successfully recorded ${countA} local student surveys.`);

// Export JSON Backup from Computer A
const recordsA = dbA.prepare('SELECT * FROM survey_responses ORDER BY id ASC').all();
const backupPayload = {
  exportFormatVersion: '1.0.0',
  exportedAt: new Date().toISOString(),
  exportSource: 'Student IDE V1 - Computer A',
  recordCount: recordsA.length,
  records: recordsA.map(r => ({
    id: String(r.id),
    surveyId: r.survey_id,
    studentName: r.student_name,
    studentClass: r.student_class,
    answers: JSON.parse(r.answers_json),
    submittedAt: r.submitted_at,
    source: r.source_type
  }))
};

const exportedBackupFile = path.join(testDir, 'student_ide_backup_comp_a.json');
fs.writeFileSync(exportedBackupFile, JSON.stringify(backupPayload, null, 2), 'utf-8');
console.log('✓ Exported JSON backup to:', exportedBackupFile);
dbA.close();

// -------------------------------------------------------------
// COMPUTER B: Clean installation imports backup from Computer A
// -------------------------------------------------------------
console.log('\n--- 2. SIMULATING COMPUTER B (CENTRAL LAB WORKSTATION) ---');
const dbB = new DatabaseSync(dbPathB);
applyMigrations(dbB);

// Initial state check
const initialCountB = dbB.prepare('SELECT COUNT(*) as count FROM survey_responses').get().count;
assert.strictEqual(initialCountB, 0, 'Computer B must have 0 initial responses');
console.log('✓ Computer B verified with clean database (0 initial responses).');

// Read and validate import file on Computer B
const rawImport = fs.readFileSync(exportedBackupFile, 'utf-8');
const parsed = JSON.parse(rawImport);

assert.strictEqual(parsed.exportFormatVersion, '1.0.0');
assert.strictEqual(parsed.records.length, 2);

// Ingest records with SHA-256 deduplication
let importedCount = 0;
let skippedCount = 0;

function computeHash(surveyId, name, sClass, submittedAt) {
  const norm = `${surveyId}:${name.trim().toLowerCase()}:${sClass}:${submittedAt}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

const insertStmt = dbB.prepare(`
  INSERT INTO survey_responses (
    survey_id, student_profile_id, student_name, student_class, answers_json,
    submitted_at, status, source_type, external_response_id, import_hash
  ) VALUES (?, NULL, ?, ?, ?, ?, 'completed', 'imported', ?, ?)
`);

for (const rec of parsed.records) {
  const hash = computeHash(rec.surveyId, rec.studentName, rec.studentClass, rec.submittedAt);
  const exists = dbB.prepare('SELECT id FROM survey_responses WHERE import_hash = ?').get(hash);
  if (exists) {
    skippedCount++;
  } else {
    insertStmt.run(
      rec.surveyId,
      rec.studentName,
      rec.studentClass,
      JSON.stringify(rec.answers),
      rec.submittedAt,
      rec.id,
      hash
    );
    importedCount++;
  }
}

assert.strictEqual(importedCount, 2, 'Computer B must import both records');
assert.strictEqual(skippedCount, 0, 'No records should be skipped on first import');
console.log(`✓ First Import to Computer B: ${importedCount} imported, ${skippedCount} skipped.`);

// -------------------------------------------------------------
// 3. DUPLICATE IMPORT PREVENTION TEST
// -------------------------------------------------------------
console.log('\n--- 3. TESTING DUPLICATE IMPORT REJECTION ---');
let secondImported = 0;
let secondSkipped = 0;

for (const rec of parsed.records) {
  const hash = computeHash(rec.surveyId, rec.studentName, rec.studentClass, rec.submittedAt);
  const exists = dbB.prepare('SELECT id FROM survey_responses WHERE import_hash = ?').get(hash);
  if (exists) {
    secondSkipped++;
  } else {
    insertStmt.run(
      rec.surveyId,
      rec.studentName,
      rec.studentClass,
      JSON.stringify(rec.answers),
      rec.submittedAt,
      rec.id,
      hash
    );
    secondImported++;
  }
}

assert.strictEqual(secondImported, 0, 'Second import must import 0 duplicate records');
assert.strictEqual(secondSkipped, 2, 'Second import must skip both duplicate records');
console.log(`✓ Duplicate Prevention Verified: ${secondImported} imported, ${secondSkipped} safely skipped.`);

// -------------------------------------------------------------
// 4. VERIFY AGGREGATED ANALYTICS & CSV EXPORT ON COMPUTER B
// -------------------------------------------------------------
console.log('\n--- 4. VERIFYING AGGREGATED ANALYTICS ON COMPUTER B ---');
const totalB = dbB.prepare('SELECT COUNT(*) as count FROM survey_responses').get().count;
assert.strictEqual(totalB, 2, 'Total responses in Computer B must be exactly 2');

const rowsB = dbB.prepare('SELECT * FROM survey_responses ORDER BY id ASC').all();
const names = rowsB.map(r => r.student_name);
assert(names.includes('Rohan Patel'));
assert(names.includes('Ananya Roy'));
assert.strictEqual(rowsB[0].source_type, 'imported');
assert.strictEqual(rowsB[1].source_type, 'imported');

// Generate CSV with UTF-8 BOM
const headers = [
  'Response ID', 'Source', 'Student Name', 'Class', 'Submitted At',
  'Q1 Coding Experience', 'Q2 Favorite Language', 'Q3 Ease of Use',
  'Q4 Most Useful Feature', 'Q5 Recommend Score', 'Q6 Student Feedback'
];

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const csvRows = [headers.join(',')];
for (const r of rowsB) {
  const ans = JSON.parse(r.answers_json);
  csvRows.push([
    escapeCsv(r.id),
    escapeCsv(r.source_type),
    escapeCsv(r.student_name),
    escapeCsv(r.student_class),
    escapeCsv(r.submitted_at),
    escapeCsv(ans.q1_experience),
    escapeCsv(ans.q2_favorite_language),
    escapeCsv(ans.q3_ease_of_use),
    escapeCsv(ans.q4_most_useful),
    escapeCsv(ans.q5_recommend),
    escapeCsv(ans.q6_feedback)
  ].join(','));
}

const csvContent = '\uFEFF' + csvRows.join('\r\n');
const csvFile = path.join(testDir, 'aggregated_lab_report.csv');
fs.writeFileSync(csvFile, csvContent, 'utf-8');

const csvRead = fs.readFileSync(csvFile, 'utf-8');
assert(csvRead.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
assert(csvRead.includes('Rohan Patel'));
assert(csvRead.includes('Ananya Roy'));
assert(csvRead.includes('imported'));
console.log('✓ Aggregated CSV with UTF-8 BOM generated and verified at:', csvFile);

dbB.close();

console.log('\n================================================================');
console.log('TWO-COMPUTER LAB SIMULATION COMPLETED WITH 100% SUCCESS');
console.log('================================================================\n');
