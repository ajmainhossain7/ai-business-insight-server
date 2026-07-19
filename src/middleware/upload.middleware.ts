import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env';

// ============================================================
// Multer File Upload Middleware
// ============================================================

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `dataset-${uniqueSuffix}${ext}`);
  },
});

// File type filter — CSV only
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const allowedExtensions = ['.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
}

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

export const uploadSingle = uploadCsv.single('file');

// Multer-specific error handler — exported here for use in routes
export function handleMulterError(err: Error & { code?: string }, _req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void {
  if (err && (err.message?.includes('Only CSV files are allowed') || err.code === 'LIMIT_FILE_SIZE')) {
    res.status(400).json({ success: false, message: err.message || 'File size exceeds the maximum limit.' });
    return;
  }
  next(err);
}
