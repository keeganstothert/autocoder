export interface ErrorContext {
  action: string;
  error: Error;
  context?: Record<string, unknown>;
}
