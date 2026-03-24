'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboardActions({ auditId }: { auditId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-sm tracking-tight py-2 px-4 rounded-lg transition-colors border border-red-500/30 flex items-center gap-2 disabled:opacity-50"
    >
      {isDeleting ? 'Erasing...' : 'Obliterate Record'}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
  );
}
