import React, { useState } from 'react';
import { 
  FileCode, 
  Layers, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight, 
  HelpCircle,
  Copy,
  Terminal,
  Box
} from 'lucide-react';
import { DEFAULT_WORKFLOW_YAML, SPRING_BOOT_WORKFLOW_YAML } from '../data/initialData';

interface WorkflowEditorProps {
  currentYaml: string;
  onSaveYaml: (newYaml: string) => void;
  onRunWorkflow: (yaml: string) => void;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  currentYaml,
  onSaveYaml,
  onRunWorkflow,
}) => {
  const [yamlContent, setYamlContent] = useState<string>(currentYaml || DEFAULT_WORKFLOW_YAML);
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'yaml'>('visual');
  const [containerImage, setContainerImage] = useState<string>('node:20-alpine');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Editable step list for visual builder
  const [steps, setSteps] = useState<Array<{ id: string; name: string; command: string; timeoutSec: number }>>([
    { id: '1', name: 'Checkout Code', command: 'git clone --depth=1 ${{ github.repository }} .', timeoutSec: 120 },
    { id: '2', name: 'Install Dependencies', command: 'npm ci --prefer-offline', timeoutSec: 300 },
    { id: '3', name: 'Build', command: 'npm run build', timeoutSec: 600 },
    { id: '4', name: 'Tests', command: 'npm test -- --coverage --ci', timeoutSec: 600 },
    { id: '5', name: 'Deploy', command: './scripts/deploy.sh --target=production', timeoutSec: 300 },
  ]);

  const handleAddStep = () => {
    const newId = (steps.length + 1).toString();
    setSteps([...steps, { id: newId, name: 'New Pipeline Step', command: 'npm run step', timeoutSec: 300 }]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleStepChange = (id: string, field: 'name' | 'command' | 'timeoutSec', value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    onSaveYaml(yamlContent);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreset = (presetType: 'node' | 'spring' | 'go') => {
    if (presetType === 'spring') {
      setYamlContent(SPRING_BOOT_WORKFLOW_YAML);
      setContainerImage('openjdk:21-slim');
      setSteps([
        { id: '1', name: 'Checkout Code', command: 'git clone https://github.com/acme/backend.git .', timeoutSec: 120 },
        { id: '2', name: 'Maven Compile & Build', command: './mvnw clean package -DskipTests=false', timeoutSec: 600 },
        { id: '3', name: 'Unit & Integration Tests', command: './mvnw test', timeoutSec: 600 },
        { id: '4', name: 'Containerize Docker', command: 'docker build -t acme/api:latest .', timeoutSec: 400 },
        { id: '5', name: 'Deploy to Kubernetes', command: 'kubectl set image deployment/api app=acme/api:latest', timeoutSec: 300 },
      ]);
    } else {
      setYamlContent(DEFAULT_WORKFLOW_YAML);
      setContainerImage('node:20-alpine');
      setSteps([
        { id: '1', name: 'Checkout Code', command: 'git clone --depth=1 ${{ github.repository }} .', timeoutSec: 120 },
        { id: '2', name: 'Install Dependencies', command: 'npm ci --prefer-offline', timeoutSec: 300 },
        { id: '3', name: 'Build', command: 'npm run build', timeoutSec: 600 },
        { id: '4', name: 'Tests', command: 'npm test -- --coverage --ci', timeoutSec: 600 },
        { id: '5', name: 'Deploy', command: './scripts/deploy.sh --target=production', timeoutSec: 300 },
      ]);
    }
  };

  return (
    <div id="workflow-editor-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-4 rounded shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-black" />
              <span>Pipeline Configuration</span>
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Define automated build, test, and deploy workflow stages (.codeforge.yml / GitHub Actions syntax)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-save-workflow"
              onClick={handleSave}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-black bg-white border border-black hover:bg-gray-100 transition-colors rounded cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>Save Config</span>
                </>
              )}
            </button>

            <button
              id="btn-run-workflow-now"
              onClick={() => onRunWorkflow(yamlContent)}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors rounded cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              <span>Test Run Pipeline</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs & Presets */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              id="subtab-visual"
              onClick={() => setActiveSubTab('visual')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                activeSubTab === 'visual'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visual Step Builder
            </button>
            <button
              id="subtab-yaml"
              onClick={() => setActiveSubTab('yaml')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                activeSubTab === 'yaml'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              YAML Editor (.yml)
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500 font-medium">Presets:</span>
            <button
              onClick={() => loadPreset('node')}
              className="px-2 py-0.5 bg-gray-50 border border-gray-300 text-gray-800 rounded hover:bg-gray-100 cursor-pointer"
            >
              Node.js + React
            </button>
            <button
              onClick={() => loadPreset('spring')}
              className="px-2 py-0.5 bg-gray-50 border border-gray-300 text-gray-800 rounded hover:bg-gray-100 cursor-pointer"
            >
              Spring Boot + Maven
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'visual' ? (
        <div className="space-y-4">
          {/* Runner Environment Settings */}
          <div className="bg-white border border-gray-300 p-4 rounded shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center space-x-1.5">
              <Box className="w-4 h-4 text-black" />
              <span>Container Runner Environment</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Docker Image</label>
                <select
                  value={containerImage}
                  onChange={(e) => setContainerImage(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded font-mono text-black focus:outline-none focus:border-black"
                >
                  <option value="node:20-alpine">node:20-alpine (Node.js &amp; npm)</option>
                  <option value="openjdk:21-slim">openjdk:21-slim (Java &amp; Maven)</option>
                  <option value="python:3.11-slim">python:3.11-slim (Python &amp; pytest)</option>
                  <option value="golang:1.22-alpine">golang:1.22-alpine (Go)</option>
                  <option value="ubuntu:22.04">ubuntu:22.04 (Generic Linux)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Worker Pod Architecture</label>
                <input
                  type="text"
                  disabled
                  value="Kubernetes (x86_64, 4 vCPU, 8GB RAM)"
                  className="w-full p-2 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Webhook Triggers</label>
                <input
                  type="text"
                  disabled
                  value="push: [main, staging] | pr: [main]"
                  className="w-full p-2 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sequential Step Builder */}
          <div className="bg-white border border-gray-300 p-4 rounded shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Pipeline Stages (Build &rarr; Test &rarr; Deploy)
              </h2>
              <button
                id="btn-add-pipeline-step"
                onClick={handleAddStep}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-black bg-gray-100 border border-gray-300 hover:bg-gray-200 rounded cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded hover:border-gray-300"
                >
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleStepChange(step.id, 'name', e.target.value)}
                      className="text-xs font-bold text-black bg-white border border-gray-300 px-2 py-1 rounded w-36 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-gray-400 font-mono text-xs">$</span>
                      <input
                        type="text"
                        value={step.command}
                        onChange={(e) => handleStepChange(step.id, 'command', e.target.value)}
                        className="w-full pl-6 pr-3 py-1 text-xs font-mono text-black bg-white border border-gray-300 rounded focus:outline-none focus:border-black"
                        placeholder="Shell command (e.g. npm test)"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-gray-500 font-mono">Timeout:</span>
                    <input
                      type="number"
                      value={step.timeoutSec}
                      onChange={(e) => handleStepChange(step.id, 'timeoutSec', parseInt(e.target.value) || 300)}
                      className="w-16 px-1.5 py-1 text-xs font-mono text-black bg-white border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                    <span className="text-[11px] text-gray-500">s</span>

                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      disabled={steps.length <= 1}
                      className="p-1 text-gray-400 hover:text-black disabled:opacity-30 cursor-pointer"
                      title="Delete step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Raw YAML Editor */
        <div className="bg-white border border-gray-300 rounded shadow-xs overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-black flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5" />
              <span>.codeforge/workflows/ci.yml</span>
            </span>

            <button
              onClick={handleCopyYaml}
              className="inline-flex items-center px-2.5 py-1 text-xs font-mono text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded cursor-pointer"
            >
              <Copy className="w-3 h-3 mr-1" />
              <span>{copied ? 'Copied!' : 'Copy YAML'}</span>
            </button>
          </div>

          <textarea
            id="textarea-yaml-editor"
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            rows={18}
            className="w-full p-4 font-mono text-xs bg-gray-950 text-gray-100 focus:outline-none select-text leading-relaxed resize-y"
            placeholder="Paste or write your workflow YAML..."
          />
        </div>
      )}
    </div>
  );
};
