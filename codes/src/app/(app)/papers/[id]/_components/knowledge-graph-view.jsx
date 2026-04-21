'use client';

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
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
import { Lightbulb, Box, Database, Cog, Settings, Route } from 'lucide-react';

// ── STYLE CONSTANTS ───────────────────────────────────────────────────────────
const TYPE_COLORS = {
  Concept: { bg: '#fef9c3', border: '#f59e0b', icon: '#d97706', text: '#92400e' },
  Model:   { bg: '#dbeafe', border: '#3b82f6', icon: '#2563eb', text: '#1e40af' },
  Dataset: { bg: '#dcfce7', border: '#22c55e', icon: '#16a34a', text: '#14532d' },
  Method:  { bg: '#f3e8ff', border: '#a855f7', icon: '#9333ea', text: '#581c87' },
  Step:    { bg: '#e0f2fe', border: '#0ea5e9', icon: '#0284c7', text: '#075985' },
  default: { bg: '#f1f5f9', border: '#94a3b8', icon: '#64748b', text: '#334155' },
};
const TYPE_ICONS = { Concept: Lightbulb, Model: Box, Dataset: Database, Method: Cog, Step: Route, default: Settings };

// ── CUSTOM NODE — MUST include <Handle> for edges to render ──────────────────
const CustomNode = ({ data }) => {
  const t = data.type;
  const c = TYPE_COLORS[t] || TYPE_COLORS.default;
  const Icon = TYPE_ICONS[t] || TYPE_ICONS.default;
  return (
    <>
      {/* These invisible handles are the edge attachment points */}
      <Handle type="target" position={Position.Left}  style={{ background: c.border, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top}   style={{ background: c.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: c.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: c.border, width: 8, height: 8 }} />

      <div style={{
        background: c.bg,
        border: `2px solid ${c.border}`,
        borderRadius: 10,
        padding: '7px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
        minWidth: 110,
        maxWidth: 190,
        cursor: 'default',
      }}>
        <Icon style={{ width: 13, height: 13, flexShrink: 0, color: c.icon }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.35, wordBreak: 'break-word' }}>
          {data.label}
        </span>
      </div>
    </>
  );
};

const nodeTypes = { custom: CustomNode };

// ── FORCE LAYOUT (spring simulation, no external libs) ────────────────────────
function forceLayout(nodes, edges, iterations = 200) {
  if (nodes.length === 0) return nodes;

  const W = 900, H = 600;
  const REPEL = 12000;
  const ATTRACT = 0.08;
  const IDEAL_LEN = 220;

  const adj = new Set(edges.map(e => `${e.source}||${e.target}`));

  // Place nodes in a circle initially
  const pos = nodes.map((_, i) => ({
    x: W / 2 + (W * 0.38) * Math.cos((2 * Math.PI * i) / nodes.length),
    y: H / 2 + (H * 0.38) * Math.sin((2 * Math.PI * i) / nodes.length),
    vx: 0, vy: 0,
  }));

  const idxById = {};
  nodes.forEach((n, i) => { idxById[n.id] = i; });

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    // Repulsion: all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = REPEL / (dist * dist);
        pos[i].vx += (dx / dist) * force;
        pos[i].vy += (dy / dist) * force;
        pos[j].vx -= (dx / dist) * force;
        pos[j].vy -= (dy / dist) * force;
      }
    }

    // Attraction: connected pairs
    edges.forEach(e => {
      const si = idxById[e.source];
      const ti = idxById[e.target];
      if (si == null || ti == null) return;
      const dx = pos[ti].x - pos[si].x;
      const dy = pos[ti].y - pos[si].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = ATTRACT * (dist - IDEAL_LEN);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      pos[si].vx += fx; pos[si].vy += fy;
      pos[ti].vx -= fx; pos[ti].vy -= fy;
    });

    for (const p of pos) {
      p.x += p.vx * cooling;
      p.y += p.vy * cooling;
      p.vx *= 0.5; p.vy *= 0.5;
      p.x = Math.max(80, Math.min(W - 80, p.x));
      p.y = Math.max(60, Math.min(H - 60, p.y));
    }
  }

  return nodes.map((n, i) => ({ ...n, position: { x: pos[i].x, y: pos[i].y } }));
}

// ── INNER COMPONENT ───────────────────────────────────────────────────────────
function KnowledgeGraphInner({ knowledgeGraph }) {
  const { fitView } = useReactFlow();

  const { rfNodes, rfEdges } = useMemo(() => {
    const rawNodes = knowledgeGraph?.nodes || [];
    const rawEdges = knowledgeGraph?.edges || [];

    // Build multiple-key ID map: by id, by index, by label
    const idMap = {};
    rawNodes.forEach((n, i) => {
      const sid = String(n.id);
      idMap[sid] = sid;
      idMap[String(i)] = sid;
      if (n.label) idMap[String(n.label).toLowerCase()] = sid;
    });

    const mappedNodes = rawNodes.map((n) => ({
      id: String(n.id),
      type: 'custom',
      data: { label: n.label, type: n.type || 'Concept' },
      position: { x: 0, y: 0 },
    }));

    const validNodeIds = new Set(mappedNodes.map(n => n.id));

    const mappedEdges = rawEdges
      .map((e, i) => {
        const rawSrc = String(e.source);
        const rawTgt = String(e.target);
        const src = idMap[rawSrc] || idMap[rawSrc.toLowerCase()] || rawSrc;
        const tgt = idMap[rawTgt] || idMap[rawTgt.toLowerCase()] || rawTgt;
        return {
          id: e.id ? String(e.id) : `e${i}`,
          source: src,
          target: tgt,
          label: e.label || '',
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          labelStyle: { fontSize: 9, fill: '#4f46e5', fontWeight: 600 },
          labelBgStyle: { fill: '#eef2ff', fillOpacity: 0.9 },
          labelBgPadding: [3, 5],
          labelBgBorderRadius: 4,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 16, height: 16 },
        };
      })
      // Only keep edges where BOTH source and target exist as node IDs
      .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target) && e.source !== e.target);

    const laidOut = forceLayout(mappedNodes, mappedEdges);
    return { rfNodes: laidOut, rfEdges: mappedEdges };
  }, [knowledgeGraph]);

  const [nodes, setNodes] = React.useState(rfNodes);
  const [edges, setEdges] = React.useState(rfEdges);
  const initialized = useRef(false);

  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
    initialized.current = false;
  }, [rfNodes, rfEdges]);

  useEffect(() => {
    if (!initialized.current && nodes.length > 0) {
      const t = setTimeout(() => { fitView({ padding: 0.18, duration: 600 }); initialized.current = true; }, 120);
      return () => clearTimeout(t);
    }
  }, [nodes, fitView]);

  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), []);

  return (
    <div style={{ height: 560, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
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
        <Background color="#cbd5e1" gap={22} size={1} />

        {/* Type legend */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 5,
          pointerEvents: 'none',
        }}>
          {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'default').map(([type, c]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c.border }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>{type}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 10,
          background: 'rgba(255,255,255,0.85)', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '4px 10px',
          fontSize: 10, color: '#64748b', fontWeight: 600,
          pointerEvents: 'none',
        }}>
          {nodes.length} nodes · {edges.length} connections
        </div>
      </ReactFlow>
    </div>
  );
}

// ── PUBLIC EXPORT ─────────────────────────────────────────────────────────────
export function KnowledgeGraphView({ knowledgeGraph }) {
  if (!knowledgeGraph?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No knowledge graph data available.
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner knowledgeGraph={knowledgeGraph} />
    </ReactFlowProvider>
  );
}
