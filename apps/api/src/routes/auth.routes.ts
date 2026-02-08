import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'jansunwai-dev-secret';
const JWT_EXPIRES_IN = '8h';

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const officer = await prisma.officers.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    if (!officer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, officer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        officerId: officer.id,
        email: officer.email,
        role: officer.role,
        departmentId: officer.department_id,
        wardId: officer.ward_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department_id: officer.department_id,
        department_name: officer.department?.name || null,
        ward_id: officer.ward_id,
      },
      token,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/auth/seed-officer (dev only -- creates a test officer)
router.post('/seed-officer', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not available in production' });
  }

  try {
    const { name, email, password, role, department_id, ward_id } = req.body;

    if (!name || !email || !password || !department_id) {
      return res.status(400).json({ message: 'name, email, password, and department_id are required' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const officer = await prisma.officers.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password_hash,
        role: role || 'ward_officer',
        department_id,
        ward_id: ward_id || null,
        phone: req.body.phone || '0000000000',
      },
    });

    return res.json({ officer: { id: officer.id, email: officer.email, role: officer.role } });
  } catch (error: any) {
    console.error('[Auth] Seed error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
