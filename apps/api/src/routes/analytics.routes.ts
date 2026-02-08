import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import {
  heatmapQuerySchema,
  wardsQuerySchema,
  trendsQuerySchema,
} from '../validators/analytics.validator';

const router = Router();
const controller = new AnalyticsController();

router.get('/heatmap', controller.getHeatmapData);
router.get('/wards', controller.getWardScorecards);
router.get('/trends', controller.getTrends);

export default router;
