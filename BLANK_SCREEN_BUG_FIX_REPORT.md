# STUDENT IDE V1: CRITICAL BUG FIX REPORT
**Electron Blank Screen & Same-Origin SecurityError Resolution**  
**Date:** November 1, 2026  
**Status:** Resolved, Verified & Tested  

---

## 1. Executive Summary

When launching **Student IDE V1**, the Electron window opened but displayed an empty, dark blank screen accompanied by the terminal error:
```
[Renderer] Electron Security Warning (Insecure Content-Security-Policy)
[Renderer] Uncaught SecurityError: Failed to execute 'open' on 'Document': Can only call open() on same-origin documents.
at file:///D:/Student%20IDE/dist/assets/index-CFyS4Vk8.js:9
```

This bug has been diagnosed to its exact root cause and fixed:
1. **Removed Unsafe Cross-Origin DOM Manipulation:** Eliminated `document.open()`, `document.write()`, and `document.close()` on sandboxed iframe documents.
2. **Implemented Declarative `srcDoc` Preview:** Switched to the standard `srcDoc` attribute on `<iframe sandbox="allow-scripts allow-modals allow-forms">`, ensuring live HTML, CSS, and JavaScript preview without cross-origin violations or access to Electron/Node APIs.
3. **Introduced Global & Component Error Boundaries:** Created `ErrorBoundary.tsx` wrapping the application root and `WebPreview` so that component errors never crash the UI into a blank screen.
4. **Hardened Content Security Policy (CSP):** Removed `'unsafe-eval'` and unnecessary wildcards; enabled strict local worker execution for Monaco Editor and isolated iframe frames.
5. **Modernized Electron Event Handlers:** Replaced the deprecated positional parameter structure of `webContents.on('console-message')` with the current Electron 40 `event` parameter structure.

---

## 2. Exact Root Cause Analysis

### 2.1 The Cross-Origin Conflict
In `src/renderer/components/ide/WebPreview.tsx`:
```tsx
// PREVIOUS FLAWED IMPLEMENTATION:
useEffect(() => {
  if (iframeRef.current) {
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();       // <-- THREW SecurityError HERE
      doc.write(getCombinedDocument());
      doc.close();
    }
  }
}, [htmlContent, cssContent, refreshKey]);
```

The `<iframe>` element was marked with:
```html
<iframe sandbox="allow-scripts allow-modals allow-forms" ... />
```

Under modern Chromium and Electron security specifications:
- Any `<iframe>` sandboxed **without** `allow-same-origin` is assigned an opaque, unique `null` origin.
- The parent Electron window runs under the local `file:///` origin.
- Because the origin of the sandboxed iframe (`null`) does not match the parent document origin (`file://`), Chromium's same-origin security enforcement strictly prohibits calling `.open()`, `.write()`, or `.close()` on `contentDocument`.
- Invoking `doc.open()` throws a fatal DOMException:
  `SecurityError: Failed to execute 'open' on 'Document': Can only call open() on same-origin documents.`

### 2.2 Why the Screen Was Completely Blank
Because `WebPreview` was mounted whenever an HTML file was loaded or preview was toggled, this exception fired synchronously during React's commit phase in `useEffect`. In React 19, an unhandled exception during a lifecycle effect unmounts the entire component hierarchy. Without an `<ErrorBoundary>`, the `#root` DOM was wiped out, leaving a blank dark background (`#1e1e2e`).

---

## 3. Implementation Details

### 3.1 Declarative, Isolated Preview with `srcDoc`
`src/renderer/components/ide/WebPreview.tsx` was re-engineered:
- Replaced imperative DOM calls with the native `srcDoc` attribute:
  ```tsx
  <iframe
    key={`preview-frame-${refreshKey}`}
    title="Student Web Preview"
    srcDoc={combinedDocument}
    sandbox="allow-scripts allow-modals allow-forms"
    className="w-full h-full border-none bg-white"
  />
  ```
- **Live Preview Preserved:** When `htmlContent` or `cssContent` updates, `combinedDocument` recalculates smoothly via `useMemo`. The browser re-renders the preview natively without DOM scripting errors.
- **Strict Isolation:** Because `allow-same-origin` is **omitted**, student JavaScript inside the preview cannot access `window.parent`, `window.top`, `window.api`, `ElectronAPI`, local storage, or Node.js.
- **Reload Control:** The manual Refresh button increments `refreshKey`, forcing a clean instance for student scripts.

### 3.2 React Crash Resilience (Error Boundaries)
Created `src/renderer/components/common/ErrorBoundary.tsx` and wrapped:
1. Root application in `src/renderer/index.tsx`:
   ```tsx
   <ErrorBoundary fallbackTitle="Student IDE Encountered an Unexpected Error">
     <App />
   </ErrorBoundary>
   ```
