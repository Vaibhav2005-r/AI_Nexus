import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  Search,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AgentStep, ResearchSession } from '../types';

interface AgentTraceProps {
  session: ResearchSession;
  onReRunSimulation: () => void;
  onOpenRawTrace: () => void;
}

export const AgentTrace: React.FC<AgentTraceProps> = ({
  session,
  onReRunSimulation,
  onOpenRawTrace,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>('step-2');

  const toggleStepLogs = (stepId: string) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId);
  };

  const getStepIcon = (type: string, status: string) => {
    if (status === 'running') {
      return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
    }
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }

    switch (type) {
      case 'planner':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'decomposer':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'verifier':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'report':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300';
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      default:
        return 'border-white/10 bg-[#16161a] text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0f] border-r border-white/10 overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0d]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Agent Execution Trace
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReRunSimulation}
            className="p-1.5 rounded-md bg-[#18181d] border border-white/10 text-gray-400 hover:text-white transition-colors"
            title="Re-run Agent Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenRawTrace}
            className="p-1.5 rounded-md bg-[#18181d] border border-white/10 text-gray-400 hover:text-cyan-300 transition-colors"
            title="View Raw JSON Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Metrics Banner */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[#111115] border-b border-white/10 text-center font-mono">
        <div>
          <p className="text-[10px] text-gray-400 uppercase">Sources</p>
          <p className="text-xs font-bold text-cyan-400">
            {session.metrics?.sourcesAnalyzed ?? 0} scanned
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase">Verified</p>
          <p className="text-xs font-bold text-emerald-400">
            {session.metrics?.factsVerified ?? 0} facts
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase">Accuracy</p>
          <p className="text-xs font-bold text-purple-400">
            {session.metrics?.overallCredibility ?? 98}%
          </p>
        </div>
      </div>

      {/* Stepper Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.steps.map((step, index) => {
          const isExpanded = expandedStepId === step.id;
          const isCurrent = session.currentStepIndex === index;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative pl-6"
            >
              {/* Connecting Timeline Line */}
              {index < session.steps.length - 1 && (
                <div
                  className={`absolute left-2.5 top-7 bottom-0 w-[2px] transition-colors ${
                    step.status === 'completed'
                      ? 'bg-emerald-500/40'
                      : step.status === 'running'
                      ? 'bg-cyan-500/40 animate-pulse'
                      : 'bg-white/10'
                  }`}
                />
              )}

              {/* Step Circle Badge */}
              <div
                className={`absolute left-0 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${getStepColor(
                  step.status
                )}`}
              >
                {getStepIcon(step.type, step.status)}
              </div>

              {/* Step Header Card */}
              <div
                onClick={() => toggleStepLogs(step.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  step.status === 'running'
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : step.status === 'completed'
                    ? 'bg-[#121216] border-white/10 hover:border-white/20'
                    : 'bg-[#0f0f12] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{step.title}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {step.durationMs && (
                      <span className="text-[10px] font-mono text-gray-500">
                        {step.durationMs}ms
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-snug">
                  {step.description}
                </p>

                {/* Sub-Queries Nested List (Decomposer Step) */}
                {step.subQueries && step.subQueries.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-mono font-semibold text-cyan-400 uppercase">
                      Concurrent Sub-Queries ({step.subQueries.length}):
                    </p>
                    {step.subQueries.map((sq) => (
                      <div
                        key={sq.id}
                        className="p-2 rounded bg-[#0b0b0e] border border-white/5 flex items-center justify-between text-[11px] font-mono"
                      >
                        <span className="text-gray-300 truncate mr-2">
                          • {sq.query}
                        </span>
                        {sq.status === 'completed' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {sq.resultsCount ? `${sq.resultsCount} hits` : 'Done'}
                          </span>
                        ) : (
                          <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Details Logs */}
                <AnimatePresence>
                  {isExpanded && step.details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 text-[10px] font-mono text-gray-400"
                    >
                      {step.details.strategy && (
                        <div className="space-y-1">
                          <p className="text-indigo-300 font-semibold uppercase">
                            Strategy Pillars:
                          </p>
                          {step.details.strategy.map((st, i) => (
                            <p key={i} className="pl-2 border-l border-indigo-500/30 text-gray-300">
                              - {st}
                            </p>
                          ))}
                        </div>
                      )}

                      {step.details.logs && (
                        <div className="bg-[#08080a] p-2 rounded border border-white/5 space-y-1 text-gray-400">
                          {step.details.logs.map((log, i) => (
                            <p key={i} className="leading-tight font-mono text-[10px] text-cyan-200/80">
                              {log}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 bg-[#09090c] text-[10px] font-mono text-gray-500 flex items-center justify-between">
        <span>Tavily + SerpAPI Parallel Index</span>
        <span className="text-indigo-400">Verified Citation Engine</span>
      </div>
    </div>
  );
};
