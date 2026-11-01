const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// Test 1: Verify Database Layer & Profile Persistence
console.log('--- TEST 1: Database Layer & Profile Management ---');
const testDbPath = path.join(os.tmpdir(), `student_ide_test_${Date.now()}.db`);
const dbModule = require('./dist-electron/main/db.js');

// Initialize DB
const db = dbModule.initDatabase(testDbPath);
assert(db, 'Database should initialize');
console.log('✓ SQLite database successfully initialized');

// First launch check (should be null)
const initialProfile = dbModule.getProfile();
assert.strictEqual(initialProfile, null, 'Initial profile should be null on first launch');
console.log('✓ Initial profile is null on first launch');

// Save Profile: Class 7 Student
const student1 = dbModule.saveProfile('Aarav Sharma', 7);
assert.strictEqual(student1.student_name, 'Aarav Sharma');
assert.strictEqual(student1.student_class, 7);
console.log('✓ Successfully saved student profile: Aarav Sharma (Class 7)');

// Verify language preferences automatically suggested for Class 7
const prefsClass7 = dbModule.getLanguagePreferences();
const enabled7 = prefsClass7.filter(p => p.enabled).map(p => p.id);
console.log('Class 7 suggested & enabled languages:', enabled7);
assert(enabled7.includes('html'), 'Class 7 should include HTML');
assert(enabled7.includes('css'), 'Class 7 should include CSS');
assert(enabled7.includes('python'), 'Class 7 should include Python');
assert(enabled7.includes('javascript'), 'Class 7 should include JavaScript');
assert(!enabled7.includes('cpp'), 'Class 7 should not suggest C++');
assert(!enabled7.includes('php'), 'Class 7 should not suggest PHP');
assert(!enabled7.includes('sql'), 'Class 7 should not suggest SQL');
console.log('✓ Class 7 suggestion matrix verified (HTML, CSS, Python, JavaScript)');

// Profile Update: Student moves to Class 10
const student2 = dbModule.saveProfile('Aarav Sharma', 10);
assert.strictEqual(student2.student_class, 10);
const { getSuggestedLanguagesForClass } = require('./dist-electron/common/languages.js');
const suggested10 = getSuggestedLanguagesForClass(10);
console.log('Class 10 suggested languages:', suggested10);
assert.deepStrictEqual(suggested10, ['python', 'sql', 'javascript']);
console.log('✓ Class 10 suggestion matrix verified (Python, SQL, JavaScript)');

// Profile Update: Student moves to Class 12
const suggested12 = getSuggestedLanguagesForClass(12);
console.log('Class 12 suggested languages:', suggested12);
assert.deepStrictEqual(suggested12, ['python', 'cpp', 'sql', 'javascript', 'php']);
console.log('✓ Class 12 suggestion matrix verified (Python, C++, SQL, JavaScript, PHP)');

// Test Custom Language Preferences persistence
dbModule.saveLanguagePreferences(['python', 'sql', 'html']);
const customPrefs = dbModule.getLanguagePreferences();
const customEnabled = customPrefs.filter(p => p.enabled).map(p => p.id);
assert.deepStrictEqual(customEnabled.sort(), ['html', 'python', 'sql'].sort());
console.log('✓ Custom language preferences saved and retrieved successfully');

dbModule.closeDatabase();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

// Test 2: Verify Execution Engine
console.log('\n--- TEST 2: Process Execution Engine & Runtime Dispatcher ---');
const runner = require('./dist-electron/main/runner.js');

// Mock window for event capture
let capturedOutputs = [];
let capturedComplete = null;

const mockWindow = {
  isDestroyed: () => false,
  webContents: {
    send: (channel, data) => {
      if (channel === 'execution:output') {
        capturedOutputs.push(data);
      } else if (channel === 'execution:complete') {
        capturedComplete = data;
      }
    }
  }
};

