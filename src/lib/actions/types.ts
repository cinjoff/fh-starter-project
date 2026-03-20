export type ActionState<T = void> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
