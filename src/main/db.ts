import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import { StudentProfile, LanguagePreference, SupportedLanguageId } from '../common/types';
import { ALL_SUPPORTED_LANGUAGES, getSuggestedLanguagesForClass } from '../common/languages';

import { runMigrations } from './migrations';

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  try {
    if (app) {
      if (app.name !== 'student-ide') {
        app.name = 'student-ide';
      }
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      return path.join(userDataPath, 'student_ide.db');
    }
  } catch (err) {
    console.warn('[DB] Could not get app.getPath(userData), using fallback:', err);
  }
  // Fallback if app is not yet initialized or in unit test
  const fallbackDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return path.join(fallbackDir, 'student_ide.db');
}

export function initDatabase(customPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const db = new DatabaseSync(dbPath);

  // Run schema migrations and enable foreign keys
  runMigrations(db);

  dbInstance = db;
  return db;
}

export function getProfile(studentId?: number): StudentProfile | null {
  const db = initDatabase();

  if (studentId) {
    const stmt = db.prepare('SELECT id, student_name, student_class, created_at, updated_at FROM profile WHERE id = ?');
    const row = stmt.get(studentId) as any;
    if (row) {
      return {
        id: row.id,
        student_name: row.student_name,
        student_class: row.student_class,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
  }

  // Fallback: check last active student stored in settings
  const lastActiveRow = db.prepare("SELECT value FROM settings WHERE key = 'last_active_student_id'").get() as any;
  if (lastActiveRow && lastActiveRow.value) {
    const stmt = db.prepare('SELECT id, student_name, student_class, created_at, updated_at FROM profile WHERE id = ?');
    const row = stmt.get(Number(lastActiveRow.value)) as any;
    if (row) {
      return {
        id: row.id,
        student_name: row.student_name,
        student_class: row.student_class,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
  }

  // Fallback: return most recently updated profile
  const stmt = db.prepare('SELECT id, student_name, student_class, created_at, updated_at FROM profile ORDER BY updated_at DESC LIMIT 1');
  const row = stmt.get() as any;
  if (!row) return null;
  return {
    id: row.id,
    student_name: row.student_name,
    student_class: row.student_class,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getAllProfiles(): StudentProfile[] {
  const db = initDatabase();
  const rows = db.prepare('SELECT id, student_name, student_class, created_at, updated_at FROM profile ORDER BY updated_at DESC').all() as any[];
  return rows.map((row) => ({
    id: row.id,
    student_name: row.student_name,
    student_class: row.student_class,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function saveProfile(studentName: string, studentClass: number, existingId?: number): StudentProfile {
  const db = initDatabase();
  const trimmedName = studentName.trim();
  const validClass = Math.max(6, Math.min(12, Math.floor(studentClass)));

  let profileId: number;

  if (existingId) {
    const checkStmt = db.prepare('SELECT id FROM profile WHERE id = ?');
    const exists = checkStmt.get(existingId) as any;
    if (exists) {
      db.prepare(`
        UPDATE profile 
        SET student_name = ?, student_class = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(trimmedName, validClass, existingId);
      profileId = existingId;
    } else {
      const info = db.prepare(`
        INSERT INTO profile (student_name, student_class, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(trimmedName, validClass);
      profileId = Number(info.lastInsertRowid);
    }
  } else {
    // Check if student with same name and class already exists (case-insensitive)
    const findStmt = db.prepare('SELECT id FROM profile WHERE student_name = ? COLLATE NOCASE AND student_class = ? LIMIT 1');
    const existing = findStmt.get(trimmedName, validClass) as any;
    if (existing) {
      db.prepare('UPDATE profile SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
      profileId = existing.id;
    } else {
      const info = db.prepare(`
        INSERT INTO profile (student_name, student_class, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(trimmedName, validClass);
      profileId = Number(info.lastInsertRowid);
    }
  }

  // Record this student as last active
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES ('last_active_student_id', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(profileId));

  // When class is chosen for the first time, initialize language suggestions if not configured
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM language_preferences');
  const countRow = countStmt.get() as any;
  if (countRow.count === 0) {
    initDefaultLanguagesForClass(validClass);
  }

  return getProfile(profileId)!;
}

export function initDefaultLanguagesForClass(studentClass: number): void {
  const db = initDatabase();
  const suggested = new Set(getSuggestedLanguagesForClass(studentClass));

  const upsertStmt = db.prepare(`
    INSERT INTO language_preferences (language_id, enabled, is_suggested, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(language_id) DO UPDATE SET
      is_suggested = excluded.is_suggested,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const lang of ALL_SUPPORTED_LANGUAGES) {
    const isSug = suggested.has(lang.id) ? 1 : 0;
    upsertStmt.run(lang.id, isSug, isSug);
  }
}

export function getLanguagePreferences(): LanguagePreference[] {
  const db = initDatabase();
  const profile = getProfile();
  const studentClass = profile ? profile.student_class : 8;
  const suggestedSet = new Set(getSuggestedLanguagesForClass(studentClass));

  const rows = db.prepare('SELECT language_id, enabled, is_suggested FROM language_preferences').all() as any[];
  const prefMap = new Map<string, { enabled: boolean; isSuggested: boolean }>();

  for (const row of rows) {
    prefMap.set(row.language_id, {
      enabled: row.enabled === 1,
      isSuggested: suggestedSet.has(row.language_id as SupportedLanguageId),
    });
  }

  return ALL_SUPPORTED_LANGUAGES.map(lang => {
    const pref = prefMap.get(lang.id);
    const isSuggested = suggestedSet.has(lang.id);
    return {
      ...lang,
      isSuggested,
      enabled: pref ? pref.enabled : isSuggested,
    };
  });
}

export function saveLanguagePreferences(enabledIds: SupportedLanguageId[]): void {
  const db = initDatabase();
  const enabledSet = new Set(enabledIds);
  const profile = getProfile();
  const studentClass = profile ? profile.student_class : 8;
  const suggestedSet = new Set(getSuggestedLanguagesForClass(studentClass));

  const upsertStmt = db.prepare(`
    INSERT INTO language_preferences (language_id, enabled, is_suggested, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(language_id) DO UPDATE SET
      enabled = excluded.enabled,
      is_suggested = excluded.is_suggested,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const lang of ALL_SUPPORTED_LANGUAGES) {
    const isEnabled = enabledSet.has(lang.id) ? 1 : 0;
    const isSuggested = suggestedSet.has(lang.id) ? 1 : 0;
    upsertStmt.run(lang.id, isEnabled, isSuggested);
  }

  // Mark onboarding as completed
  setOnboardingCompleted(true);
}

export function isOnboardingCompleted(): boolean {
  try {
    const db = initDatabase();
    const profile = getProfile();
    if (!profile || !profile.student_name || profile.student_name.trim().length === 0) {
      return false;
    }

    // Check settings table for explicit flag
    const stmt = db.prepare("SELECT value FROM settings WHERE key = 'onboarding_completed'");
    const row = stmt.get() as any;
    if (row && row.value === '1') {
      return true;
    }

    // Fallback: check if language_preferences has records
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM language_preferences');
    const countRow = countStmt.get() as any;
    if (countRow && countRow.count > 0) {
      setOnboardingCompleted(true);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[DB] Error checking onboarding status:', err);
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  try {
    const db = initDatabase();
    const val = completed ? '1' : '0';
    const stmt = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES ('onboarding_completed', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(val);
  } catch (err) {
    console.error('[DB] Error setting onboarding status:', err);
  }
}

export function hasLanguagePreferencesConfigured(): boolean {
  try {
    const db = initDatabase();
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM language_preferences');
    const countRow = countStmt.get() as any;
    return !!(countRow && countRow.count > 0);
  } catch {
    return false;
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
