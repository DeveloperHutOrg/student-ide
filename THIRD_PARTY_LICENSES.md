# Third-Party Licenses & Software Notices

Student IDE V1 redistributes or incorporates third-party open-source components. This document provides notice of licenses and copyright information as required by the respective authors.

---

## 1. MinGW-w64 & GCC (C/C++ Compiler Toolchain)
- **Component:** MinGW-w64 GCC 14.1.0 (w64devkit distribution)
- **Source:** [https://github.com/skeeto/w64devkit](https://github.com/skeeto/w64devkit) | [https://www.mingw-w64.org/](https://www.mingw-w64.org/)
- **Licenses:**
  - **MinGW-w64 Runtime:** Public Domain and ZPL / BSD-style licenses.
  - **GCC (GNU Compiler Collection):** GNU General Public License version 3 (GPLv3) with the **GCC Runtime Library Exception**.
  - **Runtime Library Exception Notice:** Under the GCC Runtime Library Exception, compiling student source code with GCC and distributing the resulting executable does not cause the resulting executable to be covered by the GNU General Public License.
  - **w64devkit Scripts & Helpers:** Dedicated to the public domain under The Unlicense.

---

## 2. Electron Framework
- **Component:** Electron v40.8.0
- **Copyright:** (c) Electron contributors, GitHub Inc.
- **License:** MIT License
- **Permission Notice:**
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

---

## 3. Node.js & node:sqlite Engine
- **Component:** Node.js runtime and built-in SQLite engine (`node:sqlite`)
- **Copyright:** (c) Node.js contributors, OpenJS Foundation
- **License:** MIT License
- **SQLite Engine:** Dedicated to the Public Domain:
  > *May you do good and not evil.*  
  > *May you find forgiveness for yourself and forgive others.*  
  > *May you share freely, never taking more than you give.*

---

## 4. React & React DOM
- **Component:** React v19.2.4, React DOM v19.2.4
- **Copyright:** (c) Meta Platforms, Inc. and affiliates
- **License:** MIT License

---

## 5. Monaco Editor
- **Component:** Monaco Editor v0.52.2, @monaco-editor/react v4.7.0
- **Copyright:** (c) Microsoft Corporation
- **License:** MIT License

---

## 6. Lucide Icons
- **Component:** Lucide React v1.16.0
- **Copyright:** (c) Lucide Contributors
- **License:** ISC License

---

## 7. Zod Schema Validation
- **Component:** Zod v4.6.7
- **Copyright:** (c) Colin McDonnell
- **License:** MIT License

---

## 8. Tailwind CSS & PostCSS
- **Component:** Tailwind CSS v3.4.17, PostCSS v8.5.6, Autoprefixer v10.4.21
- **Copyright:** (c) Tailwind Labs, Inc.
- **License:** MIT License

---

## 9. Vite Build Tooling
- **Component:** Vite v7.3.1
- **Copyright:** (c) Yuxi (Evan) You and Vite contributors
- **License:** MIT License

---

## 10. External Runtime Redistribution & Detection Notices

### Python
- When Python is executed, Student IDE resolves the local or bundled Python runtime.
- Python is licensed under the Python Software Foundation (PSF) License Agreement.

### PHP (Runtime Limitation Notice)
- Student IDE includes syntax highlighting and project templates for PHP.
- PHP binaries are **not bundled** in the base installer to keep the distribution size compact.
- If PHP is installed on the user workstation (or configured in `runtimes/php`), Student IDE executes it cleanly. If not present, the IDE outputs a friendly notification advising the user how to configure a PHP interpreter.
- The PHP language is licensed under the PHP License v3.01.
