# Changelog

All notable changes to the **Student IDE** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-01

### Added
- **Phase 1 & 2: Core Desktop IDE Foundation**
  - Modern Electron 40 + React 19 + TypeScript + Tailwind CSS application structure.
  - Full integration of Microsoft Monaco Editor with code autocompletion and dark theme.
  - Project file explorer with file/directory creation and deletion.
  - Multi-language execution runner (Python, JavaScript, SQL, HTML/CSS, C++, PHP).
  - Sandboxed live HTML/CSS preview iframe with `srcdoc`.
  - Dark UI theme with Catppuccin-inspired brand palette (`#1e1e2e`, `#181825`, `#89b4fa`).

- **Phase 3: Persistent Onboarding & Founder Profile**
  - SQLite persistent onboarding flag in `settings` table.
  - Automatic skip of onboarding on all subsequent launches.
  - Grade-specific language recommendations for Classes 6 to 12.
  - Edit Profile dialog in Settings allowing students to update their name and grade.
  - Developer Hut About & Founder modal dialog with official website links.

- **Phase 4: Offline Survey Module**
  - Dedicated Survey tab in main navigation with completion state indicators.
  - Authoritative SQLite profile integration preventing student spoofing.
  - 6-question structured feedback questionnaire with single-choice, rating, and feedback fields.
  - Zod payload validation in main process with atomic transactional submission.
  - Zero telemetry or network requests: 100% private and offline.

- **Phase 5: Offline Admin Survey Dashboard**
  - Hidden Admin Portal with `Ctrl+Shift+A` shortcut and settings footer link.
  - Cryptographic admin password protection using `crypto.scryptSync` with random salt and constant-time comparison.
  - Comprehensive KPI metric cards and graphical breakdown across all questions and classes.
  - Searchable, filterable response table with detailed student response inspection modal.
  - Export engine: Excel-compatible CSV with UTF-8 BOM, Versioned JSON backup (`exportFormatVersion: "1.0.0"`), and formatted summary text reports.
  - Multi-machine offline import engine with Zod schema validation, SHA-256 duplicate fingerprinting, and atomic transaction rollback.

- **Phase 6: Release Readiness, Runtime Bundling & Windows Installer**
  - Bundled MinGW-w64 GCC 14.1.0 C++ compiler toolchain inside application resources.
  - Full C++17 compilation (`-std=c++17`) with isolated runtime `PATH` resolution.
  - Interactive standard input prompt in Terminal for `cin` and Python `input()`.
  - Forceful process tree termination (`taskkill /T /F`) for the Stop execution button.
  - Self-contained JavaScript execution using Electron's internal Node.js v24 runtime (`ELECTRON_RUN_AS_NODE=1`).
  - Production-ready NSIS Windows x64 installer (`Student IDE-Setup-1.0.0.exe`).
  - Per-user installation (`perMachine: false`) requiring zero administrator privileges.
  - Data persistence across version upgrades in `%APPDATA%\student-ide`.
  - Comprehensive documentation suite (`RELEASE_READINESS_REPORT.md`, `INSTALLATION_GUIDE.md`, `USER_GUIDE.md`, `THIRD_PARTY_LICENSES.md`).

### Fixed
- Fixed Electron blank screen on production build caused by restrictive iframe origin access in `WebPreview.tsx`.
- Resolved Monaco web worker loading errors in packaged environment via Vite native worker bundling.
- Fixed process hang on failed assertion in headless test runner by adding global try/catch error handling.
