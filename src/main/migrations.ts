import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_SURVEY_ID, DEFAULT_SURVEY_VERSION, INITIAL_SURVEY } from '../common/surveyData';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: DatabaseSync) => {
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
    },
  },
  {
    version: 2,
    name: '002_survey_module',
    up: (db: DatabaseSync) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS surveys (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          version TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS survey_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          survey_id TEXT NOT NULL,
          student_profile_id INTEGER NOT NULL,
          student_name TEXT NOT NULL,
          student_class INTEGER NOT NULL,
          answers_json TEXT NOT NULL,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'submitted',
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
          FOREIGN KEY (student_profile_id) REFERENCES profile(id) ON DELETE CASCADE,
          CONSTRAINT uq_survey_student UNIQUE (survey_id, student_profile_id)
        );
      `);

      // Seed initial active survey if not present
      const stmt = db.prepare(`
        INSERT INTO surveys (id, title, version, is_active, created_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          version = excluded.version,
          is_active = excluded.is_active
      `);
      stmt.run(DEFAULT_SURVEY_ID, INITIAL_SURVEY.title, DEFAULT_SURVEY_VERSION);
    },
  },
];

/**
 * Executes pending database migrations sequentially within transactions.
 * Enables foreign keys and maintains schema_migrations history.
 */
export function runMigrations(db: DatabaseSync): void {
  // Always enforce foreign key constraints
  db.exec('PRAGMA foreign_keys = ON;');

  // Create migrations tracker table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[DB Migration] Applying migration ${migration.version}: ${migration.name}`);
      db.exec('BEGIN IMMEDIATE');
      try {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
          .run(migration.version, migration.name);
        db.exec('COMMIT');
        console.log(`[DB Migration] Successfully applied migration ${migration.version}`);
      } catch (err) {
        db.exec('ROLLBACK');
        console.error(`[DB Migration] Failed applying migration ${migration.version}:`, err);
        throw err;
      }
    }
  }
}
