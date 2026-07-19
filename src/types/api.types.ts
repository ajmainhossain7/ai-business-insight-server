// ============================================================
// Shared API Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  avatar?: string;
}

export interface UploadDatasetDTO {
  name: string;
  description?: string;
}

export interface GenerateReportDTO {
  title?: string;
  description?: string;
}

export interface SendChatMessageDTO {
  message: string;
}

export type SortOrder = 'asc' | 'desc';
