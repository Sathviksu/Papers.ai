'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Handle,
  Position,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Book, User, School, Calendar, FileText, Info, Sparkles, Move } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/aurora/Badge';

// ── CUSTOM NODE — Handles required for edges to render ────────────────────────
const CitationNode = ({ data, selected }) => {
  const isMain = data.isMain;
  return (
    <>
      <Handle type="target" position={Position.Left}   style={{ background: isMain ? '#fff' : '#6366f1', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top}    style={{ background: isMain ? '#fff' : '#6366f1', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right}  style={{ background: isMain ? '#fff' : '#94a3b8', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: isMain ? '#fff' : '#94a3b8', width: 8, height: 8 }} />

      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 min-w-[180px] max-w-[240px] shadow-sm ${
        isMain
          ? 'bg-gradient-to-br from-aurora-blue to-aurora-violet text-white border-transparent'
          : `bg-white border-aurora-border hover:border-aurora-blue ${selected ? 'ring-2 ring-aurora-blue border-aurora-blue shadow-md' : ''}`
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${isMain ? 'bg-white/20' : 'bg-aurora-blue/10'}`}>
            <Book className={`h-4 w-4 ${isMain ? 'text-white' : 'text-aurora-blue'}`} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isMain ? 'text-white/70' : 'text-aurora-text-low'}`}>
              {isMain ? 'Main Paper' : (data.type || 'Citation')}
            </p>
            <p className={`text-sm font-bold line-clamp-2 ${isMain ? 'text-white' : 'text-aurora-text-high'}`}>
              {data.label}
            </p>
            {!isMain && data.year && (
              <p className="text-[10px] mt-1 text-aurora-text-mid font-medium">Published: {data.year}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const nodeTypes = { citation: CitationNode };

// ── RADIAL LAYOUT (main paper in center, citations in ring) ───────────────────
function radialLayout(nodes) {
  if (nodes.length === 0) return nodes;
  const mainIdx = nodes.findIndex(n => n.id === 'main-paper');
  const cx = 500, cy = 340;
  const R = 280;

  return nodes.map((n, i) => {
    if (n.id === 'main-paper') return { ...n, position: { x: cx - 100, y: cy - 50 } };
    const citIdx = i <= mainIdx ? i : i - 1;
    const total = nodes.length - 1;
    const angle = (2 * Math.PI * citIdx) / total - Math.PI / 2;
    return { ...n, position: { x: cx + R * Math.cos(angle) - 90, y: cy + R * Math.sin(angle) - 50 } };
  });
}

// ── INNER COMPONENT ───────────────────────────────────────────────────────────
function CitationGraphInner({ paper, citations }) {
  const { fitView } = useReactFlow();
  const [selectedCitation, setSelectedCitation] = useState(null);
  const initialized = useRef(false);

  const { rfNodes, rfEdges } = useMemo(() => {
    const rawNodes = [
      {
        id: 'main-paper',
        type: 'citation',
        data: { label: paper.title, isMain: true },
        position: { x: 0, y: 0 },
      },
      ...citations.map((c, i) => ({
        id: `cit-${i}`,
        type: 'citation',
        data: {
          label: c.ref || 'Untitled Reference',
          type: c.type,
          year: c.year,
          authors: c.authors,
          conference: c.conference,
          context: c.context,
          role: c.role,
          isMain: false,
        },
        position: { x: 0, y: 0 },
      })),
    ];

    const rawEdges = citations.map((c, i) => ({
      id: `e-${i}`,
      source: 'main-paper',
      target: `cit-${i}`,
      label: 'cites',
      labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85 },
      labelBgPadding: [4, 3],
      labelBgBorderRadius: 4,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
      style: { stroke: '#cbd5e1', strokeWidth: 1.8 },
    }));

    return { rfNodes: radialLayout(rawNodes), rfEdges: rawEdges };
  }, [paper, citations]);

  const [nodes, setNodes] = useState(rfNodes);
  const [edges, setEdges] = useState(rfEdges);

  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
    initialized.current = false;
  }, [rfNodes, rfEdges]);

  useEffect(() => {
    if (!initialized.current && nodes.length > 0) {
      const t = setTimeout(() => { fitView({ padding: 0.15, duration: 600 }); initialized.current = true; }, 100);
      return () => clearTimeout(t);
    }
  }, [nodes, fitView]);

  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), []);

  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), []);

  const onNodeClick = useCallback((_, node) => {
    if (node.id === 'main-paper') {
      setSelectedCitation({
        label: paper.title,
        authors: paper.authors,
        year: paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'N/A',
        type: 'Main Research',
        conference: paper.conference || 'Current Publication',
        context: 'Primary subject of this research.',
        isMain: true,
      });
    } else {
      setSelectedCitation({ ...node.data, isMain: false });
    }
  }, [paper]);

  const onNodeMouseEnter = useCallback((_, node) => {
    setEdges(prev => prev.map(edge => {
      const isConnected = edge.source === node.id || edge.target === node.id;
      return isConnected
        ? { ...edge, animated: true, style: { ...edge.style, stroke: '#6366f1', strokeWidth: 2.5 } }
        : { ...edge, style: { ...edge.style, opacity: 0.25 } };
    }));
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setEdges(prev => prev.map(edge => ({
      ...edge, animated: false,
      style: { stroke: '#cbd5e1', strokeWidth: 1.8 },
    })));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-aurora-blue/10 rounded-xl">
            <Move className="h-5 w-5 text-aurora-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-aurora-text-high font-heading">Citation Network</h3>
            <p className="text-xs text-aurora-text-low font-medium">1st-degree references and their contexts</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white">{citations.length} References</Badge>
      </div>

      {/* Graph */}
      <Card className="overflow-hidden border-aurora-border shadow-sm">
        <CardContent className="p-0">
          <div style={{ height: 500, background: '#f8fafc' }} className="relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              panOnScroll={false}
              panOnDrag={true}
              preventScrolling={false}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#cbd5e1" gap={20} />

              {/* Legend */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-aurora-border shadow-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-aurora-blue to-aurora-violet" />
                    <span className="text-[10px] font-bold text-aurora-text-high uppercase">Central Paper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-aurora-border" />
                    <span className="text-[10px] font-bold text-aurora-text-mid uppercase">Cited Paper</span>
                  </div>
                </div>
              </div>
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Detail panel */}
      <Card className={`transition-all duration-500 border-2 ${selectedCitation ? 'border-aurora-blue shadow-lg opacity-100' : 'border-aurora-border/20 opacity-50'}`}>
        <CardContent className="p-8">
          {!selectedCitation ? (
            <div className="flex flex-col items-center py-10 text-center gap-4">
              <Info className="h-8 w-8 text-aurora-text-low/30" />
              <p className="text-aurora-text-low font-medium">Click any node to reveal citation metadata and context</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={selectedCitation.isMain ? 'success' : 'default'}>
                      {selectedCitation.type || 'Citation'}
                    </Badge>
                    {selectedCitation.role && (
                      <Badge variant="outline" className="text-aurora-violet border-aurora-violet/30">{selectedCitation.role}</Badge>
                    )}
                  </div>
                  <h4 className="text-2xl font-bold font-heading text-aurora-text-high mb-4">{selectedCitation.label}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-aurora-blue/5 rounded-lg">
                          <User className="h-4 w-4 text-aurora-blue" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-aurora-text-low uppercase">Authors</p>
                          <p className="text-sm font-semibold text-aurora-text-mid">{selectedCitation.authors?.join(', ') || 'Metadata not found'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-aurora-cyan/5 rounded-lg">
                          <Calendar className="h-4 w-4 text-aurora-cyan" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-aurora-text-low uppercase">Year</p>
                          <p className="text-sm font-semibold text-aurora-text-mid">{selectedCitation.year || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-aurora-violet/5 rounded-lg">
                          <School className="h-4 w-4 text-aurora-violet" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-aurora-text-low uppercase">Conference / Journal</p>
                          <p className="text-sm font-semibold text-aurora-text-mid">{selectedCitation.conference || 'Unknown venue'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!selectedCitation.isMain && (
                  <div className="w-full md:w-80 bg-aurora-surface-1 rounded-2xl p-6 border border-aurora-border">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-aurora-blue" />
                      <p className="text-xs font-bold text-aurora-text-high uppercase">Context of Citation</p>
                    </div>
                    <p className="text-sm text-aurora-text-mid leading-relaxed italic">
                      &ldquo;{selectedCitation.context || 'Context not explicitly extracted during this pass.'}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── PUBLIC EXPORT ─────────────────────────────────────────────────────────────
export function CitationNetworkGraph({ paper, citations = [] }) {
  if (!citations.length) {
    return (
      <div className="flex items-center justify-center h-48 text-aurora-text-low text-sm">
        <Sparkles className="h-5 w-5 mr-2 text-aurora-violet" /> No citation data extracted for this paper.
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <CitationGraphInner paper={paper} citations={citations} />
    </ReactFlowProvider>
  );
}
