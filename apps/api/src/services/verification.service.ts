// ============================================================
// apps/api/src/services/verification.service.ts
// Verification token management for citizen resolution verification.
// ============================================================

import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 72;

interface CreateVerificationTokenResult {
  token: string;
  expiresAt: Date;
  verificationUrl: string;
}

/**
 * Generates a verification token when an officer marks a grievance as resolved.
 * Invalidates any existing unused tokens for the same grievance first.
 */
export async function createVerificationToken(
  grievanceId: string
): Promise<CreateVerificationTokenResult> {
  // Invalidate any existing unused tokens for this grievance
  await prisma.verification_tokens.updateMany({
    where: {
      grievance_id: grievanceId,
      used: false,
    },
    data: {
      used: true,
      used_at: new Date(),
    },
  });

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

  await prisma.verification_tokens.create({
    data: {
      grievance_id: grievanceId,
      token,
      expires_at: expiresAt,
    },
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify/${token}`;

  return { token, expiresAt, verificationUrl };
}

/**
 * Validates a verification token.
 * Checks: token exists, not used, not expired.
 * Returns the grievance ID if valid.
 */
export async function validateVerificationToken(
  token: string
): Promise<{ valid: boolean; grievanceId?: string; error?: string }> {
  const record = await prisma.verification_tokens.findUnique({
    where: { token },
  });

  if (!record) {
    return { valid: false, error: 'Invalid verification token.' };
  }

  if (record.used) {
    return { valid: false, error: 'This verification link has already been used.' };
  }

  if (new Date() > record.expires_at) {
    return { valid: false, error: 'This verification link has expired. Please contact support.' };
  }

  return { valid: true, grievanceId: record.grievance_id };
}

/**
 * Marks a verification token as used with current timestamp.
 */
export async function markTokenUsed(token: string): Promise<void> {
  await prisma.verification_tokens.update({
    where: { token },
    data: {
      used: true,
      used_at: new Date(),
    },
  });
}
