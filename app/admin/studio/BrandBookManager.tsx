'use client';

import { useState } from 'react';

export default function BrandBookManager({ initialBrands }: { initialBrands: any[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBrand = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newBrandName) return;
     setIsCreating(true);
     try {
        const res = await fetch('/api/brands', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ brandName: newBrandName })
        });
        if (!res.ok) throw new Error('Failed to create brand');
        const newBrand = await res.json();
        setBrands([newBrand, ...brands]);
        setNewBrandName('');
     } catch(err) {
        console.error(err);
        alert('Could not initialize Brand Book.');
     } finally {
        setIsCreating(false);
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !selectedBrand) return;

     try {
        setIsUploading(true);
        // 1. Get presigned URL from our backend
        const ticketRes = await fetch('/api/upload', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        if (!ticketRes.ok) throw new Error('Failed to get secure upload ticket');
        const { presignedUrl, url } = await ticketRes.json();

        // 2. Upload cleanly to Google Cloud Storage directly from browser
        const uploadRes = await fetch(presignedUrl, {
           method: 'PUT',
           body: file,
           headers: { 'Content-Type': file.type }
        });
        if (!uploadRes.ok) throw new Error('Google Cloud Storage rejected the file');

        // 3. Register it locally in DB
        alert(`Successfully uploaded directly to GCS: ${url}`);
        
     } catch(err: any) {
        console.error(err);
        alert('Upload Error: ' + err.message);
     } finally {
        setIsUploading(false);
     }
  };

  const handleArchiveBrand = async () => {
     if (!selectedBrand) return;
     if (!confirm('Transition all of this brand\'s assets to Google Cloud Archive Storage? This drastically reduces costs, but retrieval takes 12 hours.')) return;
     
     try {
        setIsArchiving(true);
        const res = await fetch(`/api/brands/${selectedBrand.id}/archive`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        alert(data.message);
     } catch(err: any) {
        console.error(err);
        alert(err.message);
     } finally {
        setIsArchiving(false);
     }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Left Sidebar: Brand Selection */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
         <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create Brand Identity</h3>
            <form onSubmit={handleCreateBrand} className="flex flex-col gap-3">
               <input 
                 type="text"
                 value={newBrandName}
                 onChange={e => setNewBrandName(e.target.value)}
                 placeholder="E.g. Omi Wellbeauty"
                 className="bg-black border border-[#464646] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] outline-none transition-colors"
               />
               <button 
                 type="submit"
                 disabled={isCreating}
                 className="bg-[#f5ed38] hover:bg-[#dc9f0f] text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
               >
                 {isCreating ? 'Provisioning...' : 'Initialize Brand Profile'}
               </button>
            </form>
         </div>

         <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 flex flex-col gap-2">
            <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest pl-2 mb-2">Active Portfolios</h3>
            {brands.map(b => (
              <button 
                 key={b.id} 
                 onClick={() => setSelectedBrand(b)}
                 className={`text-left w-full hover:bg-black p-3 rounded-lg border transition-colors flex items-center justify-between group ${selectedBrand?.id === b.id ? 'border-[#f5ed38] bg-black' : 'border-transparent hover:border-[#464646]'}`}
              >
                  <span className={`font-bold ${selectedBrand?.id === b.id ? 'text-[#f5ed38]' : 'text-white'}`}>{b.brandName}</span>
                  <span className="text-xs bg-[#333] px-2 py-1 rounded-md text-slate-400 group-hover:text-white">
                    {b.assets?.length || 0} Assets
                  </span>
               </button>
            ))}
            {brands.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No active brand portfolios yet.</p>}
         </div>
      </div>

      {/* Right Canvas: DAM and Editor */}
      <div className="w-full md:w-2/3">
         {selectedBrand ? (
            <div className="bg-[#1a1a1a] border border-[#f5ed38]/30 rounded-2xl p-8 flex flex-col gap-6">
               <div className="border-b border-[#333] pb-4 flex justify-between items-center">
                 <h2 className="text-3xl font-black text-white">{selectedBrand.brandName} <span className="text-[#f5ed38]">Identity</span></h2>
                 <div className="flex gap-3">
                   <button 
                     onClick={handleArchiveBrand}
                     disabled={isArchiving}
                     className="bg-[#222] hover:bg-[#333] text-purple-400 px-4 py-2 rounded-lg font-bold border border-[#464646] transition-colors disabled:opacity-50"
                   >
                     {isArchiving ? 'Archiving...' : '🗄️ Send to Glacier'}
                   </button>
                   <label className="bg-[#f5ed38]/10 text-[#f5ed38] px-4 py-2 rounded-lg font-bold border border-[#f5ed38]/30 hover:bg-[#f5ed38]/20 transition-colors cursor-pointer disabled:opacity-50">
                     {isUploading ? 'Uploading to GCS...' : '+ New Asset'}
                     <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                   </label>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-black border border-[#333] p-4 rounded-xl">
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Core Palette</h4>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[#333] bg-[#f5ed38] cursor-pointer hover:scale-110 transition-transform"></div>
                      <div className="w-12 h-12 rounded-full border-2 border-[#333] bg-purple-500 cursor-pointer hover:scale-110 transition-transform"></div>
                      <div className="w-12 h-12 rounded-full border-2 border-[#333] bg-black border-dashed flex items-center justify-center cursor-pointer hover:border-slate-500 text-slate-500">+</div>
                    </div>
                 </div>
                 <div className="bg-black border border-[#333] p-4 rounded-xl">
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Typography Family</h4>
                    <input type="text" placeholder="E.g. Inter, Helvetica" className="w-full bg-transparent border border-[#464646] p-2 rounded-lg text-white outline-none focus:border-purple-400" />
                 </div>
                 <div className="bg-black border border-[#333] p-4 rounded-xl col-span-full border-dashed">
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex justify-between">
                       <span>Asset Library</span>
                       <span>{selectedBrand.assets?.length || 0} Items</span>
                    </h4>
                    <div className="h-40 flex items-center justify-center text-slate-500">
                       Drop Brand Assets Here (Images / Videos)
                    </div>
                 </div>
               </div>
            </div>
         ) : (
            <div className="glass-card border border-[#464646] rounded-2xl p-8 min-h-[500px] flex items-center justify-center">
              <p className="text-slate-500 text-lg font-medium">
                Select a brand portfolio to configure colors, fonts, or upload raw creative assets.
              </p>
            </div>
         )}
      </div>

    </div>
  );
}
