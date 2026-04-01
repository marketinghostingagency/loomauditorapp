'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  // Completely hide this global header on the public report pages
  if (pathname?.startsWith('/report')) {
    return null;
  }

  return (
    <header className="w-full bg-[#111111]/90 backdrop-blur-md border-b border-[#333]/50 flex items-center justify-between h-20 px-6 sticky top-0 z-50 shadow-xl print:hidden">
      <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
        <img src="/mha-logo2.png" alt="Marketing Hosting Agency" className="h-10 object-contain" />
        <div className="h-8 w-px bg-slate-700 mx-2"></div>
        <h1 className="font-semibold text-lg tracking-tight text-[#f5ed38]">
           Auditor <span className="text-slate-400 font-medium text-sm">v1.5</span>
        </h1>
      </Link>
      
      <a href="/admin" className="text-slate-400 hover:text-[#f5ed38] text-sm font-bold transition-all flex items-center gap-2 bg-[#222222] px-4 py-2 rounded-lg border border-[#464646] hover:border-[#f5ed38]/50 shadow-lg">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        Admin Login
      </a>
    </header>
  );
}
