import { PipelineRun, PipelineStep, StepLogLine, Repository } from '../types/ci';

export interface TriggerOptions {
  repo: Repository;
  branch: string;
  commitHash?: string;
  commitMessage: string;
  author: string;
  authorEmail: string;
  triggerType: 'WEBHOOK_PUSH' | 'MANUAL_DISPATCH' | 'PULL_REQUEST';
  failureScenario?: 'NONE' | 'TEST_FAILURE' | 'BUILD_SYNTAX_ERROR' | 'LINT_ERROR' | 'DEPLOY_TIMEOUT';
  customSteps?: { name: string; command: string; durationSec: number }[];
}

export async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'mocked_test_signature';
  }
}

export async function sendWebhookPushToBackend(options: TriggerOptions, payload: any): Promise<any> {
  try {
    const rawBody = JSON.stringify(payload);
    const hex = await computeHmacSha256Hex(options.repo.webhookSecret, rawBody);
    const res = await fetch(`/api/v1/webhooks/github/${options.repo.owner}/${options.repo.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-github-event': 'push',
        'x-hub-signature-256': `sha256=${hex}`,
      },
      body: rawBody
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend webhook dispatch fallback to client runner', err);
  }
  return null;
}

export async function sendManualRunToBackend(payload: any): Promise<any> {
  try {
    const res = await fetch('/api/v1/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend manual run dispatch fallback', err);
  }
  return null;
}

export async function cancelRunOnBackend(runId: string): Promise<void> {
  try {
    await fetch(`/api/v1/runs/${runId}/cancel`, { method: 'POST' });
  } catch (err) {
    console.warn('Backend run cancel error', err);
  }
}

export async function updateRunOnBackend(runId: string, updates: Record<string, any>): Promise<void> {
  try {
    await fetch(`/api/v1/runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.warn('Backend run update error', err);
  }
}

export async function createRepoOnBackend(repoData: Partial<Repository>): Promise<any> {
  try {
    const res = await fetch('/api/v1/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repoData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend repo creation error', err);
  }
  return null;
}

function generateShortHash(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
}

export function createNewPipelineRun(options: TriggerOptions, nextRunNumber: number): PipelineRun {
  const commitSha = options.commitHash || generateShortHash();
  const workerNodes = ['k8s-worker-node-us-east-1a', 'k8s-worker-node-us-east-1b', 'k8s-worker-node-us-east-2c', 'k8s-worker-node-eu-west-1a'];
  const assignedWorker = workerNodes[Math.floor(Math.random() * workerNodes.length)];
  const containerId = `docker-runner-${Math.random().toString(36).substring(2, 9)}`;
  const kafkaOffset = 48900 + nextRunNumber * 3;
  const now = new Date();

  // Create default 3-step or custom pipeline
  const steps: PipelineStep[] = [
    {
      id: `step-build-${Date.now()}-1`,
      name: 'Build',
      command: 'npm run build',
      status: 'QUEUED',
      durationMs: 0,
      logs: []
    },
    {
      id: `step-tests-${Date.now()}-2`,
      name: 'Tests',
      command: 'npm test -- --ci --coverage',
      status: 'QUEUED',
      durationMs: 0,
      logs: []
    },
    {
      id: `step-deploy-${Date.now()}-3`,
      name: 'Deploy',
      command: './scripts/deploy.sh --target=production',
      status: 'QUEUED',
      durationMs: 0,
      logs: []
    }
  ];

  return {
    id: `run-${nextRunNumber}`,
    runNumber: nextRunNumber,
    repoId: options.repo.id,
    repoName: `${options.repo.owner}/${options.repo.name}`,
    branch: options.branch,
    commitHash: commitSha,
    commitMessage: options.commitMessage,
    author: options.author,
    authorEmail: options.authorEmail,
    status: 'QUEUED',
    triggerType: options.triggerType,
    createdAt: now.toISOString(),
    durationTotalMs: 0,
    steps,
    workerNode: assignedWorker,
    containerId,
    kafkaOffset,
    redisKey: `run:${options.repo.owner}:${options.repo.name}:${nextRunNumber}`,
    postgresId: `pg_run_${Date.now()}`,
    failureScenario: options.failureScenario || 'NONE',
  };
}

// Generate realistic log scripts for steps
export function getStepLogScript(
  stepName: string,
  stepIndex: number,
  run: PipelineRun,
  scenario: string
): { lines: { type: StepLogLine['type']; text: string; delayMs: number }[]; willFail: boolean; errorSummary?: string; exitCode: number } {
  const isTestFail = scenario === 'TEST_FAILURE' && (stepName.toLowerCase().includes('test') || stepIndex === 1);
  const isBuildFail = scenario === 'BUILD_SYNTAX_ERROR' && (stepName.toLowerCase().includes('build') || stepIndex === 0);

  if (stepName.toLowerCase().includes('build')) {
    if (isBuildFail) {
      return {
        willFail: true,
        exitCode: 1,
        errorSummary: 'TypeScript compiler error in src/services/api.ts(42,15)',
        lines: [
          { type: 'system', text: `[Docker] Initializing environment container ${run.containerId} (node:20-alpine)...`, delayMs: 200 },
          { type: 'command', text: `$ npm run build`, delayMs: 400 },
          { type: 'stdout', text: `> ${run.repoName.split('/')[1]}@1.0.0 build`, delayMs: 300 },
          { type: 'stdout', text: `> tsc -b && vite build`, delayMs: 400 },
          { type: 'error', text: `src/services/api.ts:42:15 - error TS2339: Property 'validateToken' does not exist on type 'AuthClient'.`, delayMs: 600 },
          { type: 'stderr', text: `42     return this.authClient.validateToken(sessionToken);`, delayMs: 300 },
          { type: 'stderr', text: `                              ~~~~~~~~~~~~~`, delayMs: 200 },
          { type: 'error', text: `Found 1 compilation error in src/services/api.ts.`, delayMs: 400 },
          { type: 'error', text: `npm ERR! Lifecycle script 'build' failed with exit code 1.`, delayMs: 300 }
        ]
      };
    }

    return {
      willFail: false,
      exitCode: 0,
      lines: [
        { type: 'system', text: `[Docker Engine] Container ${run.containerId} spawned on node ${run.workerNode}`, delayMs: 200 },
        { type: 'command', text: `$ npm run build`, delayMs: 350 },
        { type: 'stdout', text: `> ${run.repoName.split('/')[1]}@1.0.0 build`, delayMs: 300 },
        { type: 'stdout', text: `> vite build --mode production`, delayMs: 400 },
        { type: 'stdout', text: `vite v6.2.3 building for production...`, delayMs: 500 },
        { type: 'stdout', text: `transforming (248 modules)...`, delayMs: 600 },
        { type: 'stdout', text: `✓ 312 modules transformed.`, delayMs: 500 },
        { type: 'stdout', text: `rendering chunks...`, delayMs: 400 },
        { type: 'stdout', text: `dist/index.html                   1.42 kB │ gzip:  0.58 kB`, delayMs: 300 },
        { type: 'stdout', text: `dist/assets/index-B7a12.js       248.16 kB │ gzip: 76.12 kB`, delayMs: 300 },
        { type: 'success', text: `✓ Build completed successfully (exit code 0)`, delayMs: 300 }
      ]
    };
  }

  if (stepName.toLowerCase().includes('test')) {
    if (isTestFail) {
      return {
        willFail: true,
        exitCode: 1,
        errorSummary: '3 tests failed in src/auth/__tests__/session.spec.ts',
        lines: [
          { type: 'system', text: `[Docker] Mounting virtual test harness and PostgreSQL test container...`, delayMs: 250 },
          { type: 'command', text: `$ npm test -- --ci`, delayMs: 350 },
          { type: 'stdout', text: `RUNS src/auth/__tests__/session.spec.ts`, delayMs: 400 },
          { type: 'stdout', text: `RUNS src/pipeline/__tests__/runner.spec.ts`, delayMs: 450 },
          { type: 'stdout', text: `PASS src/pipeline/__tests__/runner.spec.ts (18 passed, 18 total)`, delayMs: 550 },
          { type: 'stdout', text: `FAIL src/auth/__tests__/session.spec.ts`, delayMs: 600 },
          { type: 'error', text: `  ● AuthService › validateSessionToken() › should reject expired JWT token`, delayMs: 400 },
          { type: 'stderr', text: `    Expected status code: 401 Unauthorized`, delayMs: 250 },
          { type: 'stderr', text: `    Received status code: 200 OK`, delayMs: 250 },
          { type: 'stderr', text: `      at Object.<anonymous> (src/auth/__tests__/session.spec.ts:48:19)`, delayMs: 200 },
          { type: 'error', text: `  ● AuthService › validateSessionToken() › should invalidate revoked refresh tokens`, delayMs: 350 },
          { type: 'stderr', text: `    AssertionError: expected false to be true`, delayMs: 200 },
          { type: 'error', text: `  ● AuthService › RBACGuard › should enforce role admin on /api/v1/workers`, delayMs: 350 },
          { type: 'stderr', text: `    Error: Access Denied filter bypassed unexpectedly`, delayMs: 200 },
          { type: 'error', text: `Tests:       3 failed, 24 passed, 27 total`, delayMs: 300 },
          { type: 'error', text: `Process completed with exit code 1.`, delayMs: 200 }
        ]
      };
    }

    return {
      willFail: false,
      exitCode: 0,
      lines: [
        { type: 'system', text: `[Docker] Starting Jest / Vitest test runner inside container...`, delayMs: 200 },
        { type: 'command', text: `$ npm test -- --ci --coverage`, delayMs: 350 },
        { type: 'stdout', text: `PASS src/auth/__tests__/session.spec.ts (14 tests passed)`, delayMs: 450 },
        { type: 'stdout', text: `PASS src/pipeline/__tests__/runner.spec.ts (18 tests passed)`, delayMs: 500 },
        { type: 'stdout', text: `PASS src/webhooks/__tests__/github.spec.ts (12 tests passed)`, delayMs: 450 },
        { type: 'stdout', text: `----------------------|---------|----------|---------|---------|`, delayMs: 300 },
        { type: 'stdout', text: `File                  | % Stmts | % Branch | % Funcs | % Lines |`, delayMs: 150 },
        { type: 'stdout', text: `All files             |   94.12 |    91.80 |   96.20 |   94.88 |`, delayMs: 150 },
        { type: 'stdout', text: `----------------------|---------|----------|---------|---------|`, delayMs: 150 },
        { type: 'stdout', text: `Test Suites: 3 passed, 3 total | Tests: 44 passed, 44 total`, delayMs: 300 },
        { type: 'success', text: `✓ All tests passed successfully in isolated test container`, delayMs: 250 }
      ]
    };
  }

  if (stepName.toLowerCase().includes('deploy')) {
    return {
      willFail: false,
      exitCode: 0,
      lines: [
        { type: 'system', text: `[Docker] Authenticating with Kubernetes API Server (us-east-1)...`, delayMs: 250 },
        { type: 'command', text: `$ ./scripts/deploy.sh --target=production`, delayMs: 350 },
        { type: 'stdout', text: `[Deploy] Verifying docker image sha-${run.commitHash}...`, delayMs: 350 },
        { type: 'stdout', text: `[Kubernetes] Patching Deployment '${run.repoName.split('/')[1]}' container specs...`, delayMs: 450 },
        { type: 'stdout', text: `deployment.apps/${run.repoName.split('/')[1]} configured`, delayMs: 300 },
        { type: 'stdout', text: `Waiting for rollout to finish: 1 of 4 updated replicas are available...`, delayMs: 400 },
        { type: 'stdout', text: `Waiting for rollout to finish: 3 of 4 updated replicas are available...`, delayMs: 450 },
        { type: 'stdout', text: `deployment.apps/${run.repoName.split('/')[1]} successfully rolled out (4/4 healthy).`, delayMs: 400 },
        { type: 'stdout', text: `Health check probe /healthz returned HTTP 200 OK.`, delayMs: 300 },
        { type: 'success', text: `✓ Production deployment completed. Status: SUCCESS`, delayMs: 300 }
      ]
    };
  }

  // Generic step fallback
  return {
    willFail: false,
    exitCode: 0,
    lines: [
      { type: 'command', text: `$ ${stepName}`, delayMs: 300 },
      { type: 'stdout', text: `Executing step ${stepName} inside runner...`, delayMs: 400 },
      { type: 'success', text: `✓ Step ${stepName} finished cleanly`, delayMs: 300 }
    ]
  };
}
