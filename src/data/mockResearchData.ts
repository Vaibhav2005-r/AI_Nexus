import { ResearchSession, AppSettings } from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  simulationSpeed: '1x',
  defaultDepth: 'Deep',
  tavilyApiKey: 'tvly-prod-9831a****89a',
  serpApiKey: 'serp-api-7721****09x',
  geminiApiKey: 'ai-studio-auto-injected',
  enabledSources: {
    google: true,
    arxiv: true,
    internalPdfs: true,
    financial: true,
    pubmed: false,
  },
  exportFormat: 'markdown',
  autoCopyMarkdown: false,
};

export const MOCK_SESSIONS: ResearchSession[] = [
  {
    id: 'session-ssb-2030',
    title: 'Economic Impact of Solid-State Batteries in EV Markets by 2030',
    prompt: 'Analyze the commercial viability, energy density milestones, cost parity curves, and supply chain bottlenecks of Solid-State Batteries (SSBs) vs Lithium-Ion in electric vehicles through 2030.',
    createdAt: '2026-08-04T05:30:00Z',
    timeCategory: 'Today',
    depth: 'Deep',
    sourcesFilter: ['Google Web', 'ArXiv Papers', 'Financial Databases'],
    deepWebEnabled: true,
    status: 'completed',
    currentStepIndex: 4,
    metrics: {
      totalTimeSeconds: 6.4,
      sourcesAnalyzed: 28,
      factsVerified: 42,
      overallCredibility: 98.4,
    },
    keyTakeaways: [
      'SSBs are projected to reach volumetric energy density of >900 Wh/L by 2028, enabling 600+ mile range in premium EVs.',
      'Cost parity with conventional NMC-811 lithium-ion cells ($85/kWh) is delayed to 2029-2031 due to halide electrolyte precursor scaling.',
      'Toyota, QuantumScape, and Factorial Energy represent 64% of active automotive pilot production capacity as of Q2 2026.',
    ],
    chartData: {
      type: 'line',
      title: 'Battery Cell Level Cost Projection ($/kWh)',
      description: 'Comparison of Liquid NMC-811 vs Oxide Solid-State vs Sulfide Solid-State (2024-2030)',
      xAxisKey: 'yearOrCategory',
      linesOrBars: [
        { key: 'liquidNMC', name: 'Liquid NMC-811 ($/kWh)', color: '#38BDF8' },
        { key: 'oxideSSB', name: 'Oxide Solid-State ($/kWh)', color: '#A855F7' },
        { key: 'sulfideSSB', name: 'Sulfide Solid-State ($/kWh)', color: '#34D399' },
      ],
      data: [
        { yearOrCategory: '2024', liquidNMC: 128, oxideSSB: 380, sulfideSSB: 450 },
        { yearOrCategory: '2025', liquidNMC: 115, oxideSSB: 290, sulfideSSB: 340 },
        { yearOrCategory: '2026', liquidNMC: 104, oxideSSB: 210, sulfideSSB: 250 },
        { yearOrCategory: '2027', liquidNMC: 95, oxideSSB: 155, sulfideSSB: 180 },
        { yearOrCategory: '2028', liquidNMC: 89, oxideSSB: 120, sulfideSSB: 135 },
        { yearOrCategory: '2029', liquidNMC: 84, oxideSSB: 96, sulfideSSB: 105 },
        { yearOrCategory: '2030', liquidNMC: 80, oxideSSB: 82, sulfideSSB: 88 },
      ],
    },
    citations: [
      {
        id: 1,
        title: 'Solid-State Battery Technology Assessment & Commercialization Roadmap 2026-2032',
        url: 'https://arxiv.org/abs/2602.08412',
        domain: 'arxiv.org',
        favicon: 'https://arxiv.org/favicon.ico',
        snippet: 'Comprehensive analysis of sulfide and oxide solid-state electrolytes detailing volumetric expansion during high-C rate fast charging cycles.',
        credibilityScore: 99,
        credibilityLabel: 'Highly Credible',
        publishDate: 'Feb 2026',
        author: 'Dr. Marcus Vance et al., MIT Department of Materials Science',
      },
      {
        id: 2,
        title: 'Global EV Battery Supply Chain & Raw Material Parity Study Q2 2026',
        url: 'https://bloombergNEF.com/insights/battery-cost-curves-2026',
        domain: 'bloombergNEF.com',
        favicon: 'https://www.bloomberg.com/favicon.ico',
        snippet: 'Lithium metal anode processing yields remain the key bottleneck holding back pilot scale-up to gigawatt-hour manufacturing facilities.',
        credibilityScore: 98,
        credibilityLabel: 'Highly Credible',
        publishDate: 'May 2026',
        author: 'Bloomberg New Energy Finance (BNEF)',
      },
      {
        id: 3,
        title: 'Automotive Solid-State Commercial Deployment Timelines & OEM Partnerships',
        url: 'https://nature.com/articles/s41560-026-0182-y',
        domain: 'nature.com',
        favicon: 'https://www.nature.com/favicon.ico',
        snippet: 'Toyota and Idemitsu Kosan validate pilot production line producing sulfide electrolyte cells with 1,000 cycle retention above 85% capacity.',
        credibilityScore: 97,
        credibilityLabel: 'Highly Credible',
        publishDate: 'Jun 2026',
        author: 'Nature Energy Journal Vol. 11',
      },
      {
        id: 4,
        title: 'QuantumScape B-Sample Battery Cell Test Protocol & Fast-Charge Results',
        url: 'https://quantumscape.com/investor-relations/q1-2026-technology-update',
        domain: 'quantumscape.com',
        favicon: 'https://quantumscape.com/favicon.ico',
        snippet: 'Alpha-2 cell testing completed with 800 charge cycles maintained at room temperature under low external mechanical stack pressure.',
        credibilityScore: 95,
        credibilityLabel: 'Credible',
        publishDate: 'Apr 2026',
        author: 'QuantumScape Engineering Whitepaper',
      },
    ],
    steps: [
      {
        id: 'step-1',
        type: 'planner',
        title: 'Strategy Formulation & Knowledge Mapping',
        description: 'Analyzed research objective, established 5 key analytical dimensions, and mapped domain constraints.',
        status: 'completed',
        timestamp: '05:30:01',
        durationMs: 820,
        details: {
          strategy: [
            'Deconstruct cell energy density trajectories (Wh/kg & Wh/L)',
            'Evaluate manufacturing yield & pack-level thermal safety',
            'Cross-examine precursor material availability (Sulfide vs Oxide)',
            'Forecast cost curve trajectory to 2030 against $80/kWh NMC benchmark',
            'Audit major OEM pilot plant announcements and independent test benchmarks',
          ],
        },
      },
      {
        id: 'step-2',
        type: 'decomposer',
        title: 'Decomposition into Targeted Sub-Queries',
        description: 'Generated 4 targeted search queries executed concurrently across specialized indexes.',
        status: 'completed',
        timestamp: '05:30:02',
        durationMs: 1100,
        subQueries: [
          { id: 'sq-1', query: 'Solid state battery cell energy density 2026 2030 Wh/kg benchmarking', status: 'completed', resultsCount: 8, sourcesFound: ['ArXiv', 'Nature Energy'] },
          { id: 'sq-2', query: 'Sulfide vs Oxide SSB cell manufacturing yields cost per kWh projection', status: 'completed', resultsCount: 6, sourcesFound: ['BloombergNEF', 'IEA'] },
          { id: 'sq-3', query: 'Lithium metal anode processing bottleneck precursor supply chain 2026', status: 'completed', resultsCount: 9, sourcesFound: ['S&P Global', 'Journal of Power Sources'] },
          { id: 'sq-4', query: 'Toyota QuantumScape Factorial Energy pilot plant GWh capacity timeline 2028', status: 'completed', resultsCount: 5, sourcesFound: ['Company SEC Filings', 'Reuters Tech'] },
        ],
      },
      {
        id: 'step-3',
        type: 'search',
        title: 'Parallel Retrieval & Data Ingestion',
        description: 'Scanned 28 primary sources across technical journals, SEC filings, and financial databases.',
        status: 'completed',
        timestamp: '05:30:04',
        durationMs: 2400,
        details: {
          sourcesScanned: 28,
          logs: [
            '[Tavily API] Fetched 12 relevant web pages with rank > 0.88',
            '[ArXiv Agent] Parsing paper 2602.08412: "Solid-State Electrolyte Interphase Stability"',
            '[Financial Index] Extracting BNEF 2026 EV Battery Cost Survey table data',
            '[Deduplication Engine] Filtered out 7 duplicate syndicated PR news items',
          ],
        },
      },
      {
        id: 'step-4',
        type: 'verifier',
        title: 'Cross-Verification & Anti-Hallucination Audit',
        description: 'Cross-referenced 42 specific quantitative metrics against peer-reviewed literature.',
        status: 'completed',
        timestamp: '05:30:05',
        durationMs: 1200,
        details: {
          claimsVerified: 42,
          hallucinationsDiscarded: 3,
          confidenceScore: 98.4,
          logs: [
            'CLAIM CHECK: "Toyota 2027 SSB range 745 miles" -> Verified against Toyota-Idemitsu joint release [3]',
            'DISCARDED CLAIM: "SSB costs currently $50/kWh in 2026" -> Unsubstantiated outlier, corrected to $210-$250/kWh [2]',
            'CONFIDENCE: High convergence across 4 independent lab validation reports',
          ],
        },
      },
      {
        id: 'step-5',
        type: 'report',
        title: 'Synthesis & Cited Report Generation',
        description: 'Drafted 1,800-word executive report with structured sections, charts, and inline citations.',
        status: 'completed',
        timestamp: '05:30:06',
        durationMs: 880,
      },
    ],
    reportMarkdown: `
# Economic & Technical Assessment: Solid-State Batteries in EV Markets (2026–2030)

## Executive Summary
Solid-State Battery (SSB) technology represents the most significant architectural shift in electrochemical energy storage since the commercialization of lithium-ion cells in 1991 [1]. Driven by demands for extended EV driving ranges (>600 miles per single charge) and ultra-fast charging capability (<12 minutes from 10% to 80% SoC), SSBs replace liquid organic electrolyte solutions with solid ionic conductors [3].

While technical breakthroughs in **sulfide-based and halide-based solid electrolytes** have mitigated early degradation issues, the industry faces severe commercial scaling challenges [2]. This report analyzes the economic parity curve, energy density trajectory, and raw material bottlenecks through 2030.

---

## 1. Energy Density Trajectory & Electrochemical Breakthroughs

The core value proposition of SSBs lies in the enablement of **pure lithium metal anodes** [1]. By eliminating porous graphite/silicon composite anodes, volumetric energy density increases dramatically:

* **Volumetric Energy Density:** Standard liquid NMC-811 cells operate at approximately **680–720 Wh/L**. Current pre-commercial B-sample solid-state cells have achieved **880–940 Wh/L** [4].
* **Gravimetric Density:** SSBs achieve **420–480 Wh/kg**, compared to **270–300 Wh/kg** for premium liquid lithium-ion cells [1].
* **Fast-Charge Reliability:** Lithium dendrite formation—historically the primary failure mechanism in lithium-metal systems—has been addressed using **isostatic stack pressure frames** and thin protective interphase coatings [3].

> **Key Finding:** Oxide-based solid electrolytes (e.g., LLZO garnet structures) offer superior thermal stability up to 400°C without runaway, whereas sulfide electrolytes (e.g., LPSCl argyrodites) yield higher room-temperature ionic conductivity (~10⁻² S/cm) [1], making sulfides the preferred choice for passenger vehicle OEMs.

---

## 2. Cost Parity Analysis: SSB vs. Liquid Lithium-Ion (2024–2030)

Achieving cost parity with traditional liquid lithium-ion ($80–$85/kWh cell-level) remains the defining hurdle for mass-market adoption [2].

Current cost breakdowns demonstrate that precursor electrolyte synthesis and dry-room roll-to-roll manufacturing account for **62% of total SSB cell costs in 2026** [2]. As manufacturing shifts from batch synthesis to continuous roll press processes, costs will decay rapidly:

* **2024–2026 (Pilot Phase):** SSBs remain at **$210–$250/kWh**, restricting deployment to luxury flagship vehicles (e.g., $120,000+ hypercars and performance SUVs) [2].
* **2027–2028 (Giga-Scale Ramp):** Projected cell costs drop to **$120–$135/kWh** as Toyota, QuantumScape, and Factorial Energy bring 5–10 GWh facilities online [3], [4].
* **2029–2030 (Mass Adoption Parity):** Cell-level cost approaches **$82–$88/kWh**, creating a competitive tipping point against conventional liquid NMC cells [2].

---

## 3. Supply Chain Bottlenecks & Raw Material Parity

The transition to solid-state chemistry shifts critical mineral dependencies:

1. **Ultra-Thin Lithium Foil:** Producing uniform <20 µm lithium metal foil at industrial scale exhibits current defect rates exceeding 18% [2].
2. **Germanium and Zirconium Inputs:** High-performance argyrodite electrolytes require specialized precursor minerals subject to concentrated global refining operations [1].
3. **Dry-Room Humidity Control:** Sulfide electrolytes react violently with ambient moisture to produce toxic hydrogen sulfide ($H_2S$) gas, requiring ultra-dry assembly environments with dew points below **-50°C** [3].

---

## 4. Strategic Outlook & OEM Deployment Roadmap

* **Toyota / Idemitsu Kosan (2027-2028):** Targeted initial release of 1,000 km (620 mile) range EV with 10-minute fast charging [3].
* **QuantumScape / VW Group PowerCo (2028):** Scale-up of QSE-5 platform targeting 5 GWh annual throughput [4].
* **Factorial / Mercedes-Benz / Hyundai (2027):** Solstice™ platform field trials in vehicle fleets [2].

### Conclusion
Solid-state batteries will not immediately replace traditional lithium-ion; rather, they will capture **14% to 18% of premium global EV market share by 2030** [2]. For mass-market commuter vehicles ($25k–$35k range), liquid iron-phosphate (LFP) and sodium-ion chemistries will continue to dominate due to unmatched cost structures.
`,
  },
  {
    id: 'session-quantum-2026',
    title: 'Quantum Error Correction Milestones: Surface Codes vs Color Codes',
    prompt: 'Compare logical qubit fidelity, threshold overheads, fault-tolerant gate counts, and physical hardware requirements between planar surface codes and 3D color codes in trapped-ion and superconducting processors.',
    createdAt: '2026-08-03T14:15:00Z',
    timeCategory: 'Previous 7 Days',
    depth: 'Deep',
    sourcesFilter: ['ArXiv Papers', 'Google Web'],
    deepWebEnabled: true,
    status: 'completed',
    currentStepIndex: 4,
    metrics: {
      totalTimeSeconds: 5.8,
      sourcesAnalyzed: 22,
      factsVerified: 36,
      overallCredibility: 99.1,
    },
    keyTakeaways: [
      'Surface codes maintain higher fault-tolerant error threshold (~1%), but suffer from high physical-to-logical qubit ratios (1000:1).',
      'Color codes enable transversal implementation of the entire Clifford group, reducing Magic State Distillation overhead by 4x.',
      'Trapped-ion systems (Quantinuum H2) demonstrated distance-7 color codes with physical error rates below 10⁻⁴.',
    ],
    chartData: {
      type: 'bar',
      title: 'Physical Qubits Required Per Logical Qubit (By Code Distance)',
      description: 'Physical qubit overhead comparison at Target Logical Error Rate of 10⁻¹⁰',
      xAxisKey: 'yearOrCategory',
      linesOrBars: [
        { key: 'surfaceCode', name: 'Surface Code Overhead', color: '#6366F1' },
        { key: 'colorCode', name: 'Color Code Overhead', color: '#EC4899' },
      ],
      data: [
        { yearOrCategory: 'Distance 3', surfaceCode: 120, colorCode: 45 },
        { yearOrCategory: 'Distance 5', surfaceCode: 450, colorCode: 180 },
        { yearOrCategory: 'Distance 7', surfaceCode: 1100, colorCode: 420 },
        { yearOrCategory: 'Distance 9', surfaceCode: 2200, colorCode: 850 },
      ],
    },
    citations: [
      {
        id: 1,
        title: 'Fault-Tolerant Quantum Computation with 3D Color Codes in Trapped Ions',
        url: 'https://arxiv.org/abs/2601.11920',
        domain: 'arxiv.org',
        snippet: 'Demonstrating distance-7 color codes with transversal non-Clifford gates using shuttling architectures.',
        credibilityScore: 99,
        credibilityLabel: 'Highly Credible',
        publishDate: 'Jan 2026',
        author: 'Quantinuum & Harvard Physics Group',
      },
      {
        id: 2,
        title: 'Logical Qubit Memory Beyond Breakthrough Thresholds in Superconducting Circuits',
        url: 'https://nature.com/articles/s41586-026-0012-z',
        domain: 'nature.com',
        snippet: 'Google Quantum AI Sycamore processor achieves logical error suppression below physical break-even point.',
        credibilityScore: 98,
        credibilityLabel: 'Highly Credible',
        publishDate: 'Mar 2026',
        author: 'Google Quantum AI Team',
      },
    ],
    steps: [
      {
        id: 'q-step-1',
        type: 'planner',
        title: 'Quantum Architecture Mapping',
        description: 'Defined topological code benchmarking parameters.',
        status: 'completed',
      },
      {
        id: 'q-step-2',
        type: 'decomposer',
        title: 'Task Decomposition',
        description: 'Executed 3 parallel searches across Quantum Physics arXiv feeds.',
        status: 'completed',
        subQueries: [
          { id: 'q-sq-1', query: 'Surface code vs color code logical qubit ratio physical error threshold', status: 'completed' },
          { id: 'q-sq-2', query: 'Quantinuum H2 trapped ion logical error rate distance 7 color code', status: 'completed' },
        ],
      },
      { id: 'q-step-3', type: 'search', title: 'Data Retrieval', description: 'Ingested 22 arXiv preprints and Physical Review Letters.', status: 'completed' },
      { id: 'q-step-4', type: 'verifier', title: 'Mathematical Verification', description: 'Verified error threshold equations.', status: 'completed' },
      { id: 'q-step-5', type: 'report', title: 'Report Generation', description: 'Generated comparative quantum engineering report.', status: 'completed' },
    ],
    reportMarkdown: `
# Quantum Error Correction Architecture Analysis: Surface Codes vs. Color Codes

## Overview
As quantum hardware transitions from the NISQ (Noisy Intermediate-Scale Quantum) era into fault-tolerant quantum computing (FTQC), **topological quantum error correction (QEC)** represents the fundamental bridge [1]. This report compares **Surface Codes** (2D planar square lattices) against **Color Codes** (2D/3D triangular or hexagonal lattices) across scalability, gate overhead, and hardware feasibility [2].

---

## 1. Topological Error Thresholds vs. Qubit Overhead
* **Surface Codes:** Feature a high fault-tolerance threshold of **~1%**, making them the primary architecture for superconducting processors (e.g., Google Quantum AI, IBM Quantum) [2]. However, non-transversal T-gates require resource-intensive **Magic State Distillation (MSD)**, consuming up to 90% of total physical qubits [1].
* **Color Codes:** Possess a slightly lower error threshold (**~0.1%–0.3%**), but natively support transversal Clifford group gates without state distillation [1]. This reduces physical qubit requirements by up to **65%** for complex algorithms such as Shor's algorithm or quantum chemistry simulations.

> **Hardware Convergence:** Trapped-ion systems with high all-to-all connectivity via ion shuttling (e.g., Quantinuum, IonQ) are uniquely suited for Color Codes, whereas 2D nearest-neighbor superconducting grids default to Surface Codes [1], [2].
`,
  },
  {
    id: 'session-semicon-2026',
    title: 'Semiconductor Supply Chain Bottlenecks: EUV Lithography & Packaging',
    prompt: 'Analyze global bottlenecks in High-NA EUV lithography optics (Zeiss), advanced packaging (CoWoS, EMIB), and high-bandwidth memory (HBM4) through 2026.',
    createdAt: '2026-07-28T10:00:00Z',
    timeCategory: 'Older',
    depth: 'Deep',
    sourcesFilter: ['Google Web', 'Financial Databases'],
    deepWebEnabled: true,
    status: 'completed',
    currentStepIndex: 4,
    metrics: {
      totalTimeSeconds: 7.1,
      sourcesAnalyzed: 31,
      factsVerified: 48,
      overallCredibility: 97.8,
    },
    keyTakeaways: [
      'ASML High-NA EUV (EXE:5000) delivery capacity is constrained to 8 units/year due to Zeiss optical lens mirror alignment tolerances.',
      'TSMC CoWoS-S capacity expansion reached 75,000 wafers/month in Q2 2026, yet demand exceeds allocation by 30%.',
      'HBM4 transition to 2048-bit interface requires hybrid bonding (direct copper-to-copper), creating new equipment bottlenecks for Applied Materials and Tokyo Electron.',
    ],
    citations: [
      {
        id: 1,
        title: 'ASML & Zeiss High-NA EUV Manufacturing Yield Update 2026',
        url: 'https://asml.com/investors/reports/2026-q2',
        domain: 'asml.com',
        snippet: '0.55 NA optics assembly requires sub-nanometer mirror surface perfection achieved via ion-beam polishing.',
        credibilityScore: 99,
        credibilityLabel: 'Highly Credible',
        publishDate: 'Jun 2026',
        author: 'ASML Investor Relations',
      },
    ],
    steps: [
      { id: 's-step-1', type: 'planner', title: 'Supply Chain Decomposition', description: 'Mapped 3 main semiconductor bottlenecks.', status: 'completed' },
      { id: 's-step-2', type: 'decomposer', title: 'Sub-Query Execution', description: 'Ran 4 queries across fab capacity filings.', status: 'completed' },
      { id: 's-step-3', type: 'search', title: 'Data Retrieval', description: 'Scanned 31 industry reports.', status: 'completed' },
      { id: 's-step-4', type: 'verifier', title: 'Verification', description: 'Cross-checked fab wafer output.', status: 'completed' },
      { id: 's-step-5', type: 'report', title: 'Report Generation', description: 'Generated fab supply chain analysis.', status: 'completed' },
    ],
    reportMarkdown: `
# Global Semiconductor Supply Chain Assessment (2026)

## Executive Summary
As AI accelerator silicon scales past 100 billion transistors per package, the semiconductor industry's primary growth bottleneck has shifted from front-end transistor shrinking (2nm/1.4nm nodes) to **High-NA EUV optics precision** and **advanced 2.5D/3D packaging substrates** [1].

---

## Key Findings
1. **High-NA EUV Optics (ASML / Carl Zeiss):** High-NA systems with 0.55 numerical aperture allow single-exposure patterning for 2nm nodes, but Zeiss optics manufacturing yields restrict global deliveries to under 10 systems per year [1].
2. **CoWoS & Substrate Scaling:** TSMC's CoWoS (Chip-on-Wafer-on-Substrate) remains fully allocated through 2027, forcing fabless designers like NVIDIA, AMD, and Google to adopt multi-foundry packaging strategies.
`,
  },
];

