'use client';

import { useState, useEffect } from 'react';

export default function LeadCaptureGate({ auditId, brandName }: { auditId: string, brandName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auditId || localStorage.getItem(`unlocked_audit_${auditId}`)) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }, 60000); 

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto'; // safety fallback
    };
  }, [auditId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, brandName, auditId })
      });
      // Unlock UI even if SMTP silently fails
      localStorage.setItem(`unlocked_audit_${auditId}`, 'true');
      document.body.style.overflow = 'auto';
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert('Internal error while unlocking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card max-w-lg w-full rounded-2xl p-8 border border-[#dc9f0f]/50 shadow-2xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f]"></div>
        
        <div className="text-center mb-6">
          <svg className="w-12 h-12 text-[#f5ed38] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Continue Reading Playbook</h2>
          <p className="text-slate-400 text-sm">
            You've reached the free preview limit. Enter your information below to securely unlock the rest of the exclusive <span className="text-white font-bold">{brandName}</span> growth audit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-bold mb-2 text-sm">Full Name <span className="text-[#dc9f0f]">*</span></label>
            <input required type="text" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} className="w-full bg-[#111] border border-[#464646] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] transition-colors" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-2 text-sm">Work Email <span className="text-[#dc9f0f]">*</span></label>
            <input required type="email" value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} className="w-full bg-[#111] border border-[#464646] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] transition-colors" placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-2 text-sm">Phone Number <span className="text-slate-500 font-normal">(Optional)</span></label>
            <input type="tel" value={formData.phone} onChange={e => setFormData(f => ({...f, phone: e.target.value}))} className="w-full bg-[#111] border border-[#464646] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5ed38] transition-colors" placeholder="(555) 123-4567" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#f5ed38] hover:bg-[#dc9f0f] text-black font-black uppercase tracking-wide py-4 mt-6 rounded-xl transition-all disabled:opacity-50">
            {isSubmitting ? 'Unlocking...' : 'Unlock Full Playbook'}
          </button>
        </form>
      </div>
    </div>
  );
}
