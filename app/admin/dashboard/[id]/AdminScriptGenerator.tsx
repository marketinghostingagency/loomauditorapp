'use client';

import { useState } from 'react';

export default function AdminScriptGenerator({ auditId, existingScript }: { auditId: string, existingScript: string | null }) {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [loomScript, setLoomScript] = useState(existingScript || "");

  const generateScript = async () => {
    try {
      setIsGeneratingScript(true);
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId }),
      });
      if (!response.ok) throw new Error('Failed to generate script');
      const data = await response.json();
      setLoomScript(data.script);
    } catch (e) {
      console.error(e);
      alert("Script generation failed.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-12 gap-6 w-full max-w-2xl mx-auto border-t border-[#464646]/30 pt-12">
      <h2 className="text-[#dc9f0f] font-bold text-2xl flex items-center gap-3 w-full justify-start mb-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        Loom Pitch Script
      </h2>
      
      <button
        onClick={generateScript}
        disabled={isGeneratingScript}
        className="bg-black border border-[#464646] hover:bg-[#222222] hover:border-[#f5ed38]/50 text-white font-bold py-4 px-8 rounded-xl transition-all w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {isGeneratingScript ? (
          <>
             <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#f5ed38]"></span>
             Drafting Loom Script...
          </>
        ) : (
          <>
            {loomScript ? 'Regenerate Pitch Script' : 'Generate New Pitch Script'}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>

      {loomScript && (
        <div className="w-full bg-black/40 border border-[#dc9f0f]/30 rounded-xl p-8 prose prose-invert max-w-none shadow-xl mt-4">
           <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-line font-medium">
             {loomScript}
           </div>
        </div>
      )}
    </div>
  );
}