export const SUGGESTED_PROMPTS = [
  {
    icon: 'Zap',
    title: 'Solid-State Batteries',
    subtitle: 'Commercial viability, energy density & EV cost parity by 2030',
    prompt: 'Analyze the commercial viability, energy density milestones, cost parity curves, and supply chain bottlenecks of Solid-State Batteries (SSBs) vs Lithium-Ion in electric vehicles through 2030.',
    category: 'Energy & Hardware',
  },
  {
    icon: 'Cpu',
    title: 'Quantum Error Correction',
    subtitle: 'Surface codes vs 3D color codes in trapped-ion processors',
    prompt: 'Compare logical qubit fidelity, threshold overheads, fault-tolerant gate counts, and physical hardware requirements between planar surface codes and 3D color codes in trapped-ion and superconducting processors.',
    category: 'Quantum Computing',
  },
  {
    icon: 'Network',
    title: 'Semiconductor Bottlenecks',
    subtitle: 'High-NA EUV lithography, CoWoS packaging & HBM4 memory',
    prompt: 'Analyze global bottlenecks in High-NA EUV lithography optics (Zeiss), advanced packaging (CoWoS, EMIB), and high-bandwidth memory (HBM4) through 2026.',
    category: 'Semiconductors',
  },
  {
    icon: 'Bot',
    title: 'Multi-Agent AI Architectures',
    subtitle: 'ReAct vs AutoGen vs Swarm orchestration patterns',
    prompt: 'Evaluate autonomous agent orchestration patterns (ReAct vs Plan-and-Solve vs Swarm) for enterprise rag workflows with latency & hallucination benchmarks.',
    category: 'AI System Design',
  },
];
