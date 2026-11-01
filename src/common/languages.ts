import { LanguagePreference, SupportedLanguageId } from './types';

export const ALL_SUPPORTED_LANGUAGES: Omit<LanguagePreference, 'enabled' | 'isSuggested'>[] = [
  {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    category: 'web',
    monacoLanguage: 'html',
    description: 'Structure of web pages with tags and elements.',
  },
  {
    id: 'css',
    name: 'CSS',
    extension: '.css',
    category: 'web',
    monacoLanguage: 'css',
    description: 'Styling, layout, animations, and visual presentation.',
  },
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    category: 'programming',
    monacoLanguage: 'python',
    description: 'Easy-to-read programming for logic, math, and algorithms.',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    category: 'programming',
    monacoLanguage: 'javascript',
    description: 'Interactive scripts for web pages and general logic.',
  },
  {
    id: 'sql',
    name: 'SQL',
    extension: '.sql',
    category: 'database',
    monacoLanguage: 'sql',
    description: 'Database queries to store, retrieve, and filter data.',
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    category: 'programming',
    monacoLanguage: 'cpp',
    description: 'High-performance programming for algorithms and software.',
  },
  {
    id: 'php',
    name: 'PHP',
    extension: '.php',
    category: 'programming',
    monacoLanguage: 'php',
    description: 'Server scripting and web backend programming.',
  },
];

/**
 * Returns the suggested language IDs for a given student class (6 to 12).
 * Requirements:
 * - Classes 6–8: HTML, CSS, Python, JavaScript.
 * - Classes 9–10: Python, SQL, JavaScript.
 * - Classes 11–12: Python, C++, SQL, JavaScript, PHP.
 */
export function getSuggestedLanguagesForClass(studentClass: number): SupportedLanguageId[] {
  if (studentClass >= 6 && studentClass <= 8) {
    return ['html', 'css', 'python', 'javascript'];
  }
  if (studentClass >= 9 && studentClass <= 10) {
    return ['python', 'sql', 'javascript'];
  }
  if (studentClass >= 11 && studentClass <= 12) {
    return ['python', 'cpp', 'sql', 'javascript', 'php'];
  }
  // Default fallback
  return ['html', 'css', 'python', 'javascript'];
}

export function buildInitialLanguagePreferences(studentClass: number): LanguagePreference[] {
  const suggested = new Set(getSuggestedLanguagesForClass(studentClass));
  return ALL_SUPPORTED_LANGUAGES.map(lang => ({
    ...lang,
    isSuggested: suggested.has(lang.id),
    enabled: suggested.has(lang.id), // Enabled by default if suggested
  }));
}

export const STARTER_TEMPLATES: Record<SupportedLanguageId, string> = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student IDE Web Page</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 40px;
      background: #f8fafc;
      color: #1e293b;
    }
    .card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      max-width: 500px;
    }
    h1 { color: #2563eb; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello from Student IDE!</h1>
    <p>Edit this HTML and watch your preview update in real time.</p>
    <button onclick="alert('Student IDE is awesome!')">Click Me!</button>
  </div>
</body>
</html>
`,
  css: `/* Student IDE Stylesheet */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #0f172a;
  color: #e2e8f0;
}

.highlight {
  color: #38bdf8;
  font-weight: bold;
}
`,
  python: `# Student IDE - Python 3 Program
print("Hello from Student IDE!")

def calculate_stats(numbers):
    total = sum(numbers)
    average = total / len(numbers)
    return total, average

scores = [88, 92, 79, 95, 84]
total, avg = calculate_stats(scores)

print(f"Scores: {scores}")
print(f"Total Score: {total}")
print(f"Class Average: {avg:.2f}")
`,
  javascript: `// Student IDE - JavaScript Execution
console.log("Hello from Student IDE!");

function greetStudent(name, grade) {
  return \`Welcome \${name}! Ready for Class \${grade} coding?\`;
}

console.log(greetStudent("Student", 10));

const sampleArray = [5, 10, 15, 20, 25];
const doubled = sampleArray.map(n => n * 2);
console.log("Original numbers:", sampleArray);
console.log("Doubled numbers: ", doubled);
`,
  sql: `-- Student IDE - Offline SQLite
-- 1. Create a students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_num INTEGER NOT NULL,
    favorite_subject TEXT
);

-- 2. Insert sample student records
INSERT INTO students (name, class_num, favorite_subject) VALUES
    ('Aarav Sharma', 9, 'Mathematics'),
    ('Diya Patel', 10, 'Computer Science'),
    ('Rohan Verma', 9, 'Physics'),
    ('Ananya Iyer', 10, 'Coding');

-- 3. Query all records
SELECT * FROM students;

-- 4. Query students in Class 10
SELECT name, favorite_subject FROM students WHERE class_num = 10;
`,
  cpp: `// Student IDE - C++ Program
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from Student IDE C++ Program!" << std::endl;

    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int num : numbers) {
        sum += num;
    }

    std::cout << "Sum of vector elements: " << sum << std::endl;
    return 0;
}
`,
  php: `<?php
// Student IDE - PHP CLI Program
echo "Hello from Student IDE PHP CLI!\\n";

$student = [
    "name" => "School Student",
    "class" => 11,
    "language" => "PHP"
];

echo "Student Name: " . $student["name"] . "\\n";
echo "Class: " . $student["class"] . "\\n";
echo "Active Track: " . $student["language"] . "\\n";

for ($i = 1; $i <= 5; $i++) {
    echo "Count: $i\\n";
}
?>
`,
};
