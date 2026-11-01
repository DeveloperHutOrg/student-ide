import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { dialog, BrowserWindow } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { 
  AdminSurveyStats, 
  AdminResponseItem, 
  AdminFilterOptions, 
  ImportSurveyResult, 
  ExportBackupFormat,
  ExportBackupRecord,
  SurveyAnswers 
} from '../common/types';
import { DEFAULT_SURVEY_ID, DEFAULT_SURVEY_VERSION } from '../common/surveyData';
import { initDatabase, getProfile } from './db';
import { verifyAdminSession } from './adminAuthService';
import { SubmitSurveySchema } from './surveyValidator';

// Zod schema for imported backup files
const ImportedRecordSchema = z.object({
  responseId: z.union([z.string(), z.number()]).optional(),
  surveyId: z.string().default(DEFAULT_SURVEY_ID),
  surveyVersion: z.string().default(DEFAULT_SURVEY_VERSION),
  studentName: z.string().min(1, 'Student name is required'),
  studentClass: z.number().int().min(6).max(12),
  answers: z.object({
    q1: z.string(),
    q2: z.string(),
    q3: z.string(),
    q4: z.union([z.string(), z.array(z.string())]),
    q5: z.union([z.string(), z.array(z.string())]),
    q6: z.string().optional().default(''),
  }),
  submittedAt: z.string().optional(),
  source: z.string().optional().default('imported'),
});

const ImportedFileSchema = z.union([
  z.object({
    exportFormatVersion: z.string().optional(),
    records: z.array(ImportedRecordSchema),
  }),
  z.array(ImportedRecordSchema),
]);

/**
 * Computes analytics and aggregated statistics for the Admin Dashboard.
 */
export function getAdminSurveyStats(token?: string): AdminSurveyStats {
  verifyAdminSession(token);
  const db = initDatabase();

  // 1. Total counts
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number };
  const localRow = db.prepare("SELECT COUNT(*) as count FROM survey_responses WHERE source_type = 'local'").get() as { count: number };
  const importedRow = db.prepare("SELECT COUNT(*) as count FROM survey_responses WHERE source_type = 'imported'").get() as { count: number };

  const totalResponses = totalRow?.count || 0;
  const localResponses = localRow?.count || 0;
  const importedResponses = importedRow?.count || 0;

  // 2. Unique participating students across all submissions
  const uniqueRow = db.prepare(`
    SELECT COUNT(DISTINCT 
      CASE 
        WHEN student_profile_id IS NOT NULL AND source_type = 'local' 
        THEN 'loc_' || student_profile_id 
        ELSE 'ext_' || LOWER(TRIM(student_name)) || '_' || student_class 
      END
    ) as count FROM survey_responses
  `).get() as { count: number };
  const uniqueStudents = uniqueRow?.count || 0;

  // 3. Current computer submission status
  const currentComputerSubmitted = localResponses > 0;

  // 4. Class distribution (Classes 6 to 12)
  const classDist: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
  const classRows = db.prepare('SELECT student_class, COUNT(*) as count FROM survey_responses GROUP BY student_class').all() as { student_class: number; count: number }[];
  for (const r of classRows) {
    if (r.student_class >= 6 && r.student_class <= 12) {
      classDist[r.student_class] = r.count;
    }
  }

  // 5. Question breakdown
  const q1Stats: Record<string, number> = {};
  const q2Stats: Record<string, number> = {};
  const q3Stats: Record<string, number> = {};
  const q4Stats: Record<string, number> = {};
  const q5Stats: Record<string, number> = {};

  const answerRows = db.prepare('SELECT answers_json FROM survey_responses').all() as { answers_json: string }[];
  for (const row of answerRows) {
    try {
      const ans = JSON.parse(row.answers_json) as SurveyAnswers;
      if (ans.q1) q1Stats[ans.q1] = (q1Stats[ans.q1] || 0) + 1;
      if (ans.q2) q2Stats[ans.q2] = (q2Stats[ans.q2] || 0) + 1;
      if (ans.q3) q3Stats[ans.q3] = (q3Stats[ans.q3] || 0) + 1;

      // Q4 can be array or string
      if (ans.q4) {
        const features = Array.isArray(ans.q4) ? ans.q4 : [ans.q4];
        for (const f of features) {
          if (f) q4Stats[f] = (q4Stats[f] || 0) + 1;
        }
      }

      // Q5 can be array or string
      if (ans.q5) {
        const improvements = Array.isArray(ans.q5) ? ans.q5 : [ans.q5];
        for (const imp of improvements) {
          if (imp) q5Stats[imp] = (q5Stats[imp] || 0) + 1;
        }
      }
    } catch {
      // Ignore unparseable individual rows
    }
  }

  // 6. Latest 5 submissions
  const latestRows = db.prepare(`
    SELECT id, survey_id, survey_version, student_profile_id, student_name, student_class, answers_json, submitted_at, status, source_type, external_response_id
    FROM survey_responses
    ORDER BY submitted_at DESC, id DESC
    LIMIT 5
  `).all() as any[];

  const latestSubmissions: AdminResponseItem[] = latestRows.map((r) => {
    let answers: any = {};
    try {
      answers = JSON.parse(r.answers_json);
    } catch {}
    return {
      id: r.id,
      surveyId: r.survey_id,
      surveyVersion: r.survey_version || '1.0.0',
      studentProfileId: r.student_profile_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      answers,
      submittedAt: r.submitted_at,
      status: r.status,
      sourceType: r.source_type || 'local',
      externalResponseId: r.external_response_id,
    };
  });

  return {
    totalResponses,
    localResponses,
    importedResponses,
    currentComputerSubmitted,
    uniqueStudents,
    classDistribution: classDist,
    questionStats: {
      q1: q1Stats,
      q2: q2Stats,
      q3: q3Stats,
      q4: q4Stats,
      q5: q5Stats,
    },
    latestSubmissions,
  };
}

