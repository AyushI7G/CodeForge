export type StepStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'CANCELLED';

export type PipelineStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type TriggerType = 'WEBHOOK_PUSH' | 'MANUAL_DISPATCH' | 'PULL_REQUEST' | 'SCHEDULED_CRON';

export interface StepLogLine {
  id: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system' | 'command' | 'success' | 'error';
  text: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  command: string;
  status: StepStatus;
  durationMs: number;
  startedAt?: string;
  finishedAt?: string;
  logs: StepLogLine[];
  errorSummary?: string;
  exitCode?: number;
}

export interface PipelineRun {
  id: string;
  runNumber: number;
  repoId: string;
  repoName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  authorEmail: string;
  status: PipelineStatus;
  triggerType: TriggerType;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationTotalMs: number;
  steps: PipelineStep[];
  workerNode: string;
  containerId: string;
  kafkaOffset: number;
  redisKey: string;
  postgresId: string;
  errorMessage?: string;
  errorStepId?: string;
  failureScenario?: 'NONE' | 'TEST_FAILURE' | 'BUILD_SYNTAX_ERROR' | 'LINT_ERROR' | 'DEPLOY_TIMEOUT';
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  defaultBranch: string;
  isPrivate: boolean;
  starsCount: number;
  webhookUrl: string;
  webhookSecret: string;
  lastActive: string;
  pipelineYaml: string;
}

export interface SystemArchitectureStats {
  springBootStatus: 'HEALTHY' | 'DEGRADED';
  kafkaQueueDepth: number;
  kafkaTopic: string;
  redisMemoryUsageKb: number;
  redisCachedKeys: number;
  k8sActiveWorkerPods: number;
  k8sMaxWorkerPods: number;
  dockerContainersActive: number;
  postgresRowCount: number;
  postgresStatus: 'CONNECTED' | 'DISCONNECTED';
  totalCompletedRuns: number;
  successRatePercentage: number;
  avgDurationSeconds: number;
}
