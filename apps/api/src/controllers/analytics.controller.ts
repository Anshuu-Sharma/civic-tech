import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import type { HeatmapQuery, WardsQuery, TrendsQuery } from '../validators/analytics.validator';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getHeatmapData(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as HeatmapQuery;
      const data = await analyticsService.getHeatmapData(filters);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getWardScorecards(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as WardsQuery;
      const data = await analyticsService.getWardScorecards(query);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as TrendsQuery;
      const data = await analyticsService.getTrends(query);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
