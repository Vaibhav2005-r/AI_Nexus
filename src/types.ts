export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AgentStepType = 'planner' | 'decomposer' | 'search' | 'verifier' | 'report';

export interface SubQuery {
  id: string;
  query: string;
  status: StepStatus;
  resultsCount?: number;
  sourcesFound?: string[];
}

export interface AgentStep {
  id: string;
  type: AgentStepType;
  title: string;
  description: string;
  status: StepStatus;
  timestamp?: string;
  durationMs?: number;
  subQueries?: SubQuery[];
  details?: {
    strategy?: string[];
    sourcesScanned?: number;
    claimsVerified?: number;
    hallucinationsDiscarded?: number;
    confidenceScore?: number;
    logs?: string[];
  };
}

export interface SourceCitation {
  id: number;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  snippet: string;
  credibilityScore: number; // 0 - 100
  credibilityLabel: 'Highly Credible' | 'Credible' | 'Moderate' | 'Unverified';
  publishDate?: string;
  author?: string;
}

export interface ChartDataPoint {
  yearOrCategory: string;
  [key: string]: string | number;
}

export interface ResearchChartConfig {
  type: 'line' | 'bar' | 'area';
  title: string;
  description: string;
  xAxisKey: string;
  linesOrBars: {
    key: string;
    name: string;
    color: string;
  }[];
  data: ChartDataPoint[];
}

export interface ResearchSession {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  timeCategory: 'Today' | 'Previous 7 Days' | 'Older';
  depth: 'Fast' | 'Deep' | 'Exhaustive';
  sourcesFilter: string[];
  deepWebEnabled: boolean;
  status: 'idle' | 'running' | 'completed';
  currentStepIndex: number;
  steps: AgentStep[];
  reportMarkdown?: string;
  citations: SourceCitation[];
  chartData?: ResearchChartConfig;
  keyTakeaways?: string[];
  metrics?: {
    totalTimeSeconds: number;
    sourcesAnalyzed: number;
    factsVerified: number;
    overallCredibility: number;
  };
}

export interface AppSettings {
  simulationSpeed: '1x' | '2x' | 'instant';
  defaultDepth: 'Fast' | 'Deep' | 'Exhaustive';
  tavilyApiKey: string;
  serpApiKey: string;
  geminiApiKey: string;
  enabledSources: {
    google: boolean;
    arxiv: boolean;
    internalPdfs: boolean;
    financial: boolean;
    pubmed: boolean;
  };
  exportFormat: 'markdown' | 'pdf' | 'json';
  autoCopyMarkdown: boolean;
}

export interface GlobalStats {
  total_sessions: number;
  total_sources_analyzed: number;
  total_facts_verified: number;
  average_credibility: number;
}
