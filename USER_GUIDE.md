# Student IDE V1 - User Guide

Welcome to **Student IDE V1**, a lightweight, fast, and completely offline coding environment crafted specifically for school students from **Classes 6 to 12**.

---

## 1. First-Time Setup & Onboarding

When you launch Student IDE for the first time:
1. **Student Profile:**
   - Enter your **Name**.
   - Select your **Class (6 to 12)**.
   - Click **Save & Continue**.
2. **Language Preferences:**
   - The IDE suggests programming languages tailored to your school grade level (e.g., Python, JavaScript, SQL, C++, HTML/CSS).
   - Check or uncheck languages according to your school syllabus.
   - Click **Start Coding**.
3. **Subsequent Launches:**
   - Onboarding is skipped automatically. You are taken straight into your workspace.
   - You can edit your name or grade level anytime in **Settings** (`⚙` icon in top bar).

---

## 2. Navigating the Workspace

- **Top Navbar:**
  - **Brand & Logo:** Displays Student IDE branding and current student profile.
  - **File Controls:** New File, Open Project Folder, Save (`Ctrl+S`).
  - **Run Button (`F5`):** Compiles and runs the currently open code file.
  - **Stop Button:** Immediately terminates a running program.
  - **Web Preview Toggle:** Opens side-by-side live HTML/CSS preview.
  - **Survey Tab:** Access school feedback surveys.
  - **Settings (`⚙`):** Adjust editor font size, tab size, edit profile, or view About / Founder page.
- **Sidebar (File Explorer):**
  - Browse project files, create new files (`.py`, `.cpp`, `.js`, `.sql`, `.html`), or create folders.
- **Center (Monaco Code Editor):**
  - Full syntax highlighting, auto-indentation, line numbers, and keyboard shortcuts powered by VS Code's editor engine.
- **Bottom (Interactive Terminal):**
  - Displays compiler output, standard output, standard error, exit codes, and duration in milliseconds.
  - Features an interactive **Input Bar** (`>`) for providing input to `std::cin` or Python `input()`.

---

## 3. Supported Languages & How to Run

### C++ (C++17) — Bundled
- **Compiler:** MinGW-w64 GCC 14.1.0 (fully bundled with the installer).
- **Execution:** Click **Run** or press `F5`. The IDE compiles your code using `-std=c++17` and executes it inside the sandbox.
- **Interactive Input:** When your code requests `std::cin >> x;`, type your value in the terminal input bar at the bottom and click **Send** or press `Enter`.
- **Termination:** If your program runs into an infinite loop, click the red **Stop** button in the header to terminate it immediately.

### Python — Automatic Detection
- **Execution:** Resolves your local Python 3.x runtime automatically.
- **Interactive Input:** Supports Python `input()` via the terminal prompt.

### JavaScript (Node.js) — Bundled
- **Execution:** Runs standalone using Electron's built-in Node.js v24 runtime (`ELECTRON_RUN_AS_NODE=1`). No external Node.js installation is required.

### SQL (SQLite) — Bundled
- **Execution:** Runs queries directly against an in-memory SQLite database.
- **Output:** Formats query results into clean ASCII tables with row counts and column headers.

### HTML, CSS & JavaScript Live Preview — Bundled
- **Execution:** Click **Preview** in the top navbar.
- **Features:** Instant live rendering inside a secure, isolated sandbox iframe. Changes update live as you write code.

---

## 4. Student Survey Module

- Click the **Survey** tab in the top navigation.
- If incomplete, complete the 6 short questions regarding your coding experience, favorite tools, and suggestions.
- Student name and class are prefilled automatically from your profile.
- Click **Submit Feedback**. Once submitted, a green tick indicator confirms successful submission.
- Submissions are stored locally in the offline database. Zero internet connectivity is used.

---

## 5. Offline Admin Survey Dashboard

For teachers, instructors, and lab administrators:
1. **Accessing the Admin Portal:**
   - Press **`Ctrl + Shift + A`** (or click **Admin Portal** at the bottom of the Settings dialog).
2. **First-Time Setup:**
   - Create a secure admin password (minimum 6 characters).
3. **Dashboard Capabilities:**
   - **Metrics:** View total student surveys, class-wise participation, and local completion status.
   - **Analytics:** Inspect graphical distributions for coding experience, language popularity, usability scores, and recommendations.
   - **Search & Filters:** Search responses by student name, filter by class (6–12), or view individual answers and feedback.
   - **Export Data:**
     - **Export CSV:** Creates an Excel-friendly CSV with UTF-8 BOM encoding.
     - **Export JSON Backup:** Creates a versioned `.json` backup file for transferring data via USB flash drive.
     - **Export Summary:** Produces a formatted text report.
   - **Import Lab Responses:**
     - Click **Import JSON Backup** to ingest survey files collected from other classroom computers.
     - Automatically verifies schema integrity and skips duplicates using SHA-256 content hashing.
