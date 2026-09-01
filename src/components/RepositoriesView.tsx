import React, { useState } from 'react';
import { 
  GitBranch, 
  GitPullRequest, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Lock, 
  Globe, 
  Star, 
  Trash2, 
  Radio, 
  ShieldCheck,
  FolderGit2
} from 'lucide-react';
import { Repository } from '../types/ci';

interface RepositoriesViewProps {
  repositories: Repository[];
  onAddRepository: (repo: Partial<Repository>) => void;
  onSelectRepo: (repo: Repository) => void;
  onSimulatePush: (repo: Repository) => void;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  repositories,
  onAddRepository,
  onSelectRepo,
  onSimulatePush,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Repo form state
  const [newRepoOwner, setNewRepoOwner] = useState<string>('acme');
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [newRepoDesc, setNewRepoDesc] = useState<string>('');
  const [newRepoBranch, setNewRepoBranch] = useState<string>('main');
  const [newRepoPrivate, setNewRepoPrivate] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    onAddRepository({
      owner: newRepoOwner.trim() || 'acme',
      name: newRepoName.trim(),
      description: newRepoDesc.trim() || 'Microservice project connected to CodeForge CI/CD',
      defaultBranch: newRepoBranch.trim() || 'main',
      isPrivate: newRepoPrivate,
      starsCount: 1,
      webhookUrl: `https://api.codeforge.internal/v1/webhooks/github/${newRepoOwner}/${newRepoName}`,
      webhookSecret: `cf_sec_${Math.random().toString(36).substring(2, 18)}`,
      lastActive: 'Just now'
    });

    setNewRepoName('');
    setNewRepoDesc('');
    setShowAddModal(false);
  };

  return (
    <div id="repositories-view-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-4 rounded shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-black" />
              <span>Connected Repositories</span>
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              GitHub repositories configured with CodeForge automated push webhooks and branch triggers
            </p>
          </div>

          <button
            id="btn-connect-new-repo"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors rounded cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-white" />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            id={`repo-card-${repo.id}`}
            className="bg-white border border-gray-300 p-4 rounded shadow-xs hover:border-gray-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Owner/Name and Private badge */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-black font-mono">
                      {repo.owner}/{repo.name}
                    </span>
                    {repo.isPrivate ? (
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 flex items-center">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Private
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 flex items-center">
                        <Globe className="w-2.5 h-2.5 mr-0.5" />
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {repo.description}
                  </p>
                </div>
              </div>

              {/* Branch and Stars */}
              <div className="flex items-center space-x-3 text-xs text-gray-600 font-mono">
                <span className="inline-flex items-center bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                  <GitBranch className="w-3 h-3 mr-1 text-gray-700" />
                  {repo.defaultBranch}
                </span>
                <span className="inline-flex items-center text-gray-600 text-[11px]">
                  <Star className="w-3 h-3 mr-1 text-gray-500" />
                  {repo.starsCount}
                </span>
                <span className="text-gray-400">&bull;</span>
                <span className="text-[11px] text-gray-500">{repo.lastActive}</span>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-600 uppercase font-bold tracking-wider">
                  <span className="flex items-center space-x-1">
                    <Radio className="w-3 h-3 text-black" />
                    <span>Webhook Endpoint</span>
                  </span>
                  <span className="text-black font-semibold">Active</span>
                </div>

                <div className="flex items-center justify-between bg-white border border-gray-300 p-1.5 rounded text-[11px] font-mono text-gray-700">
                  <span className="truncate mr-2">{repo.webhookUrl}</span>
                  <button
                    onClick={() => handleCopy(repo.webhookUrl, `url-${repo.id}`)}
                    className="text-gray-500 hover:text-black shrink-0 cursor-pointer p-0.5"
                    title="Copy Webhook URL"
                  >
                    {copiedId === `url-${repo.id}` ? (
                      <Check className="w-3 h-3 text-black" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
              <button
                id={`btn-push-repo-${repo.id}`}
                onClick={() => onSimulatePush(repo)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors rounded cursor-pointer"
              >
                <span>Simulate Push</span>
              </button>

              <button
                onClick={() => onSelectRepo(repo)}
                className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-black cursor-pointer"
              >
                <span>Edit Workflow</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-md w-full p-6 rounded shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-black">Connect GitHub Repository</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black cursor-pointer font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRepo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Repository Owner</label>
                <input
                  type="text"
                  value={newRepoOwner}
                  onChange={(e) => setNewRepoOwner(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
                  placeholder="acme or your-org"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Repository Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
                  placeholder="e.g. backend-api or microservice-worker"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded text-black focus:outline-none focus:border-black"
                  placeholder="Brief description of repo service"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Default Branch</label>
                  <input
                    type="text"
                    value={newRepoBranch}
                    onChange={(e) => setNewRepoBranch(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
                    placeholder="main"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRepoPrivate}
                      onChange={(e) => setNewRepoPrivate(e.target.checked)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-gray-800 font-semibold">Private Repo</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded text-[11px] text-gray-600">
                <span className="font-bold text-black block mb-0.5">Automated Webhook Sync</span>
                When created, CodeForge creates a dedicated HMAC-protected webhook listener and default <code>build &rarr; test &rarr; deploy</code> pipeline.
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded cursor-pointer"
                >
                  Connect &amp; Setup CI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
