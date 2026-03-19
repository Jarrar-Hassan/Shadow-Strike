import React from 'react';
import { motion } from 'framer-motion';
import { GraphNode, GraphEdge } from '@workspace/api-client-react/src/generated/api.schemas';
import { ShieldAlert, Crosshair, Cpu, Wrench } from 'lucide-react';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  // A simplified static layout for standard 4-node attack patterns to ensure it looks beautiful and clean.
  // In a real generic scenario, we'd use a force-directed graph library.
  
  const nodePositions: Record<string, { x: number, y: number }> = {
    attacker: { x: 100, y: 150 },
    target: { x: 500, y: 150 },
    technique: { x: 300, y: 60 },
    tool: { x: 300, y: 240 },
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'attacker': return <ShieldAlert className="w-6 h-6 text-rose-500" />;
      case 'target': return <Crosshair className="w-6 h-6 text-emerald-500" />;
      case 'technique': return <Cpu className="w-6 h-6 text-indigo-500" />;
      case 'tool': return <Wrench className="w-6 h-6 text-amber-500" />;
      default: return <Cpu className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="relative w-full h-[320px] bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
        {/* Draw edges first so they are underneath */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;
          
          const pos1 = nodePositions[fromNode.type] || { x: 0, y: 0 };
          const pos2 = nodePositions[toNode.type] || { x: 0, y: 0 };

          return (
            <motion.g key={`edge-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + idx * 0.1 }}>
              <line
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx={(pos1.x + pos2.x)/2} cy={(pos1.y + pos2.y)/2} r="14" fill="#f8fafc" />
              <text 
                x={(pos1.x + pos2.x)/2} 
                y={(pos1.y + pos2.y)/2 + 4} 
                fontSize="10" 
                fill="#64748b" 
                textAnchor="middle"
                fontWeight="500"
              >
                {edge.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* HTML Nodes overlay for better styling */}
      <div className="absolute inset-0 max-w-[600px] max-h-[300px] m-auto">
        {nodes.map((node, idx) => {
          const pos = nodePositions[node.type];
          if (!pos) return null;

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${(pos.x / 600) * 100}%`, top: `${(pos.y / 300) * 100}%` }}
            >
              <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center z-10">
                {getIcon(node.type)}
              </div>
              <div className="mt-2 text-center bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-foreground">{node.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{node.type}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