2. `<WebPreview>` in `WebPreview.tsx`:
   ```tsx
   export const WebPreview: React.FC<WebPreviewProps> = (props) => (
     <ErrorBoundary fallbackTitle="Web Preview encountered an issue">
       <WebPreviewContent {...props} />
     </ErrorBoundary>
   );
   ```
If any unforeseen rendering issue occurs, a friendly error card with a "Try Again" recovery button appears instead of crashing the application.

### 3.3 Restrictive Content Security Policy (CSP)
In `index.html`:
```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self' data: blob:; connect-src 'self' ws://localhost:5173 http://localhost:5173;"
/>
```
- **Removed `'unsafe-eval'`:** Prevents code string execution while satisfying Electron security requirements.
- **Offline Monaco Workers:** `worker-src 'self' blob:` allows Monaco's web workers (`ts.worker`, `html.worker`, etc.) to run locally.
- **Preview Frames:** `frame-src 'self' data: blob:` permits isolated sandbox rendering.
- **Eliminated Warning:** The `Electron Security Warning (Insecure Content-Security-Policy)` is resolved.

### 3.4 Deprecated Event Handler Modernization
In `src/main/main.ts`:
```typescript
// Updated from deprecated (event, level, message, line, sourceId):
mainWindow.webContents.on('console-message', (event) => {
  console.log(`[Renderer] [${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`);
});
```

---

## 4. Files Modified Summary

| File | Changes Made |
|------|--------------|
| `src/renderer/components/ide/WebPreview.tsx` | Removed `contentDocument.open/write/close`. Added `srcDoc={combinedDocument}` on sandboxed iframe. Wrapped in `ErrorBoundary`. |
| `src/renderer/components/common/ErrorBoundary.tsx` | New component: catches unhandled React errors, displays friendly error UI and reset button. |
| `src/renderer/index.tsx` | Wrapped `<App />` root in `<ErrorBoundary>`. |
| `index.html` | Updated CSP: removed `'unsafe-eval'`, restricted `default-src`, enabled `worker-src` and `frame-src`. |
| `src/main/main.ts` | Upgraded `console-message` event handler to modern Electron 40 `event` parameter structure. |

---

## 5. Verification & Test Results

### 5.1 Automated Full Feature Verification (`tests/run_functional_test.js`)
Executed in real Electron instance (`ELECTRON_ENABLE_LOGGING=1`):

```
--- STARTING COMPREHENSIVE FUNCTIONAL VERIFICATION ---

1. Verifying Profile & Onboarding...
Saved profile in DB: { id: 1, student_name: 'vasu', student_class: 12, ... }
✓ Profile & Onboarding: PASSED

2. Verifying React Interface & Monaco Editor in DOM...
DOM State: {
  hasRoot: true,
  hasNavbar: true,
  hasSidebar: true,
  hasMonaco: true,
  bodyBg: 'rgb(30, 30, 46)',
  title: 'Student IDE'
}
✓ React Interface & Monaco Editor: PASSED

3. Verifying Live HTML, CSS & JavaScript Preview Isolation...
Preview State: {
  found: true,
  hasSrcDoc: true,
  sandbox: 'allow-scripts allow-modals allow-forms',
  srcDocSnippet: '<!DOCTYPE html>\n<html lang="en">\n<head>...'
}
✓ Web Preview Isolation: PASSED

4. Verifying JavaScript Runner Execution...
JS execution result: { executionId: 'exec_1793517052370', success: true }
✓ JavaScript Execution: PASSED

5. Verifying Python Runner Execution...
Python execution result: { executionId: 'exec_1793517052423', success: true }
✓ Python Execution: PASSED

6. Verifying SQL Runner Execution...
SQL execution result: { executionId: 'exec_1793517052450', success: true }
✓ SQL Execution: PASSED

7. Checking for Uncaught Errors...
Uncaught errors count: 0
✓ Zero Uncaught Errors: PASSED

=============================================================
ALL FUNCTIONAL TESTS PASSED (7/7) - STUDENT IDE FULLY HEALTHY
=============================================================
[Runner Process Closed with Exit Code: 0]
```

### 5.2 Build Status
```powershell
npm.cmd run build
# build:electron -> tsc clean (Exit Code: 0)
# build:renderer -> vite build clean (Exit Code: 0)
# Result: 0 errors
```

---

## 6. How to Launch

The Student IDE application is fully ready to use:

1. **Direct Launch:** Double-click `launch.bat` in `D:\Student IDE`.
2. **Terminal:**
   ```powershell
   npm.cmd start
   ```
3. **Dev Mode:**
   ```powershell
   npm.cmd run dev
   ```
