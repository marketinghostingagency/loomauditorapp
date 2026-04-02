'use client';

import { useEffect, useRef } from 'react';

export default function AuditPendingBanner({ dark = true }: { dark?: boolean }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Auto-refresh every 12s so the page pulls fresh data automatically
    intervalRef.current = setInterval(() => {
      window.location.reload();
    }, 12000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
