import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import { StudentProfile, LanguagePreference, SupportedLanguageId } from '../common/types';
import { ALL_SUPPORTED_LANGUAGES, getSuggestedLanguagesForClass } from '../common/languages';

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

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      student_name TEXT NOT NULL,
      student_class INTEGER NOT NULL CHECK (student_class BETWEEN 6 AND 12),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS language_preferences (
      language_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      is_suggested INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
}

export function getProfile(): StudentProfile | null {
  const db = initDatabase();
  const stmt = db.prepare('SELECT id, student_name, student_class, created_at, updated_at FROM profile WHERE id = 1');
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

export function saveProfile(studentName: string, studentClass: number): StudentProfile {
  const db = initDatabase();
  const trimmedName = studentName.trim();
  const validClass = Math.max(6, Math.min(12, Math.floor(studentClass)));

  const stmt = db.prepare(`
    INSERT INTO profile (id, student_name, student_class, updated_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      student_name = excluded.student_name,
      student_class = excluded.student_class,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(trimmedName, validClass);

  // When class is chosen for the first time, initialize language suggestions if not configured
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM language_preferences');
  const countRow = countStmt.get() as any;
  if (countRow.count === 0) {
    initDefaultLanguagesForClass(validClass);
  }

  return getProfile()!;
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
