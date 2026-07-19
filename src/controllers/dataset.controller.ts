import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { DatasetModel } from '../models/Dataset.model';
import { csvService } from '../services/csv.service';
import { env } from '../config/env';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
  buildPaginationMeta,
} from '../utils/response.utils';
import { logger } from '../utils/logger.utils';

// ============================================================
// Dataset Controller
// ============================================================

export async function uploadDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }

    const { name, description } = req.body;
    const userId = req.userId!;

    // Create dataset record
    const dataset = await DatasetModel.create({
      userId,
      name: name || req.file.originalname,
      description,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      status: 'processing',
    });

    // Parse CSV in the background (don't await)
    parseCsvInBackground(dataset._id.toString(), req.file.path, req.file.originalname, req.file.size);

    sendCreated(res, { dataset }, 'Dataset uploaded successfully. Processing in background.');
  } catch (error) {
    next(error);
  }
}

async function parseCsvInBackground(
  datasetId: string,
  filePath: string,
  fileName: string,
  fileSizeBytes: number
): Promise<void> {
  try {
    const { metadata } = await csvService.parseCsvFile(filePath, fileName, fileSizeBytes);
    await DatasetModel.findByIdAndUpdate(datasetId, {
      status: 'ready',
      metadata,
      rowCount: metadata.rowCount,
      columnCount: metadata.columnCount,
    });
    logger.info(`Dataset ${datasetId} processed successfully`);
  } catch (error) {
    logger.error(`Dataset ${datasetId} processing failed:`, error);
    await DatasetModel.findByIdAndUpdate(datasetId, {
      status: 'error',
      errorMessage: (error as Error).message,
    });
  }
}

export async function getDatasets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [datasets, total] = await Promise.all([
      DatasetModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DatasetModel.countDocuments({ userId }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    sendSuccess(res, { datasets }, 'Datasets retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const dataset = await DatasetModel.findOne({ _id: id, userId });
    if (!dataset) {
      sendNotFound(res, 'Dataset');
      return;
    }

    sendSuccess(res, { dataset }, 'Dataset retrieved');
  } catch (error) {
    next(error);
  }
}

export async function deleteDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const dataset = await DatasetModel.findOne({ _id: id, userId });
    if (!dataset) {
      sendNotFound(res, 'Dataset');
      return;
    }

    // Delete physical file
    if (fs.existsSync(dataset.filePath)) {
      fs.unlinkSync(dataset.filePath);
    }

    await DatasetModel.findByIdAndDelete(id);
    sendSuccess(res, null, 'Dataset deleted successfully');
  } catch (error) {
    next(error);
  }
}
