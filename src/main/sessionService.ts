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
 * Creates and registers a new active session for the specified student.
 */
export function createSession(studentId: number = 1): { success: boolean; session: PublicSessionInfo } {
  const sessionId = crypto.randomUUID();
  activeSession = {
    sessionId,
    studentId,
    loginTime: Date.now(),
  };

  const student = db.getProfile();
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

  const student = db.getProfile();
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
