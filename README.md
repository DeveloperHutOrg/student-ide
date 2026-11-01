# Student IDE 🎓💻

<p align="center">
  <img src="src/assets/branding/logo.svg" alt="Student IDE Logo" width="480">
</p>

<p align="center">
  <strong>A lightweight, fully offline, beginner-friendly desktop IDE designed specifically for school students (Classes 6–12).</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#supported-languages">Languages</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#building-the-installer">Building Installer</a> •
  <a href="#license">License</a>
</p>

---

## 🌟 Overview

**Student IDE** is built to bridge the gap in computer science education for school students in Classes 6 through 12. Most professional developer environments (VS Code, JetBrains, etc.) can be overwhelming for young learners and require heavy background services, account logins, and constant internet connectivity.

Student IDE provides a clean, distraction-free desktop environment that works **100% offline**:
- **Zero Registration:** No email, password, or cloud accounts needed.
- **Smart Class Suggestions:** Tailors language suggestions to the student's grade level.
- **Persistent Local Profile:** Stores preferences locally using SQLite.
- **Instant Code Execution:** Built-in runners for Python, JavaScript, and SQL, plus isolated live Web (HTML/CSS/JS) preview.

---

## ✨ Features

- 🚀 **First-Launch Simplicity:** Ask only for student name and class. Launches directly into the workspace on subsequent opens.
- 🎨 **Modern Dark Theme:** Carefully designed high-contrast dark theme inspired by Catppuccin Mocha for optimal visual comfort.
- 📝 **Monaco Editor Integration:** Industry-standard code editor with syntax highlighting, line numbers, and auto-indentation.
- 🌐 **Sandboxed Live Web Preview:** Safe iframe-based real-time preview for HTML, CSS, and client-side JavaScript.
- ⚡ **Built-in Code Runners:**
  - **Python:** Offline execution using local Python runtime with real-time stdout and stderr output.
  - **JavaScript:** Node.js child-process runner with structured execution status.
  - **SQL:** In-memory SQLite runner returning clean tabular output for learning database queries.
- 📁 **File Explorer & Workspace:** Create, open, edit, rename, and organize project files and directories.
- 🛠️ **Settings & Profile Management:** Easily update student profile, toggle languages, and customize editor preferences without resetting progress.
- 📦 **Standalone Windows Installer:** Built with Electron Builder and NSIS for 1-click or customized installation on school computers.

---

## 💻 Supported Technologies

| Technology | Classes 6–8 | Classes 9–10 | Classes 11–12 | Execution Environment |
| :--- | :---: | :---: | :---: | :--- |
| **HTML5 & CSS3** | Suggested | Optional | Optional | Sandboxed Iframe Preview |
| **JavaScript** | Suggested | Suggested | Suggested | Node.js Process / Browser |
| **Python** | Suggested | Suggested | Suggested | Python CLI Runner |
| **SQL** | — | Suggested | Suggested | SQLite Database Engine |
| **C++** | — | — | Suggested | Native C++ Compiler |
| **PHP** | — | — | Suggested | PHP CLI Engine |

---

## 🏗️ Architecture

```
Student IDE
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts           # Window lifecycle, native menu, IPC handlers
│   │   ├── database.ts       # SQLite storage (profile, preferences, settings)
│   │   └── runner.ts         # Code execution manager (Python, JS, SQL)
│   ├── preload/              # Preload script
│   │   └── preload.ts        # Secure contextBridge API exposure
│   └── renderer/             # React 19 + TypeScript + Tailwind CSS UI
│       ├── components/
│       │   ├── common/       # BrandLogo, Modal, Button primitives
│       │   ├── ide/          # Navbar, Sidebar, Editor, Terminal, WebPreview
│       │   ├── onboarding/   # ProfileSetup, LanguageSelection
│       │   ├── settings/     # SettingsModal, ProfileEditModal
│       │   └── about/        # AboutModal with Founder Information
│       └── App.tsx           # State coordinator & view controller
├── build/                    # Windows .ico and installer resources
├── scripts/                  # Asset generator scripts (generate_icons.js)
└── tests/                    # Automated audit and functional verification tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: (Optional, for Python code execution) Python 3.8+

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DeveloperHutOrg/student-ide.git
   cd student-ide
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

Run the automated test suite to verify database migrations, profile persistence, and code execution runners:

```bash
npm test
```

---

## 📦 Building the Installer

To package Student IDE as a standalone Windows executable (`.exe`) and NSIS installer:

```bash
# Package into win-unpacked directory:
npm run package

# Build complete NSIS Windows setup installer:
npm run dist:win
```

The output executables and installers will be generated in `dist-package/`.

---

## 👤 Author & Organization

- **Organization:** [DeveloperHut](https://github.com/DeveloperHutOrg)
- **Author:** Vasudevan M
- **License:** MIT
