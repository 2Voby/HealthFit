// src/types/api.types.ts
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };