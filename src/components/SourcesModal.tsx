import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, ShieldCheck, Search, Filter } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  citations: SourceCitation[];
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  isOpen,
  onClose,
  citations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinCredibility, setFilterMinCredibility] = useState(0);

  const filteredCitations = citations.filter(
    (c) =>
      (c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.snippet.toLowerCase().includes(searchTerm.toLowerCase())) &&
      c.credibilityScore >= filterMinCredibility
  );

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-[#121217] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#16161c]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Verified Sources Index ({citations.length})
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Audit primary sources, peer-reviewed preprints & SEC filings
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-white/10 bg-[#0e0e12] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by title, domain, or excerpt keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Min Credibility:</span>
                <select
                  value={filterMinCredibility}
                  onChange={(e) => setFilterMinCredibility(Number(e.target.value))}
                  className="bg-[#18181f] border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value={0}>All Scores (0%+)</option>
                  <option value={90}>Highly Credible (90%+)</option>
                  <option value={95}>Elite Peer-Reviewed (95%+)</option>
                </select>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-gray-400 uppercase">
                    <th className="py-2 px-3">Ref</th>
                    <th className="py-2 px-3">Domain / Source</th>
                    <th className="py-2 px-3">Title & Excerpt</th>
                    <th className="py-2 px-3">Credibility</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredCitations.map((cite) => (
                    <tr key={cite.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-indigo-400 font-bold">
                        [{cite.id}]
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">
                        <span className="font-semibold text-white block">{cite.domain}</span>
                        <span className="text-[10px] text-gray-500">{cite.author ?? 'Verified Author'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-200 line-clamp-1 mb-0.5">
                          {cite.title}
                        </p>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                          "{cite.snippet}"
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {cite.credibilityScore}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#0d0d11] text-[11px] font-mono text-gray-500 text-center">
              Showing {filteredCitations.length} of {citations.length} total source records
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
