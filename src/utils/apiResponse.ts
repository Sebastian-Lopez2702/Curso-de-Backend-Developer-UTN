export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = <T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T> => ({
  success: true,
  data,
  message,
  meta,
});

export const errorResponse = (message: string, error?: unknown): ApiResponse => ({
  success: false,
  message,
  error,
});
