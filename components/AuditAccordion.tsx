'use client';

import { useState } from 'react';

export default function AuditAccordion({ data, rawFallback }: { data: any, rawFallback: string }) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); // Open the first tab by default
  const toggleIndex = (idx: number) => {
    setOpenIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  let parsed = null;
  try {
     const p = typeof data === 'string' ? JSON.parse(data) : data;
     if (Array.isArray(p)) parsed = p;
  } catch(e) {}

  if (!parsed) {
    // Legacy fallback for pre-Smart Brevity audits (raw string prose)
    return (
      <div className="bg-black/40 border border-[#464646] rounded-xl p-8 prose prose-invert max-w-none prose-h2:text-[#f5ed38] prose-h2:text-xl prose-h2:border-b prose-h2:border-[#464646] prose-h2:pb-4 prose-h3:text-[#dc9f0f] prose-li:text-slate-300">
        <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
          {rawFallback}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {parsed.map((section: any, idx: number) => {
        const isOpen = openIndices.includes(idx);
        return (
          <div key={idx} className="border border-[#464646] rounded-xl overflow-hidden bg-black/40 transition-all shadow-sm shadow-[#f5ed38]/5">
            <button 
              onClick={() => toggleIndex(idx)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-[#222] transition-colors"
            >
              <h3 className="text-xl font-bold text-white text-left max-w-2xl leading-tight">
                 {section.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
              </h3>
              <svg 
                className={`w-6 h-6 text-[#f5ed38] transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div 
                className="p-6 pt-0 text-slate-200 text-lg leading-relaxed font-medium border-t border-[#464646]/50 [&_p]:mb-6 [&_p:last-child]:mb-0 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-3 [&_strong]:text-[#f5ed38]"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
