import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Terminal,
  Activity,
  User,
  Trash2,
  X,
  Clock,
  FolderTree,
  Tag,
} from 'lucide-react';
import { ResearchSession } from '../types';

interface TopicCategoryDef {
  id: string;
  name: string;
  iconColor: string;
  badgeBg: string;
  keywords: string[];
}

const TOPIC_CATEGORIES: TopicCategoryDef[] = [
  {
    id: 'energy',
    name: 'Energy & Clean Tech',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    keywords: ['fusion', 'energy', 'battery', 'quantum', 'grid', 'solar', 'nuclear', 'power', 'climate', 'renewable', 'storage', 'clean'],
  },
  {
    id: 'ai',
    name: 'AI & Software',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    keywords: ['ai', 'llm', 'agent', 'model', 'neural', 'software', 'code', 'python', 'programming', 'gpu', 'transformer', 'algorithm', 'robot'],
  },
  {
    id: 'market',
    name: 'Market & Economics',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    keywords: ['market', 'stock', 'finance', 'economy', 'investment', 'crypto', 'trade', 'revenue', 'fund', 'valuation', 'business', 'gdp'],
  },
  {
    id: 'biotech',
    name: 'Biotech & Health',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
    keywords: ['bio', 'health', 'medicine', 'pharma', 'gene', 'cancer', 'clinical', 'medical', 'dna', 'drug', 'vaccine'],
  },
  {
    id: 'space',
    name: 'Space & Hardware',
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    keywords: ['space', 'rocket', 'aerospace', 'satellite', 'orbit', 'mars', 'hardware', 'chip', 'semiconductor'],
  },
];

function getSessionTopicCluster(session: ResearchSession): TopicCategoryDef {
  const text = `${session.title} ${session.prompt}`.toLowerCase();
  for (const cat of TOPIC_CATEGORIES) {
    if (cat.keywords.some((kw) => text.includes(kw))) {
      return cat;
    }
  }
  return {
    id: 'general',
    name: 'General Research',
    iconColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    keywords: [],
  };
}

interface SidebarProps {
  sessions: ResearchSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewResearch: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewResearch,
  onDeleteSession,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'time' | 'clusters'>('time');

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByTime = {
    Today: filteredSessions.filter((s) => s.timeCategory === 'Today'),
    'Previous 7 Days': filteredSessions.filter((s) => s.timeCategory === 'Previous 7 Days'),
    Older: filteredSessions.filter((s) => s.timeCategory === 'Older'),
  };

  const groupedByCluster = useMemo(() => {
    const groups: Record<string, { category: TopicCategoryDef; sessions: ResearchSession[] }> = {};
    filteredSessions.forEach((s) => {
      const cat = getSessionTopicCluster(s);
      if (!groups[cat.id]) {
        groups[cat.id] = { category: cat, sessions: [] };
      }
      groups[cat.id].sessions.push(s);
    });
    return groups;
  }, [filteredSessions]);

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#09090b] border-r border-white/10 transition-all duration-300 z-30 select-none no-print ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 bg-[#18181b] border border-white/20 text-gray-400 hover:text-white rounded-full p-1 shadow-lg hover:scale-110 transition-all z-40"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Brand & New Research */}
      <div className="p-4 border-b border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
                <div className="w-full h-full bg-[#09090b] rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  NEXUS <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">AI</span>
                </span>
                <p className="text-[10px] text-gray-400 font-mono">Multi-Agent Research</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          )}
        </div>

        {/* New Research Button */}
        <button
          onClick={onNewResearch}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm transition-all shadow-md shadow-indigo-900/30 active:scale-[0.98] ${
            isCollapsed ? 'p-2.5' : ''
          }`}
          title="Start New Research"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Research</span>}
        </button>
      </div>

      {/* Search Input & View Toggle (Only when expanded) */}
      {!isCollapsed && (
        <div className="px-3 pt-3 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search history by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121215] border border-white/10 rounded-md pl-8 pr-7 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-300 p-0.5 rounded"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-[#131317] p-1 rounded-lg border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('time')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md transition-all ${
                viewMode === 'time'
                  ? 'bg-indigo-600 text-white font-medium shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('clusters')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md transition-all ${
                viewMode === 'clusters'
                  ? 'bg-indigo-600 text-white font-medium shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FolderTree className="w-3 h-3 text-cyan-300" />
              <span>Topic Clusters</span>
            </button>
          </div>
        </div>
      )}

      {/* Sessions History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {filteredSessions.length === 0 && sessions.length > 0 && !isCollapsed && (
          <div className="text-center py-6 px-3 space-y-2">
            <p className="text-xs text-gray-400 font-medium">No sessions found</p>
            <p className="text-[10px] text-gray-500">Matching "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] text-indigo-400 hover:underline font-mono"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* TIME VIEW */}
        {viewMode === 'time' &&
          (Object.keys(groupedByTime) as (keyof typeof groupedByTime)[]).map((category) => {
            const items = groupedByTime[category];
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                {!isCollapsed && (
                  <h4 className="px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                    {category}
                  </h4>
                )}
                {items.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                          : 'bg-transparent border-transparent text-gray-400 hover:bg-[#151518] hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-snug">{session.title}</p>
                            <p className="text-[10px] text-gray-500 truncate font-mono">
                              {session.depth} • {session.metrics ? `${session.metrics.sourcesAnalyzed} sources` : 'In progress'}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isCollapsed && (
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded transition-opacity"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

        {/* TOPIC CLUSTERS VIEW */}
        {viewMode === 'clusters' &&
          Object.values(groupedByCluster).map(({ category, sessions: items }) => {
            if (items.length === 0) return null;

            return (
              <div key={category.id} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-2 py-1 flex items-center justify-between">
                    <h4 className={`text-[10px] font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 ${category.iconColor}`}>
                      <Tag className="w-3 h-3" />
                      <span>{category.name}</span>
                    </h4>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${category.badgeBg}`}>
                      {items.length} {items.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </div>
                )}
                {items.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                          : 'bg-transparent border-transparent text-gray-400 hover:bg-[#151518] hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-snug">{session.title}</p>
                            <p className="text-[10px] text-gray-500 truncate font-mono">
                              {session.depth} • {session.metrics ? `${session.metrics.sourcesAnalyzed} sources` : 'In progress'}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isCollapsed && (
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded transition-opacity"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>

      {/* Cluster Status Card & Footer */}
      {!isCollapsed && (
        <div className="p-3 m-2 rounded-lg bg-[#111115] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" /> Cluster
            </span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-gray-400 pt-1 border-t border-white/5">
            <div>Engine: <span className="text-gray-200">v2.6 Swarm</span></div>
            <div>Latency: <span className="text-gray-200">~84ms</span></div>
          </div>
        </div>
      )}

      {/* Bottom User / Settings Bar */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between bg-[#0b0b0e]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Research Lab</p>
              <p className="text-[10px] text-indigo-400 font-mono">Enterprise Tier</p>
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mx-auto">
            AI
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
