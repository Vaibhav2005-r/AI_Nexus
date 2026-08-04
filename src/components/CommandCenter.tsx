import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Globe,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  FileText,
  Layers,
  Cpu,
  Bot,
  Network,
  Check,
} from 'lucide-react';
import { SUGGESTED_PROMPTS } from '../data/mockResearchData';
import { AppSettings } from '../types';

interface CommandCenterProps {
  onStartResearch: (
    prompt: string,
    depth: 'Fast' | 'Deep' | 'Exhaustive',
    deepWeb: boolean,
    sourcesFilter: string[]
  ) => void;
  settings: AppSettings;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onStartResearch,
  settings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [depth, setDepth] = useState<'Fast' | 'Deep' | 'Exhaustive'>('Deep');
  const [deepWeb, setDeepWeb] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'Google Web',
    'ArXiv Papers',
    'Financial Databases',
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableSources = [
    'Google Web',
    'ArXiv Papers',
    'Internal PDFs & Docs',
    'Financial Databases',
    'PubMed Central',
  ];

  const handleSourceToggle = (source: string) => {
    if (selectedSources.includes(source)) {
      if (selectedSources.length > 1) {
        setSelectedSources(selectedSources.filter((s) => s !== source));
      }
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartResearch(prompt, depth, deepWeb, selectedSources);
  };

  const handleSelectSuggested = (suggestedPrompt: string) => {
    setPrompt(suggestedPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full my-auto overflow-y-auto"
    >
      {/* Header Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-center space-y-3 mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>AUTONOMOUS MULTI-AGENT SWARM v2.6</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          Deep Research. <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400">Verified Insights.</span>
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto">
          Nexus orchestrates parallel search agents, breaks down complex queries, verifies facts against primary literature, and synthesizes cited reports.
        </p>
      </motion.div>

      {/* Main Command Input Card */}
      <motion.form
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full bg-[#111115] border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl ai-glow-card ai-pulse-glow transition-all mb-8"
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="What technical or economic topic would you like Nexus to investigate? (e.g. Solid State Battery commercial parity by 2030...)"
            className="w-full h-28 bg-transparent text-white placeholder-gray-500 text-sm md:text-base focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Quick Toggles Toolbar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Deep Search Toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setDeepWeb(!deepWeb)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                deepWeb
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#18181c] border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Deep Search</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  deepWeb ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              />
            </motion.button>

            {/* Data Sources Dropdown */}
            <div className="relative">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#18181c] border border-white/10 text-gray-300 hover:text-white transition-all"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sources ({selectedSources.length})</span>
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-[#18181d] border border-white/15 rounded-xl p-2 shadow-2xl z-50 text-xs"
                  >
                    <p className="px-2 py-1 text-[10px] font-mono font-semibold text-gray-400 uppercase border-b border-white/10 mb-1">
                      Select Data Sources
                    </p>
                    {availableSources.map((src) => {
                      const isSelected = selectedSources.includes(src);
                      return (
                        <div
                          key={src}
                          onClick={() => handleSourceToggle(src)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer text-gray-300 hover:text-white"
                        >
                          <span>{src}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reasoning Depth Selector */}
            <div className="flex items-center bg-[#18181c] border border-white/10 rounded-lg p-0.5 text-xs font-mono">
              <span className="px-2 text-gray-500 text-[10px] hidden sm:inline">DEPTH:</span>
              {(['Fast', 'Deep', 'Exhaustive'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`relative px-2.5 py-1 rounded-md text-xs transition-all ${
                    depth === d
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={prompt.trim() ? { scale: 1.03 } : {}}
            whileTap={prompt.trim() ? { scale: 0.97 } : {}}
            disabled={!prompt.trim()}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all ${
              prompt.trim()
                ? 'opacity-100 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <span>Run Research</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.form>

      {/* Suggested Prompts Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended Research Topics
          </h3>
          <span className="text-[11px] text-gray-500 font-mono">Click to load query</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUGGESTED_PROMPTS.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.015, translateY: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleSelectSuggested(item.prompt)}
              className="p-3.5 rounded-xl bg-[#111115] border border-white/10 hover:border-indigo-500/40 hover:bg-[#16161b] cursor-pointer transition-all group shadow-sm hover:shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {item.category}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-xs font-semibold text-white group-hover:text-indigo-200 mb-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">
                {item.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Architecture Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 w-full text-center"
      >
        <div className="p-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-1.5 text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold text-white">1. Planner</p>
          <p className="text-[10px] text-gray-500">Maps strategy & domain constraints</p>
        </div>
        <div className="p-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-1.5 text-cyan-400">
            <Network className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold text-white">2. Decomposer</p>
          <p className="text-[10px] text-gray-500">Breaks query into 4 sub-queries</p>
        </div>
        <div className="p-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-1.5 text-purple-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold text-white">3. Verifier</p>
          <p className="text-[10px] text-gray-500">Audits claims & eliminates hallucinations</p>
        </div>
        <div className="p-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-1.5 text-emerald-400">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold text-white">4. Cited Report</p>
          <p className="text-[10px] text-gray-500">Generates rich cited report & charts</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

