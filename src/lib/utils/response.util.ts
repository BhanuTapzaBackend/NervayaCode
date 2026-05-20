export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

export function successResponse<T>(message: string, data?: T, statusCode: number = 200): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
}

export function errorResponse(message: string, _error?: unknown, statusCode: number = 400): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
    statusCode,
  };
}
