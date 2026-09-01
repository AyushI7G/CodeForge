import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  RotateCw, 
  Clock, 
  Ban, 
  GitCommit, 
  GitBranch, 
  User, 
  Terminal, 
  Copy, 
  Download, 
  Search, 
  AlertTriangle,
  ArrowRight,
  Server,
  Layers,
  Database,
  Radio,
  Cpu,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { PipelineRun, PipelineStep, StepLogLine } from '../types/ci';

interface RunDetailsViewProps {
  run: PipelineRun;
  onBack: () => void;
  onRerun: (run: PipelineRun) => void;
  onCancel: (runId: string) => void;
}

export const RunDetailsView: React.FC<RunDetailsViewProps> = ({
  run,
  onBack,
  onRerun,
  onCancel,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showArchTrace, setShowArchTrace] = useState<boolean>(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal when new logs stream in
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [run.steps, autoScroll]);

  // Aggregate logs depending on selected step filter
  const displayedLogs: { stepName: string; log: StepLogLine }[] = [];
  
  run.steps.forEach(step => {
    if (selectedStepId === 'ALL' || selectedStepId === step.id) {
      step.logs.forEach(log => {
        if (!logSearchQuery || log.text.toLowerCase().includes(logSearchQuery.toLowerCase())) {
          displayedLogs.push({ stepName: step.name, log });
        }
      });
    }
  });

  const handleCopyLogs = () => {
    const fullLogText = displayedLogs.map(item => `[${item.log.timestamp}] [${item.stepName}] ${item.log.text}`).join('\n');
    navigator.clipboard.writeText(fullLogText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const fullLogText = displayedLogs.map(item => `[${item.log.timestamp}] [${item.stepName}] ${item.log.text}`).join('\n');
    const blob = new Blob([fullLogText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline-${run.runNumber}-${run.commitHash}-logs.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m ${remSec}s`;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Check className="w-4 h-4 text-black stroke-[3]" />;
      case 'FAILED':
        return <X className="w-4 h-4 text-white stroke-[3]" />;
      case 'RUNNING':
        return <RotateCw className="w-4 h-4 text-black animate-spin" />;
      case 'SKIPPED':
        return <span className="text-gray-400 font-mono text-sm">&oslash;</span>;
      default:
        return <span className="w-2 h-2 rounded-full bg-gray-300"></span>;
    }
  };

  const getStepNodeBadgeClass = (status: string, isSelected: boolean) => {
    let base = 'relative flex items-center justify-between p-3 border transition-all rounded cursor-pointer text-left ';
    if (isSelected) {
      base += 'ring-2 ring-black ';
    }
    switch (status) {
      case 'SUCCESS':
        return base + 'bg-white border-black text-black';
      case 'FAILED':
        return base + 'bg-gray-900 border-gray-900 text-white';
      case 'RUNNING':
        return base + 'bg-gray-100 border-gray-400 text-black animate-pulse';
      case 'SKIPPED':
        return base + 'bg-gray-50 border-gray-200 text-gray-400 opacity-60';
      default:
        return base + 'bg-gray-50 border-gray-300 text-gray-600';
    }
  };

  return (
    <div id="run-details-container" className="space-y-6">
      {/* Top Breadcrumb & Run Summary Header */}
      <div className="bg-white border border-gray-300 p-5 rounded shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <button
            id="btn-back-to-runs"
            onClick={onBack}
            className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to All Pipelines</span>
          </button>

          <div className="flex items-center space-x-2">
            {run.status === 'RUNNING' ? (
              <button
                id="btn-cancel-active-run"
                onClick={() => onCancel(run.id)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-800 bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors rounded cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
                <span>Cancel Execution</span>
              </button>
            ) : (
              <button
                id="btn-rerun-active-run"
                onClick={() => onRerun(run)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors rounded cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5 text-white" />
                <span>Re-run Pipeline</span>
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Run Details Metadata */}
        <div className="pt-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-black font-mono tracking-tight">
                Pipeline #{run.runNumber}
              </h1>
              {run.status === 'SUCCESS' && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-white text-black border border-black rounded">
                  <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                  SUCCESS
                </span>
              )}
              {run.status === 'FAILED' && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-gray-900 text-white rounded">
                  <X className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                  FAILED
                </span>
              )}
              {run.status === 'RUNNING' && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-gray-100 text-black border border-gray-400 rounded animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  RUNNING
                </span>
              )}
              {run.status === 'QUEUED' && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  QUEUED
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-black">{run.commitMessage}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 font-mono">
              <span className="text-black font-semibold">{run.repoName}</span>
              <span className="text-gray-300">/</span>
              <span className="inline-flex items-center text-gray-800 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded text-[11px]">
                <GitBranch className="w-3 h-3 mr-1 text-gray-700" />
                {run.branch}
              </span>
              <span className="text-gray-300">/</span>
              <span className="inline-flex items-center text-gray-800 bg-gray-100 px-2 py-0.5 border border-gray-200 rounded text-[11px]">
                <GitCommit className="w-3 h-3 mr-1 text-gray-700" />
                {run.commitHash}
              </span>
              <span className="text-gray-300">/</span>
              <span className="inline-flex items-center text-gray-800">
                <User className="w-3 h-3 mr-1 text-gray-600" />
                {run.author}
              </span>
            </div>
          </div>

          {/* Quick timing metrics */}
          <div className="flex items-center space-x-4 bg-gray-50 border border-gray-200 p-3 rounded text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Total Duration</span>
              <span className="text-sm font-bold text-black">{formatDuration(run.durationTotalMs)}</span>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Trigger</span>
              <span className="text-xs font-bold text-gray-800">
                {run.triggerType === 'WEBHOOK_PUSH' ? 'GitHub Push' : 'Manual'}
              </span>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <span className="text-[10px] text-gray-500 block uppercase font-bold">Worker Node</span>
              <span className="text-xs text-gray-700">{run.workerNode.split('-').pop()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline DAG Flow (Interactive Steps) */}
      <div className="bg-white border border-gray-300 p-4 rounded shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Pipeline Execution Flow (DAG)
          </h2>
          <span className="text-xs text-gray-500">
            Click any step to filter terminal logs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {run.steps.map((step, idx) => {
            const isStepSelected = selectedStepId === step.id;
            return (
              <div
                key={step.id}
                id={`step-node-${step.id}`}
                onClick={() => setSelectedStepId(isStepSelected ? 'ALL' : step.id)}
                className={getStepNodeBadgeClass(step.status, isStepSelected)}
              >
                <div className="space-y-1 overflow-hidden pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold font-mono uppercase opacity-70">
                      Step {idx + 1}
                    </span>
                    <span className="text-xs font-bold truncate">
                      {step.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono opacity-80 truncate">
                    {step.command}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.status === 'FAILED' ? 'bg-white text-black' : (step.status === 'SUCCESS' ? 'bg-black text-white' : 'bg-gray-200')
                  }`}>
                    {getStepStatusIcon(step.status)}
                  </div>
                  <span className="text-[10px] font-mono mt-1 opacity-80">
                    {step.durationMs > 0 ? formatDuration(step.durationMs) : (step.status === 'RUNNING' ? '...' : '0s')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Diagnostics Banner (if failed) */}
      {run.status === 'FAILED' && (
        <div className="bg-gray-100 border-2 border-black p-4 rounded text-black space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-black shrink-0" />
            <h3 className="text-sm font-bold tracking-tight">
              Failure Detected in Step: {run.steps.find(s => s.status === 'FAILED')?.name || 'Tests'}
            </h3>
          </div>
          <p className="text-xs font-mono bg-white border border-gray-300 p-2.5 rounded text-black font-semibold">
            {run.errorMessage || 'Step exited with non-zero status (exitCode: 1)'}
          </p>
          <div className="text-xs text-gray-700 flex items-center justify-between pt-1">
            <span>Review the highlighted red/error logs below to inspect test assertions or compiler traces.</span>
            <button
              onClick={() => {
                const failStep = run.steps.find(s => s.status === 'FAILED');
                if (failStep) setSelectedStepId(failStep.id);
              }}
              className="text-xs font-bold underline cursor-pointer hover:text-gray-900"
            >
              Jump to Failed Step Logs &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Terminal & Log Viewer */}
      <div className="bg-white border border-gray-300 rounded shadow-xs overflow-hidden">
        {/* Terminal Toolbar */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Step selector pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-all-logs"
              onClick={() => setSelectedStepId('ALL')}
              className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                selectedStepId === 'ALL'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Steps ({run.steps.reduce((acc, s) => acc + s.logs.length, 0)})
            </button>
            {run.steps.map((step) => (
              <button
                key={step.id}
                id={`filter-log-step-${step.id}`}
                onClick={() => setSelectedStepId(step.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer whitespace-nowrap transition-colors flex items-center space-x-1 ${
                  selectedStepId === step.id
                    ? 'bg-black text-white font-bold'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{step.name}</span>
                <span className="text-[10px] opacity-70">({step.logs.length})</span>
              </button>
            ))}
          </div>

          {/* Terminal Tools: Search, Auto-scroll, Copy, Download */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                id="input-search-logs"
                type="text"
                placeholder="Find in logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded text-black placeholder-gray-400 focus:outline-none focus:border-black w-36"
              />
            </div>

            {/* Auto-scroll toggle */}
            <button
              id="btn-toggle-autoscroll"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 text-xs font-mono border rounded cursor-pointer transition-colors ${
                autoScroll
                  ? 'bg-gray-200 border-gray-400 text-black font-semibold'
                  : 'bg-white border-gray-300 text-gray-500 hover:text-black'
              }`}
              title="Toggle Auto-Scroll"
            >
              Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>

            {/* Copy */}
            <button
              id="btn-copy-logs"
              onClick={handleCopyLogs}
              className="p-1.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-black rounded cursor-pointer"
              title="Copy visible logs"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Download */}
            <button
              id="btn-download-logs"
              onClick={handleDownloadLogs}
              className="p-1.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-black rounded cursor-pointer"
              title="Download raw logs file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          id="terminal-log-viewer"
          className="bg-gray-950 text-gray-100 font-mono text-xs p-4 overflow-y-auto max-h-[480px] select-text leading-relaxed"
        >
          {displayedLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Terminal className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No log output for this step yet.</p>
              {run.status === 'QUEUED' && <p className="text-[11px] mt-1">Waiting for worker container initialization...</p>}
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayedLogs.map((item, idx) => {
                const { log, stepName } = item;
                let colorClass = 'text-gray-300';
                if (log.type === 'command') colorClass = 'text-white font-bold';
                else if (log.type === 'system') colorClass = 'text-gray-400 italic';
                else if (log.type === 'success') colorClass = 'text-white font-semibold underline decoration-gray-500';
                else if (log.type === 'error' || log.type === 'stderr') colorClass = 'text-gray-100 bg-gray-900 px-1 font-semibold';

                return (
                  <div key={log.id || idx} className="flex items-start hover:bg-gray-900 py-0.5 px-1 rounded">
                    {/* Line number */}
                    <span className="text-gray-600 select-none w-10 text-right pr-3 shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    {/* Timestamp */}
                    <span className="text-gray-500 select-none pr-3 shrink-0 text-[11px]">
                      {log.timestamp}
                    </span>
                    {/* Step tag if viewing ALL */}
                    {selectedStepId === 'ALL' && (
                      <span className="text-gray-400 select-none pr-2 shrink-0 text-[10px] uppercase font-semibold">
                        [{stepName}]
                      </span>
                    )}
                    {/* Log text content */}
                    <span className={`break-all ${colorClass}`}>
                      {log.text}
                    </span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Terminal Footer Bar */}
        <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-gray-600">
          <div className="flex items-center space-x-3">
            <span>Container: {run.containerId}</span>
            <span>&bull;</span>
            <span>Host: {run.workerNode}</span>
            <span>&bull;</span>
            <span>Lines: {displayedLogs.length}</span>
          </div>

          <button
            onClick={() => setShowArchTrace(!showArchTrace)}
            className="text-black font-bold hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>{showArchTrace ? 'Hide' : 'View'} Backend &amp; Kafka Trace</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Backend & Infrastructure Trace Panel */}
      {showArchTrace && (
        <div className="bg-white border border-gray-300 p-4 rounded shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">
            Infrastructure Trace &amp; Event Telemetry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="text-[10px] text-gray-500 block font-bold">1. GitHub Webhook</span>
              <span className="text-black font-semibold">HTTP 200 OK</span>
              <p className="text-[10px] text-gray-500 mt-1">HMAC SHA-256 Verified</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="text-[10px] text-gray-500 block font-bold">2. Spring Boot</span>
              <span className="text-black font-semibold">Job Created</span>
              <p className="text-[10px] text-gray-500 mt-1">ID: #{run.runNumber}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="text-[10px] text-gray-500 block font-bold">3. Kafka Topic</span>
              <span className="text-black font-semibold">ci.jobs.dispatch</span>
              <p className="text-[10px] text-gray-500 mt-1">Offset: {run.kafkaOffset}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="text-[10px] text-gray-500 block font-bold">4. Redis Key</span>
              <span className="text-black font-semibold truncate block">{run.redisKey}</span>
              <p className="text-[10px] text-gray-500 mt-1">TTL: 3600s Cached</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="text-[10px] text-gray-500 block font-bold">5. PostgreSQL Row</span>
              <span className="text-black font-semibold">{run.postgresId}</span>
              <p className="text-[10px] text-gray-500 mt-1">Status: {run.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
