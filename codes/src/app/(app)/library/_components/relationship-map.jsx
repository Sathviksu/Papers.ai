'use client';
import { useMemo, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Search, Info } from 'lucide-react';

const PaperNode = ({ data }) => {
  const g = data.gradient || { from: 'from-blue-500', to: 'to-indigo-600', text: 'text-blue-600' };
  return (
    <div className={`px-4 py-2 rounded-xl bg-white border-2 border-slate-100 shadow-xl min-w-[150px] max-w-[200px] overflow-hidden`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${g.from} ${g.to}`} />
      <h4 className="text-[10px] font-bold text-slate-800 line-clamp-2 mt-1 leading-tight">{data.label}</h4>
      <p className="text-[8px] text-slate-400 mt-1 truncate">{data.authors?.[0] || 'Unknown'}</p>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  paper: PaperNode,
};

export function PaperRelationshipMap({ papers, onClose }) {
  const [activeConnection, setActiveConnection] = useState(null);

  const { nodes, edges } = useMemo(() => {
    const initialNodes = [];
    const initialEdges = [];

    (papers || []).forEach((paper, i) => {
      initialNodes.push({
        id: paper.id,
        type: 'paper',
        data: { 
          label: paper.title, 
          authors: paper.authors,
          topics: paper.topics || paper.tags,
          gradient: { from: 'from-blue-400', to: 'to-indigo-500' }
        },
        position: { x: Math.random() * 800, y: Math.random() * 600 },
      });
    });

    // Create connections based on shared criteria
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const p1 = papers[i];
        const p2 = papers[j];

        const sharedAuthors = (p1.authors || []).filter(a => (p2.authors || []).includes(a));
        const sharedTopics = (p1.topics || p1.tags || []).filter(t => (p2.topics || p2.tags || []).includes(t));
        
        if (sharedAuthors.length > 0 || sharedTopics.length > 0) {
          initialEdges.push({
            id: `e-${p1.id}-${p2.id}`,
            source: p1.id,
            target: p2.id,
            label: sharedAuthors.length > 0 ? 'Shared Authors' : 'Shared Topics',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.5 },
            data: { sharedAuthors, sharedTopics }
          });
        }
      }
    }

    return { nodes: initialNodes, edges: initialEdges };
  }, [papers]);

  const onEdgeClick = (evt, edge) => {
    setActiveConnection(edge);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full h-full shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black font-heading text-slate-800 tracking-tight">Paper Relationship Map</h2>
            <p className="text-sm text-slate-500 font-medium">Visualizing shared authors, topics, and citations across your library.</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onEdgeClick={onEdgeClick}
            fitView
          >
            <Background color="#cbd5e1" gap={24} />
            <Controls className="!bg-white !border-slate-100 !shadow-xl !rounded-xl" />
            <MiniMap className="!bg-white !border-slate-100 !shadow-xl !rounded-xl" />
          </ReactFlow>

          {activeConnection && (
            <div className="absolute bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-aurora-blue" />
                  Shared Connection
                </h4>
                <button onClick={() => setActiveConnection(null)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {activeConnection.data.sharedAuthors.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Authors</p>
                  <div className="flex flex-wrap gap-2">
                    {activeConnection.data.sharedAuthors.map(a => (
                      <span key={a} className="px-2 py-1 rounded-md bg-aurora-blue/10 text-aurora-blue text-[10px] font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {activeConnection.data.sharedTopics.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {activeConnection.data.sharedTopics.map(t => (
                      <span key={t} className="px-2 py-1 rounded-md bg-aurora-violet/10 text-aurora-violet text-[10px] font-bold">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
