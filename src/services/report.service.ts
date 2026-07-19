import { DatasetModel, IDataset } from '../models/Dataset.model';
import { ReportModel, IReport } from '../models/Report.model';
import { csvService } from './csv.service';
import { generateInsights } from './ai/insight.service';
import { logger } from '../utils/logger.utils';

// ============================================================
// Report Generation Service
// Orchestrates: CSV Parse → AI Analysis → Store Complete Report
// ============================================================

export async function generateReport(
  dataset: IDataset,
  title: string,
  description?: string,
  category?: string,
  shortDescription?: string,
  coverImage?: string
): Promise<IReport> {
  const startTime = Date.now();
  logger.info(`Starting report generation for dataset: ${dataset.name}`);

  // Create report in "generating" state
  const report = await ReportModel.create({
    userId: dataset.userId,
    datasetId: dataset._id,
    title,
    shortDescription,
    description,
    category: category || 'Other',
    coverImage,
    isPublic: true,
    status: 'generating',
    aiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  });

  try {
    // Step 1: Parse CSV
    logger.info(`[Report ${report._id}] Step 1: Parsing CSV...`);
    const { rows, metadata } = await csvService.parseCsvFile(
      dataset.filePath,
      dataset.originalName,
      dataset.fileSizeBytes
    );

    // Step 2: Update dataset with metadata
    await DatasetModel.findByIdAndUpdate(dataset._id, {
      status: 'ready',
      metadata,
      rowCount: metadata.rowCount,
      columnCount: metadata.columnCount,
    });

    // Step 3: Generate AI insights
    logger.info(`[Report ${report._id}] Step 2: Generating AI insights...`);
    const insights = await generateInsights(metadata, rows);

    // Step 4: Save complete report
    const generationTimeMs = Date.now() - startTime;
    const updatedReport = await ReportModel.findByIdAndUpdate(
      report._id,
      {
        status: 'ready',
        // AI Output
        executiveSummary: insights.executiveSummary,
        businessHealth: insights.businessHealth,
        businessHealthScore: insights.businessHealthScore,
        kpis: insights.kpis,
        insights: insights.insights,
        charts: insights.charts,
        recommendations: insights.recommendations,
        risks: insights.risks,
        growthOpportunities: insights.growthOpportunities,
        keyMetrics: insights.keyMetrics,
        aiConfidenceScore: insights.aiConfidenceScore,
        datasetSize: metadata.rowCount,
        generationTimeMs,
      },
      { new: true }
    );

    logger.info(`[Report ${report._id}] Completed in ${generationTimeMs}ms`);
    return updatedReport!;
  } catch (error) {
    logger.error(`[Report ${report._id}] Generation failed:`, error);

    await ReportModel.findByIdAndUpdate(report._id, {
      status: 'error',
      errorMessage: (error as Error).message,
    });

    await DatasetModel.findByIdAndUpdate(dataset._id, {
      status: 'error',
      errorMessage: 'Report generation failed',
    });

    throw error;
  }
}

export const reportService = { generateReport };
