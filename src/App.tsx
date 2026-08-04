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
  const handleStartResearch = async (
    prompt: string,
    depth: 'Fast' | 'Deep' | 'Exhaustive',
    deepWeb: boolean,
    sourcesFilter: string[]
  ) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, depth, deepWebEnabled: deepWeb, sourcesFilter, domainMode: 'General' }),
      });
      
      if (!res.ok) {
        console.error("Failed to start research");
        return;
      }
      
      const session: ResearchSession = await res.json();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);

      const eventSource = new EventSource(`http://localhost:8000/api/v1/research/${session.id}/stream`);

      eventSource.addEventListener('step_update', (e) => {
        const { stepIndex, step } = JSON.parse(e.data);
        setSessions((prevSessions) =>
          prevSessions.map((s) => {
            if (s.id !== session.id) return s;
            const updatedSteps = [...s.steps];
            const existingIndex = updatedSteps.findIndex(existing => existing.id === step.id);
            if (existingIndex >= 0) {
              updatedSteps[existingIndex] = { ...updatedSteps[existingIndex], ...step };
            } else {
              updatedSteps.push(step);
            }
            return {
              ...s,
              steps: updatedSteps,
              currentStepIndex: Math.max(s.currentStepIndex, updatedSteps.length - 1),
            };
          })
        );
      });

      eventSource.addEventListener('session_complete', (e) => {
        const completedSession = JSON.parse(e.data);
        setSessions((prevSessions) =>
          prevSessions.map((s) => (s.id === session.id ? completedSession : s))
        );
        eventSource.close();
      });

      eventSource.addEventListener('error', (e) => {
        console.error("Pipeline error or connection closed", e);
        // Do not close on typical SSE reconnects, only if we know it's a hard error
      });
    } catch (err) {
      console.error(err);
    }
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
                  onReRunSimulation={() => console.log('Re-run simulation not supported on live backend yet')}
                  onOpenRawTrace={() => setIsTraceModalOpen(true)}
                />
              </div>

              {/* Right Report Viewer Pane (65-70% width on desktop) */}
              <div className="w-full md:w-[68%] h-1/2 md:h-full flex-1">
                <ReportViewer
                  session={activeSession}
                  allSessions={sessions}
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
