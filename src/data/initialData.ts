import { PipelineRun, Repository } from '../types/ci';

export const DEFAULT_WORKFLOW_YAML = `name: CodeForge CI/CD Pipeline
on:
  push:
    branches: [ main, staging, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-test-deploy:
    runs-on: codeforge-k8s-runner
    container:
      image: node:20-alpine
      env:
        NODE_ENV: production
        CI: "true"

    steps:
      - name: Checkout Code
        run: git clone --depth=1 \${{ github.repository }} .

      - name: Install Dependencies
        run: npm ci --prefer-offline

      - name: Build
        run: npm run build

      - name: Tests
        run: npm test -- --coverage --ci

      - name: Deploy
        run: ./scripts/deploy.sh --target=production
`;

export const SPRING_BOOT_WORKFLOW_YAML = `name: Spring Boot Java Microservice
on:
  push:
    branches: [ main ]

jobs:
  pipeline:
    runs-on: codeforge-k8s-runner
    container:
      image: openjdk:21-slim
    steps:
      - name: Checkout Code
        run: git clone https://github.com/acme/backend-api.git
      - name: Maven Build
        run: ./mvnw clean package -DskipTests=false
      - name: Unit & Integration Tests
        run: ./mvnw test
      - name: Containerize Docker Image
        run: docker build -t acme/backend-api:\${{ github.sha }} .
      - name: Deploy to Kubernetes
        run: kubectl set image deployment/backend-api app=acme/backend-api:\${{ github.sha }}
`;

export const INITIAL_REPOSITORIES: Repository[] = [
  {
    id: 'repo-1',
    name: 'codeforge-web',
    owner: 'acme',
    description: 'Next-generation web console and front-end interface for CodeForge CI/CD platform',
    defaultBranch: 'main',
    isPrivate: false,
    starsCount: 342,
    webhookUrl: 'https://api.codeforge.internal/v1/webhooks/github/acme/codeforge-web',
    webhookSecret: 'cf_sec_9948271038472910485910',
    lastActive: '10 minutes ago',
    pipelineYaml: DEFAULT_WORKFLOW_YAML,
  },
  {
    id: 'repo-2',
    name: 'spring-auth-service',
    owner: 'acme',
    description: 'High-throughput Spring Boot & PostgreSQL authorization service with Kafka event dispatching',
    defaultBranch: 'main',
    isPrivate: true,
    starsCount: 89,
    webhookUrl: 'https://api.codeforge.internal/v1/webhooks/github/acme/spring-auth-service',
    webhookSecret: 'cf_sec_1182740928374928172648',
    lastActive: '1 hour ago',
    pipelineYaml: SPRING_BOOT_WORKFLOW_YAML,
  },
  {
    id: 'repo-3',
    name: 'payment-gateway-worker',
    owner: 'acme',
    description: 'Dockerized microservice processing asynchronous transaction settlement queues',
    defaultBranch: 'main',
    isPrivate: true,
    starsCount: 154,
    webhookUrl: 'https://api.codeforge.internal/v1/webhooks/github/acme/payment-gateway-worker',
    webhookSecret: 'cf_sec_4472910485910994827103',
    lastActive: '3 hours ago',
    pipelineYaml: DEFAULT_WORKFLOW_YAML,
  }
];

