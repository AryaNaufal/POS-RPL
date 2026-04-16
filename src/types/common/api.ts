export type ApiError = {
  message: string;
  error?: string;
  status?: number;
};

export type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

