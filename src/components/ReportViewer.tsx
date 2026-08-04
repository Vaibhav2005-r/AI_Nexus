import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Share2,
  FileText,
  BarChart2,
  List,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Globe,
  Award,
  Layers,
  Printer,
  Search,
  X,
  Network,
  Scale,
} from 'lucide-react';
import { KnowledgeGraphModal } from './KnowledgeGraphModal';
import { FactVerificationModal } from './FactVerificationModal';
import { CitationNetworkModal } from './CitationNetworkModal';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ResearchSession, SourceCitation } from '../types';

interface ReportViewerProps {
  session: ResearchSession;
  allSessions?: ResearchSession[];
  onOpenSourcesModal: () => void;
  onAskFollowUp: (question: string) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  session,
  allSessions = [],
  onOpenSourcesModal,
  onAskFollowUp,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTooltipCitation, setActiveTooltipCitation] = useState<SourceCitation | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [isKnowledgeGraphOpen, setIsKnowledgeGraphOpen] = useState(false);
  const [isCitationNetworkOpen, setIsCitationNetworkOpen] = useState(false);
  const [isFactVerificationOpen, setIsFactVerificationOpen] = useState(false);
  const [selectedFactCitationId, setSelectedFactCitationId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute total keyword matches in the current report
  const matchCount = React.useMemo(() => {
    if (!reportSearchQuery.trim() || !session.reportMarkdown) return 0;
    const escapedQuery = reportSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const matches = session.reportMarkdown.match(regex);
    return matches ? matches.length : 0;
  }, [reportSearchQuery, session.reportMarkdown]);

  // Helper to highlight keyword matches in text
  const renderTextWithHighlights = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-amber-400/30 text-amber-200 font-semibold border-b-2 border-amber-400 rounded-sm px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll > 0) {
        const progress = (scrollTop / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      } else {
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    handleScroll();
  }, [session.reportMarkdown, session.id]);

  const handleCopyMarkdown = () => {
    if (!session.reportMarkdown) return;
    navigator.clipboard.writeText(session.reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCitationClick = (citationId: number, e: React.MouseEvent) => {
    const citation = session.citations.find((c) => c.id === citationId);
    if (citation) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({ x: rect.left, y: rect.bottom + 8 });
      setActiveTooltipCitation(citation);
      setSelectedFactCitationId(citationId);
      setIsFactVerificationOpen(true);
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim()) return;
    onAskFollowUp(followUpInput);
    setFollowUpInput('');
  };

  // Process markdown text to insert interactive citation buttons
  const renderFormattedMarkdown = (markdownText: string) => {
    // Replace markdown headers and citations
    const lines = markdownText.split('\n');

    return lines.map((line, idx) => {
      // Check for headings
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-bold text-white mt-4 mb-3 pb-2 border-b border-white/10">
            {renderLineWithCitations(line.replace('# ', ''))}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-semibold text-white mt-6 mb-2">
            {renderLineWithCitations(line.replace('## ', ''))}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-semibold text-gray-200 mt-4 mb-2">
            {renderLineWithCitations(line.replace('### ', ''))}
          </h3>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-500/10 p-3 rounded-r-lg my-4 text-indigo-200 text-sm italic">
            {renderLineWithCitations(line.replace('> ', ''))}
          </blockquote>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-gray-300 text-sm mb-1">
            {renderLineWithCitations(line.replace(/^[*|-]\s+/, ''))}
          </li>
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} className="my-6 border-white/10" />;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-sm text-gray-300 leading-relaxed mb-3">
          {renderLineWithCitations(line)}
        </p>
      );
    });
  };

  // Helper to parse inline citation tags like [1], [2]
  const renderLineWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationId = parseInt(match[1], 10);
        return (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleCitationClick(citationId, e)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
            title={`View Citation [${citationId}]`}
          >
            [{citationId}]
          </motion.button>
        );
      }
      return renderTextWithHighlights(part, reportSearchQuery);
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#08080a] overflow-hidden select-text relative">
      {/* Reading Progress Bar */}
      <div className="w-full bg-[#181822] h-1 shrink-0 overflow-hidden no-print z-20">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Action Bar */}
      <div className="p-4 border-b border-white/10 bg-[#0c0c0f] flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none flex items-center gap-2">
              Final Synthesis Report
              {session.metrics?.overallCredibility && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Confidence: {session.metrics.overallCredibility.toFixed(1)}%
                </span>
              )}
            </h3>
            <div className="text-[10px] text-gray-400 font-mono mt-1 flex items-center gap-3">
              <span>Verified by {session.citations.length} primary peer-reviewed sources</span>
              {session.metrics?.previousCredibility && (
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                   Trend: {session.metrics.previousCredibility.toFixed(1)}% → {session.metrics.overallCredibility.toFixed(1)}% (+{(session.metrics.overallCredibility - session.metrics.previousCredibility).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Local Report Search Bar */}
          <div className="relative flex items-center no-print">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Find in report..."
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
              className="w-36 sm:w-48 focus:w-56 transition-all duration-200 bg-[#18181d] border border-white/10 focus:border-indigo-500/50 rounded-lg pl-8 pr-14 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            {reportSearchQuery && (
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {matchCount}
                </span>
                <button
                  onClick={() => setReportSearchQuery('')}
                  className="text-gray-400 hover:text-white p-0.5 rounded"
                  title="Clear Search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181d] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs transition-colors no-print"
            title="Print or Save Report as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181d] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs transition-colors no-print"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={onOpenSourcesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 text-xs transition-colors no-print"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sources ({session.citations.length})</span>
          </button>

          <button
            onClick={() => setIsKnowledgeGraphOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs transition-colors no-print font-medium shadow-sm"
            title="Open Interactive D3 Knowledge Graph Topology"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Knowledge Graph</span>
          </button>

          <button
            onClick={() => setIsCitationNetworkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs transition-colors no-print font-medium shadow-sm"
            title="Open D3 Citation Cross-Reference Network"
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Citation Network</span>
          </button>

          <button
            onClick={() => {
              setSelectedFactCitationId(session.citations[0]?.id ?? 1);
              setIsFactVerificationOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs transition-colors no-print font-medium shadow-sm"
            title="Open Side-by-Side Fact Verification Panel"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Fact Verification</span>
          </button>
        </div>
      </div>

      {/* Main Report Body Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-4xl mx-auto w-full"
      >
        {/* Skeleton Loader during research generation */}
        {session.status === 'running' && !session.reportMarkdown ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded-lg w-3/4" />
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
              <div className="h-4 bg-white/5 rounded w-4/6" />
            </div>
            <div className="h-48 bg-white/5 rounded-2xl border border-white/10" />
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
            </div>
          </div>
        ) : (
          <>
            {/* Memory Timeline */}
            {(() => {
              const timeline = allSessions
                .filter(s => s.prompt.toLowerCase() === session.prompt.toLowerCase())
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                
              if (timeline.length > 1) {
                return (
                  <div className="p-4 rounded-2xl bg-[#111116] border border-emerald-500/30 shadow-xl space-y-3 mb-6 no-print">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                        Research Memory Timeline
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-400">
                      {timeline.map((s, idx) => (
                        <React.Fragment key={s.id}>
                          <div className={`px-2 py-1 rounded border ${s.id === session.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-[#18181f] border-white/10'}`}>
                            {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          {idx < timeline.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Key Takeaways Highlight Cards */}
            {session.keyTakeaways && session.keyTakeaways.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#111116] border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                    Executive Key Takeaways
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {session.keyTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#18181f] border border-white/10 text-xs text-gray-200 leading-snug flex flex-col justify-between"
                    >
                      <span className="text-indigo-400 font-mono text-[10px] font-bold mb-1">
                        KEY FINDING 0{idx + 1}
                      </span>
                      <p>{renderTextWithHighlights(takeaway, reportSearchQuery)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formatted Markdown Report Content */}
            <div className="markdown-body">
              {session.reportMarkdown
                ? renderFormattedMarkdown(session.reportMarkdown)
                : 'No report generated yet.'}
            </div>

            {/* Embedded Recharts Visualization */}
            {session.chartData && (
              <div className="p-5 rounded-2xl bg-[#111116] border border-white/10 shadow-xl space-y-4 my-8">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    {session.chartData.title}
                  </h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {session.chartData.description}
                  </p>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {session.chartData.type === 'line' ? (
                      <LineChart data={session.chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey={session.chartData.xAxisKey} stroke="#a3a3a3" fontSize={12} />
                        <YAxis stroke="#a3a3a3" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            borderColor: '#3f3f46',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '0.75rem',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#d4d4d8' }} />
                        {session.chartData.linesOrBars.map((item) => (
                          <Line
                            key={item.key}
                            type="monotone"
                            dataKey={item.key}
                            name={item.name}
                            stroke={item.color}
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={session.chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey={session.chartData.xAxisKey} stroke="#a3a3a3" fontSize={12} />
                        <YAxis stroke="#a3a3a3" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            borderColor: '#3f3f46',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '0.75rem',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#d4d4d8' }} />
                        {session.chartData.linesOrBars.map((item) => (
                          <Bar
                            key={item.key}
                            dataKey={item.key}
                            name={item.name}
                            fill={item.color}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sources Cited Grid */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Primary Sources Cited ({session.citations.length})
                </h4>
                <button
                  onClick={onOpenSourcesModal}
                  className="text-xs text-indigo-400 hover:underline font-mono"
                >
                  View Full Table
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {session.citations.map((cite) => (
                  <a
                    key={cite.id}
                    href={cite.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#111116] border border-white/10 hover:border-indigo-500/40 hover:bg-[#16161c] transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-gray-300 font-mono">
                            [{cite.id}]
                          </div>
                          <span className="text-xs font-mono text-gray-400 font-semibold truncate max-w-[120px]">
                            {cite.domain}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {cite.credibilityScore}% Credible
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300 line-clamp-1 mb-1">
                        {cite.title}
                      </h5>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {cite.snippet}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>{cite.publishDate ?? 'Peer-Reviewed'}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-indigo-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Follow-up Question Bar */}
            <div className="p-4 rounded-2xl bg-[#121217] border border-white/10 shadow-xl space-y-3 my-6">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Ask Follow-up Question to Agent Swarm</span>
              </div>
              <form onSubmit={handleFollowUpSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="e.g. Compare the manufacturing yields of sulfide vs oxide electrolytes..."
                  className="flex-1 bg-[#18181e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!followUpInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Query</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Floating Citation Popover Modal/Tooltip */}
      <AnimatePresence>
        {activeTooltipCitation && tooltipPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 w-80 p-4 rounded-xl bg-[#18181f] border border-indigo-500/40 shadow-2xl space-y-2.5 text-xs"
            style={{
              left: Math.min(tooltipPosition.x, window.innerWidth - 340),
              top: Math.min(tooltipPosition.y, window.innerHeight - 200),
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px]">
                  [{activeTooltipCitation.id}]
                </span>
                <span className="font-mono text-gray-300 font-semibold truncate max-w-[140px]">
                  {activeTooltipCitation.domain}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activeTooltipCitation.credibilityLabel} ({activeTooltipCitation.credibilityScore}%)
              </span>
            </div>

            <h5 className="font-semibold text-white leading-snug">
              {activeTooltipCitation.title}
            </h5>

            <p className="text-[11px] text-gray-300 italic bg-[#0f0f13] p-2 rounded border border-white/5 leading-relaxed">
              "{activeTooltipCitation.snippet}"
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-gray-400">
              <span>{activeTooltipCitation.author ?? 'Verified Reference'}</span>
              <a
                href={activeTooltipCitation.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Visit Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={() => {
                setSelectedFactCitationId(activeTooltipCitation.id);
                setIsFactVerificationOpen(true);
                setActiveTooltipCitation(null);
              }}
              className="w-full py-1.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors my-1"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Claim Side-by-Side</span>
            </button>

            <button
              onClick={() => setActiveTooltipCitation(null)}
              className="w-full text-center text-[10px] text-gray-500 hover:text-gray-300 pt-1"
            >
              Click anywhere to dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Graph Modal */}
      <KnowledgeGraphModal
        isOpen={isKnowledgeGraphOpen}
        onClose={() => setIsKnowledgeGraphOpen(false)}
        session={session}
      />

      {/* Citation Cross-Reference Network Modal */}
      <CitationNetworkModal
        isOpen={isCitationNetworkOpen}
        onClose={() => setIsCitationNetworkOpen(false)}
        session={session}
      />

      {/* Fact Verification Side-by-Side Panel Overlay */}
      <FactVerificationModal
        isOpen={isFactVerificationOpen}
        onClose={() => setIsFactVerificationOpen(false)}
        session={session}
        selectedCitationId={selectedFactCitationId}
      />
    </div>
  );
};
