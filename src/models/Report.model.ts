import mongoose, { Document, Schema } from 'mongoose';
import { ChartConfig, InsightItem } from '../types/ai.types';

// ============================================================
// Report Model — AI-generated business insight reports
// Enhanced with category, confidence, public fields for explore page
// ============================================================

export const BUSINESS_CATEGORIES = [
  'Retail & E-commerce',
  'Finance & Banking',
  'Healthcare',
  'Technology & SaaS',
  'Manufacturing',
  'Logistics & Supply Chain',
  'Marketing & Sales',
  'Human Resources',
  'Real Estate',
  'Education',
  'Food & Beverage',
  'Other',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

export interface IKPI {
  name: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface IRisk {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  datasetId?: mongoose.Types.ObjectId;
  title: string;
  shortDescription?: string;
  description?: string;
  category: string;
  coverImage?: string;
  isPublic: boolean;
  status: 'generating' | 'ready' | 'error';
  // AI Output
  executiveSummary?: string;
  businessHealth?: 'excellent' | 'good' | 'fair' | 'poor';
  businessHealthScore?: number;
  kpis?: IKPI[];
  insights?: InsightItem[];
  charts?: ChartConfig[];
  recommendations?: string[];
  risks?: IRisk[];
  growthOpportunities?: string[];
  keyMetrics?: Record<string, string | number>;
  // Metadata
  aiConfidenceScore?: number;
  aiModel?: string;
  generationTimeMs?: number;
  datasetSize?: number; // rows
  errorMessage?: string;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const insightItemSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    category: {
      type: String,
      enum: ['trend', 'anomaly', 'correlation', 'summary', 'recommendation'],
      required: true,
    },
  },
  { _id: false }
);

const chartConfigSchema = new Schema(
  {
    type: { type: String, enum: ['bar', 'line', 'pie', 'area', 'scatter'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    xKey: { type: String, required: true },
    yKey: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    color: { type: String },
  },
  { _id: false }
);

const kpiSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String },
    trend: { type: String, enum: ['up', 'down', 'stable'] },
    changePercent: { type: Number },
  },
  { _id: false }
);

const riskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
    mitigation: { type: String },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: 'Dataset',
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    coverImage: { type: String },
    isPublic: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['generating', 'ready', 'error'],
      default: 'generating',
    },
    // AI Output fields
    executiveSummary: { type: String },
    businessHealth: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
    },
    businessHealthScore: { type: Number, min: 0, max: 100 },
    kpis: [kpiSchema],
    insights: [insightItemSchema],
    charts: [chartConfigSchema],
    recommendations: [{ type: String }],
    risks: [riskSchema],
    growthOpportunities: [{ type: String }],
    keyMetrics: { type: Schema.Types.Mixed },
    aiConfidenceScore: { type: Number, min: 0, max: 100 },
    aiModel: { type: String },
    generationTimeMs: { type: Number },
    datasetSize: { type: Number },
    errorMessage: { type: String },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound indexes for efficient queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ isPublic: 1, status: 1, createdAt: -1 });
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ title: 'text', shortDescription: 'text' });

export const ReportModel = mongoose.model<IReport>('Report', reportSchema);
