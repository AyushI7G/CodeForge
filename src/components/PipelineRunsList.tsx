import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  RotateCw, 
  Ban, 
  GitCommit, 
  GitBranch, 
  User, 
  Terminal, 
  Play, 
  Search, 
  Filter,
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { PipelineRun, PipelineStatus } from '../types/ci';

interface PipelineRunsListProps {
  runs: PipelineRun[];
  onSelectRun: (run: PipelineRun) => void;
  onRerun: (run: PipelineRun) => void;
  onCancel: (runId: string) => void;
  selectedRunId?: string;
}

export const PipelineRunsList: React.FC<PipelineRunsListProps> = ({
  runs,
  onSelectRun,
  onRerun,
  onCancel,
  selectedRunId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Extract unique branches
  const branches = Array.from(new Set(runs.map(r => r.branch)));

  const filteredRuns = runs.filter(run => {
    const matchesSearch = 
      run.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.commitHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${run.runNumber}`.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;
    const matchesBranch = branchFilter === 'ALL' || run.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const getStatusBadge = (status: PipelineStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-white text-black border border-black rounded">
            <Check className="w-3 h-3 mr-1 text-black stroke-[3]" />
            SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-gray-900 text-white rounded">
            <X className="w-3 h-3 mr-1 text-white stroke-[3]" />
            FAILED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-gray-100 text-black border border-gray-400 rounded animate-pulse">
            <RotateCw className="w-3 h-3 mr-1 text-black animate-spin" />
            RUNNING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded">
            <Clock className="w-3 h-3 mr-1 text-gray-600" />
            QUEUED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
            <Ban className="w-3 h-3 mr-1 text-gray-600" />
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Check className="w-3 h-3 text-black stroke-[2.5]" />;
      case 'FAILED':
        return <X className="w-3 h-3 text-black stroke-[2.5]" />;
      case 'RUNNING':
        return <RotateCw className="w-3 h-3 text-black animate-spin" />;
      case 'SKIPPED':
        return <span className="text-gray-400 text-xs font-mono">&oslash;</span>;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>;
    }
  };

  const formatDuration = (ms: number) => {
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m ${remSec}s`;
  };

  return (
    <div id="pipeline-runs-container" className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-gray-300 p-4 rounded shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">Pipeline Runs</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Automated builds triggered via GitHub webhooks &bull; Spring Boot + Kafka queue worker execution
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Total Runs</span>
              <span className="font-bold text-black text-sm">{runs.length}</span>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Success Rate</span>
              <span className="font-bold text-black text-sm">
                {runs.length > 0
                  ? `${Math.round((runs.filter(r => r.status === 'SUCCESS').length / runs.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="border-l border-gray-300 pl-4">
              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Avg Time</span>
              <span className="font-bold text-black text-sm">34s</span>
            </div>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              id="input-search-runs"
              type="text"
              placeholder="Search commit, author, repo, #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded text-black placeholder-gray-400 focus:outline-none focus:border-black"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Status:</span>
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:border-black"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="RUNNING">Running Only</option>
              <option value="QUEUED">Queued Only</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Branch:</span>
            <select
              id="select-branch-filter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:border-black"
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline Runs List Cards */}
      <div className="space-y-3">
        {filteredRuns.length === 0 ? (
          <div className="bg-white border border-gray-300 p-8 text-center rounded">
            <AlertTriangle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-black">No pipeline runs matched your filters</p>
            <p className="text-xs text-gray-500 mt-1">Try clearing your search query or triggering a new GitHub Push event.</p>
          </div>
        ) : (
          filteredRuns.map((run) => {
            const isSelected = selectedRunId === run.id;

            return (
              <div
                key={run.id}
                id={`pipeline-run-card-${run.runNumber}`}
                className={`bg-white border transition-all rounded p-4 ${
                  isSelected 
                    ? 'border-black ring-1 ring-black shadow-sm' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info: Pipeline #, status, commit details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-bold text-black font-mono">
                        Pipeline #{run.runNumber}
                      </span>
                      {getStatusBadge(run.status)}
                      <span className="text-xs text-gray-500 font-mono">
                        {run.repoName}
                      </span>
                    </div>

                    {/* Commit message & metadata */}
                    <div className="flex items-start space-x-2">
                      <GitCommit className="w-3.5 h-3.5 text-gray-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-black font-medium line-clamp-1">
                        {run.commitMessage}
                      </span>
                    </div>

                    {/* Meta pills */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-1">
                      <span className="inline-flex items-center font-mono bg-gray-100 px-2 py-0.5 border border-gray-200 rounded text-[11px]">
                        <GitBranch className="w-3 h-3 mr-1 text-gray-700" />
                        {run.branch}
                      </span>
                      <span className="font-mono text-gray-700 text-[11px] bg-gray-100 px-1.5 py-0.5 border border-gray-200 rounded">
                        {run.commitHash.substring(0, 7)}
                      </span>
                      <span className="inline-flex items-center text-gray-700">
                        <User className="w-3 h-3 mr-1 text-gray-500" />
                        {run.author}
                      </span>
                      <span className="text-gray-400">&bull;</span>
                      <span className="text-gray-500 font-mono text-[11px]">
                        {new Date(run.createdAt).toLocaleTimeString()}
                      </span>
                      {run.durationTotalMs > 0 && (
                        <>
                          <span className="text-gray-400">&bull;</span>
                          <span className="font-mono text-gray-800 text-[11px] font-medium">
                            Duration: {formatDuration(run.durationTotalMs)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: Step Flow Display (exact to user prompt) */}
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded lg:min-w-[340px]">
                    <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Pipeline Steps</span>
                      <span className="font-mono text-[10px] text-gray-500">
                        Worker: {run.workerNode.split('-').pop()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {run.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 flex items-center justify-center">
                              {getStepIcon(step.status)}
                            </span>
                            <span className={step.status === 'FAILED' ? 'text-black font-bold' : 'text-gray-800'}>
                              {step.name}
                            </span>
                          </div>
                          <span className="text-gray-500 text-[11px]">
                            {step.durationMs > 0 ? formatDuration(step.durationMs) : (step.status === 'RUNNING' ? 'running...' : '0s')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Error Highlight if Failed (exact to user prompt: Error: 3 tests failed [View Logs]) */}
                    {run.status === 'FAILED' && (
                      <div className="mt-2.5 pt-2 border-t border-gray-200">
                        <p className="text-xs font-bold text-black flex items-center">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-black shrink-0" />
                          <span>Error: {run.errorMessage || 'Step exited with non-zero status'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0">
                    <button
                      id={`btn-view-logs-${run.runNumber}`}
                      onClick={() => onSelectRun(run)}
                      className="w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-black bg-white border border-black hover:bg-gray-100 transition-colors rounded cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 mr-1.5 text-black" />
                      <span>View Logs</span>
                    </button>

                    {run.status === 'RUNNING' ? (
                      <button
                        id={`btn-cancel-${run.runNumber}`}
                        onClick={() => onCancel(run.id)}
                        className="w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors rounded cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
                        <span>Cancel</span>
                      </button>
                    ) : (
                      <button
                        id={`btn-rerun-${run.runNumber}`}
                        onClick={() => onRerun(run)}
                        className="w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 hover:bg-gray-100 transition-colors rounded cursor-pointer"
                        title="Re-run this pipeline job with same commit"
                      >
                        <RotateCw className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                        <span>Re-run</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
