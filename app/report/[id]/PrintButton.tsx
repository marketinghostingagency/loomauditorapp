'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="print:hidden bg-[#222] hover:bg-[#333] text-white font-bold py-2 px-4 rounded-lg border border-[#464646] transition-colors flex items-center gap-2 text-sm shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
      </svg>
      Download PDF
    </button>
  );
}
