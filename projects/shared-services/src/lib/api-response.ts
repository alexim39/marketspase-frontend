

// =========================================
// RESPONSE MODELS
// =========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}