export const INITIAL_RUNS: PipelineRun[] = [
  {
    id: 'run-25',
    runNumber: 25,
    repoId: 'repo-1',
    repoName: 'acme/codeforge-web',
    branch: 'main',
    commitHash: '8e4f1a2',
    commitMessage: 'feat(auth): update session token expiration logic and add RBAC guards',
    author: 'Alex Chen',
    authorEmail: 'alex.chen@acme.dev',
    status: 'FAILED',
    triggerType: 'WEBHOOK_PUSH',
    createdAt: '2026-08-31T08:52:10Z',
    startedAt: '2026-08-31T08:52:12Z',
    finishedAt: '2026-08-31T08:52:54Z',
    durationTotalMs: 42000,
    workerNode: 'k8s-worker-node-us-east-4a',
    containerId: 'docker-c98f2174a',
    kafkaOffset: 48912,
    redisKey: 'run:acme:codeforge-web:25',
    postgresId: 'pg_run_019283849102',
    errorMessage: '3 tests failed in auth.spec.ts',
    errorStepId: 'step-tests',
    failureScenario: 'TEST_FAILURE',
    steps: [
      {
        id: 'step-checkout',
        name: 'Checkout Code',
        command: 'git clone --depth=1 https://github.com/acme/codeforge-web.git .',
        status: 'SUCCESS',
        durationMs: 4000,
        startedAt: '2026-08-31T08:52:12Z',
        finishedAt: '2026-08-31T08:52:16Z',
        logs: [
          { id: 'l-1', timestamp: '08:52:12.102', type: 'system', text: 'Spawning isolated runner container: docker:node-20-alpine (Host: k8s-worker-node-us-east-4a)' },
          { id: 'l-2', timestamp: '08:52:13.210', type: 'command', text: '$ git clone --depth=1 https://github.com/acme/codeforge-web.git .' },
          { id: 'l-3', timestamp: '08:52:14.401', type: 'stdout', text: 'Cloning into \'/workspace/codeforge-web\'...' },
          { id: 'l-4', timestamp: '08:52:15.580', type: 'stdout', text: 'remote: Enumerating objects: 184, done.' },
          { id: 'l-5', timestamp: '08:52:15.910', type: 'stdout', text: 'remote: Total 184 (delta 0), reused 184 (delta 0)' },
          { id: 'l-6', timestamp: '08:52:16.002', type: 'stdout', text: 'HEAD is now at 8e4f1a2 feat(auth): update session token expiration logic' },
          { id: 'l-7', timestamp: '08:52:16.020', type: 'success', text: '✓ Checkout completed in 4s' },
        ],
        exitCode: 0,
      },
      {
        id: 'step-build',
        name: 'Build',
        command: 'npm run build',
        status: 'SUCCESS',
        durationMs: 14000,
        startedAt: '2026-08-31T08:52:16Z',
        finishedAt: '2026-08-31T08:52:30Z',
        logs: [
          { id: 'l-10', timestamp: '08:52:16.104', type: 'command', text: '$ npm run build' },
          { id: 'l-11', timestamp: '08:52:17.220', type: 'stdout', text: '> codeforge-web@1.4.0 build' },
          { id: 'l-12', timestamp: '08:52:17.350', type: 'stdout', text: '> vite build --mode production' },
          { id: 'l-13', timestamp: '08:52:19.410', type: 'stdout', text: 'vite v6.2.3 building for production...' },
          { id: 'l-14', timestamp: '08:52:22.890', type: 'stdout', text: 'transforming (142) src/App.tsx' },
          { id: 'l-15', timestamp: '08:52:26.540', type: 'stdout', text: '✓ 312 modules transformed.' },
          { id: 'l-16', timestamp: '08:52:29.110', type: 'stdout', text: 'dist/index.html                   1.42 kB │ gzip:  0.58 kB' },
          { id: 'l-17', timestamp: '08:52:29.340', type: 'stdout', text: 'dist/assets/index-Dc910f.js     248.16 kB │ gzip: 76.12 kB' },
          { id: 'l-18', timestamp: '08:52:30.010', type: 'success', text: '✓ Build completed successfully in 14s' },
        ],
        exitCode: 0,
      },
      {
        id: 'step-tests',
        name: 'Tests',
        command: 'npm test -- --ci',
        status: 'FAILED',
        durationMs: 24000,
        startedAt: '2026-08-31T08:52:30Z',
        finishedAt: '2026-08-31T08:52:54Z',
        errorSummary: '3 tests failed in src/auth/__tests__/session.spec.ts',
        logs: [
          { id: 'l-20', timestamp: '08:52:30.120', type: 'command', text: '$ npm test -- --ci' },
          { id: 'l-21', timestamp: '08:52:31.450', type: 'stdout', text: 'RUNS src/auth/__tests__/session.spec.ts' },
          { id: 'l-22', timestamp: '08:52:33.200', type: 'stdout', text: 'RUNS src/pipeline/__tests__/runner.spec.ts' },
          { id: 'l-23', timestamp: '08:52:38.110', type: 'stdout', text: 'PASS src/pipeline/__tests__/runner.spec.ts (18 tests)' },
          { id: 'l-24', timestamp: '08:52:42.090', type: 'stdout', text: 'FAIL src/auth/__tests__/session.spec.ts' },
          { id: 'l-25', timestamp: '08:52:45.301', type: 'error', text: '  ● AuthService › validateSessionToken() › should reject expired JWT token' },
          { id: 'l-26', timestamp: '08:52:46.402', type: 'stderr', text: '    Expected status code: 401 Unauthorized' },
          { id: 'l-27', timestamp: '08:52:47.103', type: 'stderr', text: '    Received status code: 200 OK' },
          { id: 'l-28', timestamp: '08:52:48.210', type: 'stderr', text: '      at Object.<anonymous> (src/auth/__tests__/session.spec.ts:48:19)' },
          { id: 'l-29', timestamp: '08:52:49.001', type: 'error', text: '  ● AuthService › validateSessionToken() › should invalidate revoked refresh tokens' },
          { id: 'l-30', timestamp: '08:52:50.120', type: 'stderr', text: '    AssertionError: expected false to be true' },
          { id: 'l-31', timestamp: '08:52:51.300', type: 'error', text: '  ● AuthService › RBACGuard › should enforce role admin on /api/v1/workers' },
          { id: 'l-32', timestamp: '08:52:52.410', type: 'stderr', text: '    Error: Access Denied filter bypassed unexpectedly' },
          { id: 'l-33', timestamp: '08:52:53.900', type: 'error', text: 'Tests:       3 failed, 24 passed, 27 total' },
          { id: 'l-34', timestamp: '08:52:54.002', type: 'error', text: 'Snapshots:   0 total' },
          { id: 'l-35', timestamp: '08:52:54.015', type: 'error', text: 'Time:        24.12s' },
          { id: 'l-36', timestamp: '08:52:54.020', type: 'stderr', text: 'Process completed with exit code 1.' }
        ],
        exitCode: 1,
      },
      {
        id: 'step-deploy',
        name: 'Deploy',
        command: './scripts/deploy.sh --target=production',
        status: 'SKIPPED',
        durationMs: 0,
        logs: [
          { id: 'l-40', timestamp: '08:52:54.050', type: 'system', text: 'Step skipped due to previous step failure (step-tests exitCode 1).' }
        ]
      }
    ]
  },
  {
    id: 'run-24',
    runNumber: 24,
    repoId: 'repo-1',
    repoName: 'acme/codeforge-web',
    branch: 'main',
    commitHash: '3b9c7d1',
    commitMessage: 'fix(parser): optimize webhook payload deserialization in Spring backend',
    author: 'Sarah Jenkins',
    authorEmail: 'sarah.j@acme.dev',
    status: 'SUCCESS',
    triggerType: 'WEBHOOK_PUSH',
    createdAt: '2026-08-31T08:14:00Z',
    startedAt: '2026-08-31T08:14:02Z',
    finishedAt: '2026-08-31T08:15:07Z',
    durationTotalMs: 65000,
    workerNode: 'k8s-worker-node-us-east-1b',
    containerId: 'docker-a44e9910f',
    kafkaOffset: 48901,
    redisKey: 'run:acme:codeforge-web:24',
    postgresId: 'pg_run_019283710294',
    steps: [
      {
        id: 'step-checkout',
        name: 'Checkout Code',
        command: 'git clone --depth=1 https://github.com/acme/codeforge-web.git .',
        status: 'SUCCESS',
        durationMs: 3000,
        startedAt: '2026-08-31T08:14:02Z',
        finishedAt: '2026-08-31T08:14:05Z',
        logs: [
          { id: 'l-101', timestamp: '08:14:02.100', type: 'system', text: 'Worker assigned: k8s-worker-node-us-east-1b' },
          { id: 'l-102', timestamp: '08:14:03.010', type: 'command', text: '$ git clone --depth=1 https://github.com/acme/codeforge-web.git .' },
          { id: 'l-103', timestamp: '08:14:05.100', type: 'stdout', text: 'HEAD is now at 3b9c7d1 fix(parser): optimize webhook payload deserialization' },
          { id: 'l-104', timestamp: '08:14:05.110', type: 'success', text: '✓ Checkout completed in 3s' }
        ],
        exitCode: 0,
      },
      {
        id: 'step-build',
        name: 'Build',
        command: 'npm run build',
        status: 'SUCCESS',
        durationMs: 18000,
        startedAt: '2026-08-31T08:14:05Z',
        finishedAt: '2026-08-31T08:14:23Z',
        logs: [
          { id: 'l-110', timestamp: '08:14:05.200', type: 'command', text: '$ npm run build' },
          { id: 'l-111', timestamp: '08:14:07.110', type: 'stdout', text: 'vite v6.2.3 building for production...' },
          { id: 'l-112', timestamp: '08:14:15.890', type: 'stdout', text: '✓ 310 modules transformed.' },
          { id: 'l-113', timestamp: '08:14:22.900', type: 'stdout', text: 'dist/assets/index-B71e.js  246.80 kB' },
          { id: 'l-114', timestamp: '08:14:23.010', type: 'success', text: '✓ Build completed in 18s' }
        ],
        exitCode: 0,
      },
      {
        id: 'step-tests',
        name: 'Tests',
        command: 'npm test -- --ci',
        status: 'SUCCESS',
        durationMs: 32000,
        startedAt: '2026-08-31T08:14:23Z',
        finishedAt: '2026-08-31T08:14:55Z',
        logs: [
          { id: 'l-120', timestamp: '08:14:23.100', type: 'command', text: '$ npm test -- --ci' },
          { id: 'l-121', timestamp: '08:14:27.400', type: 'stdout', text: 'PASS src/auth/__tests__/session.spec.ts (14 tests)' },
          { id: 'l-122', timestamp: '08:14:38.200', type: 'stdout', text: 'PASS src/pipeline/__tests__/runner.spec.ts (18 tests)' },
          { id: 'l-123', timestamp: '08:14:50.100', type: 'stdout', text: 'PASS src/webhooks/__tests__/github.spec.ts (12 tests)' },
          { id: 'l-124', timestamp: '08:14:54.890', type: 'stdout', text: 'Test Suites: 3 passed, 3 total | Tests: 44 passed, 44 total' },
          { id: 'l-125', timestamp: '08:14:55.010', type: 'success', text: '✓ Tests completed in 32s' }
        ],
        exitCode: 0,
      },
      {
        id: 'step-deploy',
        name: 'Deploy',
        command: './scripts/deploy.sh --target=production',
        status: 'SUCCESS',
        durationMs: 15000,
        startedAt: '2026-08-31T08:14:55Z',
        finishedAt: '2026-08-31T08:15:10Z',
        logs: [
          { id: 'l-130', timestamp: '08:14:55.100', type: 'command', text: '$ ./scripts/deploy.sh --target=production' },
          { id: 'l-131', timestamp: '08:14:57.200', type: 'stdout', text: 'Authenticating with Kubernetes cluster us-east-1-prod...' },
          { id: 'l-132', timestamp: '08:15:01.400', type: 'stdout', text: 'Rolling update deployment/codeforge-web to image sha-3b9c7d1...' },
          { id: 'l-133', timestamp: '08:15:08.100', type: 'stdout', text: 'deployment.apps/codeforge-web successfully rolled out (4/4 pods ready).' },
          { id: 'l-134', timestamp: '08:15:10.005', type: 'success', text: '✓ Production deploy verified. Status: SUCCESS' }
        ],
        exitCode: 0,
      }
    ]
  },
  {
    id: 'run-23',
    runNumber: 23,
    repoId: 'repo-2',
    repoName: 'acme/spring-auth-service',
    branch: 'main',
    commitHash: 'fa2109b',
    commitMessage: 'refactor(kafka): configure consumer concurrency and dead-letter topics',
    author: 'Elena Rostova',
    authorEmail: 'elena.r@acme.dev',
    status: 'SUCCESS',
    triggerType: 'WEBHOOK_PUSH',
    createdAt: '2026-08-31T07:30:10Z',
    startedAt: '2026-08-31T07:30:12Z',
    finishedAt: '2026-08-31T07:31:16Z',
    durationTotalMs: 64000,
    workerNode: 'k8s-worker-node-us-east-2c',
    containerId: 'docker-88912cba1',
    kafkaOffset: 48870,
    redisKey: 'run:acme:spring-auth-service:23',
    postgresId: 'pg_run_019283590123',
    steps: [
      {
        id: 'step-checkout',
        name: 'Checkout Code',
        command: 'git clone https://github.com/acme/spring-auth-service.git',
        status: 'SUCCESS',
        durationMs: 4000,
        logs: [
          { id: 'l-201', timestamp: '07:30:12.000', type: 'command', text: '$ git clone https://github.com/acme/spring-auth-service.git' },
          { id: 'l-202', timestamp: '07:30:16.000', type: 'success', text: '✓ Cloned 54MB repo in 4s' }
        ]
      },
      {
        id: 'step-build',
        name: 'Build',
        command: './mvnw clean compile',
        status: 'SUCCESS',
        durationMs: 19000,
        logs: [
          { id: 'l-203', timestamp: '07:30:16.000', type: 'command', text: '$ ./mvnw clean compile' },
          { id: 'l-204', timestamp: '07:30:35.000', type: 'success', text: '[INFO] BUILD SUCCESS (19s)' }
        ]
      },
      {
        id: 'step-tests',
        name: 'Tests',
        command: './mvnw test',
        status: 'SUCCESS',
        durationMs: 31000,
        logs: [
          { id: 'l-205', timestamp: '07:30:35.000', type: 'command', text: '$ ./mvnw test' },
          { id: 'l-206', timestamp: '07:31:06.000', type: 'success', text: '[INFO] Tests run: 62, Failures: 0, Errors: 0 (31s)' }
        ]
      },
      {
        id: 'step-deploy',
        name: 'Deploy',
        command: 'kubectl apply -f k8s/production.yaml',
        status: 'SUCCESS',
        durationMs: 14000,
        logs: [
          { id: 'l-207', timestamp: '07:31:06.000', type: 'command', text: '$ kubectl apply -f k8s/production.yaml' },
          { id: 'l-208', timestamp: '07:31:20.000', type: 'success', text: '✓ Deployment rolled out successfully in 14s' }
        ]
      }
    ]
  },
  {
    id: 'run-22',
    runNumber: 22,
    repoId: 'repo-3',
    repoName: 'acme/payment-gateway-worker',
    branch: 'staging',
    commitHash: '99c1e40',
    commitMessage: 'chore(deps): bump redis client version and connection pool limits',
    author: 'Michael Scott',
    authorEmail: 'm.scott@acme.dev',
    status: 'SUCCESS',
    triggerType: 'MANUAL_DISPATCH',
    createdAt: '2026-08-31T06:10:00Z',
    startedAt: '2026-08-31T06:10:02Z',
    finishedAt: '2026-08-31T06:11:11Z',
    durationTotalMs: 69000,
    workerNode: 'k8s-worker-node-us-east-1a',
    containerId: 'docker-fe7712a9',
    kafkaOffset: 48834,
    redisKey: 'run:acme:payment-gateway-worker:22',
    postgresId: 'pg_run_019283410928',
    steps: [
      {
        id: 'step-build',
        name: 'Build',
        command: 'docker build -t worker:staging .',
        status: 'SUCCESS',
        durationMs: 20000,
        logs: [{ id: 'l-301', timestamp: '06:10:02.000', type: 'success', text: '✓ Docker image built in 20s' }]
      },
      {
        id: 'step-tests',
        name: 'Tests',
        command: 'pytest tests/integration',
        status: 'SUCCESS',
        durationMs: 33000,
        logs: [{ id: 'l-302', timestamp: '06:10:22.000', type: 'success', text: '✓ 52 test cases passed in 33s' }]
      },
      {
        id: 'step-deploy',
        name: 'Deploy',
        command: 'helm upgrade --install payment-worker ./chart',
        status: 'SUCCESS',
        durationMs: 16000,
        logs: [{ id: 'l-303', timestamp: '06:10:55.000', type: 'success', text: '✓ Staging helm release updated in 16s' }]
      }
    ]
  }
];
