import { Request, Response, NextFunction } from 'express';
import { ReportModel } from '../models/Report.model';
import { DatasetModel } from '../models/Dataset.model';
import { ChatModel } from '../models/Chat.model';
import { reportService } from '../services/report.service';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response.utils';
import { BUSINESS_CATEGORIES } from '../models/Report.model';

// ============================================================
// Report Controller
// ============================================================

// GET /api/reports/stats — retrieve user dashboard statistics
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;

    const [totalDatasets, totalReports, readyReports, totalChats, reports] = await Promise.all([
      DatasetModel.countDocuments({ userId }),
      ReportModel.countDocuments({ userId }),
      ReportModel.countDocuments({ userId, status: 'ready' }),
      ChatModel.countDocuments({ userId }),
      ReportModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status coverImage category createdAt')
        .lean(),
    ]);

    const successRate = totalReports > 0 ? Math.round((readyReports / totalReports) * 100) : 100;

    // Generate dynamic activity chart data for the last 6 months
    const activityChart: Record<string, string | number>[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      // Mock some activity values scaled to actual reports
      activityChart.push({
        name: label,
        Reports: Math.ceil(readyReports * (0.1 + Math.random() * 0.2)),
        Datasets: Math.ceil(totalDatasets * (0.1 + Math.random() * 0.2)),
      });
    }

    sendSuccess(res, {
      stats: {
        totalDatasets,
        totalReports,
        readyReports,
        totalChats,
        successRate,
      },
      recentReports: reports,
      activityChart,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/public — public explore page (no auth required)
export async function getPublicReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      sort = 'createdAt',
      order = 'desc',
      from,
      to,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: Record<string, unknown> = { isPublic: true, status: 'ready' };
    if (category && category !== 'all') filter.category = category;
    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;
      if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField: Record<string, 1 | -1> = {};
    if (sort === 'confidence') sortField.aiConfidenceScore = sortOrder;
    else if (sort === 'views') sortField.viewCount = sortOrder;
    else sortField.createdAt = sortOrder;

    const [reports, total] = await Promise.all([
      ReportModel.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .select('title shortDescription category coverImage datasetSize aiConfidenceScore businessHealth viewCount createdAt')
        .lean(),
      ReportModel.countDocuments(filter),
    ]);

    sendSuccess(res, {
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      categories: BUSINESS_CATEGORIES,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/reports/generate — trigger AI analysis on a dataset
export async function generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { datasetId, title, shortDescription, description, category, coverImage } = req.body;

    if (!datasetId || !title) {
      sendError(res, 'datasetId and title are required', 400);
      return;
    }

    const dataset = await DatasetModel.findOne({ _id: datasetId, userId });
    if (!dataset) {
      sendNotFound(res, 'Dataset not found');
      return;
    }

    // Kick off async generation (fire-and-forget style to return quickly)
    const report = await reportService.generateReport(
      dataset,
      title,
      description,
      category,
      shortDescription,
      coverImage
    );

    sendCreated(res, { report }, 'Report generation started successfully');
  } catch (error) {
    next(error);
  }
}

// GET /api/reports — current user's reports
export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { page = '1', limit = '10', status, search } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const [reports, total] = await Promise.all([
      ReportModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReportModel.countDocuments(filter),
    ]);

    sendSuccess(res, {
      reports,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/:id — single report (owner or public)
export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const report = await ReportModel.findById(id);
    if (!report) {
      sendNotFound(res, 'Report not found');
      return;
    }

    // Check access: owner always allowed, otherwise must be public
    if (!report.isPublic && (!userId || report.userId.toString() !== userId.toString())) {
      sendError(res, 'Access denied', 403);
      return;
    }

    // Increment view count
    await ReportModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 }, lastViewedAt: new Date() });

    sendSuccess(res, { report });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/reports/:id
export async function deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const report = await ReportModel.findOneAndDelete({ _id: id, userId });
    if (!report) {
      sendNotFound(res, 'Report not found');
      return;
    }

    sendSuccess(res, {}, 'Report deleted successfully');
  } catch (error) {
    next(error);
  }
}
