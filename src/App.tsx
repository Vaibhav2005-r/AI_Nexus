import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CommandCenter } from './components/CommandCenter';
import { AgentTrace } from './components/AgentTrace';
import { ReportViewer } from './components/ReportViewer';
import { SourcesModal } from './components/SourcesModal';
import { SettingsModal } from './components/SettingsModal';
import { RawTraceModal } from './components/RawTraceModal';
import { MOCK_SESSIONS, INITIAL_SETTINGS } from './data/mockResearchData';
import { ResearchSession, AppSettings, AgentStep, SourceCitation } from './types';

export default function App() {
  const [sessions, setSessions] = useState<ResearchSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>('session-ssb-2030');
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Function to create and simulate a new research session
  const handleStartResearch = (
    prompt: string,
    depth: 'Fast' | 'Deep' | 'Exhaustive',
    deepWeb: boolean,
    sourcesFilter: string[]
  ) => {
    const newSessionId = `session-${Date.now()}`;
    const title = prompt.length > 50 ? prompt.slice(0, 48) + '...' : prompt;

    const initialSteps: AgentStep[] = [
      {
        id: 's-1',
        type: 'planner',
        title: 'Strategy Formulation & Knowledge Mapping',
        description: 'Analyzing research objective and establishing domain constraints...',
        status: 'running',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        details: {
          strategy: [
            'Deconstruct analytical dimensions and technical milestones',
            'Cross-examine primary literature, SEC filings, and preprint servers',
            'Map critical material and economic parity bottlenecks',
          ],
        },
      },
      {
        id: 's-2',
        type: 'decomposer',
        title: 'Task Decomposition into Sub-Queries',
        description: 'Generating parallel queries across specialized search indexes...',
        status: 'pending',
        subQueries: [
          { id: 'sq-1', query: `${prompt.slice(0, 35)} benchmark trajectory 2026-2030`, status: 'pending' },
          { id: 'sq-2', query: `${prompt.slice(0, 35)} cost per unit economic parity`, status: 'pending' },
          { id: 'sq-3', query: `${prompt.slice(0, 35)} supply chain precursor bottlenecks`, status: 'pending' },
          { id: 'sq-4', query: `${prompt.slice(0, 35)} peer-reviewed lab test validation`, status: 'pending' },
        ],
      },
      {
        id: 's-3',
        type: 'search',
        title: 'Parallel Retrieval & Ingestion',
        description: 'Scanning sources via Tavily, ArXiv, and Financial Databases...',
        status: 'pending',
      },
      {
        id: 's-4',
        type: 'verifier',
        title: 'Cross-Verification & Anti-Hallucination Audit',
        description: 'Cross-referencing quantitative claims against primary literature...',
        status: 'pending',
      },
      {
        id: 's-5',
        type: 'report',
        title: 'Synthesis & Cited Report Generation',
        description: 'Drafting executive report with charts and inline citations...',
        status: 'pending',
      },
    ];

    const newSession: ResearchSession = {
      id: newSessionId,
      title,
      prompt,
      createdAt: new Date().toISOString(),
      timeCategory: 'Today',
      depth,
      sourcesFilter,
      deepWebEnabled: deepWeb,
      status: 'running',
      currentStepIndex: 0,
      steps: initialSteps,
      citations: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);

    // Run Simulation Timeline
    runAgentSimulation(newSessionId, prompt);
  };

  const runAgentSimulation = (sessionId: string, prompt: string) => {
    const speedMultiplier = settings.simulationSpeed === 'instant' ? 0.05 : settings.simulationSpeed === '2x' ? 0.5 : 1;
    const stepDelay = 1200 * speedMultiplier;

    // Helper to update session state
    const updateSessionStep = (stepIdx: number, stepUpdate: Partial<AgentStep>, sessionUpdate?: Partial<ResearchSession>) => {
      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (s.id !== sessionId) return s;
          const updatedSteps = [...s.steps];
          updatedSteps[stepIdx] = { ...updatedSteps[stepIdx], ...stepUpdate };
          return {
            ...s,
            steps: updatedSteps,
            currentStepIndex: stepIdx,
            ...sessionUpdate,
          };
        })
      );
    };

    // Step 0: Planner finishes -> Step 1 Decomposer starts
    setTimeout(() => {
      updateSessionStep(0, { status: 'completed', durationMs: 780 });
      updateSessionStep(1, {
        status: 'running',
        subQueries: [
          { id: 'sq-1', query: `${prompt.slice(0, 30)} quantitative metrics 2026`, status: 'completed', resultsCount: 9 },
          { id: 'sq-2', query: `${prompt.slice(0, 30)} commercial scaling cost curve`, status: 'completed', resultsCount: 7 },
          { id: 'sq-3', query: `${prompt.slice(0, 30)} supply chain bottlenecks`, status: 'completed', resultsCount: 6 },
          { id: 'sq-4', query: `${prompt.slice(0, 30)} peer-reviewed journal papers`, status: 'completed', resultsCount: 11 },
        ],
      });
    }, stepDelay * 1);

    // Step 1: Decomposer finishes -> Step 2 Search starts
    setTimeout(() => {
      updateSessionStep(1, { status: 'completed', durationMs: 1050 });
      updateSessionStep(2, {
        status: 'running',
        details: {
          sourcesScanned: 24,
          logs: [
            '[Tavily API] Fetched 14 authoritative web indexes with relevance > 0.89',
            '[ArXiv Engine] Parsing paper 2603.0912: "Technical Breakthrough Analysis"',
            '[Financial Index] Extracting 2026 Industry Survey metrics',
          ],
        },
      });
    }, stepDelay * 2);

    // Step 2: Search finishes -> Step 3 Verifier starts
    setTimeout(() => {
      updateSessionStep(2, { status: 'completed', durationMs: 1800 });
      updateSessionStep(3, {
        status: 'running',
        details: {
          claimsVerified: 32,
          hallucinationsDiscarded: 2,
          confidenceScore: 98.6,
          logs: [
            'CLAIM CHECK: "Parity milestone estimated by 2028-2030" -> Verified across 3 peer sources',
            'DISCARDED CLAIM: Unsubstantiated price projection removed from output',
            'CONFIDENCE SCORE: 98.6% high convergence',
          ],
        },
      });
    }, stepDelay * 3);

    // Step 3: Verifier finishes -> Step 4 Report finishes & populates output
    setTimeout(() => {
      updateSessionStep(3, { status: 'completed', durationMs: 1100 });

      // Generated Mock Citations
      const generatedCitations: SourceCitation[] = [
        {
          id: 1,
          title: `Technical & Economic Assessment of ${prompt.slice(0, 40)}`,
          url: 'https://arxiv.org/abs/2603.08912',
          domain: 'arxiv.org',
          snippet: 'Comprehensive benchmarking of primary technology metrics, manufacturing yields, and economic cost parity curves.',
          credibilityScore: 99,
          credibilityLabel: 'Highly Credible',
          publishDate: '2026',
          author: 'Global Technology Research Institute',
        },
        {
          id: 2,
          title: 'Global Industry Supply Chain & Cost Structure Benchmark Report Q2 2026',
          url: 'https://bloombergNEF.com/insights/market-analysis-2026',
          domain: 'bloombergNEF.com',
          snippet: 'Precursor raw material processing bottlenecks hold back full giga-scale commercial deployment.',
          credibilityScore: 98,
          credibilityLabel: 'Highly Credible',
          publishDate: 'May 2026',
          author: 'Bloomberg New Energy Finance',
        },
        {
          id: 3,
          title: 'Peer-Reviewed Journal Validation & Field Performance Metrics',
          url: 'https://nature.com/articles/s41586-2026-0912',
          domain: 'nature.com',
          snippet: 'Independent lab test protocols confirm 1,000+ cycle stability retention exceeding 85% initial capacity.',
          credibilityScore: 97,
          credibilityLabel: 'Highly Credible',
          publishDate: 'Jun 2026',
          author: 'Nature Technology Review',
        },
      ];

      const generatedMarkdown = `
# Autonomous Multi-Agent Research Report: ${prompt}

## Executive Summary
This report presents a synthesized, cross-verified analysis of **${prompt}** [1]. Utilizing parallel search agents across technical literature, financial filings, and preprint indexes, Nexus AI has audited key quantitative claims and manufacturing scaling trajectories [2].

---

## 1. Technical Framework & Core Milestones
* **Primary Performance Metrics:** Quantitative benchmarks demonstrate steady optimization curves with field retention exceeding **85% across 1,000 operational cycles** [3].
* **Manufacturing Scaling:** Commercialization transitions from batch processing to continuous roll-to-roll production, reducing unit costs by **~42%** over a 36-month horizon [2].
* **System Integration:** Safety protocols and thermal stability margins exhibit zero runaway up to **350°C** [1].

> **Key Architectural Insight:** Cross-agent verification confirmed high convergence across 3 independent laboratory trials [1], eliminating earlier unsubstantiated yield projections.

---

## 2. Supply Chain & Economic Outlook (2026–2030)
1. **Precursor Raw Materials:** Supply chain bottlenecks center on specialized precursor refining capacity rather than mining extraction [2].
2. **Capital Expenditure (CapEx) Parity:** Giga-scale facilities require initial capital investment of **~$1.2B per 10 GWh throughput**, with payback periods averaging 4.2 years [2].

---

## 3. Strategic Conclusion
Continued deployment depends on solving precursor yield consistency. Early commercial adopters will capture market share in high-margin premium segments prior to mass-market penetration [1], [3].
`;

      updateSessionStep(
        4,
        { status: 'completed', durationMs: 950 },
        {
          status: 'completed',
          reportMarkdown: generatedMarkdown,
          citations: generatedCitations,
          keyTakeaways: [
            `Nexus verified 32 quantitative facts across 24 primary sources for: "${prompt.slice(0, 45)}...".`,
            'Manufacturing yields and precursor material processing represent the primary bottleneck to commercial scaling.',
            'Cost parity curves project high-margin market adoption within 24-36 months.',
          ],
          metrics: {
            totalTimeSeconds: Number((speedMultiplier * 5.2).toFixed(1)),
            sourcesAnalyzed: 24,
            factsVerified: 32,
            overallCredibility: 98.6,
          },
          chartData: {
            type: 'line',
            title: 'Projected Commercial Adoption & Unit Cost Curve',
            description: 'Unit Cost ($/unit) vs Adoption Index (2024-2030)',
            xAxisKey: 'yearOrCategory',
            linesOrBars: [
              { key: 'cost', name: 'Unit Cost ($)', color: '#38BDF8' },
              { key: 'adoption', name: 'Adoption Index (%)', color: '#34D399' },
            ],
            data: [
              { yearOrCategory: '2024', cost: 320, adoption: 5 },
              { yearOrCategory: '2025', cost: 240, adoption: 12 },
              { yearOrCategory: '2026', cost: 180, adoption: 22 },
              { yearOrCategory: '2027', cost: 135, adoption: 38 },
              { yearOrCategory: '2028', cost: 105, adoption: 58 },
              { yearOrCategory: '2029', cost: 88, adoption: 76 },
              { yearOrCategory: '2030', cost: 75, adoption: 90 },
            ],
          },
        }
      );
    }, stepDelay * 4);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleNewResearch = () => {
    setActiveSessionId(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleAskFollowUp = (question: string) => {
    if (!activeSession) return;

    const followUpText = `\n\n---\n### Follow-Up Query Response: "${question}"\nNexus multi-agent swarm re-queried specialized indexes. The agent confirms that additional empirical trials show a **14% increase in process efficiency** when implementing automated quality assurance feedback loops.`;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              reportMarkdown: (s.reportMarkdown || '') + followUpText,
            }
          : s
      )
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-gray-100 select-none">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewResearch={handleNewResearch}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar
          activeSession={activeSession}
          settings={settings}
          onUpdateSettings={(newSt) => setSettings({ ...settings, ...newSt })}
          onOpenTraceModal={() => setIsTraceModalOpen(true)}
          onExportReport={() => {
            if (activeSession?.reportMarkdown) {
              const blob = new Blob([activeSession.reportMarkdown], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeSession.title.slice(0, 30).replace(/\s+/g, '_')}_Nexus_Report.md`;
              a.click();
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content View Routing: CommandCenter vs Split-Pane View */}
        <AnimatePresence mode="wait">
          {!activeSession ? (
            <motion.div
              key="command-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              <CommandCenter
                onStartResearch={handleStartResearch}
                settings={settings}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeSession.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden"
            >
              {/* Left Agent Trace Pane (30-35% width on desktop) */}
              <div className="w-full md:w-[32%] h-1/2 md:h-full flex-shrink-0 no-print">
                <AgentTrace
                  session={activeSession}
                  onReRunSimulation={() => runAgentSimulation(activeSession.id, activeSession.prompt)}
                  onOpenRawTrace={() => setIsTraceModalOpen(true)}
                />
              </div>

              {/* Right Report Viewer Pane (65-70% width on desktop) */}
              <div className="w-full md:w-[68%] h-1/2 md:h-full flex-1">
                <ReportViewer
                  session={activeSession}
                  onOpenSourcesModal={() => setIsSourcesOpen(true)}
                  onAskFollowUp={handleAskFollowUp}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <SourcesModal
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        citations={activeSession?.citations || []}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />

      <RawTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        session={activeSession}
      />
    </div>
  );
}
