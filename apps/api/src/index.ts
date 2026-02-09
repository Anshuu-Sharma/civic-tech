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
import logger, { requestLogger, logStartupBanner } from './lib/logger';

const app = express();
const log = logger.scope('Server');

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request/Response logging
app.use(requestLogger);

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
app.use((req, res) => {
  log.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Start Server
async function start() {
  // Initialize storage bucket
  try {
    if (config.supabaseServiceRoleKey) {
      await initStorageBucket();
      log.success('Storage bucket initialized');
    } else {
      log.warn('SUPABASE_SERVICE_ROLE_KEY not set, skipping storage bucket init');
    }
  } catch (err) {
    log.warn('Failed to initialize storage bucket:', err);
  }

  app.listen(config.port, () => {
    logStartupBanner({
      port: config.port,
      env: config.nodeEnv,
      corsOrigin: config.corsOrigin,
    });
  });
}

start().catch((err) => {
  log.error('Failed to start server:', err);
  process.exit(1);
});

startEscalationJob();

export default app;