/**
 * Retrieves searchable and filterable survey response items for table view.
 */
export function getAdminResponses(filters: AdminFilterOptions = {}, token?: string): AdminResponseItem[] {
  verifyAdminSession(token);
  const db = initDatabase();

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters.studentClass && filters.studentClass !== 'all') {
    whereClauses.push('student_class = ?');
    params.push(Number(filters.studentClass));
  }

  if (filters.sourceType && filters.sourceType !== 'all') {
    whereClauses.push('source_type = ?');
    params.push(filters.sourceType);
  }

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    whereClauses.push('LOWER(student_name) LIKE ?');
    params.push(`%${filters.searchQuery.trim().toLowerCase()}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sortDir = filters.sortBy === 'oldest' ? 'ASC' : 'DESC';

  const sql = `
    SELECT id, survey_id, survey_version, student_profile_id, student_name, student_class, answers_json, submitted_at, status, source_type, external_response_id
    FROM survey_responses
    ${whereSql}
    ORDER BY submitted_at ${sortDir}, id ${sortDir}
  `;

  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map((r) => {
    let answers: any = {};
    try {
      answers = JSON.parse(r.answers_json);
    } catch {}
    return {
      id: r.id,
      surveyId: r.survey_id,
      surveyVersion: r.survey_version || '1.0.0',
      studentProfileId: r.student_profile_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      answers,
      submittedAt: r.submitted_at,
      status: r.status,
      sourceType: r.source_type || 'local',
      externalResponseId: r.external_response_id,
    };
  });
}

/**
 * Exports survey responses in CSV, JSON (Backup format), or Summary format.
 * Prompts user with native save file dialog and writes with UTF-8 encoding.
 */
export async function exportSurveyData(
  format: 'csv' | 'json' | 'summary',
  getMainWindow: () => BrowserWindow | null,
  token?: string
): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> {
  verifyAdminSession(token);
  const responses = getAdminResponses({ sortBy: 'newest' }, token);
  const win = getMainWindow();

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  let defaultPath = '';
  let filters: { name: string; extensions: string[] }[] = [];

  if (format === 'csv') {
    defaultPath = `student_ide_survey_export_${dateStr}.csv`;
    filters = [{ name: 'CSV Files', extensions: ['csv'] }];
  } else if (format === 'json') {
    defaultPath = `student_ide_survey_backup_${dateStr}.json`;
    filters = [{ name: 'JSON Backup Files', extensions: ['json'] }];
  } else {
    defaultPath = `student_ide_survey_summary_${dateStr}.txt`;
    filters = [{ name: 'Text Summary Files', extensions: ['txt'] }];
  }

  const saveDialogResult = await dialog.showSaveDialog(win || undefined as any, {
    title: `Export Survey Responses (${format.toUpperCase()})`,
    defaultPath,
    filters,
  });

  if (saveDialogResult.canceled || !saveDialogResult.filePath) {
    return { success: false, canceled: true };
  }

  const filePath = saveDialogResult.filePath;

  try {
    if (format === 'csv') {
      // Generate CSV with UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF';
      const headers = [
        'Response ID',
        'Source',
        'Student Name',
        'Class',
        'Survey ID',
        'Ease of Use (Q1)',
        'Primary Language (Q2)',
        'Frequency (Q3)',
        'Useful Features (Q4)',
        'Desired Improvements (Q5)',
        'Suggestions (Q6)',
        'Submitted At',
        'Status',
      ];

      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const rows: string[] = [headers.map(escapeCsv).join(',')];

      for (const r of responses) {
        const q4Str = Array.isArray(r.answers?.q4) ? r.answers.q4.join('; ') : r.answers?.q4 || '';
        const q5Str = Array.isArray(r.answers?.q5) ? r.answers.q5.join('; ') : r.answers?.q5 || '';
        const rowData = [
          r.externalResponseId || r.id,
          r.sourceType,
          r.studentName,
          r.studentClass,
          r.surveyId,
          r.answers?.q1 || '',
          r.answers?.q2 || '',
          r.answers?.q3 || '',
          q4Str,
          q5Str,
          r.answers?.q6 || '',
          r.submittedAt,
          r.status,
        ];
        rows.push(rowData.map(escapeCsv).join(','));
      }

      fs.writeFileSync(filePath, bom + rows.join('\r\n'), 'utf8');
    } else if (format === 'json') {
      // Versioned Backup Format
      const backupRecords: ExportBackupRecord[] = responses.map((r) => ({
        responseId: r.externalResponseId || r.id,
        surveyId: r.surveyId,
        surveyVersion: DEFAULT_SURVEY_VERSION,
        studentName: r.studentName,
        studentClass: r.studentClass,
        answers: r.answers,
        submittedAt: r.submittedAt,
        source: r.sourceType,
      }));

      const backupData: ExportBackupFormat = {
        exportFormatVersion: '1.0.0',
        exportedAt: now.toISOString(),
        generator: 'Student IDE Offline Admin Dashboard',
        totalRecords: backupRecords.length,
        surveyId: DEFAULT_SURVEY_ID,
        surveyVersion: DEFAULT_SURVEY_VERSION,
        records: backupRecords,
      };

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    } else {
      // Aggregated summary report
      const stats = getAdminSurveyStats(token);
      let summaryText = '====================================================\n';
      summaryText += 'STUDENT IDE - SURVEY AGGREGATED SUMMARY REPORT\n';
      summaryText += `Generated: ${now.toLocaleString()}\n`;
      summaryText += '====================================================\n\n';

      summaryText += `Total Responses Recorded: ${stats.totalResponses}\n`;
      summaryText += `  - Local Computer Submissions: ${stats.localResponses}\n`;
      summaryText += `  - Imported Submissions: ${stats.importedResponses}\n\n`;

      summaryText += '--- RESPONSES BY CLASS ---\n';
      for (let c = 6; c <= 12; c++) {
        const count = stats.classDistribution[c] || 0;
        const pct = stats.totalResponses > 0 ? ((count / stats.totalResponses) * 100).toFixed(1) : '0.0';
        summaryText += `Class ${c}: ${count} (${pct}%)\n`;
      }
      summaryText += '\n';

      summaryText += '--- QUESTION 1: EASE OF USE ---\n';
      for (const [key, val] of Object.entries(stats.questionStats.q1)) {
        const pct = stats.totalResponses > 0 ? ((val / stats.totalResponses) * 100).toFixed(1) : '0.0';
        summaryText += `  * ${key}: ${val} (${pct}%)\n`;
      }
      summaryText += '\n';

      summaryText += '--- QUESTION 2: PRIMARY PROGRAMMING LANGUAGE ---\n';
      for (const [key, val] of Object.entries(stats.questionStats.q2)) {
        const pct = stats.totalResponses > 0 ? ((val / stats.totalResponses) * 100).toFixed(1) : '0.0';
        summaryText += `  * ${key}: ${val} (${pct}%)\n`;
      }
      summaryText += '\n';

      summaryText += '--- QUESTION 3: USAGE FREQUENCY ---\n';
      for (const [key, val] of Object.entries(stats.questionStats.q3)) {
        const pct = stats.totalResponses > 0 ? ((val / stats.totalResponses) * 100).toFixed(1) : '0.0';
        summaryText += `  * ${key}: ${val} (${pct}%)\n`;
      }
      summaryText += '\n';

      summaryText += '--- QUESTION 4: MOST USEFUL FEATURES ---\n';
      for (const [key, val] of Object.entries(stats.questionStats.q4)) {
        summaryText += `  * ${key}: ${val} votes\n`;
      }
      summaryText += '\n';

      summaryText += '--- QUESTION 5: DESIRED IMPROVEMENTS ---\n';
      for (const [key, val] of Object.entries(stats.questionStats.q5)) {
        summaryText += `  * ${key}: ${val} votes\n`;
      }

      fs.writeFileSync(filePath, summaryText, 'utf8');
    }

    return { success: true, filePath };
  } catch (err: any) {
    console.error('[Admin Export] Failed to export data:', err);
    return { success: false, error: err.message || 'Failed to export survey data.' };
  }
}

/**
 * Imports survey responses from another Student IDE JSON export file.
 * Validates schema, survey version, detects duplicates, and executes batch insert inside a transaction.
 */
export async function importSurveyData(
  getMainWindow: () => BrowserWindow | null,
  token?: string,
  filePathOverride?: string
): Promise<ImportSurveyResult> {
  verifyAdminSession(token);
  const win = getMainWindow();

  let targetFilePath = filePathOverride;

  if (!targetFilePath) {
    const openDialogResult = await dialog.showOpenDialog(win || undefined as any, {
      title: 'Import Survey Responses JSON',
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup Files', extensions: ['json'] }],
    });

    if (openDialogResult.canceled || openDialogResult.filePaths.length === 0) {
      return {
        success: false,
        totalInFile: 0,
        importedCount: 0,
        skippedDuplicates: 0,
        rejectedCount: 0,
        details: ['Import cancelled.'],
      };
    }

    targetFilePath = openDialogResult.filePaths[0];
  }

  // 1. Read and parse JSON content safely
  let fileContent = '';
  try {
    fileContent = fs.readFileSync(targetFilePath, 'utf8');
  } catch (err: any) {
    return {
      success: false,
      totalInFile: 0,
      importedCount: 0,
      skippedDuplicates: 0,
      rejectedCount: 1,
      details: [`Could not read file: ${err.message}`],
    };
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(fileContent);
  } catch (err: any) {
    return {
      success: false,
      totalInFile: 0,
      importedCount: 0,
      skippedDuplicates: 0,
      rejectedCount: 1,
      details: [`Invalid JSON formatting: ${err.message}`],
    };
  }

  // 2. Validate top-level schema via Zod
  const schemaParseResult = ImportedFileSchema.safeParse(parsedRaw);
  if (!schemaParseResult.success) {
    const errorIssues = schemaParseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return {
      success: false,
      totalInFile: 0,
      importedCount: 0,
      skippedDuplicates: 0,
      rejectedCount: 1,
      details: [`File schema validation failed: ${errorIssues}`],
    };
  }

  const rawRecords = Array.isArray(schemaParseResult.data)
    ? schemaParseResult.data
    : schemaParseResult.data.records;

  const totalInFile = rawRecords.length;
  let importedCount = 0;
  let skippedDuplicates = 0;
  let rejectedCount = 0;
  const details: string[] = [];

  const db = initDatabase();

  // 3. Process records inside an atomic transaction
  db.exec('BEGIN IMMEDIATE');
  try {
    const checkHashStmt = db.prepare('SELECT id FROM survey_responses WHERE import_hash = ?');
    const checkContentStmt = db.prepare(`
      SELECT id FROM survey_responses 
      WHERE survey_id = ? AND LOWER(student_name) = ? AND student_class = ? AND submitted_at = ?
    `);

    const insertStmt = db.prepare(`
      INSERT INTO survey_responses (
        survey_id,
        student_profile_id,
        student_name,
        student_class,
        answers_json,
        submitted_at,
        status,
        source_type,
        external_response_id,
        import_hash
      ) VALUES (?, NULL, ?, ?, ?, ?, 'imported', 'imported', ?, ?)
    `);

    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const trimmedName = rec.studentName ? rec.studentName.trim() : '';
      const submittedAt = rec.submittedAt || new Date().toISOString().slice(0, 19).replace('T', ' ');

      if (!trimmedName || !rec.studentClass || rec.studentClass < 6 || rec.studentClass > 12) {
        rejectedCount++;
        details.push(`Record #${i + 1}: Rejected (invalid student name or class)`);
        continue;
      }

      // Compute unique content hash for exact deduplication
      const rawPayloadForHash = `${rec.surveyId}:${trimmedName.toLowerCase()}:${rec.studentClass}:${submittedAt}`;
      const importHash = crypto.createHash('sha256').update(rawPayloadForHash).digest('hex');

      // Check for duplicate by import_hash or content
      const hashExists = checkHashStmt.get(importHash);
      const contentExists = checkContentStmt.get(rec.surveyId, trimmedName.toLowerCase(), rec.studentClass, submittedAt);

      if (hashExists || contentExists) {
        skippedDuplicates++;
        details.push(`Skipped duplicate: ${trimmedName} (Class ${rec.studentClass})`);
        continue;
      }

      // Insert validated imported record
      const externalId = rec.responseId ? String(rec.responseId) : `import-${importHash.slice(0, 8)}`;
      insertStmt.run(
        rec.surveyId || DEFAULT_SURVEY_ID,
        trimmedName,
        rec.studentClass,
        JSON.stringify(rec.answers),
        submittedAt,
        externalId,
        importHash
      );

      importedCount++;
    }

    db.exec('COMMIT');

    const summaryMsg = `Successfully imported ${importedCount} response(s). Skipped ${skippedDuplicates} duplicate(s). Rejected ${rejectedCount}.`;
    details.unshift(summaryMsg);

    return {
      success: true,
      totalInFile,
      importedCount,
      skippedDuplicates,
      rejectedCount,
      details,
    };
  } catch (err: any) {
    db.exec('ROLLBACK');
    console.error('[Admin Import] Batch import failed and rolled back:', err);
    return {
      success: false,
      totalInFile,
      importedCount: 0,
      skippedDuplicates: 0,
      rejectedCount: totalInFile,
      details: [`Transaction rolled back due to error: ${err.message}`],
    };
  }
}
