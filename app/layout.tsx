import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MHA Auditor | OmniChannel Marketing Scripts',
  description: 'Generate high-converting custom Loom audit scripts in seconds for Marketing Hosting Agency.',
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
        
        <header className="w-full bg-[#111111]/90 backdrop-blur-md border-b border-[#333]/50 flex items-center h-20 px-6 sticky top-0 z-50 shadow-xl">
          <div className="flex items-center gap-4">
            <img src="/mha-logo2.png" alt="Marketing Hosting Agency" className="h-10 object-contain" />
            <div className="h-8 w-px bg-slate-700 mx-2"></div>
            <h1 className="font-semibold text-lg tracking-tight text-[#f5ed38]">Auditor <span className="text-slate-400 font-medium text-sm">v1.5</span></h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
