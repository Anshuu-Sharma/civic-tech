import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import grievanceRoutes from './routes/grievance.routes';
import analyticsRoutes from './routes/analytics.routes';
import citizenRoutes from './routes/citizen.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import verificationRoutes from './routes/verification.routes';
import rtiRoutes from './routes/rti.routes';
import { startEscalationJob } from './jobs/escalation.job';
import { initStorageBucket } from './services/storage.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health Check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/grievance', grievanceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/citizen', citizenRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1', verificationRoutes);
app.use('/api/v1/rti', rtiRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Start Server
async function start() {
  // Initialize storage bucket (non-blocking - don't fail startup if Supabase service key is missing)
  try {
    if (config.supabaseServiceRoleKey) {
      await initStorageBucket();
    } else {
      console.warn('[Storage] SUPABASE_SERVICE_ROLE_KEY not set, skipping storage bucket init');
    }
  } catch (err) {
    console.warn('[Storage] Failed to initialize storage bucket:', err);
  }

  app.listen(config.port, () => {
    console.log(`\n  JanSunwai AI API Server`);
    console.log(`  =======================`);
    console.log(`  Environment : ${config.nodeEnv}`);
    console.log(`  Port        : ${config.port}`);
    console.log(`  CORS Origin : ${config.corsOrigin}`);
    console.log(`  Health      : http://localhost:${config.port}/api/v1/health`);
    console.log();
  });
}

start().catch(console.error);

startEscalationJob();

export default app;
