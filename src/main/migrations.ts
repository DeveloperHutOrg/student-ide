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
  {
    version: 3,
    name: '003_admin_survey_dashboard',
    up: (db: DatabaseSync) => {
      // 1. Create admin_auth table for locally configured credentials
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin_auth (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          algorithm TEXT NOT NULL DEFAULT 'scrypt',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Rebuild survey_responses table to support imported responses from other installations
      db.exec(`
        CREATE TABLE IF NOT EXISTS survey_responses_v3 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          survey_id TEXT NOT NULL,
          student_profile_id INTEGER,
          student_name TEXT NOT NULL,
          student_class INTEGER NOT NULL,
          answers_json TEXT NOT NULL,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'submitted',
          source_type TEXT NOT NULL DEFAULT 'local',
          external_response_id TEXT,
          import_hash TEXT,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
          FOREIGN KEY (student_profile_id) REFERENCES profile(id) ON DELETE SET NULL
        );
      `);

      // Check if original survey_responses exists and copy data
      const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='survey_responses'").get();
      if (checkTable) {
        db.exec(`
          INSERT INTO survey_responses_v3 (
            id, survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, status, source_type, external_response_id, import_hash
          )
          SELECT 
            id, survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, status, 'local', 'local-' || id, 'local-' || id
          FROM survey_responses;

          DROP TABLE survey_responses;
        `);
      }

      db.exec(`
        ALTER TABLE survey_responses_v3 RENAME TO survey_responses;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_local_student 
        ON survey_responses(survey_id, student_profile_id) 
        WHERE source_type = 'local' AND student_profile_id IS NOT NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_import_hash 
        ON survey_responses(import_hash) 
        WHERE import_hash IS NOT NULL;
      `);
    },
  },
  {
    version: 4,
    name: '004_multi_student_survey',
    up: (db: DatabaseSync) => {
      // 1. Disable foreign keys temporarily during table schema rebuild
      db.exec('PRAGMA foreign_keys = OFF;');

      // 2. Rebuild profile table without CHECK (id = 1) constraint to support multiple students
      db.exec(`
        CREATE TABLE IF NOT EXISTS profile_v4 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_name TEXT NOT NULL,
          student_class INTEGER NOT NULL CHECK (student_class BETWEEN 6 AND 12),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Copy existing profile records safely
      db.exec(`
        INSERT INTO profile_v4 (id, student_name, student_class, created_at, updated_at)
        SELECT id, student_name, student_class, created_at, updated_at FROM profile;
      `);

      // 4. Ensure any student with a local survey response has a profile record
      const localRespRows = db.prepare(`
        SELECT DISTINCT student_name, student_class 
        FROM survey_responses 
        WHERE source_type = 'local'
      `).all() as { student_name: string; student_class: number }[];

      for (const row of localRespRows) {
        if (!row.student_name) continue;
        const existing = db.prepare(`
          SELECT id FROM profile_v4 
          WHERE LOWER(TRIM(student_name)) = LOWER(TRIM(?)) AND student_class = ?
        `).get(row.student_name, row.student_class) as { id: number } | undefined;

        if (!existing) {
          db.prepare(`
            INSERT INTO profile_v4 (student_name, student_class)
            VALUES (?, ?)
          `).run(row.student_name.trim(), row.student_class);
        }
      }

      // 5. Replace profile table and create unique index on (name, class)
      db.exec(`
        DROP TABLE profile;
        ALTER TABLE profile_v4 RENAME TO profile;
        CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_name_class 
        ON profile(student_name COLLATE NOCASE, student_class);
      `);

      // 6. Ensure survey_responses has survey_version column
      const cols = db.prepare("PRAGMA table_info('survey_responses')").all() as { name: string }[];
      const hasVersionCol = cols.some(c => c.name === 'survey_version');
      if (!hasVersionCol) {
        db.exec("ALTER TABLE survey_responses ADD COLUMN survey_version TEXT DEFAULT '1.0.0';");
      }

      // Populate survey_version from surveys table for existing records
      db.exec(`
        UPDATE survey_responses 
        SET survey_version = COALESCE(
          (SELECT version FROM surveys WHERE surveys.id = survey_responses.survey_id LIMIT 1),
          '1.0.0'
        )
        WHERE survey_version IS NULL OR survey_version = '';
      `);

      // 7. Relink survey_responses to their corresponding profile ids
      const allProfiles = db.prepare('SELECT id, student_name, student_class FROM profile').all() as { id: number; student_name: string; student_class: number }[];
      for (const p of allProfiles) {
        db.prepare(`
          UPDATE survey_responses 
          SET student_profile_id = ? 
          WHERE source_type = 'local' 
            AND LOWER(TRIM(student_name)) = LOWER(TRIM(?)) 
            AND student_class = ?
        `).run(p.id, p.student_name, p.student_class);
      }

      // 8. Rebuild unique index: enforce UNIQUE(student_profile_id, survey_id, survey_version)
      db.exec(`
        DROP INDEX IF EXISTS uq_survey_local_student;
        CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_local_student_version 
        ON survey_responses(student_profile_id, survey_id, survey_version) 
        WHERE source_type = 'local' AND student_profile_id IS NOT NULL;
      `);

      // 9. Re-enable foreign keys
      db.exec('PRAGMA foreign_keys = ON;');
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
