export type TaskType =
  | 'resume-structure'
  | 'requirements-extraction'
  | 'asset-draft'
  | 'gap-analysis';

export interface BudgetPolicy {
  enabled: boolean;
  maxEstimatedCostUsd: number;
  requireConfirmAboveUsd: number;
}

export interface CostEstimate {
  taskType: TaskType;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  estimatedLatencyMs: number;
}

export interface RunOptions {
  schema?: Record<string, unknown>;
  constraints?: string[];
  budget?: BudgetPolicy;
}

export interface LLMProvider {
  id: string;
  supportsTask(taskType: TaskType): boolean;
  run<TOutput = unknown>(taskType: TaskType, input: string, options?: RunOptions): Promise<TOutput>;
  estimate(taskType: TaskType, inputSize: number): CostEstimate;
}

export interface ModelRouter {
  registerProvider(provider: LLMProvider): void;
  run<TOutput = unknown>(
    taskType: TaskType,
    input: string,
    options?: RunOptions,
  ): Promise<{ output: TOutput; providerId: string; estimate: CostEstimate }>;
  estimate(taskType: TaskType, inputSize: number): CostEstimate[];
}
