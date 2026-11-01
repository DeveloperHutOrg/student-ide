import crypto from 'crypto';
import * as db from './db';
import { logoutAdmin } from './adminAuthService';
import { StudentProfile, PublicSessionInfo } from '../common/types';

interface InternalSession {
  sessionId: string;
  studentId: number;
  loginTime: number;
}

// In-memory active session.
// On initial application launch, system reboot, or after shutdown, this starts as null.
let activeSession: InternalSession | null = null;

/**
 * Returns the active student's ID or null if no session is active.
 */
export function getActiveStudentId(): number | null {
  return activeSession ? activeSession.studentId : null;
}

/**
 * Creates and registers a new active session for the specified student.
 */
export function createSession(studentId?: number): { success: boolean; session: PublicSessionInfo } {
  const targetId = studentId !== undefined ? studentId : (db.getProfile()?.id || 1);
  const sessionId = crypto.randomUUID();
  activeSession = {
    sessionId,
    studentId: targetId,
    loginTime: Date.now(),
  };

  const student = db.getProfile(studentId);
  return {
    success: true,
    session: {
      isAuthenticated: true,
      student: student || undefined,
      loginTime: activeSession.loginTime,
    },
  };
}

/**
 * Retrieves the current public session status without exposing private session secrets.
 */
export function getActiveSession(): PublicSessionInfo {
  if (!activeSession) {
    return {
      isAuthenticated: false,
    };
  }

  const student = db.getProfile(activeSession.studentId);
  return {
    isAuthenticated: true,
    student: student || undefined,
    loginTime: activeSession.loginTime,
  };
}

/**
 * Clears the active student session from memory.
 */
export function clearSession(): void {
  activeSession = null;
}

/**
 * Complete student logout: clears the session and logs out of any active admin session.
 */
export function logout(): { success: boolean } {
  clearSession();
  try {
    logoutAdmin();
  } catch (err) {
    // Admin was not logged in
  }
  return { success: true };
}

/**
 * Checks whether an active session currently exists.
 */
export function isSessionActive(): boolean {
  return activeSession !== null;
}
