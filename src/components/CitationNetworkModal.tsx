import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Network,
  ExternalLink,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Sparkles,
  Share2,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import * as d3 from 'd3';
import { ResearchSession, SourceCitation } from '../types';

interface CitationNode extends d3.SimulationNodeDatum {
  id: string;
  citationId: number;
  label: string;
  domain: string;
  title: string;
  credibilityScore: number;
  type: 'citation' | 'finding';
  radius: number;
  color: string;
  citationData?: SourceCitation;
  findingText?: string;
  findingIndex?: number;
}

interface CitationLink extends d3.SimulationLinkDatum<CitationNode> {
  source: string | CitationNode;
  target: string | CitationNode;
  relationship: 'cross-reference' | 'supports-finding' | 'co-citation';
  strength: number;
}

interface CitationNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ResearchSession;
}

export const CitationNetworkModal: React.FC<CitationNetworkModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<CitationNode | null>(null);
  const [minCredibilityFilter, setMinCredibilityFilter] = useState<number>(0);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Extract unique domains for dropdown
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    session.citations.forEach((c) => domains.add(c.domain));
    return Array.from(domains);
  }, [session.citations]);

  // Generate citation network nodes and cross-reference links
  const networkData = useMemo(() => {
    const nodes: CitationNode[] = [];
    const links: CitationLink[] = [];

    // Add Citation Nodes
    session.citations.forEach((cite) => {
      const isHighCred = cite.credibilityScore >= 90;
      nodes.push({
        id: `cite-${cite.id}`,
        citationId: cite.id,
        label: `[${cite.id}] ${cite.domain}`,
        domain: cite.domain,
        title: cite.title,
        credibilityScore: cite.credibilityScore,
        type: 'citation',
        radius: isHighCred ? 18 : 14,
        color: isHighCred ? '#10b981' : '#f59e0b', // emerald-500 or amber-500
        citationData: cite,
      });
    });

    // Add Finding Nodes
    const takeaways = session.keyTakeaways ?? [];
    takeaways.forEach((takeaway, idx) => {
      nodes.push({
        id: `finding-${idx + 1}`,
        citationId: -1,
        label: `Finding #${idx + 1}`,
        domain: 'Synthesized Finding',
        title: takeaway,
        credibilityScore: 100,
        type: 'finding',
        radius: 20,
        color: '#8b5cf6', // purple-500
        findingText: takeaway,
        findingIndex: idx + 1,
      });
    });

    // Generate Cross-reference Links between Citations
    for (let i = 0; i < session.citations.length; i++) {
      for (let j = i + 1; j < session.citations.length; j++) {
        const citeA = session.citations[i];
        const citeB = session.citations[j];

        // 1) Domain co-citation match
        const sameDomain = citeA.domain === citeB.domain;

        // 2) Keyword / Topic overlap in snippets/titles
        const wordsA = new Set(
          `${citeA.title} ${citeA.snippet}`.toLowerCase().match(/\b\w{4,}\b/g) || []
        );
        const wordsB = `${citeB.title} ${citeB.snippet}`.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const sharedWords = wordsB.filter((w) => wordsA.has(w));

        if (sameDomain || sharedWords.length >= 2) {
          links.push({
            source: `cite-${citeA.id}`,
            target: `cite-${citeB.id}`,
            relationship: 'cross-reference',
            strength: sameDomain ? 0.8 : 0.5,
          });
        }
      }
    }

    // Connect Citations to Findings based on markdown references
    takeaways.forEach((takeaway, idx) => {
      const findingNodeId = `finding-${idx + 1}`;
      session.citations.forEach((cite) => {
        if (takeaway.includes(`[${cite.id}]`)) {
          links.push({
            source: `cite-${cite.id}`,
            target: findingNodeId,
            relationship: 'supports-finding',
            strength: 0.9,
          });
        }
      });
    });

    return { nodes, links };
  }, [session]);

  // Compute stats for selected node
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode) return [];
    return networkData.links.filter((l) => {
      const sId = typeof l.source === 'object' ? (l.source as CitationNode).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as CitationNode).id : l.target;
      return sId === selectedNode.id || tId === selectedNode.id;
    });
  }, [selectedNode, networkData]);

  // D3 Force Graph Simulation Effect
  useEffect(() => {
    if (!isOpen || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Filter nodes
    let filteredNodes = networkData.nodes.filter((n) => {
      if (n.type === 'citation') {
        if (n.credibilityScore < minCredibilityFilter) return false;
        if (selectedDomain !== 'all' && n.domain !== selectedDomain) return false;
      }
      return true;
    });

    const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = networkData.links
      .map((l) => ({ ...l }))
      .filter((l) => {
        const sId = typeof l.source === 'object' ? (l.source as CitationNode).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as CitationNode).id : l.target;
        return activeNodeIds.has(sId) && activeNodeIds.has(tId);
      });

    // Zoom container
    const g = svg.append('g').attr('class', 'citation-network-group');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomScale(Math.round(event.transform.k * 100));
      });

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.95));

    // Force Simulation
    const simulation = d3
      .forceSimulation<CitationNode>(filteredNodes)
      .force(
        'link',
        d3
          .forceLink<CitationNode, CitationLink>(filteredLinks)
          .id((d) => d.id)
          .distance((d) => (d.relationship === 'supports-finding' ? 95 : 120))
      )
      .force('charge', d3.forceManyBody().strength(-360))
      .force('collide', d3.forceCollide<CitationNode>().radius((d) => d.radius + 16))
      .force('x', d3.forceX(0).strength(0.06))
      .force('y', d3.forceY(0).strength(0.06));

    // Render Edges
    const link = g
      .append('g')
      .selectAll<SVGLineElement, CitationLink>('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: CitationLink) =>
        d.relationship === 'supports-finding'
          ? 'rgba(139, 92, 246, 0.45)'
          : 'rgba(56, 189, 248, 0.35)'
      )
      .attr('stroke-width', (d: CitationLink) => (d.relationship === 'supports-finding' ? 2 : 1.5))
      .attr('stroke-dasharray', (d: CitationLink) => (d.relationship === 'cross-reference' ? '5,5' : 'none'));

    // Render Nodes
    const node = g
      .append('g')
      .selectAll<SVGGElement, CitationNode>('.node')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, CitationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer pulsing halo
    node
      .filter((d: CitationNode) => d.type === 'finding')
      .append('circle')
      .attr('r', (d: CitationNode) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2);

    // Node inner circle
    node
      .append('circle')
      .attr('r', (d: CitationNode) => d.radius)
      .attr('fill', (d: CitationNode) => d.color)
      .attr('stroke', '#09090d')
      .attr('stroke-width', 2);

    // Node label badge
    node
      .append('text')
      .text((d: CitationNode) => (d.type === 'finding' ? `F${d.findingIndex}` : `[${d.citationId}]`))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace');

    // Label under node
    node
      .append('text')
      .text((d: CitationNode) => d.domain)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: CitationNode) => d.radius + 14)
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .attr('pointer-events', 'none');

    // Node click
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on('click', () => setSelectedNode(null));

    // Simulation ticker
    simulation.on('tick', () => {
      link
        .attr('x1', (d: CitationLink) => (d.source as CitationNode).x!)
        .attr('y1', (d: CitationLink) => (d.source as CitationNode).y!)
        .attr('x2', (d: CitationLink) => (d.target as CitationNode).x!)
        .attr('y2', (d: CitationLink) => (d.target as CitationNode).y!);

      node.attr('transform', (d: CitationNode) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [isOpen, networkData, minCredibilityFilter, selectedDomain]);

  if (!isOpen) return null;

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
          className="bg-[#0b0b0f] border border-white/15 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative font-sans"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-[#12121a] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Network className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Citation Cross-Reference Network</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    D3 Force Graph
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Visualizing source-to-source co-citations & corroboration links across research findings
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

          {/* Controls Bar */}
          <div className="px-4 py-2.5 border-b border-white/10 bg-[#0e0e14] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-gray-300 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filter Domain:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-[#181822] border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="all">All Domains ({uniqueDomains.length})</option>
                  {uniqueDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Min Credibility:</span>
                <select
                  value={minCredibilityFilter}
                  onChange={(e) => setMinCredibilityFilter(Number(e.target.value))}
                  className="bg-[#181822] border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value={0}>All (0%+)</option>
                  <option value={90}>High Credibility (90%+)</option>
                  <option value={95}>Elite Peer-Reviewed (95%+)</option>
                </select>
              </div>
            </div>

            {/* Network Legend */}
            <div className="hidden lg:flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Elite Source (90%+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>Standard Source</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                <span>Core Finding</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t border-dashed border-cyan-400 inline-block" />
                <span>Co-Citation Link</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">Zoom: {zoomScale}%</span>
            </div>
          </div>

          {/* D3 Simulation Canvas */}
          <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
            <svg
              ref={svgRef}
              className="w-full h-full bg-[#08080c] cursor-grab active:cursor-grabbing"
            />

            {/* Selected Node Drawer */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-4 top-4 bottom-4 w-80 md:w-96 bg-[#14141c] border border-white/15 rounded-2xl p-4 shadow-2xl overflow-y-auto flex flex-col justify-between z-20"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                          {selectedNode.type === 'finding'
                            ? `Research Finding #${selectedNode.findingIndex}`
                            : `Citation [${selectedNode.citationId}]`}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-white p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedNode.type === 'citation' && selectedNode.citationData && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {selectedNode.citationData.domain}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            {selectedNode.citationData.credibilityScore}% Score
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-snug">
                          {selectedNode.citationData.title}
                        </h4>

                        <div className="p-3 bg-[#0a0a0f] rounded-xl border border-white/5 space-y-2">
                          <p className="text-xs text-gray-300 italic leading-relaxed">
                            "{selectedNode.citationData.snippet}"
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono pt-1 border-t border-white/5">
                            Author: {selectedNode.citationData.author || 'Verified Source'}
                          </p>
                        </div>

                        <div className="p-3 bg-[#0a0a0f] rounded-xl border border-white/5 space-y-1 text-xs">
                          <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">
                            Active Network Connections ({selectedNodeConnections.length})
                          </span>
                          <p className="text-gray-400 text-[11px] leading-snug">
                            Connected via shared topics & direct research corroboration.
                          </p>
                        </div>

                        <a
                          href={selectedNode.citationData.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg transition-all"
                        >
                          <span>Visit Citation URL</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {selectedNode.type === 'finding' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono text-purple-400 font-bold uppercase">
                          Key Synthesis Finding
                        </h4>
                        <p className="text-xs text-gray-200 leading-relaxed bg-[#0a0a0f] p-3 rounded-xl border border-white/10">
                          {selectedNode.findingText}
                        </p>
                        <div className="p-3 bg-[#0a0a0f] rounded-xl border border-white/5 text-xs text-gray-400 font-mono">
                          Corroborated by active citation network references.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-gray-500 text-center">
                    Click background to dismiss • Drag nodes to explore cluster dynamics
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Bar */}
          <div className="p-3 border-t border-white/10 bg-[#0a0a0e] flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                Citation Topology: {networkData.nodes.length} Nodes, {networkData.links.length} Cross-Reference Links
              </span>
            </div>
            <span>Powered by D3.js Force Simulation</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
