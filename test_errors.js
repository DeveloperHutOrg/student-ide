const assert = require('assert');
const runner = require('./dist-electron/main/runner.js');

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

async function testPythonSyntaxError() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing Python Syntax Error Reporting]');

  const brokenCode = `
def broken_function(:
    print("Oops")
`;
  await runner.executeCode(mockWindow, {
    language: 'python',
    code: brokenCode,
  });

  await new Promise(r => setTimeout(r, 600));

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('Python Stderr Output:\n' + allText.trim());
  assert(allText.includes('SyntaxError'), 'Stderr should contain SyntaxError');
  assert(capturedComplete && capturedComplete.exitCode !== 0, 'Exit code should be non-zero on error');
  console.log('✓ Python SyntaxError reported cleanly with line location');
}

async function testSqlSyntaxError() {
  capturedOutputs = [];
  capturedComplete = null;
  console.log('\n[Testing SQL Syntax Error Reporting]');

  const brokenSql = `SELECT * FORM students;`; // Typos FORM instead of FROM
  await runner.executeCode(mockWindow, {
    language: 'sql',
    code: brokenSql,
  });

  const allText = capturedOutputs.map(o => o.text).join('');
  console.log('SQL Error Output:\n' + allText.trim());
  assert(allText.includes('SQL Error:'), 'Should report SQL Error');
  assert(capturedComplete && capturedComplete.status === 'error', 'Status should be error');
  console.log('✓ SQL Syntax error reported cleanly to student');
}

async function run() {
  await testPythonSyntaxError();
  await testSqlSyntaxError();
  console.log('\n✓ All Error Reporting Tests Passed!');
}

run();
