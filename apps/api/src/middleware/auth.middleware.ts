import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger';

const log = logger.scope('Auth');

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'jansunwai-dev-secret';

export interface AuthenticatedRequest extends Request {
  officer?: {
    officerId: string;
    email: string;
    role: 'ward_officer' | 'department_head' | 'commissioner';
    departmentId: string;
    wardId: string | null;
  };
}

/**
 * Require a valid JWT in the Authorization header.
 * Attaches decoded officer info to req.officer.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      officerId: string;
      email: string;
      role: string;
      departmentId: string;
      wardId: string | null;
    };

    req.officer = {
      officerId: decoded.officerId,
      email: decoded.email,
      role: decoded.role as 'ward_officer' | 'department_head' | 'commissioner',
      departmentId: decoded.departmentId,
      wardId: decoded.wardId,
    };

    next();
  } catch (error) {
    log.debug('Failed auth attempt:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
}

/**
 * Require specific roles. Use after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.officer) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.officer.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
