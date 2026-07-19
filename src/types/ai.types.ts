// ============================================================
// AI Layer Types — shared across services
// ============================================================

export interface CsvColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: string[];
  nullCount: number;
  uniqueCount: number;
}

export interface CsvMetadata {
  rowCount: number;
  columnCount: number;
  columns: CsvColumn[];
  fileSizeBytes: number;
  fileName: string;
}

export interface InsightItem {
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category: 'trend' | 'anomaly' | 'correlation' | 'summary' | 'recommendation';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title: string;
  description: string;
  xKey: string;
  yKey: string;
  data: Record<string, string | number>[];
  color?: string;
}

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

export interface AIInsightResult {
  executiveSummary: string;
  businessHealth: 'excellent' | 'good' | 'fair' | 'poor';
  businessHealthScore: number;
  kpis: IKPI[];
  insights: InsightItem[];
  charts: ChartConfig[];
  recommendations: string[];
  risks: IRisk[];
  growthOpportunities: string[];
  keyMetrics: Record<string, string | number>;
  aiConfidenceScore: number;
  generatedAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  reportTitle: string;
  reportSummary: string;
  businessHealth?: string;
  keyMetrics: Record<string, string | number>;
  kpis: IKPI[];
  insights: InsightItem[];
  risks: IRisk[];
  recommendations: string[];
}

export interface GeminiGenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}
