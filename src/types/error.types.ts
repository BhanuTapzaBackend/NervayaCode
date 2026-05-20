export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  error: unknown;
}
