import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Terminal, Code } from 'lucide-react';
import { ResearchSession } from '../types';

interface RawTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ResearchSession | null;
}

export const RawTraceModal: React.FC<RawTraceModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [copied, setCopied] = useState(false);

  const jsonContent = session
    ? JSON.stringify(
        {
          sessionId: session.id,
          prompt: session.prompt,
          depth: session.depth,
          status: session.status,
          metrics: session.metrics,
          steps: session.steps,
          citationsCount: session.citations.length,
        },
        null,
        2
      )
    : '';

  const handleCopy = () => {
    if (!jsonContent) return;
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-[#101014] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#15151b]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Multi-Agent Raw Execution Trace (JSON)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e26] border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0d]">
              <pre className="text-xs text-cyan-300/90 leading-relaxed font-mono whitespace-pre-wrap break-words">
                {jsonContent}
              </pre>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-[#121216] text-[10px] text-gray-500 text-center">
              Format: Nexus AI Agent Swarm Schema v2.6
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
