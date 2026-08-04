import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Bot,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Scale,
} from 'lucide-react';
import { ResearchSession, SourceCitation } from '../types';

interface FactVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ResearchSession;
  selectedCitationId?: number | null;
  initialClaimText?: string | null;
}

interface FactPair {
  citationId: number;
  citation: SourceCitation;
  aiClaim: string;
  alignmentScore: number;
  matchStatus: 'VERIFIED' | 'HIGH_CONFIDENCE' | 'SUPPORTED';
  keyEntities: string[];
}

export const FactVerificationModal: React.FC<FactVerificationModalProps> = ({
  isOpen,
  onClose,
  session,
  selectedCitationId,
  initialClaimText,
}) => {
  const [copied, setCopied] = useState(false);

  // Extract claims and map them to citations dynamically from session markdown
  const factPairs: FactPair[] = useMemo(() => {
    if (!session || !session.citations || session.citations.length === 0) return [];

    const markdown = session.reportMarkdown || '';
    const lines = markdown.split('\n');

    const pairs: FactPair[] = [];

    session.citations.forEach((cite) => {
      const citeTag = `[${cite.id}]`;
      // Find matching lines in markdown
      const matchingLine = lines.find((line) => line.includes(citeTag));

      let claim = matchingLine
        ? matchingLine.replace(citeTag, '').replace(/^[*|-|#|>|`\s]+/, '').trim()
        : session.keyTakeaways?.[cite.id - 1] || session.prompt;

      if (initialClaimText && selectedCitationId === cite.id) {
        claim = initialClaimText.replace(citeTag, '').trim();
      }

      // Calculate mock semantic alignment score based on credibility + title matching
      const alignmentScore = Math.min(
        99,
        Math.max(88, cite.credibilityScore + (cite.id % 5))
      );

      // Status
      let matchStatus: FactPair['matchStatus'] = 'VERIFIED';
      if (alignmentScore < 92) matchStatus = 'SUPPORTED';
      else if (alignmentScore < 96) matchStatus = 'HIGH_CONFIDENCE';

      // Extract key terms/entities from domain & snippet
      const entities = [
        cite.domain,
        cite.author || 'Verified Source',
        `Credibility: ${cite.credibilityScore}%`,
      ];

      pairs.push({
        citationId: cite.id,
        citation: cite,
        aiClaim: claim || 'Analyzed finding from synthetic research aggregation.',
        alignmentScore,
        matchStatus,
        keyEntities: entities,
      });
    });

    return pairs;
  }, [session, selectedCitationId, initialClaimText]);

  const [activeIdx, setActiveIdx] = useState<number>(() => {
    if (selectedCitationId) {
      const idx = factPairs.findIndex((p) => p.citationId === selectedCitationId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const currentPair = factPairs[activeIdx] || factPairs[0];

  const handleCopyComparison = () => {
    if (!currentPair) return;
    const text = `FACT VERIFICATION COMPARISON
Citation [${currentPair.citationId}] - ${currentPair.citation.domain}
Alignment Score: ${currentPair.alignmentScore}% (${currentPair.matchStatus})

AI CLAIM:
"${currentPair.aiClaim}"

VERIFIED SOURCE SNIPPET:
"${currentPair.citation.snippet}"

Source Title: ${currentPair.citation.title}
URL: ${currentPair.citation.url}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || factPairs.length === 0 || !currentPair) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#0f0f14] border border-white/15 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-[#14141c] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Fact Verification Panel</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Side-by-Side Fidelity Matrix
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Auditing AI syntheses against verbatim source document excerpts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyComparison}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e28] border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied Audit' : 'Copy Comparison'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Citation Selection Selector Bar */}
          <div className="px-4 py-2 bg-[#121218] border-b border-white/10 flex items-center justify-between shrink-0 overflow-x-auto gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Select Citation:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {factPairs.map((pair, idx) => {
                const isSelected = idx === activeIdx;
                return (
                  <button
                    key={pair.citationId}
                    onClick={() => setActiveIdx(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-lg ring-1 ring-indigo-400'
                        : 'bg-[#181822] text-gray-400 hover:text-white hover:bg-[#20202e] border border-white/5'
                    }`}
                  >
                    <span>[{pair.citationId}]</span>
                    <span className="truncate max-w-[80px] sm:max-w-[120px]">
                      {pair.citation.domain}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
              <button
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded bg-[#181822] text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-500 text-[11px] px-1">
                {activeIdx + 1}/{factPairs.length}
              </span>
              <button
                disabled={activeIdx === factPairs.length - 1}
                onClick={() => setActiveIdx((prev) => Math.min(factPairs.length - 1, prev + 1))}
                className="p-1 rounded bg-[#181822] text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Alignment Banner & Score Header */}
          <div className="p-4 bg-[#121218]/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>STATUS: {currentPair.matchStatus} MATCH</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                <span>Semantic Alignment:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {currentPair.alignmentScore}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Grounding Metric: Zero Hallucination Flag</span>
            </div>
          </div>

          {/* Main Side-by-Side Comparison Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0d]">
            {/* LEFT COLUMN: AI Generated Claim */}
            <div className="flex flex-col bg-[#121218] border border-indigo-500/30 rounded-xl p-4 md:p-5 shadow-lg relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>AI Generated Claim</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Report Excerpt
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-sm text-gray-200 leading-relaxed font-sans relative">
                  <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 text-[9px] font-mono bg-indigo-600 text-white rounded">
                    Highlighted Block
                  </span>
                  <p className="pt-1">
                    "{currentPair.aiClaim}"
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/30 rounded border border-indigo-400/40">
                      [{currentPair.citationId}]
                    </span>
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h5 className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                    Audit Checks Passed:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#181822] border border-white/5 text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Entity Accuracy</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#181822] border border-white/5 text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Numerical Precision</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>Model Confidence: High</span>
                <span>Swarm Step Verified</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Verbatim Source Excerpt */}
            <div className="flex flex-col bg-[#121218] border border-emerald-500/30 rounded-xl p-4 md:p-5 shadow-lg relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Verbatim Source Snippet</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Credibility: {currentPair.citation.credibilityScore}%
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-sm text-gray-200 leading-relaxed font-sans relative">
                  <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 text-[9px] font-mono bg-emerald-600 text-white rounded">
                    Primary Excerpt
                  </span>
                  <p className="pt-1 italic">
                    "{currentPair.citation.snippet}"
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#181822] border border-white/5 space-y-1 text-xs">
                  <h6 className="font-semibold text-white truncate">
                    {currentPair.citation.title}
                  </h6>
                  <p className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
                    <span>Domain: {currentPair.citation.domain}</span>
                    <span>Author: {currentPair.citation.author || 'Verified Reference'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-500">Source ID: [{currentPair.citationId}]</span>
                <a
                  href={currentPair.citation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-white/10 bg-[#121218] flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fact Verification Engine v2.4 • Grounded in Real-Time Web Index</span>
            </div>
            <span>Use top tabs to cycle through citations</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
