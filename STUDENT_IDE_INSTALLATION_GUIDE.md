# STUDENT IDE V1.0.0 - WINDOWS INSTALLATION GUIDE

**Application:** Student IDE  
**Installer Package:** `Student-IDE-Setup-1.0.0-x64.exe`  
**Target Platform:** Windows 10 & Windows 11 (64-bit / x64)  
**Developer:** DeveloperHut (`https://developerhut.in`)  
**License:** MIT  

---

## 1. System Requirements

| Specification | Minimum Requirement | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (Version 1809+) or Windows 11 | Windows 11 (64-bit) |
| **Architecture** | 64-bit (x64) | 64-bit (x64) |
| **Processor** | Dual-Core 2.0 GHz Intel / AMD | Quad-Core 2.5 GHz or higher |
| **System Memory (RAM)** | 2 GB | 4 GB or higher |
| **Available Storage** | 1.2 GB free disk space | 2.0 GB free disk space |
| **Network Connectivity** | **Zero Internet Required (100% Offline)** | None |
| **Administrative Access** | **Not Required** (Per-user installation by default) | Optional |

---

## 2. Standard Student Installation

1. Copy or download `Student-IDE-Setup-1.0.0-x64.exe` to your computer (e.g. from USB drive or school local network share).
2. Double-click **`Student-IDE-Setup-1.0.0-x64.exe`**.
3. The lightweight NSIS installer will launch without requiring administrator credentials (`asInvoker`):
   - **Destination Folder:** Default is `%LOCALAPPDATA%\Programs\Student IDE` (can be changed to any custom path).
   - **Start Menu Shortcut:** Created by default for easy access.
   - **Desktop Shortcut:** Option to place an icon on the student desktop.
4. Click **Install**.
5. Once installation finishes, click **Finish** to immediately open Student IDE.

> [!NOTE]
> The installer uses NSIS per-user installation (`perMachine: false`). Students do not need administrative rights or IT intervention to install Student IDE on school lab workstations.

---

## 3. Computer Lab & Silent Batch Deployment

School computer lab administrators and IT coordinators can deploy Student IDE silently across an entire computer room using command line scripting:

### 3.1 Silent Installation (Default User Path)
```powershell
.\Student-IDE-Setup-1.0.0-x64.exe /S
```

### 3.2 Silent Installation to Custom Directory
```powershell
.\Student-IDE-Setup-1.0.0-x64.exe /S /D=C:\LabSoftware\StudentIDE
```

---

## 4. Student Data Preservation on Upgrade & Uninstall

Student IDE stores all persistent data outside the application directory:
- **SQLite Database:** `%APPDATA%\student-ide\student_ide.db` (Student profile, onboarding preferences, survey records, and admin credentials).
- **Default Projects:** `%USERPROFILE%\StudentIDE_Projects\` (Student coding files and projects).

**Upgrade & Uninstall Policy:**
- Installing a newer version automatically upgrades the application binaries without touching the student's existing projects or database.
- Uninstallation removes only the IDE binaries and runtimes (`deleteAppDataOnUninstall: false`). Student projects and database records remain safe on disk.

---

## 5. Offline Runtime Verification

Once installed, all programming languages operate completely offline without internet or additional tools:
- **Python 3.11:** Bundled official embeddable Python runtime (`resources\runtimes\python\python.exe`).
- **C++17:** Bundled MinGW-w64 GCC 14.1 toolchain (`resources\runtimes\mingw\bin\g++.exe`).
- **HTML / CSS / JS:** Built-in Chromium engine with Live Sandboxed Web Preview.
- **Node.js:** Built-in Electron Node.js runtime for standalone JavaScript scripts.
- **SQLite:** Built-in synchronous SQLite query engine.
