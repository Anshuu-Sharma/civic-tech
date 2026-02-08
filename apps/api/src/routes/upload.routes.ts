// ============================================================
// apps/api/src/routes/upload.routes.ts
// Media upload endpoints.
// ============================================================

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { uploadFile, createSignedUploadUrl } from '../services/storage.service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * POST /api/v1/upload/media
 * Server-side upload: accepts multipart file, stores in Supabase.
 * Returns the public URL.
 */
router.post('/media', upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No files uploaded' },
      });
    }

    const urls: string[] = [];

    for (const file of files) {
      const url = await uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      urls.push(url);
    }

    return res.json({ success: true, data: { urls } });
  } catch (err: any) {
    console.error('[Upload] Error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: err.message },
    });
  }
});

/**
 * POST /api/v1/upload/signed-url
 * Returns a signed URL for client-side direct upload.
 */
router.post('/signed-url', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'fileName is required' },
      });
    }

    const result = await createSignedUploadUrl(fileName);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SIGNED_URL_FAILED', message: err.message },
    });
  }
});

export default router;
