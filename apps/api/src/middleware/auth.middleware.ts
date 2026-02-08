import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  next();
}
