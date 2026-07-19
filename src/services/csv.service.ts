import fs from 'fs';
import csvParser from 'csv-parser';
import { CsvMetadata, CsvColumn } from '../types/ai.types';
import { logger } from '../utils/logger.utils';

// ============================================================
// CSV Parsing & Analysis Service
// ============================================================

interface ParsedCsvResult {
  rows: Record<string, string>[];
  metadata: CsvMetadata;
}

export async function parseCsvFile(
  filePath: string,
  fileName: string,
  fileSizeBytes: number
): Promise<ParsedCsvResult> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const columnStats: Map<string, { values: string[]; nullCount: number; uniqueValues: Set<string> }> = new Map();

    logger.info(`Parsing CSV file: ${fileName}`);

    fs.createReadStream(filePath)
      .pipe(
        csvParser()
      )
      .on('data', (row: Record<string, string>) => {
        rows.push(row);

        // Collect column statistics
        Object.entries(row).forEach(([key, value]) => {
          if (!columnStats.has(key)) {
            columnStats.set(key, { values: [], nullCount: 0, uniqueValues: new Set() });
          }
          const stats = columnStats.get(key)!;
          if (!value || value.trim() === '' || value.toLowerCase() === 'null') {
            stats.nullCount++;
          } else {
            stats.values.push(value);
            stats.uniqueValues.add(value);
          }
        });
      })
      .on('end', () => {
        const columns: CsvColumn[] = Array.from(columnStats.entries()).map(([name, stats]) => ({
          name,
          type: inferColumnType(stats.values),
          sampleValues: stats.values.slice(0, 5),
          nullCount: stats.nullCount,
          uniqueCount: stats.uniqueValues.size,
        }));

        const metadata: CsvMetadata = {
          rowCount: rows.length,
          columnCount: columns.length,
          columns,
          fileSizeBytes,
          fileName,
        };

        logger.info(`CSV parsed: ${rows.length} rows, ${columns.length} columns`);
        resolve({ rows, metadata });
      })
      .on('error', (error) => {
        logger.error('CSV parse error:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      });
  });
}

function inferColumnType(values: string[]): CsvColumn['type'] {
  if (values.length === 0) return 'string';

  const sample = values.slice(0, 20);

  // Check if all are numbers
  if (sample.every((v) => !isNaN(Number(v)) && v.trim() !== '')) {
    return 'number';
  }

  // Check if all are dates
  if (sample.every((v) => !isNaN(Date.parse(v)))) {
    return 'date';
  }

  // Check if all are booleans
  const booleanValues = ['true', 'false', 'yes', 'no', '1', '0'];
  if (sample.every((v) => booleanValues.includes(v.toLowerCase()))) {
    return 'boolean';
  }

  return 'string';
}

export function validateCsvFile(originalName: string, fileSizeBytes: number, maxSizeMB: number): void {
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (ext !== 'csv') {
    throw new Error('Only CSV files are allowed');
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (fileSizeBytes > maxSizeBytes) {
    throw new Error(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
  }
}

export const csvService = {
  parseCsvFile,
  validateCsvFile,
};
