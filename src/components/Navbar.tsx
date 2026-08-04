import React from 'react';
import {
  Sparkles,
  Zap,
  Terminal,
  Download,
  Share2,
  Sliders,
  ShieldCheck,
  Globe,
  Code,
} from 'lucide-react';
import { ResearchSession, AppSettings } from '../types';

interface NavbarProps {
  activeSession: ResearchSession | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenTraceModal: () => void;
  onExportReport: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSession,
  settings,
  onUpdateSettings,
  onOpenTraceModal,
  onExportReport,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 bg-[#0a0a0d]/90 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-20 sticky top-0 no-print">
      {/* Title & Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono text-gray-400">STATUS:</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {activeSession?.status === 'running' ? 'RESEARCHING...' : 'READY'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-white/10" />

        <div className="min-w-0 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
            {activeSession ? activeSession.title : 'Nexus AI Command Center'}
          </h2>
          {activeSession && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono hidden sm:inline-block">
              {activeSession.depth} Research
            </span>
          )}
        </div>
      </div>

      {/* Controls & Toolbar */}
      <div className="flex items-center gap-2">
        {/* Simulation Speed Switcher */}
        <div className="hidden md:flex items-center bg-[#141418] border border-white/10 rounded-lg p-0.5 text-xs font-mono">
          <span className="px-2 text-gray-400 text-[10px]">SPEED:</span>
          {(['1x', '2x', 'instant'] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onUpdateSettings({ simulationSpeed: spd })}
              className={`px-2 py-0.5 rounded text-[11px] transition-all capitalize ${
                settings.simulationSpeed === spd
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {spd}
            </button>
          ))}
        </div>

        {/* View Raw JSON Trace */}
        {activeSession && (
          <button
            onClick={onOpenTraceModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#16161a] border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs transition-colors"
            title="View Raw Multi-Agent JSON Trace"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">Trace Logs</span>
          </button>
        )}

        {/* Export Report */}
        {activeSession?.status === 'completed' && (
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-md bg-[#16161a] border border-white/10 text-gray-400 hover:text-white transition-colors"
          title="Configure Agent Settings & Models"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
