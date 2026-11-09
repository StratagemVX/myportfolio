import React from 'react';

interface MermaidDiagramProps {
  flowText?: string;
  steps?: { title: string; subtitle?: string }[];
}

export default function MermaidDiagram({ flowText, steps }: MermaidDiagramProps) {
  if (steps && steps.length > 0) {
    return (
      <div className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 font-mono">
        <div className="flex items-center space-x-2 text-[10px] text-[#A8B8A7] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
          <span>SYSTEM ARCHITECTURAL PIPELINE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, idx) => (
            <div key={idx} className="relative bg-[#22252C] border border-[rgba(255,255,255,0.06)] rounded p-3 text-xs">
              <span className="text-[10px] text-[#A8B8A7] font-semibold">STAGE 0{idx + 1}</span>
              <p className="text-[#F0F0ED] font-medium mt-1">{step.title}</p>
              {step.subtitle && <p className="text-[11px] text-[#A4A8AE] mt-0.5">{step.subtitle}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (flowText) {
    const parts = flowText.split('->').map(p => p.trim());
    return (
      <div className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 font-mono">
        <div className="flex items-center space-x-2 text-[10px] text-[#A8B8A7] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
          <span>VERIFIED SYSTEM FLOW DIAGRAM</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {parts.map((part, idx) => (
            <React.Fragment key={idx}>
              <div className="px-3 py-2 rounded bg-[#22252C] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] font-medium">
                {part}
              </div>
              {idx < parts.length - 1 && (
                <span className="text-[#A8B8A7] font-bold px-1">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
