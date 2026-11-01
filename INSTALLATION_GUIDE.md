# Student IDE V1 - Windows Installation Guide

**Version:** 1.0.0  
**Target Platform:** Windows 10 & Windows 11 (64-bit / x64)  
**Package:** `Student IDE-Setup-1.0.0.exe`  
**License:** MIT

---

## 1. System Requirements

| Specification | Minimum Requirement | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (Build 1809+) or Windows 11 | Windows 11 (64-bit) |
| **Architecture** | 64-bit (x64) | 64-bit (x64) |
| **Processor** | Dual-core 1.8 GHz Intel / AMD | Quad-core 2.4 GHz or higher |
| **Memory (RAM)** | 2 GB | 4 GB or higher |
| **Disk Space** | 600 MB free space | 1 GB free space |
| **Internet Access** | **None (100% Offline)** | None required |
| **Administrator Privileges** | **Not Required** (Installs per-user) | Optional |

---

## 2. Standard Installation

1. Download or copy `Student IDE-Setup-1.0.0.exe` to your computer (e.g., via USB flash drive or local network share).
2. Double-click **`Student IDE-Setup-1.0.0.exe`**.
3. The NSIS installer will guide you through the setup:
   - Select installation directory (defaults to `%LOCALAPPDATA%\Programs\Student IDE`).
   - Check the box to create a **Desktop Shortcut**.
   - Check the box to create a **Start Menu Shortcut**.
4. Click **Install**.
5. Once installation finishes, check **Run Student IDE** and click **Finish**.

> [!NOTE]
> Student IDE is configured with `perMachine: false` and `requestedExecutionLevel: asInvoker`. It will **not** trigger unexpected User Account Control (UAC) administrator permission prompts, allowing students to install on school lab computers where administrator access is restricted.

---

## 3. Computer Lab & Silent Deployment

Lab administrators can automate deployment across multiple school computers using NSIS silent command-line flags:

### Silent Install (Per-User)
```cmd
"Student IDE-Setup-1.0.0.exe" /S
```

### Silent Install with Custom Directory
```cmd
"Student IDE-Setup-1.0.0.exe" /S /D=C:\Software\StudentIDE
```

---

## 4. Student Data & Upgrade Persistence

All student work, SQLite databases, and profiles are stored outside the installation directory:
- **Database & Preferences:** `%APPDATA%\student-ide\student_ide.db`
- **Default Student Code Projects:** `%USERPROFILE%\StudentIDE_Projects`

When installing a newer version of Student IDE:
- Run the new installer directly.
- The installer automatically upgrades binary files while **preserving** `%APPDATA%\student-ide\student_ide.db` and student project files.
- On launch, automatic SQLite database migrations ensure schema updates apply cleanly without any student data loss.

---

## 5. Uninstallation

To remove Student IDE from your system:
1. Open Windows **Settings** (`Win + I`).
2. Navigate to **Apps** > **Installed Apps** (or **Apps & features**).
3. Search for **Student IDE**.
4. Click the three dots menu and select **Uninstall**.
5. The uninstaller removes application binaries, shortcuts, and registry entries cleanly.
6. Student projects in `%USERPROFILE%\StudentIDE_Projects` are retained safely to prevent accidental homework loss.
