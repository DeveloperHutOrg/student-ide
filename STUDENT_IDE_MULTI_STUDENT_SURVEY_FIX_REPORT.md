# STUDENT IDE: MULTI-STUDENT SURVEY SUBMISSION ARCHITECTURE & FIX REPORT

**Project:** Student IDE  
**Version:** 1.0.0  
**Target Environment:** School Computer Labs (Shared Workstations)  
**Priority:** CRITICAL  
**Date:** November 2026  
**Author:** DeveloperHut Engineering Team  

---

## 1. Executive Summary

In educational environments such as school and college computer laboratories, multiple students share a single physical computer across different class periods and shifts. Previously, Student IDE permitted only one survey submission per machine. If Student A submitted their survey, subsequent students logging into the same computer either encountered a pre-completed survey screen or had their submissions fail / overwrite Student A's identity.

This report documents the end-to-end investigation, root cause discovery, architectural overhaul, non-destructive database migration, and full validation of the **Multi-Student Survey Architecture** in Student IDE. 

### Key Accomplishments:
1. **Independent Student Profiles:** Replaced the single-row profile table constraint with an auto-incrementing, multi-student identity store.
2. **Compound Constraint Enforcement:** Enforced `UNIQUE(student_profile_id, survey_id, survey_version)`, allowing every registered student on a machine to submit their own response once per survey version.
3. **Session-Bound Survey Operations:** Coupled survey status checking and response submission directly to the active authenticated student session ID rather than a global computer state.
4. **Dynamic UI Lifecycle:** Eliminated one-time startup caching of `surveyCompleted` in the React frontend; survey state now evaluates dynamically upon student login, student switching, and logout.
5. **Zero Data Loss Migration:** Implemented **Migration 4 (`004_multi_student_survey`)**, safely rebuilding existing SQLite tables, preserving all historical responses, and automatically reconstructing orphaned student profiles.
6. **Admin Dashboard Enhancement:** Added a dedicated **"Participating Students"** KPI card utilizing resilient `COUNT(DISTINCT ...)` logic to prevent count inflation across local profiles and imported lab datasets.

---

## 2. Root Cause Analysis

A thorough audit of the SQLite schema, IPC handlers, session lifecycle, and frontend state revealed three compounding root causes:

### Root Cause 1: Single-Row Table Constraint on `profile` Table
In `src/main/migrations.ts` (`001_initial_schema`), the `profile` table was defined as:
```sql
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
- The constraint `CHECK (id = 1)` artificially restricted the local database to exactly one student profile at any given time.
- When Student B logged in, `saveProfile` performed an `INSERT ... ON CONFLICT(id) DO UPDATE`, overwriting row `id = 1` with Student B's name and class.
- As a consequence, Student A's profile row was destroyed, and both students shared the identical `student_profile_id = 1`.

### Root Cause 2: Overly Restrictive Unique Index on `survey_responses`
In `001_initial_schema`:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_local_student 
ON survey_responses(survey_id, student_profile_id) 
WHERE source_type = 'local';
```
- Because every student who logged in was assigned `student_profile_id = 1`, the unique constraint `(survey_id, student_profile_id)` blocked any second student from submitting.
- SQLite rejected subsequent submissions with `SQLITE_CONSTRAINT: UNIQUE constraint failed: survey_responses.survey_id, survey_responses.student_profile_id`.

### Root Cause 3: Premature Frontend State Caching
In `src/renderer/App.tsx`:
```typescript
// Legacy behavior: Checked once on mount
useEffect(() => {
  window.electronAPI.getSurveyStatus().then((status) => {
    setSurveyCompleted(status.completed);
  });
}, []);
```
- `surveyCompleted` was fetched only once during the initial application boot.
- When Student A logged out and Student B logged in, `surveyCompleted` remained `true` in memory.
- The UI never re-queried the backend for Student B, wrongly presenting the "Survey Already Completed" view even before any database submission was attempted.

---

## 3. Architecture & Implementation

### 3.1. Database Schema Overhaul & Migration 4
SQLite does not permit altering check constraints or removing primary key restrictions on existing tables via `ALTER TABLE`. Migration 4 (`004_multi_student_survey`) was designed to execute a zero-loss table migration:

