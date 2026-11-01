import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { initDatabase } from './db';
import { AdminAuthStatus } from '../common/types';

// In-memory session store (tokens are never persisted to disk and clear on app exit)
let activeAdminToken: string | null = null;
let sessionCreatedAt: number = 0;
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Checks whether an admin master password is configured in SQLite,
 * and whether the current session is authenticated.
 */
export function getAdminAuthStatus(): AdminAuthStatus {
  const db = initDatabase();
  const row = db.prepare('SELECT id FROM admin_auth WHERE id = 1').get();
  const isConfigured = !!row;

  const isSessionValid = 
    activeAdminToken !== null && 
    (Date.now() - sessionCreatedAt < SESSION_TTL_MS);

  return {
    isConfigured,
    isAuthenticated: isConfigured && isSessionValid,
  };
}

/**
 * First-time admin password setup.
 * Hashes password using Node.js scrypt with a 16-byte cryptographically secure salt.
 */
export function setupAdminPassword(password: string): { success: boolean; token?: string; error?: string } {
  if (!password || typeof password !== 'string' || password.length < 6) {
    return { success: false, error: 'Admin password must be at least 6 characters long.' };
  }

  const db = initDatabase();
  const existing = db.prepare('SELECT id FROM admin_auth WHERE id = 1').get();
  if (existing) {
    return { success: false, error: 'Admin password is already configured. Please log in.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const passwordHash = hashBuffer.toString('hex');

  const stmt = db.prepare(`
    INSERT INTO admin_auth (id, password_hash, salt, algorithm, updated_at)
    VALUES (1, ?, ?, 'scrypt', CURRENT_TIMESTAMP)
  `);
  stmt.run(passwordHash, salt);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  activeAdminToken = token;
  sessionCreatedAt = Date.now();

  return { success: true, token };
}

/**
 * Verifies the admin password and establishes an in-memory session.
 * Uses timingSafeEqual to protect against timing analysis attacks.
 */
export function loginAdmin(password: string): { success: boolean; token?: string; error?: string } {
  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Password is required.' };
  }

  const db = initDatabase();
  const row = db.prepare('SELECT password_hash, salt FROM admin_auth WHERE id = 1').get() as {
    password_hash: string;
    salt: string;
  } | undefined;

  if (!row) {
    return { success: false, error: 'Admin password has not been configured yet.' };
  }

  const candidateHashBuffer = crypto.scryptSync(password, row.salt, 64);
  const storedHashBuffer = Buffer.from(row.password_hash, 'hex');

  const match = 
    candidateHashBuffer.length === storedHashBuffer.length &&
    crypto.timingSafeEqual(candidateHashBuffer, storedHashBuffer);

  if (!match) {
    return { success: false, error: 'Incorrect master admin password.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  activeAdminToken = token;
  sessionCreatedAt = Date.now();

  return { success: true, token };
}

/**
 * Destroys the active admin session.
 */
export function logoutAdmin(): void {
  activeAdminToken = null;
  sessionCreatedAt = 0;
}

/**
 * Validates that an admin session is active and valid.
 * Throws an error if unauthorized.
 */
export function verifyAdminSession(clientToken?: string): boolean {
  if (!activeAdminToken) {
    throw new Error('Unauthorized: Admin authentication required.');
  }

  if (Date.now() - sessionCreatedAt > SESSION_TTL_MS) {
    logoutAdmin();
    throw new Error('Unauthorized: Admin session expired. Please log in again.');
  }

  if (clientToken && clientToken !== activeAdminToken) {
    throw new Error('Unauthorized: Invalid admin session token.');
  }

  return true;
}
