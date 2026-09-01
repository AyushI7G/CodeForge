import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PipelineRunsList } from './components/PipelineRunsList';
import { RunDetailsView } from './components/RunDetailsView';
import { WorkflowEditor } from './components/WorkflowEditor';
import { RepositoriesView } from './components/RepositoriesView';
import { ArchitectureMonitor } from './components/ArchitectureMonitor';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';

import { PipelineRun, Repository, SystemArchitectureStats, PipelineStep } from './types/ci';
import { INITIAL_RUNS, INITIAL_REPOSITORIES, DEFAULT_WORKFLOW_YAML } from './data/initialData';
import { 
  createNewPipelineRun, 
  getStepLogScript, 
  TriggerOptions, 
  sendWebhookPushToBackend, 
  sendManualRunToBackend, 
  cancelRunOnBackend, 
  updateRunOnBackend, 
  createRepoOnBackend 
} from './services/pipelineEngine';

export default function App() {
  const [runs, setRuns] = useState<PipelineRun[]>(() => {
    const saved = localStorage.getItem('codeforge_runs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_RUNS;
  });

  const [repositories, setRepositories] = useState<Repository[]>(() => {
    const saved = localStorage.getItem('codeforge_repos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_REPOSITORIES;
  });

  const [currentWorkflowYaml, setCurrentWorkflowYaml] = useState<string>(DEFAULT_WORKFLOW_YAML);
  const [activeTab, setActiveTab] = useState<'pipelines' | 'workflow' | 'repos' | 'architecture'>('pipelines');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);
  const [activeTargetRepo, setActiveTargetRepo] = useState<Repository | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active execution runners reference to support canceling
  const activeTimersRef = useRef<{ [runId: string]: boolean }>({});

  // Sync with Backend Server on Initial Mount
  useEffect(() => {
    fetch('/api/v1/repos')
      .then(res => res.ok ? res.json() : null)
      .then(serverRepoList => {
        if (serverRepoList && Array.isArray(serverRepoList) && serverRepoList.length > 0) {
          setRepositories(prev => {
            const map = new Map(prev.map(r => [r.id, r]));
            serverRepoList.forEach((sr: any) => {
              if (!map.has(sr.id)) {
                map.set(sr.id, {
                  ...sr,
                  description: sr.description || 'Microservice project connected to CodeForge',
                  starsCount: sr.starsCount || 0,
                  pipelineYaml: DEFAULT_WORKFLOW_YAML
                });
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('codeforge_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('codeforge_repos', JSON.stringify(repositories));
  }, [repositories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // System Stats calculation
  const runningRuns = runs.filter(r => r.status === 'RUNNING');
  const completedRuns = runs.filter(r => r.status === 'SUCCESS' || r.status === 'FAILED');
  const successRuns = runs.filter(r => r.status === 'SUCCESS');

  const stats: SystemArchitectureStats = {
    springBootStatus: 'HEALTHY',
    kafkaQueueDepth: runs.filter(r => r.status === 'QUEUED').length,
    kafkaTopic: 'ci.jobs.dispatch',
    redisMemoryUsageKb: 1240 + runs.length * 12,
    redisCachedKeys: runs.length,
    k8sActiveWorkerPods: Math.min(4, Math.max(2, runningRuns.length + 1)),
    k8sMaxWorkerPods: 10,
    dockerContainersActive: runningRuns.length,
    postgresRowCount: 120 + runs.length,
    postgresStatus: 'CONNECTED',
    totalCompletedRuns: completedRuns.length,
    successRatePercentage: completedRuns.length > 0 
      ? Math.round((successRuns.length / completedRuns.length) * 100) 
      : 100,
    avgDurationSeconds: 38,
  };

  // Helper to update a run in state
  const updateRunState = (runId: string, updater: (prev: PipelineRun) => PipelineRun) => {
    setRuns(prevRuns => prevRuns.map(r => r.id === runId ? updater(r) : r));
  };

  // Asynchronous Pipeline Engine Worker Simulation
  const executePipelineRun = async (newRun: PipelineRun) => {
    const runId = newRun.id;
    activeTimersRef.current[runId] = true;

    // 1. Mark status as RUNNING, assign start time
    const startTime = Date.now();
    updateRunState(runId, run => ({
      ...run,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    }));

    let hasFailed = false;

    // 2. Iterate through each step sequentially
    for (let stepIndex = 0; stepIndex < newRun.steps.length; stepIndex++) {
      if (!activeTimersRef.current[runId]) break; // Cancelled
      if (hasFailed) {
        // Skip remaining steps if previous failed
        updateRunState(runId, run => ({
          ...run,
          steps: run.steps.map((s, idx) => idx >= stepIndex ? { ...s, status: 'SKIPPED', durationMs: 0 } : s)
        }));
        break;
      }

      const currentStep = newRun.steps[stepIndex];
      const stepStartTime = Date.now();

      // Mark step as RUNNING
      updateRunState(runId, run => ({
        ...run,
        steps: run.steps.map((s, idx) => idx === stepIndex ? {
          ...s,
          status: 'RUNNING',
          startedAt: new Date().toISOString(),
          logs: [{ id: `init-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), type: 'system', text: `Starting execution of ${s.name} inside container ${run.containerId}...` }]
        } : s)
      }));

      // Generate step log script
      const script = getStepLogScript(
        currentStep.name,
        stepIndex,
        newRun,
        newRun.failureScenario || 'NONE'
      );

      // Stream logs line by line
      for (const logLine of script.lines) {
        if (!activeTimersRef.current[runId]) break;

        await new Promise(resolve => setTimeout(resolve, logLine.delayMs));

        updateRunState(runId, run => ({
          ...run,
          steps: run.steps.map((s, idx) => idx === stepIndex ? {
            ...s,
            durationMs: Date.now() - stepStartTime,
            logs: [
              ...s.logs,
              {
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString(),
                type: logLine.type,
                text: logLine.text,
              }
            ]
          } : s)
        }));
      }

      if (!activeTimersRef.current[runId]) break;

      const stepDuration = Date.now() - stepStartTime;

      if (script.willFail) {
        hasFailed = true;
        updateRunState(runId, run => ({
          ...run,
          status: 'FAILED',
          errorMessage: script.errorSummary || 'Step failed with non-zero exit code',
          errorStepId: currentStep.id,
          finishedAt: new Date().toISOString(),
          durationTotalMs: Date.now() - startTime,
          steps: run.steps.map((s, idx) => idx === stepIndex ? {
            ...s,
            status: 'FAILED',
            durationMs: stepDuration,
            finishedAt: new Date().toISOString(),
            exitCode: script.exitCode,
            errorSummary: script.errorSummary,
          } : s)
        }));
      } else {
        // Mark step as SUCCESS
        updateRunState(runId, run => ({
          ...run,
          steps: run.steps.map((s, idx) => idx === stepIndex ? {
            ...s,
            status: 'SUCCESS',
            durationMs: stepDuration,
            finishedAt: new Date().toISOString(),
            exitCode: 0,
          } : s)
        }));
      }
    }

    // 3. Finalize run status if not failed or cancelled
    if (activeTimersRef.current[runId] && !hasFailed) {
      const finalDuration = Date.now() - startTime;
      updateRunState(runId, run => ({
        ...run,
        status: 'SUCCESS',
        finishedAt: new Date().toISOString(),
        durationTotalMs: finalDuration,
      }));
      updateRunOnBackend(runId, {
        status: 'SUCCESS',
        finishedAt: new Date().toISOString(),
        durationTotalMs: finalDuration
      });
      showToast(`Pipeline #${newRun.runNumber} completed successfully!`);
    } else if (hasFailed) {
      const finalDuration = Date.now() - startTime;
      updateRunOnBackend(runId, {
        status: 'FAILED',
        finishedAt: new Date().toISOString(),
        durationTotalMs: finalDuration
      });
      showToast(`Pipeline #${newRun.runNumber} failed. Check logs for details.`);
    }

    delete activeTimersRef.current[runId];
  };

  // Triggering new Push / Webhook Run
  const handleTriggerPush = async (options: TriggerOptions) => {
    const nextNumber = Math.max(...runs.map(r => r.runNumber), 25) + 1;
    const newRun = createNewPipelineRun(options, nextNumber);

    setRuns(prev => [newRun, ...prev]);
    setSelectedRunId(newRun.id);
    setActiveTab('pipelines');
    showToast(`GitHub Webhook received! Pipeline #${nextNumber} queued in Kafka.`);

    // Dispatch to Backend REST API / Webhook Endpoint
    if (options.triggerType === 'WEBHOOK_PUSH') {
      const simulatedPayload = {
        ref: `refs/heads/${options.branch}`,
        after: options.commitHash || newRun.commitHash,
        head_commit: {
          id: options.commitHash || newRun.commitHash,
          message: options.commitMessage,
          timestamp: new Date().toISOString(),
          author: {
            name: options.author,
            email: options.authorEmail
          }
        },
        pusher: {
          name: options.author,
          email: options.authorEmail
        },
        repository: {
          name: options.repo.name,
          full_name: `${options.repo.owner}/${options.repo.name}`,
          owner: { name: options.repo.owner }
        }
      };
      sendWebhookPushToBackend(options, simulatedPayload);
    } else {
      sendManualRunToBackend({
        repoName: `${options.repo.owner}/${options.repo.name}`,
        branch: options.branch,
        commitHash: newRun.commitHash,
        commitMessage: options.commitMessage,
        author: options.author,
        authorEmail: options.authorEmail,
        triggerType: options.triggerType
      });
    }

    // Start background execution
    setTimeout(() => {
      executePipelineRun(newRun);
    }, 500);
  };

  // Manual Trigger
  const handleManualTrigger = () => {
    const repo = repositories[0];
    handleTriggerPush({
      repo,
      branch: repo.defaultBranch,
      commitMessage: 'manual: dispatch automated workflow runner',
      author: 'Ayushi Gupta',
      authorEmail: 'ayushi@codeforge.internal',
      triggerType: 'MANUAL_DISPATCH',
      failureScenario: 'NONE'
    });
  };

  // Re-run an existing pipeline
  const handleRerun = (existingRun: PipelineRun) => {
    const targetRepo = repositories.find(r => r.name === existingRun.repoName.split('/')[1]) || repositories[0];
    handleTriggerPush({
      repo: targetRepo,
      branch: existingRun.branch,
      commitHash: existingRun.commitHash,
      commitMessage: `Re-run #${existingRun.runNumber}: ${existingRun.commitMessage}`,
      author: existingRun.author,
      authorEmail: existingRun.authorEmail,
      triggerType: 'MANUAL_DISPATCH',
      failureScenario: existingRun.failureScenario || 'NONE',
    });
  };

  // Cancel an active run
  const handleCancelRun = (runId: string) => {
    activeTimersRef.current[runId] = false;
    updateRunState(runId, run => ({
      ...run,
      status: 'CANCELLED',
      finishedAt: new Date().toISOString(),
      steps: run.steps.map(s => s.status === 'RUNNING' ? { ...s, status: 'CANCELLED' } : (s.status === 'QUEUED' ? { ...s, status: 'SKIPPED' } : s))
    }));
    cancelRunOnBackend(runId);
    showToast(`Pipeline execution cancelled.`);
  };

  const handleAddRepository = (newRepoData: Partial<Repository>) => {
    const newRepo: Repository = {
      id: `repo-${Date.now()}`,
      name: newRepoData.name || 'new-service',
      owner: newRepoData.owner || 'acme',
      description: newRepoData.description || 'Microservice project connected to CodeForge',
      defaultBranch: newRepoData.defaultBranch || 'main',
      isPrivate: newRepoData.isPrivate ?? false,
      starsCount: 0,
      webhookUrl: newRepoData.webhookUrl || `https://api.codeforge.internal/v1/webhooks/github/acme/${newRepoData.name}`,
      webhookSecret: newRepoData.webhookSecret || `cf_sec_${Date.now()}`,
      lastActive: 'Just connected',
      pipelineYaml: DEFAULT_WORKFLOW_YAML,
    };

    setRepositories(prev => [newRepo, ...prev]);
    createRepoOnBackend(newRepo);
    showToast(`Repository ${newRepo.owner}/${newRepo.name} connected.`);
  };

  const selectedRun = runs.find(r => r.id === selectedRunId);

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col selection:bg-gray-200">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'pipelines') setSelectedRunId(null);
        }}
        onOpenWebhookModal={() => {
          setActiveTargetRepo(repositories[0]);
          setIsWebhookModalOpen(true);
        }}
        onNewManualRun={handleManualTrigger}
        stats={stats}
        runningCount={runningRuns.length}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-black text-white px-4 py-2.5 rounded shadow-lg text-xs font-semibold flex items-center space-x-2 border border-gray-700 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pipelines' && (
          selectedRun ? (
            <RunDetailsView
              run={selectedRun}
              onBack={() => setSelectedRunId(null)}
              onRerun={handleRerun}
              onCancel={handleCancelRun}
            />
          ) : (
            <PipelineRunsList
              runs={runs}
              onSelectRun={(run) => setSelectedRunId(run.id)}
              onRerun={handleRerun}
              onCancel={handleCancelRun}
              selectedRunId={selectedRunId || undefined}
            />
          )
        )}

        {activeTab === 'workflow' && (
          <WorkflowEditor
            currentYaml={currentWorkflowYaml}
            onSaveYaml={(newYaml) => {
              setCurrentWorkflowYaml(newYaml);
              showToast('Workflow configuration saved to repository.');
            }}
            onRunWorkflow={() => {
              handleTriggerPush({
                repo: repositories[0],
                branch: 'main',
                commitMessage: 'ci: test new workflow step definition',
                author: 'Ayushi Gupta',
                authorEmail: 'ayushi@codeforge.internal',
                triggerType: 'MANUAL_DISPATCH',
                failureScenario: 'NONE'
              });
            }}
          />
        )}

        {activeTab === 'repos' && (
          <RepositoriesView
            repositories={repositories}
            onAddRepository={handleAddRepository}
            onSelectRepo={(repo) => {
              setCurrentWorkflowYaml(repo.pipelineYaml);
              setActiveTab('workflow');
            }}
            onSimulatePush={(repo) => {
              setActiveTargetRepo(repo);
              setIsWebhookModalOpen(true);
            }}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureMonitor
            stats={stats}
            totalRuns={runs.length}
          />
        )}
      </main>

      {/* Webhook Push Simulator Modal */}
      <WebhookSimulatorModal
        repositories={repositories}
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onTriggerPush={handleTriggerPush}
        initialRepo={activeTargetRepo}
      />
    </div>
  );
}