1. **Foreign Key Integrity Suspension:** `PRAGMA foreign_keys = OFF` is asserted before structural operations.
2. **Multi-Student Profile Table Creation:**
   ```sql
   CREATE TABLE profile_v4 (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     class TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   ```
3. **Data Preservation:** Existing profile rows are copied verbatim into `profile_v4`.
4. **Reconciliation of Overwritten Student Identities:**
   Migration 4 inspects `survey_responses` for any `student_name` and `student_class` pairs that no longer exist in `profile` (due to prior single-row overwrites). It creates new profile rows for each unique student and repoints `survey_responses.student_profile_id` to their respective reconstructed ID.
5. **Table Swap:** Drops legacy `profile` and renames `profile_v4` to `profile`.
6. **Survey Versioning & Updated Unique Index:**
   Adds column `survey_version TEXT NOT NULL DEFAULT '1.0.0'` to `survey_responses` and creates the production index:
   ```sql
   CREATE UNIQUE INDEX uq_survey_local_student_version 
   ON survey_responses(student_profile_id, survey_id, survey_version) 
   WHERE source_type = 'local';
   ```
7. **Foreign Key Verification:** Runs `PRAGMA foreign_key_check` and reinstates `PRAGMA foreign_keys = ON`.

### 3.2. Student Identity & Multi-Profile Database Methods (`src/main/db.ts`)
- **`saveProfile(data)`:** Now checks if a profile with the same name (case-insensitive via `COLLATE NOCASE`) and class already exists:
  - If existing: Updates `updated_at` and records the ID as `last_active_student_id`.
  - If new: Inserts a new record, allocating a distinct auto-incremented ID.
- **`getProfile(studentId?)`:** Retrieves the active profile for a specific student ID or defaults to the last active student.
- **`getAllProfiles()`:** Returns all registered student profiles on the machine, enabling quick student switching.

### 3.3. Active Session Association (`src/main/sessionService.ts`)
- Added `activeStudentId: number | null` to the in-memory session manager.
- Exported `getActiveStudentId()` and `setActiveStudentId(id)`.
- When a student authenticates, their database profile ID is locked to the session.
- On logout or application shutdown, the session and `activeStudentId` are cleared.

### 3.4. Session-Bound Survey Service (`src/main/surveyService.ts`)
- **`getSurveyStatus(surveyId, studentId?)`:** Evaluates completion status specifically for the requesting student's profile ID. If no student is authenticated, `completed: false` is returned safely without throwing errors.
- **`submitSurveyResponse(payload, studentId?)`:** Attaches the active `student_profile_id` and `survey_version` (1.0.0). Rejects duplicate submissions for the same student while welcoming distinct students on the same machine.
- **`getSurveyResponse(surveyId, studentId?)`:** Retrieves the specific student's submitted response.

### 3.5. Dynamic Frontend Lifecycle (`src/renderer/App.tsx`)
- In `handleLogin(role, profile)`:
  - Saves student profile and immediately invokes `window.electronAPI.getSurveyStatus()`.
  - Sets `surveyCompleted` dynamically based on the authenticated student's history.
- In `handleSwitchStudent()`:
  - Updates profile and re-checks `getSurveyStatus()` for the selected student.
- In `handleConfirmLogout()`:
  - Resets `surveyCompleted` to `false` and clears session state.

### 3.6. Student Quick-Picker on Login Screen (`src/renderer/components/auth/LoginView.tsx`)
- To streamline computer lab workflows where 40+ students rotate through workstations daily, the Login view loads existing local profiles via `window.electronAPI.getAllProfiles()`.
- Students can either pick their existing name from a quick-select chip list or enter their details to register.

### 3.7. Admin Dashboard Analytics (`src/main/adminSurveyService.ts`)
- Added **`uniqueStudents`** metric:
  ```sql
  SELECT COUNT(DISTINCT 
    CASE 
      WHEN student_profile_id IS NOT NULL AND source_type = 'local' 
        THEN 'loc_' || student_profile_id
      ELSE 
        'ext_' || LOWER(TRIM(student_name)) || '_' || student_class 
    END
  ) as uniqueStudents 
  FROM survey_responses;
  ```
- Distinguishes between total submissions and distinct participating students.
- Preserves full compatibility with JSON/CSV export, lab computer aggregation, and import workflows.

---

