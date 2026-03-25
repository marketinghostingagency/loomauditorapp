'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboardActions({ auditId }: { auditId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  const handleShareMHA = () => {
    const url = `${window.location.origin}/report/${auditId}?theme=mha`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareSimplicity = () => {
    const url = `${window.location.origin}/report/${auditId}?theme=simplicity`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure you want to obliterate this audit from the database? This action cannot be reversed.')) return;
    
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/audit/${auditId}`, { method: 'DELETE' });
      
      if (!res.ok) throw new Error('Deletion failed');
      
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete the audit record.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-[#222] border border-[#f5ed38]/30 rounded-lg overflow-hidden">
        <button 
          onClick={handleShareMHA}
          className="hover:bg-[#333] text-[#f5ed38] font-bold text-sm tracking-tight py-2 px-4 transition-colors border-r border-[#464646] flex items-center gap-2"
        >
          {isCopied ? 'Copied MHA!' : 'Copy MHA Link'}
        </button>
        <button 
          onClick={handleShareSimplicity}
          className="hover:bg-[#333] text-purple-400 font-bold text-sm tracking-tight py-2 px-4 transition-colors flex items-center gap-2"
        >
          {isCopied ? 'Copied SM!' : 'Copy Simplicity Link'}
        </button>
      </div>

      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-sm tracking-tight py-2 px-4 rounded-lg transition-colors border border-red-500/30 flex items-center gap-2 disabled:opacity-50"
      >
        {isDeleting ? 'Erasing...' : 'Obliterate Record'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
}
