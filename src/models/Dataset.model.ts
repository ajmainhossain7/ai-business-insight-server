import mongoose, { Document, Schema } from 'mongoose';
import { CsvMetadata } from '../types/ai.types';

// ============================================================
// Dataset Model — Uploaded CSV file metadata
// ============================================================

export interface IDataset extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  metadata?: CsvMetadata;
  errorMessage?: string;
  rowCount?: number;
  columnCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const datasetSchema = new Schema<IDataset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'text/csv',
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'],
      default: 'uploading',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    rowCount: {
      type: Number,
    },
    columnCount: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual for file size in MB
datasetSchema.virtual('fileSizeMB').get(function () {
  return (this.fileSizeBytes / (1024 * 1024)).toFixed(2);
});

// Indexes
datasetSchema.index({ userId: 1, createdAt: -1 });
datasetSchema.index({ status: 1 });

export const DatasetModel = mongoose.model<IDataset>('Dataset', datasetSchema);
