'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Lightbulb, Box, Database, Cog, Settings } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';

const nodeTypeIcons = {
  Concept: Lightbulb,
  Model: Box,
  Dataset: Database,
  Method: Cog,
  default: Settings,
};

const nodeTypeColors = {
  Concept: 'bg-yellow-100 border-yellow-300',
  Model: 'bg-blue-100 border-blue-300',
  Dataset: 'bg-green-100 border-green-300',
  Method: 'bg-purple-100 border-purple-300',
  default: 'bg-gray-100 border-gray-300',
};

const CustomNode = ({ data }) => {
  const Icon = nodeTypeIcons[data.type] || nodeTypeIcons.default;
  const colors = nodeTypeColors[data.type] || nodeTypeColors.default;

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg border-2 shadow-sm ${colors}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="text-sm font-medium truncate">{data.label}</div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const elk = new ELK();

const useLayoutedElements = (initialNodes, initialEdges, options) => {
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState(initialEdges);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if (initialNodes.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const graph = {
      id: 'root',
      layoutOptions: options,
      children: initialNodes.map((node) => ({
        ...node,
        width: 172,
        height: 40,
      })),
      edges: initialEdges,
    };

    elk
      .layout(graph)
      .then((layoutedGraph) => {
        setNodes(
          layoutedGraph.children.map((node) => ({
            ...node,
            position: { x: node.x, y: node.y },
          }))
        );
        setEdges(layoutedGraph.edges || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [initialNodes, initialEdges]);

  return { nodes, setNodes, edges, setEdges, loading };
};

export function KnowledgeGraphView({ knowledgeGraph }) {
  const initialNodes = useMemo(
    () =>
      knowledgeGraph.nodes.map((node) => ({
        id: node.id,
        type: 'custom',
        data: { label: node.label, type: node.type },
        position: { x: 0, y: 0 },
      })),
    [knowledgeGraph]
  );

  const initialEdges = useMemo(
    () =>
      knowledgeGraph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed' },
      })),
    [knowledgeGraph]
  );

  const { nodes, setNodes, edges, setEdges, loading } = useLayoutedElements(
    initialNodes,
    initialEdges,
    {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '80',
    }
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div style={{ height: '70vh', position: 'relative' }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
