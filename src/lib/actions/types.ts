/** Shared return type for server actions: success/error status with optional typed data. */
export type ActionState<T = void> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
