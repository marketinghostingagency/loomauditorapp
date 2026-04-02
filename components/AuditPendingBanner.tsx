'use client';

import { useEffect, useRef } from 'react';

export default function AuditPendingBanner({
  dark = true,
  clientFacing = false
}: {
  dark?: boolean;
  clientFacing?: boolean;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only auto-refresh on admin view, never on client-facing page
    if (clientFacing) return;
    intervalRef.current = setInterval(() => {
      window.location.reload();
    }, 12000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [clientFacing]);

  // ── Client-facing: professional, no technical details ──
  if (clientFacing) {
    return (
      <div className={`rounded-2xl overflow-hidden shadow-2xl border ${
        dark ? 'bg-[#111] border-[#333]' : 'bg-white border-slate-200'
      }`}>
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${
          dark
            ? 'bg-gradient-to-r from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f]'
            : 'bg-gradient-to-r from-[#116dff] to-[#4A90E2]'
        }`} />

        <div className="flex flex-col items-center justify-center gap-8 py-20 px-8 text-center">
          {/* Checkmark-style icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            dark ? 'bg-[#f5ed38]/10 border-2 border-[#f5ed38]/30' : 'bg-blue-50 border-2 border-[#116dff]/30'
          }`}>
            <svg className={`w-9 h-9 ${ dark ? 'text-[#f5ed38]' : 'text-[#116dff]' }`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="flex flex-col gap-3 max-w-lg">
            <h2 className={`text-3xl font-black tracking-tight ${
              dark ? 'text-white' : 'text-[#07004C]'
            }`}>
              Your Report is Being Prepared
            </h2>
            <p className={`text-lg leading-relaxed ${
              dark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Our team is conducting a comprehensive analysis of your brand's
              digital presence. This process takes time to do right.
            </p>
          </div>

          {/* Timeline callout */}
          <div className={`flex items-center gap-4 rounded-2xl px-8 py-5 border ${
            dark
              ? 'bg-[#1a1a1a] border-[#333]'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              dark ? 'bg-[#f5ed38]/10' : 'bg-blue-50'
            }`}>
              <svg className={`w-6 h-6 ${ dark ? 'text-[#f5ed38]' : 'text-[#116dff]' }`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={`font-black text-base ${ dark ? 'text-white' : 'text-[#07004C]' }`}>
                Expect your report within 48 hours
              </p>
              <p className={`text-sm mt-0.5 ${ dark ? 'text-slate-500' : 'text-slate-500' }`}>
                You&apos;ll receive an email notification as soon as it&apos;s ready.
              </p>
            </div>
          </div>

          <p className={`text-xs mt-2 ${ dark ? 'text-slate-600' : 'text-slate-400' }`}>
            Questions? Reach out to your account manager.
          </p>
        </div>
      </div>
    );
  }

  // ── Admin view: technical spinner + auto-refresh ──

  if (dark) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-[#f5ed38]/30 shadow-xl relative overflow-hidden">
        {/* Animated top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc9f0f] via-[#f5ed38] to-[#dc9f0f] rounded-t-2xl animate-pulse" />

        <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#333]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#f5ed38] animate-spin" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Growth Playbook <span className="text-[#f5ed38]">Generating...</span>
            </h2>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Our AI is conducting a deep-dive analysis of this brand&apos;s digital presence.
              This typically takes <strong className="text-white">1–3 minutes</strong>.
              This page will refresh automatically.
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#f5ed38] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>

          <p className="text-slate-600 text-xs font-mono">Auto-refreshing every 12 seconds</p>
        </div>
      </div>
    );
  }

  // Light theme (Simplicity)
  return (
    <div className="rounded-2xl p-8 border-2 border-[#116dff]/30 bg-blue-50 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#116dff] to-[#4A90E2] rounded-t-2xl animate-pulse" />

      <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#116dff] animate-spin" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#07004C] tracking-tight mb-2">
            Growth Playbook <span className="text-[#116dff]">Generating...</span>
          </h2>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed">
            Our AI is conducting a deep-dive analysis of this brand&apos;s digital presence.
            This typically takes <strong className="text-[#07004C]">1–3 minutes</strong>.
            This page will refresh automatically.
          </p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#116dff] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <p className="text-slate-400 text-xs font-mono">Auto-refreshing every 12 seconds</p>
      </div>
    </div>
  );
}