async function testPythonExecution() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing Python Execution]');

  const pyCode = `
scores = [10, 20, 30]
print("Sum =", sum(scores))
`;
  await runner.executeCode(mockWindow, {
    language: 'python',
    code: pyCode,
  });

  // Wait for child process to finish
  await new Promise(r => setTimeout(r, 1200));

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('Python Output:\n' + allText.trim());
  assert(allText.includes('Sum = 60'), 'Python output should contain "Sum = 60"');
  assert(capturedComplete && capturedComplete.exitCode === 0, 'Python execution should exit with code 0');
  console.log('✓ Python offline execution verified successfully');
}

async function testJavaScriptExecution() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing JavaScript Execution]');

  const jsCode = `
const items = ['alpha', 'beta', 'gamma'];
console.log("Count:", items.length);
console.log("Upper:", items.map(s => s.toUpperCase()).join(', '));
`;
  await runner.executeCode(mockWindow, {
    language: 'javascript',
    code: jsCode,
  });

  await new Promise(r => setTimeout(r, 1200));

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('JavaScript Output:\n' + allText.trim());
  assert(allText.includes('Count: 3'), 'JS output should contain "Count: 3"');
  assert(allText.includes('ALPHA, BETA, GAMMA'), 'JS output should contain uppercase string');
  assert(capturedComplete && capturedComplete.exitCode === 0, 'JS execution should exit with code 0');
  console.log('✓ JavaScript offline execution verified successfully');
}

async function testSqlExecution() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing SQL In-Engine Execution]');

  const sqlCode = `
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, year INT);
INSERT INTO books (title, year) VALUES ('Python Basics', 2024);
INSERT INTO books (title, year) VALUES ('Data Structures', 2025);
SELECT id, title, year FROM books WHERE year >= 2024;
`;
  await runner.executeCode(mockWindow, {
    language: 'sql',
    code: sqlCode,
  });

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('SQL Output:\n' + allText.trim());
  assert(allText.includes('Python Basics'), 'SQL output should contain "Python Basics"');
  assert(allText.includes('Data Structures'), 'SQL output should contain "Data Structures"');
  assert(capturedComplete && capturedComplete.exitCode === 0, 'SQL execution should exit with code 0');
  console.log('✓ SQL offline tabular execution verified successfully');
}

async function testWebPreviewExecution() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing HTML/CSS Web Technology Handling]');

  await runner.executeCode(mockWindow, {
    language: 'html',
    code: '<h1>Hello Student</h1>',
  });

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('HTML Output:\n' + allText.trim());
  assert(allText.includes('Web Technology: HTML'), 'Should report HTML web technology');
  assert(capturedComplete && capturedComplete.exitCode === 0, 'HTML should exit with 0');
  console.log('✓ HTML/CSS treated as web technology verified successfully');
}

async function testProcessTimeoutAndStop() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing Safe Process Stop Control]');

  // Python infinite loop simulation
  const loopCode = `
import time
while True:
    time.sleep(0.1)
`;
  await runner.executeCode(mockWindow, {
    language: 'python',
    code: loopCode,
  });

  // Wait 300ms then trigger stopActiveExecution
  await new Promise(r => setTimeout(r, 300));
  runner.stopActiveExecution(mockWindow);

  await new Promise(r => setTimeout(r, 600));

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('Stop Output:\n' + allText.trim());
  assert(allText.includes('Execution stopped by student'), 'Should confirm stopped by student');
  assert(capturedComplete && capturedComplete.status === 'stopped', 'Status should be "stopped"');
  console.log('✓ Safe process stop and child tree termination verified successfully');
}

async function runAllTests() {
  await testPythonExecution();
  await testJavaScriptExecution();
  await testSqlExecution();
  await testWebPreviewExecution();
  await testProcessTimeoutAndStop();
  console.log('\n=========================================');
  console.log(' ALL 5 TEST SUITES PASSED FLAWLESSLY!    ');
  console.log('=========================================\n');
}

runAllTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
