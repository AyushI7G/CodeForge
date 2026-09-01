import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  User, 
  Send, 
  Check, 
  AlertTriangle, 
  Code, 
  Radio, 
  Layers, 
  X,
  FileCode
} from 'lucide-react';
import { Repository } from '../types/ci';
import { TriggerOptions } from '../services/pipelineEngine';

interface WebhookSimulatorModalProps {
  repositories: Repository[];
  isOpen: boolean;
  onClose: () => void;
  onTriggerPush: (options: TriggerOptions) => void;
  initialRepo?: Repository;
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  repositories,
  isOpen,
  onClose,
  onTriggerPush,
  initialRepo,
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState<string>(initialRepo?.id || repositories[0]?.id || '');
  const [branch, setBranch] = useState<string>('main');
  const [author, setAuthor] = useState<string>('Alex Chen');
  const [authorEmail, setAuthorEmail] = useState<string>('alex.chen@acme.dev');
  const [commitMessage, setCommitMessage] = useState<string>('feat(worker): optimize Docker container lifecycle');
  const [failureScenario, setFailureScenario] = useState<'NONE' | 'TEST_FAILURE' | 'BUILD_SYNTAX_ERROR'>('NONE');
  const [showRawPayload, setShowRawPayload] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRepo = repositories.find(r => r.id === selectedRepoId) || repositories[0];

  const simulatedPayload = {
    ref: `refs/heads/${branch}`,
    before: '0000000000000000000000000000000000000000',
    after: 'e92f1b8a9c04b82d716298172938172938172938',
    repository: {
      id: 94819201,
      name: currentRepo.name,
      full_name: `${currentRepo.owner}/${currentRepo.name}`,
      private: currentRepo.isPrivate,
      default_branch: currentRepo.defaultBranch,
    },
    pusher: {
      name: author.toLowerCase().replace(/\s+/g, ''),
      email: authorEmail,
    },
    head_commit: {
      id: 'e92f1b8a9c04b82d716298172938172938172938',
      message: commitMessage,
      timestamp: new Date().toISOString(),
      author: {
        name: author,
        email: authorEmail,
      },
      added: ['src/pipeline/worker.ts'],
      modified: ['src/services/engine.ts'],
      removed: []
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRepo) return;

    onTriggerPush({
      repo: currentRepo,
      branch: branch.trim() || 'main',
      commitMessage: commitMessage.trim() || 'feat: automated commit dispatch',
      author: author.trim() || 'Developer',
      authorEmail: authorEmail.trim() || 'dev@acme.dev',
      triggerType: 'WEBHOOK_PUSH',
      failureScenario,
    });

    onClose();
  };

  const handlePresetScenario = (scenario: 'NONE' | 'TEST_FAILURE' | 'BUILD_SYNTAX_ERROR') => {
    setFailureScenario(scenario);
    if (scenario === 'TEST_FAILURE') {
      setCommitMessage('feat(auth): update session token expiration logic (3 tests fail)');
    } else if (scenario === 'BUILD_SYNTAX_ERROR') {
      setCommitMessage('refactor(api): broken TypeScript type declaration');
    } else {
      setCommitMessage('feat(core): optimize worker container startup latency');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-xl w-full p-6 rounded shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold text-black">Simulate GitHub Push Webhook</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black cursor-pointer font-bold text-lg"
          >
            &times;
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600">
          Sends an automated HTTP POST webhook to CodeForge's Spring Boot controller, dispatches an event to the Kafka queue, and launches a Docker worker.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Repo */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Target Repository</label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full p-2 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
            >
              {repositories.map(r => (
                <option key={r.id} value={r.id}>
                  {r.owner}/{r.name} ({r.defaultBranch})
                </option>
              ))}
            </select>
          </div>

          {/* Branch & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Git Branch</label>
              <div className="relative">
                <GitBranch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
                  placeholder="main"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Commit Author</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-black focus:outline-none focus:border-black"
                  placeholder="Alex Chen"
                  required
                />
              </div>
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Commit Message</label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full p-2 bg-white border border-gray-300 rounded text-black font-medium focus:outline-none focus:border-black"
              placeholder="e.g. feat(auth): update session token expiration logic"
              required
            />
          </div>

          {/* Test Scenario Selector */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">Execution Outcome Scenario</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetScenario('NONE')}
                className={`p-2 border rounded text-left transition-colors cursor-pointer ${
                  failureScenario === 'NONE'
                    ? 'border-black bg-gray-50 ring-1 ring-black'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-black flex items-center space-x-1">
                  <Check className="w-3 h-3 text-black stroke-[3]" />
                  <span>Success</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Build &rarr; Test &rarr; Deploy pass</p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetScenario('TEST_FAILURE')}
                className={`p-2 border rounded text-left transition-colors cursor-pointer ${
                  failureScenario === 'TEST_FAILURE'
                    ? 'border-black bg-gray-50 ring-1 ring-black'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-black flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-black" />
                  <span>Test Failure</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Fails 3 tests in auth.spec.ts</p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetScenario('BUILD_SYNTAX_ERROR')}
                className={`p-2 border rounded text-left transition-colors cursor-pointer ${
                  failureScenario === 'BUILD_SYNTAX_ERROR'
                    ? 'border-black bg-gray-50 ring-1 ring-black'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-black flex items-center space-x-1">
                  <FileCode className="w-3 h-3 text-black" />
                  <span>Build Error</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">TypeScript compilation error</p>
              </button>
            </div>
          </div>

          {/* Toggle raw JSON payload */}
          <div>
            <button
              type="button"
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="text-xs font-mono text-gray-600 hover:text-black underline cursor-pointer"
            >
              {showRawPayload ? 'Hide' : 'Inspect'} raw GitHub Webhook HTTP POST Payload
            </button>

            {showRawPayload && (
              <pre className="mt-2 p-3 bg-gray-950 text-gray-100 text-[10px] font-mono rounded overflow-x-auto max-h-40">
                {JSON.stringify(simulatedPayload, null, 2)}
              </pre>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-webhook-push"
              type="submit"
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Trigger GitHub Push</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
