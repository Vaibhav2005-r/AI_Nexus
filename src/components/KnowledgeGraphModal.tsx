import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Network, ExternalLink, ShieldCheck, ZoomIn, ZoomOut, RotateCcw, Filter, Sparkles, Layers } from 'lucide-react';
import * as d3 from 'd3';
import { ResearchSession, SourceCitation } from '../types';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'root' | 'finding' | 'citation';
  radius: number;
  color: string;
  details?: string;
  citationData?: SourceCitation;
  takeawayIndex?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ResearchSession;
}

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeFilter, setNodeFilter] = useState<'all' | 'finding' | 'citation'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Prepare nodes and links from session
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Root node: Central research question
    const rootId = 'root';
    nodes.push({
      id: rootId,
      label: session.prompt.length > 40 ? `${session.prompt.substring(0, 40)}...` : session.prompt,
      type: 'root',
      radius: 22,
      color: '#38bdf8', // sky-400
      details: session.prompt,
    });

    // Finding nodes
    const takeaways = session.keyTakeaways ?? [];
    takeaways.forEach((takeaway, idx) => {
      const findingId = `finding-${idx}`;
      nodes.push({
        id: findingId,
        label: `Finding #${idx + 1}`,
        type: 'finding',
        radius: 16,
        color: '#a855f7', // purple-500
        details: takeaway,
        takeawayIndex: idx + 1,
      });

      // Link root to finding
      links.push({
        source: rootId,
        target: findingId,
        label: 'synthesizes',
      });
    });

    // Citation nodes
    session.citations.forEach((cite) => {
      const citeId = `cite-${cite.id}`;
      // Color based on credibility
      const isHighCred = cite.credibilityScore >= 90;
      const citeColor = isHighCred ? '#10b981' : '#f59e0b'; // emerald-500 vs amber-500

      nodes.push({
        id: citeId,
        label: `[${cite.id}] ${cite.domain}`,
        type: 'citation',
        radius: 13,
        color: citeColor,
        citationData: cite,
      });

      // Check if any takeaway references this citation ID e.g. [1]
      let linkedToFinding = false;
      takeaways.forEach((takeaway, idx) => {
        if (takeaway.includes(`[${cite.id}]`)) {
          links.push({
            source: `finding-${idx}`,
            target: citeId,
            label: 'verified by',
          });
          linkedToFinding = true;
        }
      });

      // Fallback: link to root if not linked to specific finding
      if (!linkedToFinding) {
        links.push({
          source: rootId,
          target: citeId,
          label: 'referenced by',
        });
      }
    });

    return { nodes, links };
  }, [session]);

  // Render D3 Force Directed Graph
  useEffect(() => {
    if (!isOpen || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Filter nodes/links if filter active
    let filteredNodes = [...graphData.nodes];
    if (nodeFilter !== 'all') {
      filteredNodes = filteredNodes.filter(
        (n) => n.type === 'root' || n.type === nodeFilter
      );
    }

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links
      .map((l) => ({ ...l }))
      .filter((l) => {
        const sourceId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });

    // Create container group for zooming
    const g = svg.append('g').attr('class', 'graph-container');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100));
      });

    svg.call(zoom);

    // Initial center transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.95));

    // Simulation setup
    const simulation = d3
      .forceSimulation<GraphNode>(filteredNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(filteredLinks)
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as GraphNode;
            const t = d.target as GraphNode;
            if (s.type === 'root' || t.type === 'root') return 110;
            return 80;
          })
      )
      .force('charge', d3.forceManyBody().strength(-380))
      .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.radius + 18))
      .force('x', d3.forceX(0).strength(0.08))
      .force('y', d3.forceY(0).strength(0.08));

    // Draw Links
    const link = g
      .append('g')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.18)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d: GraphLink) => (d.label === 'verified by' ? '4,4' : 'none'));

    // Draw Node Groups
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('.node')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
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

    // Glowing outer ring for root/findings
    node
      .filter((d) => d.type === 'root')
      .append('circle')
      .attr('r', (d) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2)
      .attr('class', 'animate-pulse');

    // Main circle
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('shadow-lg', true);

    // Icons or Text Inside Node
    node
      .append('text')
      .text((d) => {
        if (d.type === 'root') return '★';
        if (d.type === 'finding') return `F${d.takeawayIndex}`;
        return `[${d.citationData?.id}]`;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => (d.type === 'root' ? '14px' : '10px'))
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace');

    // Node Labels below
    node
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 15)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-family', 'sans-serif')
      .attr('pointer-events', 'none');

    // Node Click Listener
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    // Canvas click to deselect node
    svg.on('click', () => setSelectedNode(null));

    // Ticker update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: GraphLink) => (d.source as GraphNode).x!)
        .attr('y1', (d: GraphLink) => (d.source as GraphNode).y!)
        .attr('x2', (d: GraphLink) => (d.target as GraphNode).x!)
        .attr('y2', (d: GraphLink) => (d.target as GraphNode).y!);

      node.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [isOpen, graphData, nodeFilter]);

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
          className="bg-[#0e0e12] border border-white/15 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#13131a] z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                <Network className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Knowledge Graph Topology</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    D3 Force Simulation
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Visualizing multi-agent relationships between research prompt, findings, and verified sources
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

          {/* Sub Toolbar: Filters & Controls */}
          <div className="px-4 py-2.5 border-b border-white/10 bg-[#111116] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-gray-300 z-10">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Show Nodes:</span>
              <div className="flex items-center bg-[#181820] p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setNodeFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    nodeFilter === 'all'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All ({graphData.nodes.length})
                </button>
                <button
                  onClick={() => setNodeFilter('finding')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    nodeFilter === 'finding'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Findings ({session.keyTakeaways?.length ?? 0})
                </button>
                <button
                  onClick={() => setNodeFilter('citation')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    nodeFilter === 'citation'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Citations ({session.citations.length})
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="hidden lg:flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-400 border border-black inline-block" />
                <span className="text-gray-300">Central Prompt</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-black inline-block" />
                <span className="text-gray-300">Core Findings</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black inline-block" />
                <span className="text-gray-300">Highly Credible Source (90%+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-black inline-block" />
                <span className="text-gray-300">Standard Source</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">Zoom: {zoomLevel}%</span>
            </div>
          </div>

          {/* Canvas & Inspector Main Area */}
          <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
            {/* SVG Force Graph */}
            <svg
              ref={svgRef}
              className="w-full h-full bg-[#09090d] cursor-grab active:cursor-grabbing"
            />

            {/* Node Inspector Side Drawer */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-4 top-4 bottom-4 w-80 md:w-96 bg-[#16161e] border border-white/15 rounded-2xl p-4 shadow-2xl overflow-y-auto flex flex-col justify-between z-20"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                          {selectedNode.type === 'root'
                            ? 'Research Query'
                            : selectedNode.type === 'finding'
                            ? `Finding #${selectedNode.takeawayIndex}`
                            : 'Primary Citation'}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-white p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Details */}
                    {selectedNode.type === 'root' && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {session.prompt}
                        </h4>
                        <div className="p-3 bg-[#0d0d12] rounded-xl border border-white/5 text-xs text-gray-300 space-y-1 font-mono">
                          <p>
                            <span className="text-gray-500">Depth Mode:</span> {session.depth}
                          </p>
                          <p>
                            <span className="text-gray-500">Sources Analyzed:</span>{' '}
                            {session.citations.length}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'finding' && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-purple-400 font-bold uppercase">
                          Key Research Finding
                        </h4>
                        <p className="text-xs text-gray-200 leading-relaxed bg-[#0d0d12] p-3 rounded-xl border border-white/10">
                          {selectedNode.details}
                        </p>
                      </div>
                    )}

                    {selectedNode.type === 'citation' && selectedNode.citationData && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            [{selectedNode.citationData.id}] {selectedNode.citationData.domain}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {selectedNode.citationData.credibilityScore}% Score
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white leading-snug">
                          {selectedNode.citationData.title}
                        </h4>

                        <div className="p-3 bg-[#0d0d12] rounded-xl border border-white/5 space-y-2">
                          <p className="text-[11px] text-gray-300 italic leading-relaxed">
                            "{selectedNode.citationData.snippet}"
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono pt-1 border-t border-white/5">
                            Author: {selectedNode.citationData.author ?? 'Verified Reference'}
                          </p>
                        </div>

                        <a
                          href={selectedNode.citationData.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg transition-all"
                        >
                          <span>Open Source URL</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-gray-500 text-center">
                    Drag nodes to rearrange layout • Scroll canvas to zoom
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer instruction bar */}
          <div className="p-3 border-t border-white/10 bg-[#0a0a0e] flex items-center justify-between text-[11px] font-mono text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Interactive Knowledge Mesh ({graphData.nodes.length} Nodes, {graphData.links.length} Edges)</span>
            </div>
            <span>Click any node to inspect details</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