## 4. Source Files Modified

| File | Primary Changes |
| :--- | :--- |
| `src/main/migrations.ts` | Implemented Migration 4 (`004_multi_student_survey`), rebuilt `profile` table, repaired orphaned responses, and added `uq_survey_local_student_version`. |
| `src/main/db.ts` | Multi-profile queries, `getAllProfiles()`, `saveProfile` non-destructive upsert by name+class, `last_active_student_id` tracking. |
| `src/main/sessionService.ts` | Added `activeStudentId` state tracking, `getActiveStudentId()` helper. |
| `src/main/surveyService.ts` | Parameterized survey checks and submissions with explicit `studentId` and `survey_version`. |
| `src/main/adminSurveyService.ts` | Implemented `uniqueStudents` count, robust distinct identification for local & imported records. |
| `src/main/ipcHandlers.ts` | Routed `survey:getStatus`, `survey:submit`, and `survey:getResponse` to active student ID; added `profile:getAll`. |
| `src/common/types.ts` | Added `uniqueStudents` to `AdminSurveyStats`, updated IPC function signatures. |
| `src/preload/preload.ts` | Exposed `getAllProfiles()` and updated typed bridge definitions. |
| `src/renderer/App.tsx` | Added dynamic survey status verification upon login, student switch, and logout cleanup. |
| `src/renderer/components/admin/AdminDashboard.tsx` | Added "Participating Students" KPI card with user group icon. |
| `src/renderer/components/auth/LoginView.tsx` | Integrated student quick-switch picker for lab environments. |
| `tests/test_multi_student_survey.js` | Comprehensive end-to-end multi-student test suite. |
| `package.json` | Registered `test_multi_student_survey.js` in test script runner. |

---

## 5. Verification & Test Results

### 5.1. Multi-Student Lab Simulation Test Suite (`test_multi_student_survey.js`)
Executed automated verification covering all critical workflows:

```
=== Multi-Student Survey Submission Test Suite ===
Test 1: Migration 4 applied cleanly and profile table allows multiple students: PASSED
Test 2: Student A submits survey successfully: PASSED
Test 3: Student A cannot submit duplicate survey: PASSED
Test 4: Student B logs in and sees uncompleted survey: PASSED
Test 5: Student B submits survey successfully: PASSED
Test 6: Student A logs back in and sees their completed survey: PASSED
Test 7: Admin stats correctly report 2 responses and 2 unique students: PASSED
Test 8: Database restart preserves all profiles and survey responses: PASSED
```
**Result: 8 / 8 Passed (100%)**

### 5.2. Live AppData Database Migration Verification
Tested on the user's live database (`C:\Users\vasud\AppData\Roaming\student-ide\student_ide.db`):
- Migration 4 executed smoothly.
- Detected historical profile `Vasudevan M` (Class 10-A, ID 1).
- Detected historical survey submission from student `vasu` (Class 10-A).
- Reconstructed `vasu` as distinct profile (ID 2) and linked survey response 1 to `vasu` (student_profile_id = 2).
- Zero data loss or corruption.

---

## 6. School Computer Lab Workflow Verification

The following standard lab sequence was verified:

```
[Student A Arrives]
      │
      ▼
Logs in as "Rahul Sharma (Class 9A)"
      │
      ▼
Completes & submits Student IDE Survey
      │
      ▼
Logs out (Session terminated, survey state cleared)
      │
      ▼
[Student B Arrives at Same Computer]
      │
      ▼
Logs in as "Priya Patel (Class 9B)"
      │
      ▼
Survey status checked -> Returns NOT completed
      │
      ▼
Completes & submits Student IDE Survey -> Accepted (Response ID 2)
      │
      ▼
Logs out
      │
      ▼
[Teacher / Lab Admin]
      │
      ▼
Logs into Admin Dashboard
      │
      ▼
Views Summary:
  - Total Submissions: 2
  - Participating Students: 2
  - Individual Responses: Both Rahul and Priya listed with timestamps
```

---

## 7. Conclusion

The multi-student survey bug has been completely resolved. Student IDE now fully supports shared school computer lab deployments, allowing multiple students to create their profiles, submit surveys independently, and retain their response histories without interference. All changes are strictly offline, fully migrated without data loss, and backed by comprehensive automated test coverage.
