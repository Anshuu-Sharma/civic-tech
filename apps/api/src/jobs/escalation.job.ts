import cron from 'node-cron';
import { checkAndEscalate } from '../services/escalation.service';
import logger from '../lib/logger';

const log = logger.scope('EscalationJob');

let isRunning = false;

/**
 * Start the escalation cron job.
 * Default schedule: every hour at minute 0 ("0 * * * *")
 * Override with ESCALATION_CRON env var (e.g. every 15 minutes in dev).
 * Includes a mutex lock to prevent overlapping runs.
 */
export function startEscalationJob(): void {
  // Default: hourly. In development, can override to run more frequently.
  const schedule = process.env.ESCALATION_CRON || '0 * * * *';

  cron.schedule(schedule, async () => {
    if (isRunning) {
      log.info('Skipping -- previous run still in progress');
      return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
      log.info(`Starting at ${new Date().toISOString()}`);
      const result = await checkAndEscalate();
      const duration = Date.now() - startTime;
      log.info(`Completed in ${duration}ms: ${result.escalated} escalated`);
    } catch (error: any) {
      log.error('Failed:', error.message);
    } finally {
      isRunning = false;
    }
  });

  log.info(`Scheduled with cron expression: ${schedule}`);
}
