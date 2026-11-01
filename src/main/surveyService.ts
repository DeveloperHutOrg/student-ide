import { DatabaseSync } from 'node:sqlite';
import { 
  SurveyDefinition, 
  SurveyStatus, 
  SurveyResponseRecord, 
  SurveySubmitResult,
  SubmitSurveyPayload 
} from '../common/types';
import { DEFAULT_SURVEY_ID, DEFAULT_SURVEY_VERSION, INITIAL_SURVEY } from '../common/surveyData';
import { initDatabase, getProfile } from './db';
import { validateSurveySubmission } from './surveyValidator';

/**
 * Retrieves the survey definition (questions, metadata) for a given survey ID.
 */
export function getSurveyDefinition(surveyId: string = DEFAULT_SURVEY_ID): SurveyDefinition {
  const db = initDatabase();
  const stmt = db.prepare('SELECT id, title, version, is_active FROM surveys WHERE id = ?');
  const row = stmt.get(surveyId) as { id: string; title: string; version: string; is_active: number } | undefined;

  if (row) {
    return {
      id: row.id,
      title: row.title,
      version: row.version,
      description: INITIAL_SURVEY.description,
      isActive: row.is_active === 1,
      questions: INITIAL_SURVEY.questions,
    };
  }

  return INITIAL_SURVEY;
}

/**
 * Checks whether the current student has submitted the survey.
 * Authoritative: resolves profile from local SQLite database.
 */
export function getSurveyStatus(surveyId: string = DEFAULT_SURVEY_ID): SurveyStatus {
  const db = initDatabase();
  const profile = getProfile();

  const def = getSurveyDefinition(surveyId);

  if (!profile || !profile.id) {
    return {
      hasSubmitted: false,
      surveyId: def.id,
      surveyTitle: def.title,
      surveyVersion: def.version,
      studentProfile: null,
    };
  }

  const stmt = db.prepare(`
    SELECT id, submitted_at, status 
    FROM survey_responses 
    WHERE survey_id = ? AND student_profile_id = ?
  `);
  const row = stmt.get(surveyId, profile.id) as { id: number; submitted_at: string; status: string } | undefined;

  return {
    hasSubmitted: !!row,
    submittedAt: row ? row.submitted_at : undefined,
    surveyId: def.id,
    surveyTitle: def.title,
    surveyVersion: def.version,
    studentProfile: {
      id: profile.id,
      name: profile.student_name,
      studentClass: profile.student_class,
    },
  };
}

/**
 * Retrieves the student's existing response if previously submitted.
 */
export function getSurveyResponse(surveyId: string = DEFAULT_SURVEY_ID): SurveyResponseRecord | null {
  const db = initDatabase();
  const profile = getProfile();

  if (!profile || !profile.id) {
    return null;
  }

  const stmt = db.prepare(`
    SELECT id, survey_id, student_profile_id, student_name, student_class, answers_json, submitted_at, status
    FROM survey_responses
    WHERE survey_id = ? AND student_profile_id = ?
  `);
  const row = stmt.get(surveyId, profile.id) as any;

  if (!row) {
    return null;
  }

  let parsedAnswers = {};
  try {
    parsedAnswers = JSON.parse(row.answers_json);
  } catch (err) {
    console.error('[Survey] Failed to parse answers_json:', err);
  }

  return {
    id: row.id,
    surveyId: row.survey_id,
    studentProfileId: row.student_profile_id,
    studentName: row.student_name,
    studentClass: row.student_class,
    answers: parsedAnswers as any,
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

/**
 * Submits the survey response.
 * - Validates input with Zod.
 * - Uses authoritative student profile from SQLite.
 * - Enforces unique submission checks.
 * - Executes insertion inside an atomic transaction.
 */
export function submitSurveyResponse(payload: unknown): SurveySubmitResult {
  const db = initDatabase();

  // 1. Validate payload structure and answers with Zod
  const validated = validateSurveySubmission(payload);

  // 2. Authoritative profile retrieval - do not trust renderer
  const profile = getProfile();
  if (!profile || !profile.id || !profile.student_name) {
    throw new Error('No registered student profile found. Please set up your student profile first.');
  }

  // 3. Pre-check for duplicate submission
  const existing = getSurveyResponse(validated.surveyId);
  if (existing) {
    throw new Error(
      `Survey was already submitted on ${existing.submittedAt}. Duplicate submissions are not permitted.`
    );
  }

  // 4. Atomic transaction with parameterized SQL
  db.exec('BEGIN IMMEDIATE');
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO survey_responses (
        survey_id,
        student_profile_id,
        student_name,
        student_class,
        answers_json,
        submitted_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `);

    const result = stmt.run(
      validated.surveyId,
      profile.id,
      profile.student_name,
      profile.student_class,
      JSON.stringify(validated.answers),
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      submittedAt: now,
      responseId: Number(result.lastInsertRowid),
      message: 'Thank you! Your feedback has been saved locally.',
    };
  } catch (err: any) {
    db.exec('ROLLBACK');
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      throw new Error('A submission has already been recorded for this profile. Duplicate submissions are not allowed.');
    }
    throw err;
  }
}
