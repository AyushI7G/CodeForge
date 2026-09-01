import React from 'react';
import { GitBranch, Radio, Database, Cpu, Plus, GitCommit, RefreshCw, Layers } from 'lucide-react';
import { SystemArchitectureStats } from '../types/ci';

interface HeaderProps {
  activeTab: 'pipelines' | 'workflow' | 'repos' | 'architecture';
  setActiveTab: (tab: 'pipelines' | 'workflow' | 'repos' | 'architecture') => void;
  onOpenWebhookModal: () => void;
  onNewManualRun: () => void;
  stats: SystemArchitectureStats;
  runningCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenWebhookModal,
  onNewManualRun,
  stats,
  runningCount,
}) => {
  return (
    <header id="codeforge-header" className="bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Top Brand & System Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-bold text-lg rounded-sm tracking-tighter">
              CF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-black">CodeForge</span>
                {runningCount > 0 && (
                  <span className="flex items-center space-x-1 text-xs bg-gray-900 text-white px-2 py-0.5 rounded font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>{runningCount} Active Job{runningCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Infrastructure Health Indicators */}
          <div className="hidden lg:flex items-center space-x-4 text-xs font-mono text-gray-700 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded">
            <div className="flex items-center space-x-1.5" title="Spring Boot REST API">
              <span className="w-2 h-2 rounded-full bg-gray-900"></span>
              <span className="font-semibold text-black">Spring Boot</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-1.5" title="Kafka Event Queue">
              <Radio className="w-3.5 h-3.5 text-gray-800" />
              <span>Kafka: {stats.kafkaQueueDepth} queued</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-1.5" title="Redis Cache Status">
              <Layers className="w-3.5 h-3.5 text-gray-800" />
              <span>Redis: {stats.redisCachedKeys} keys</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-1.5" title="Kubernetes Worker Pods">
              <Cpu className="w-3.5 h-3.5 text-gray-800" />
              <span>K8s: {stats.k8sActiveWorkerPods} Pods</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-1.5" title="PostgreSQL Database">
              <Database className="w-3.5 h-3.5 text-gray-800" />
              <span>Postgres: OK</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-simulate-webhook"
              onClick={onOpenWebhookModal}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-black bg-white border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors rounded cursor-pointer shadow-xs"
              title="Simulate GitHub Push Webhook event"
            >
              <GitCommit className="w-3.5 h-3.5 mr-1.5 text-black" />
              <span>Simulate GitHub Push</span>
            </button>

            <button
              id="btn-trigger-run"
              onClick={onNewManualRun}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-black hover:bg-gray-800 transition-colors rounded cursor-pointer shadow-xs"
              title="Trigger a new manual build run"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-white" />
              <span>Trigger Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
            <button
              id="tab-pipelines"
              onClick={() => setActiveTab('pipelines')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'pipelines'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Pipelines &amp; Runs
            </button>
            <button
              id="tab-workflow"
              onClick={() => setActiveTab('workflow')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'workflow'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Workflow Config (.yml)
            </button>
            <button
              id="tab-repos"
              onClick={() => setActiveTab('repos')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'repos'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Repositories &amp; Webhooks
            </button>
            <button
              id="tab-architecture"
              onClick={() => setActiveTab('architecture')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'architecture'
                  ? 'border-black text-black font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Architecture &amp; Worker Pool
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
