'use client';

import { useState } from 'react';

interface AuditAccordionProps {
  auditId: string;
  data: any;
  rawFallback: string;
  isEditable?: boolean;
}

export default function AuditAccordion({ auditId, data, rawFallback, isEditable = false }: AuditAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); 
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<any[] | null>(() => {
    try {
      const p = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(p) ? p : null;
    } catch(e) { return null; }
  });

  const toggleIndex = (idx: number) => {
    setOpenIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleContentChange = (idx: number, newContent: string) => {
    if (!sections) return;
    const newSections = [...sections];
    newSections[idx].content = newContent;
    setSections(newSections);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/audit/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiAnalysis: sections })
      });
      if (!res.ok) throw new Error('Failed to save');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Error saving the audit.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!sections) {
    return (
      <div className="bg-black/40 border border-[#464646] rounded-xl p-8 prose prose-invert max-w-none">
        <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
          {rawFallback}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {isEditable && (
        <div className="flex justify-end mb-4 gap-3 print:hidden">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-[#464646] text-white rounded-lg hover:bg-[#222] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[#dc9f0f] text-black font-bold flex gap-2 items-center rounded-lg hover:bg-[#f5ed38] transition-colors">
                 {isSaving ? 'Saving...' : 'Save Audit Updates'}
              </button>
            </>
          ) : (
            <button onClick={() => { setIsEditing(true); setOpenIndices(sections.map((_, i) => i)); }} className="px-4 py-2 bg-[#222] border border-[#f5ed38]/50 text-[#f5ed38] font-bold rounded-lg hover:bg-[#333] flex items-center gap-2 transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
               Edit Report Content
            </button>
          )}
        </div>
      )}

      {sections.map((section: any, idx: number) => {
        const isOpen = openIndices.includes(idx);
        return (
          <div key={idx} className="border border-[#464646] rounded-xl overflow-hidden bg-black/40 transition-all shadow-sm shadow-[#f5ed38]/5 print:shadow-none print:border-none print:bg-white print:text-black">
            <button 
              onClick={() => toggleIndex(idx)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-[#222] transition-colors print:hidden"
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
            
            {/* The Print heading only shows during PDF/Print rendering so the title isn't lost when the button is hidden */}
            <h3 className="hidden print:block text-2xl font-bold text-black border-b border-black pb-2 mb-4 mt-6">
              {section.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
            </h3>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 pt-0 border-t border-[#464646]/50 print:border-none print:pt-0 print:px-0">
                {isEditing ? (
                  <div className="pt-6">
                     <textarea 
                       value={section.content}
                       onChange={(e) => handleContentChange(idx, e.target.value)}
                       className="w-full min-h-[500px] p-4 bg-black/50 border border-[#f5ed38]/30 rounded-lg text-slate-200 font-mono text-sm leading-relaxed focus:outline-none focus:border-[#f5ed38] focus:ring-1 focus:ring-[#f5ed38]"
                     />
                  </div>
                ) : (
                  <div 
                    className="pt-6 text-slate-200 text-lg leading-relaxed font-medium [&_p]:mb-6 [&_p:last-child]:mb-0 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-3 [&_strong]:text-[#f5ed38] print:text-black print:[&_strong]:text-black print:pt-4"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
