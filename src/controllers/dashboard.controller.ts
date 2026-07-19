import { Request, Response, NextFunction } from 'express';
import { DatasetModel } from '../models/Dataset.model';
import { ReportModel } from '../models/Report.model';
import { ChatModel } from '../models/Chat.model';
import { sendSuccess } from '../utils/response.utils';

// ============================================================
// Dashboard Controller — Aggregated stats for dashboard
// ============================================================

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    const [
      totalDatasets,
      totalReports,
      readyReports,
      totalChats,
      recentReports,
      datasetStatusBreakdown,
    ] = await Promise.all([
      DatasetModel.countDocuments({ userId }),
      ReportModel.countDocuments({ userId }),
      ReportModel.countDocuments({ userId, status: 'ready' }),
      ChatModel.countDocuments({ userId }),
      ReportModel.find({ userId, status: 'ready' })
        .populate('datasetId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt viewCount generationTimeMs'),
      DatasetModel.aggregate([
        { $match: { userId: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Monthly report activity (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyActivity = await ReportModel.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activityChart = monthlyActivity.map((item) => ({
      month: monthNames[item._id.month - 1],
      reports: item.count,
    }));

    sendSuccess(res, {
      stats: {
        totalDatasets,
        totalReports,
        readyReports,
        totalChats,
        successRate: totalReports > 0 ? Math.round((readyReports / totalReports) * 100) : 0,
      },
      recentReports,
      activityChart,
      datasetStatusBreakdown,
    }, 'Dashboard stats retrieved');
  } catch (error) {
    next(error);
  }
}
