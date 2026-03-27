'use client';

import { useState } from 'react';
import DefaultEditor from 'react-simple-wysiwyg';

interface AuditAccordionProps {
  auditId: string;
  data: any;
  rawFallback: string;
  isEditable?: boolean;
  themeObj?: any;
}

export default function AuditAccordion({ auditId, data, rawFallback, isEditable = false, themeObj }: AuditAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); 
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<any[] | null>(() => {
    try {
      const p = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(p) ? p : null;
    } catch(e) { return null; }
  });

  // Default theme is Dark MHA if none passed
  const isSimplicity = themeObj?.name === 'simplicity';
  const cardBg = isSimplicity ? 'bg-white border-[#116dff]/30 shadow-md' : 'bg-black/40 border-[#464646]';
  const headerBg = isSimplicity ? 'hover:bg-slate-50 text-[#07004C]' : 'hover:bg-[#222] text-white';
  const textBody = isSimplicity ? 'text-[#07004C]' : 'text-slate-200';
  const accentColor = isSimplicity ? 'text-[#116dff]' : 'text-[#f5ed38]';
  const boldTagColor = isSimplicity ? '[&_strong]:text-[#116dff]' : '[&_strong]:text-[#f5ed38]';

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
      <div className={`${cardBg} border rounded-xl p-8 prose max-w-none`}>
        <div className={`text-lg leading-relaxed ${textBody} whitespace-pre-wrap font-medium`}>
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
              <button onClick={() => setIsEditing(false)} className={`px-4 py-2 border rounded-lg transition-colors ${isSimplicity ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-[#464646] text-white hover:bg-[#222]'}`}>Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className={`px-4 py-2 font-bold flex gap-2 items-center rounded-lg transition-colors ${isSimplicity ? 'bg-[#116dff] text-white hover:bg-blue-600' : 'bg-[#dc9f0f] text-black hover:bg-[#f5ed38]'}`}>
                 {isSaving ? 'Saving...' : 'Save Audit Updates'}
              </button>
            </>
          ) : (
            <button onClick={() => { setIsEditing(true); setOpenIndices(sections.map((_, i) => i)); }} className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-colors border ${isSimplicity ? 'bg-white border-[#116dff]/50 text-[#116dff] hover:bg-blue-50' : 'bg-[#222] border-[#f5ed38]/50 text-[#f5ed38] hover:bg-[#333]'}`}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
               Edit Report Content
            </button>
          )}
        </div>
      )}

      {sections.map((section: any, idx: number) => {
        const isOpen = openIndices.includes(idx);
        return (
          <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${cardBg} print:shadow-none print:border-none print:bg-white print:text-black`}>
            {isEditing ? (
              // EDITABLE VIEW (Title input + React Simple WYSIWYG)
              <div className="p-6">
                 <input 
                   type="text" 
                   value={section.title}
                   onChange={(e) => {
                     const newSections = [...sections];
                     newSections[idx].title = e.target.value;
                     setSections(newSections);
                   }}
                   className={`w-full text-xl font-bold p-2 mb-4 bg-transparent border-b focus:outline-none ${isSimplicity ? 'text-[#07004C] border-slate-200 focus:border-[#116dff]' : 'text-white border-[#464646] focus:border-[#f5ed38]'}`}
                 />
                 <div className={`mt-4 rounded-lg overflow-hidden border ${isSimplicity ? 'border-slate-300 bg-white text-black' : 'border-[#464646] bg-black/40 text-black [&_.rsw-editor]:text-white [&_.rsw-toolbar]:bg-[#222] [&_.rsw-toolbar_button]:text-white'}`}>
                    <DefaultEditor 
                      value={section.content}
                      onChange={(e) => handleContentChange(idx, e.target.value)}
                    />
                 </div>
              </div>
            ) : (
              // READ-ONLY VIEW
              <>
                <button 
                  onClick={() => toggleIndex(idx)}
                  className={`w-full flex items-center justify-between p-6 text-left focus:outline-none transition-colors ${headerBg} print:hidden`}
                >
                  <h3 className="text-xl font-bold text-left max-w-2xl leading-tight">
                     {section.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
                  </h3>
                  <svg 
                    className={`w-6 h-6 ${accentColor} transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                <h3 className="hidden print:block text-2xl font-bold text-black border-b border-black pb-2 mb-4 mt-6">
                  {section.title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
                </h3>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className={`p-6 pt-0 border-t print:border-none print:pt-0 print:px-0 ${isSimplicity ? 'border-slate-200' : 'border-[#464646]/50'}`}>
                    <div 
                      className={`pt-6 text-lg leading-relaxed font-medium [&_p]:mb-6 [&_p:last-child]:mb-0 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-3 print:text-black print:[&_strong]:text-black print:pt-4 ${textBody} ${boldTagColor}`}
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
