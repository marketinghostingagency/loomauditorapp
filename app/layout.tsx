import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MHA Auditor | OmniChannel Marketing Scripts',
  description: 'The MHA Intelligence Engine will rigorously audit their Mobile CRO, SEO architecture, Affiliate networks, and Paid Lifecycle flows to instantly architect an elite, board-level Omnichannel Growth Strategy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased min-h-screen relative overflow-x-hidden text-slate-50 bg-[#222222]`}>
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#1a1a1a]">
          {/* MHA branded subtle yellow/dark glows instead of blue/purple */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#f5ed38] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.05] animate-blob"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#dc9f0f] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.05] animate-blob animation-delay-4000"></div>
        </div>
        
        <header className="w-full bg-[#111111]/90 backdrop-blur-md border-b border-[#333]/50 flex items-center justify-between h-20 px-6 sticky top-0 z-50 shadow-xl">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
            <img src="/mha-logo2.png" alt="Marketing Hosting Agency" className="h-10 object-contain" />
            <div className="h-8 w-px bg-slate-700 mx-2"></div>
            <h1 className="font-semibold text-lg tracking-tight text-[#f5ed38]">Auditor <span className="text-slate-400 font-medium text-sm">v1.5</span></h1>
          </Link>
          
          <a href="/admin" className="text-slate-400 hover:text-[#f5ed38] text-sm font-bold transition-all flex items-center gap-2 bg-[#222222] px-4 py-2 rounded-lg border border-[#464646] hover:border-[#f5ed38]/50 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Admin Login
          </a>
        </header>

        <main className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
