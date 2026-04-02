'use client';

import { useState } from 'react';

// ---- Types ----
interface FontStyle { family: string; size: string; weight: string; label: string; }
interface Brand {
  id: string;
  brandName: string;
  website?: string;
  status?: string;
  // 4 canonical brand tokens
  brandBackground?: string;
  brandHeaderColor?: string;
  brandTextColor?: string;
  brandCtaColor?: string;
  // Legacy palette fields
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontColor?: string;
  ctaPrimaryColor?: string;
  ctaSecondaryColor?: string;
  typography?: string;
  fontH1?: string;
  fontH2?: string;
  fontBody?: string;
  logoUrl?: string;
  assets?: Asset[];
}
interface Asset {
  id: string;
  title: string;
  fileUrl: string;
  classification?: string;
  isPrimary?: boolean;
  status: string;
  tags?: string;
}

const ASSET_CATEGORIES = ['Logo', 'Square Logo', 'Vertical Logo', 'Banner', 'Video', 'Image', 'Veo Output', 'Generated Output', 'Other'];

// ---- Editable Color Token ----
function EditableColorToken({
  hex, label, fieldKey, onSave
}: {
  hex?: string | null; label: string; fieldKey: string; onSave: (key: string, value: string) => void;
}) {
  const isEmpty = !hex || hex === '#333333';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(isEmpty ? '#ffffff' : hex!);

  const handleSave = () => {
    setEditing(false);
    onSave(fieldKey, draft);
  };

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div
        className={`w-14 h-14 rounded-xl border-2 cursor-pointer transition-all relative flex items-center justify-center
          ${isEmpty
            ? 'border-dashed border-[#555] bg-transparent hover:border-[#f5ed38] hover:bg-[#f5ed38]/5'
            : 'border-white/10 shadow-lg hover:scale-105 hover:border-[#f5ed38]/50'}`}
        style={isEmpty ? {} : { backgroundColor: draft }}
        onClick={() => setEditing(true)}
        title={isEmpty ? `Set ${label} color` : `Click to edit · ${draft}`}
      >
        {isEmpty
          ? <span className="text-slate-500 group-hover:text-[#f5ed38] text-xl transition-colors">+</span>
          : <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl text-white text-xs font-bold">✏️</span>
        }
      </div>
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setEditing(false)}>
          <div className="bg-[#1a1a1a] border border-[#f5ed38]/30 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl w-72" onClick={e => e.stopPropagation()}>
            <p className="text-white font-bold text-sm uppercase tracking-wide">{label}</p>
            <div className="w-20 h-20 rounded-xl border border-white/20 shadow-inner" style={{ backgroundColor: draft }} />
            <input type="color" value={draft} onChange={e => setDraft(e.target.value)} className="w-full h-10 cursor-pointer rounded-xl border border-[#333] bg-transparent" />
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="#f13729"
              className="bg-black border border-[#464646] rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-[#f5ed38] outline-none w-full text-center"
            />
            <div className="flex gap-3 w-full">
              <button onClick={() => setEditing(false)} className="flex-1 border border-[#333] text-slate-400 py-2 rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-[#f5ed38] text-black py-2 rounded-lg font-bold text-sm">Save Token</button>
            </div>
          </div>
        </div>
      )}
      <span className="text-[10px] text-slate-400 font-mono uppercase">{label}</span>
      <span className={`text-[10px] font-mono ${isEmpty ? 'text-slate-600 italic' : 'text-slate-600'}`}>{isEmpty ? 'not set' : draft}</span>
    </div>
  );
}

export default function BrandBookManager({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [activeTab, setActiveTab] = useState<'identity' | 'canvas'>('identity');

  const [isUploading, setIsUploading] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Asset form state
  const [assetTab, setAssetTab] = useState<'upload' | 'veo'>('upload');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [veoRefFile, setVeoRefFile] = useState<File | null>(null);
  const [assetClass, setAssetClass] = useState('Logo');
  const [isPrimary, setIsPrimary] = useState(false);
  const [assetTags, setAssetTags] = useState('');
  const [veoPrompt, setVeoPrompt] = useState('');

  // ---- Actions ----
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: newBrandName, website: newWebsite })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create brand');
      const newBrand = await res.json();
      setBrands([newBrand, ...brands]);
      setSelectedBrand(newBrand);
      setActiveTab('identity');
      setNewBrandName('');
      setNewWebsite('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const uploadFileToCDN = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleAiGeneration = async (asset: Asset, preset: string) => {
    const prompt = aiPrompt[asset.id];
    if (!prompt) return alert('Enter a creative instruction first.');
    setIsGenerating(prev => ({ ...prev, [asset.id]: true }));
    try {
      const res = await fetch('/api/vertex/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: asset.fileUrl, prompt, aspectPreset: preset })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const dbRes = await fetch(`/api/brands/${selectedBrand!.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Variation · ${asset.fileUrl.split('/').pop()}`,
          type: 'video',
          fileUrl: 'pending-veo-generation',
          classification: 'Veo Output',
          status: 'DRAFT',
          tags: ['Generative', `${preset}`]
        })
      });
      const { asset: newAsset } = await dbRes.json();
      updateSelectedBrandAssets([...(selectedBrand!.assets || []), newAsset]);
      alert(`Veo job sent to Draft Sandbox! Debug: \n\n${data.analysisPayload}`);
    } catch (err: any) {
      alert('Vertex AI Error: ' + err.message);
    } finally {
      setIsGenerating(prev => ({ ...prev, [asset.id]: false }));
    }
  };

  const handleArchiveBrand = async () => {
    if (!selectedBrand) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/archive`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = { ...selectedBrand, status: 'ARCHIVED' };
      setSelectedBrand(updated);
      setBrands(brands.map(b => b.id === selectedBrand.id ? updated : b));
      setShowDeleteModal(false);
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchiveBrand = async () => {
    if (!selectedBrand) return;
    setIsUnarchiving(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/unarchive`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = { ...selectedBrand, status: 'ACTIVE' };
      setSelectedBrand(updated);
      setBrands(brands.map(b => b.id === selectedBrand.id ? updated : b));
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrands(brands.filter(b => b.id !== selectedBrand.id));
      setSelectedBrand(null);
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateAssetStatus = async (assetId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/brands/${selectedBrand!.id}/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update asset status');
      const { asset: updatedAsset } = await res.json();
      updateSelectedBrandAssets(selectedBrand!.assets!.map(a => a.id === assetId ? updatedAsset : a));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateSelectedBrandAssets = (newAssets: Asset[]) => {
    const updated = { ...selectedBrand!, assets: newAssets };
    setSelectedBrand(updated);
    setBrands(brands.map(b => b.id === updated.id ? updated : b));
  };

  const submitNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setIsUploading(true);
    try {
      if (assetTab === 'upload') {
        if (!uploadFile) throw new Error('Select a file to upload');
        const url = await uploadFileToCDN(uploadFile);
        const dbRes = await fetch(`/api/brands/${selectedBrand.id}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadFile.name,
            type: uploadFile.type.startsWith('video') ? 'video' : 'image',
            fileUrl: url,
            classification: assetClass,
            isPrimary,
            tags: assetTags.split(',').map(t => t.trim()).filter(Boolean)
          })
        });
        const { asset } = await dbRes.json();
        updateSelectedBrandAssets([...(selectedBrand.assets || []), asset]);
        alert('Asset uploaded successfully!');
      } else {
        if (!veoPrompt) throw new Error('Enter a prompt for Veo Studio');

        // If they included a reference image, upload it first
        let referenceFileUrl: string | undefined;
        if (veoRefFile) {
          referenceFileUrl = await uploadFileToCDN(veoRefFile);
        }

        const res = await fetch('/api/vertex/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: veoPrompt, aspectPreset: '1:1', fileUrl: referenceFileUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const dbRes = await fetch(`/api/brands/${selectedBrand.id}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Veo: ${veoPrompt.slice(0, 50)}`,
            type: 'video',
            fileUrl: referenceFileUrl || 'pending-veo-generation',
            classification: 'Generated Output',
            status: 'DRAFT',
            tags: ['Generative', 'From-Scratch']
          })
        });
        const newAssetData = await dbRes.json();
        updateSelectedBrandAssets([...(selectedBrand.assets || []), newAssetData.asset]);
        alert(`Veo Studio job queued → Draft Sandbox. Debug: \n${data.analysisPayload}`);
      }
      setShowAssetModal(false);
      setUploadFile(null);
      setVeoRefFile(null);
      setVeoPrompt('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const matchesSearch = (a: Asset) => {
    if (!assetSearchQuery) return true;
    const q = assetSearchQuery.toLowerCase();
    return `${a.title} ${a.classification} ${a.tags}`.toLowerCase().includes(q);
  };

  const activeBrands = brands.filter(b => b.status !== 'ARCHIVED');
  const archivedBrands = brands.filter(b => b.status === 'ARCHIVED');
  const isArchived = selectedBrand?.status === 'ARCHIVED';

  const handleUpdateBrandToken = async (fieldKey: string, value: string) => {
    if (!selectedBrand || isSavingBrand) return;
    setIsSavingBrand(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: value })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      const updated = await res.json();
      const updatedBrand = { ...selectedBrand, ...updated, assets: selectedBrand.assets };
      setSelectedBrand(updatedBrand);
      setBrands(brands.map(b => b.id === selectedBrand.id ? updatedBrand : b));
    } catch (err: any) {
      alert('Failed to save token: ' + err.message);
    } finally {
      setIsSavingBrand(false);
    }
  };

  // ---- Brand Identity Panel ----
  const renderIdentityPanel = () => {
    if (!selectedBrand) return null;
    const parseFontStyle = (s?: string | null): FontStyle | null => {
      try { return s ? JSON.parse(s) : null; } catch { return null; }
    };
    const h1 = parseFontStyle(selectedBrand.fontH1);
    const h2 = parseFontStyle(selectedBrand.fontH2);
    const body = parseFontStyle(selectedBrand.fontBody);

    // The 4 canonical brand color tokens
    const BRAND_TOKENS = [
      {
        label: 'Background',
        sublabel: 'Asset / page background',
        fieldKey: 'brandBackground',
        hex: selectedBrand.brandBackground,
        defaultGuess: '#ffffff'
      },
      {
        label: 'Header Color',
        sublabel: 'H1 / H2 heading text',
        fieldKey: 'brandHeaderColor',
        hex: selectedBrand.brandHeaderColor,
        defaultGuess: '#1a1a1a'
      },
      {
        label: 'Text Color',
        sublabel: 'Body & paragraph text',
        fieldKey: 'brandTextColor',
        hex: selectedBrand.brandTextColor,
        defaultGuess: '#333333'
      },
      {
        label: 'CTA Color',
        sublabel: 'Button / call-to-action',
        fieldKey: 'brandCtaColor',
        hex: selectedBrand.brandCtaColor,
        defaultGuess: null
      },
    ];

    return (
      <div className="flex flex-col gap-8">
        {/* Logo + Brand Tokens Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/50 border border-[#333] rounded-2xl p-6">
            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-5">Brand Logo</h4>
            {selectedBrand.logoUrl ? (
              <a href={selectedBrand.logoUrl} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedBrand.logoUrl} alt={selectedBrand.brandName + ' logo'} className="max-h-24 object-contain" />
              </a>
            ) : (
              <p className="text-slate-600 italic text-sm">No logo extracted — upload one via Asset Manager</p>
            )}
          </div>

          <div className="bg-black/50 border border-[#333] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Brand Color Tokens</h4>
                <p className="text-slate-600 text-xs mt-1">Brand defaults — overridable per asset</p>
              </div>
              {isSavingBrand && <span className="text-[#f5ed38] text-xs animate-pulse">Saving...</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {BRAND_TOKENS.map(p => (
                <div key={p.label} className="flex items-center gap-3">
                  <EditableColorToken
                    hex={p.hex}
                    label=""
                    fieldKey={p.fieldKey}
                    onSave={handleUpdateBrandToken}
                  />
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{p.label}</p>
                    <p className="text-slate-500 text-xs">{p.sublabel}</p>
                    <p className="text-slate-600 font-mono text-[10px] mt-0.5">{p.hex || 'not set'}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-5 border-t border-[#222] pt-3">Click any swatch to edit</p>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-black/50 border border-[#333] rounded-2xl p-6">
          <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-5">Typography System</h4>
          <div className="flex flex-col gap-5">
            {selectedBrand.typography && (
              <div className="border-b border-[#222] pb-4">
                <p className="text-slate-500 text-xs mb-1">Primary Family</p>
                <p className="text-white text-2xl font-bold" style={{ fontFamily: selectedBrand.typography }}>
                  {selectedBrand.typography}
                </p>
              </div>
            )}
            {h1 && (
              <div className="flex items-end justify-between border-b border-[#222] pb-3">
                <div>
                  <p className="text-slate-500 text-xs mb-1">H1 · {h1.label} · {h1.size}</p>
                  <p className="text-white" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: h1.weight, fontFamily: h1.family }}>Aa</p>
                </div>
                <p className="text-slate-600 font-mono text-xs">{h1.size} / w{h1.weight}</p>
              </div>
            )}
            {h2 && (
              <div className="flex items-end justify-between border-b border-[#222] pb-3">
                <div>
                  <p className="text-slate-500 text-xs mb-1">H2 · {h2.label} · {h2.size}</p>
                  <p className="text-white" style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: h2.weight, fontFamily: h2.family }}>Bb</p>
                </div>
                <p className="text-slate-600 font-mono text-xs">{h2.size} / w{h2.weight}</p>
              </div>
            )}
            {body && (
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Body · {body.label} · {body.size}</p>
                  <p className="text-slate-300" style={{ fontSize: body.size, fontWeight: body.weight, fontFamily: body.family }}>The quick brown fox jumps over the lazy dog</p>
                </div>
                <p className="text-slate-600 font-mono text-xs">{body.size} / w{body.weight}</p>
              </div>
            )}
            {!h1 && !h2 && !body && !selectedBrand.typography && (
              <p className="text-slate-600 italic text-sm">No typography extracted. Add a website URL to scan font data.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---- Asset Canvas Panel ----
  const renderCanvasPanel = () => {
    if (!selectedBrand) return null;
    const activeAssets = (selectedBrand.assets || []).filter(a => a.status === 'ACTIVE' && matchesSearch(a));
    const draftAssets = (selectedBrand.assets || []).filter(a => a.status === 'DRAFT' && matchesSearch(a));

    return (
      <div className="flex flex-col gap-8">
        <input
          type="text"
          placeholder="🔍 Search assets by name, classification, or tag..."
          value={assetSearchQuery}
          onChange={e => setAssetSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-[#464646] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5ed38]"
        />

        {activeAssets.length === 0 && draftAssets.length === 0 && (
          <div className="text-slate-500 italic p-10 border border-dashed border-[#444] rounded-xl text-center">
            Canvas is empty. Add assets using the + Add Asset button above.
          </div>
        )}

        {ASSET_CATEGORIES.map(cat => {
          const items = activeAssets.filter(a => a.classification === cat || (!a.classification && cat === 'Other'));
          if (!items.length) return null;
          return (
            <div key={cat}>
              <h4 className="text-[#f5ed38] font-bold text-lg border-b border-[#333] pb-2 mb-4 flex justify-between">
                <span>{cat}s</span>
                <span className="text-sm text-slate-500 font-medium">{items.length} layers</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map(asset => (
                  <div key={asset.id} className="border border-[#464646] hover:border-[#f5ed38]/50 rounded-xl p-4 bg-[#111] transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{asset.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5 font-mono truncate">{asset.fileUrl.split('/').pop()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        {asset.isPrimary && <span className="bg-[#f5ed38] text-black px-2 py-0.5 rounded text-[10px] font-bold">Primary</span>}
                      </div>
                    </div>
                    {asset.tags && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {JSON.parse(asset.tags).map((t: string) => (
                          <span key={t} className="bg-[#333] text-slate-300 px-2 py-0.5 rounded text-[10px]">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* AI Modification terminal */}
                    {!isArchived && (
                      <div className="bg-black/40 border border-[#222] p-3 rounded-lg mt-2">
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Veo Studio — Edit or Duplicate</p>
                        <textarea
                          placeholder="Describe changes (e.g. 'Dark background, shorter cut')..."
                          value={aiPrompt[asset.id] || ''}
                          onChange={e => setAiPrompt(p => ({ ...p, [asset.id]: e.target.value }))}
                          className="w-full bg-black border border-[#333] rounded-lg p-2 text-xs text-white focus:border-[#f5ed38] outline-none h-12 resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          {['1:1', '4:5', '9:16'].map(p => (
                            <button key={p} onClick={() => handleAiGeneration(asset, p)} disabled={isGenerating[asset.id]} className="flex-1 bg-[#222] hover:bg-[#f5ed38] hover:text-black text-xs text-slate-300 font-bold py-1.5 rounded transition-colors disabled:opacity-50">{p}</button>
                          ))}
                        </div>
                        {isGenerating[asset.id] && <p className="text-[#f5ed38] text-xs animate-pulse mt-2">Queuing Veo job...</p>}
                      </div>
                    )}

                    <div className="flex justify-end mt-3 pt-3 border-t border-[#222]">
                      <button onClick={() => handleUpdateAssetStatus(asset.id, 'DRAFT')} disabled={isArchived} className="text-slate-500 hover:text-[#dc9f0f] text-xs transition-colors disabled:opacity-30">
                        ↺ Move to Drafts
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Draft Sandbox */}
        {draftAssets.length > 0 && (
          <div className="bg-[#1a1100] border border-[#dc9f0f]/50 p-6 rounded-2xl mt-4">
            <h4 className="text-[#dc9f0f] font-bold text-xl mb-2 flex justify-between items-center">
              <span>⚠️ Draft Sandbox</span>
              <span className="text-sm bg-[#dc9f0f]/20 px-3 py-1 rounded-full font-normal">{draftAssets.length} needs review</span>
            </h4>
            <p className="text-slate-400 text-sm mb-5">These are unfinalized or Veo-generated assets. Approve them to promote to your active canvas.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {draftAssets.map(asset => (
                <div key={asset.id} className="border border-[#dc9f0f]/30 rounded-xl p-4 bg-[#110a00]">
                  <span className="text-[#dc9f0f] font-mono text-[10px] uppercase block mb-1">{asset.classification || 'Generated'}</span>
                  <p className="text-white font-medium">{asset.title || 'Untitled'}</p>
                  {asset.tags && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {JSON.parse(asset.tags).map((t: string) => (
                        <span key={t} className="bg-[#221500] border border-[#dc9f0f]/20 text-[#dc9f0f] px-2 py-0.5 rounded text-[10px]">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button onClick={() => handleUpdateAssetStatus(asset.id, 'ACTIVE')} className="bg-[#dc9f0f] hover:bg-[#f5ed38] text-black text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                      Merge to Canvas ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">

      {/* Left Sidebar */}
      <div className="w-full md:w-1/4 flex flex-col gap-4 flex-shrink-0">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">Initialize Portfolio</h3>
          <form onSubmit={handleCreateBrand} className="flex flex-col gap-3">
            <input
              type="text"
              value={newBrandName}
              onChange={e => setNewBrandName(e.target.value)}
              placeholder="Brand name (e.g. Republic Tax Relief)"
              className="bg-black border border-[#464646] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] outline-none transition-colors text-sm"
              suppressHydrationWarning
            />
            <input
              type="text"
              value={newWebsite}
              onChange={e => setNewWebsite(e.target.value)}
              placeholder="Website URL (for brand scraping)"
              className="bg-black border border-[#464646] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#f5ed38] outline-none transition-colors text-sm"
              suppressHydrationWarning
            />
            <button type="submit" disabled={isCreating} className="bg-[#f5ed38] hover:bg-white text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {isCreating ? 'Scanning brand...' : '🔍 Create + Scan'}
            </button>
          </form>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <p className="text-[#f5ed38] font-bold uppercase tracking-widest text-xs pl-2 mb-3 border-b border-[#333] pb-2">Active Portfolios</p>
          <div className="flex flex-col gap-1">
            {activeBrands.map(b => (
              <button key={b.id} onClick={() => { setSelectedBrand(b); setActiveTab('identity'); }}
                className={`text-left w-full p-3 rounded-lg border transition-colors flex items-center justify-between group ${selectedBrand?.id === b.id ? 'border-[#f5ed38] bg-black' : 'border-transparent hover:border-[#464646] hover:bg-black/30'}`}
              >
                <span className={`font-semibold text-sm truncate ${selectedBrand?.id === b.id ? 'text-[#f5ed38]' : 'text-white'}`}>{b.brandName}</span>
                <span className="text-xs bg-[#333] px-1.5 py-0.5 rounded text-slate-400 flex-shrink-0 ml-2">{b.assets?.length || 0}</span>
              </button>
            ))}
            {activeBrands.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No portfolios yet</p>}
          </div>
        </div>

        {archivedBrands.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-4 opacity-70">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs pl-2 mb-3 border-b border-[#333] pb-2">Archived</p>
            <div className="flex flex-col gap-1">
              {archivedBrands.map(b => (
                <button key={b.id} onClick={() => { setSelectedBrand(b); setActiveTab('identity'); }}
                  className={`text-left w-full p-3 rounded-lg border transition-colors flex items-center justify-between ${selectedBrand?.id === b.id ? 'border-slate-600 bg-black' : 'border-transparent hover:border-[#333]'}`}
                >
                  <span className="text-slate-500 text-sm truncate">{b.brandName}</span>
                  <span className="text-xs text-slate-700">archived</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="w-full min-w-0">
        {selectedBrand ? (
          <div className="bg-[#1a1a1a] border border-[#f5ed38]/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedBrand.brandName}</h2>
                {selectedBrand.website && <a href={selectedBrand.website} target="_blank" rel="noreferrer" className="text-slate-500 text-sm hover:text-[#f5ed38] transition-colors">{selectedBrand.website}</a>}
                {isArchived && <span className="mt-2 inline-block bg-red-900/30 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/40">READ-ONLY · ARCHIVED</span>}
              </div>
              <div className="flex gap-3 flex-wrap">
                {isArchived ? (
                  <button onClick={handleUnarchiveBrand} disabled={isUnarchiving} className="bg-[#dc9f0f] hover:bg-[#f5ed38] text-black font-bold px-5 py-2 rounded-xl transition-colors">
                    {isUnarchiving ? 'Restoring...' : 'Unarchive Portfolio'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setShowDeleteModal(true)} className="bg-[#222] hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-xl font-bold border border-[#464646] hover:border-red-500/30 transition-colors text-sm">
                      Manage
                    </button>
                    <button onClick={() => setShowAssetModal(true)} className="bg-[#f5ed38] hover:bg-white text-black font-black px-4 py-2 rounded-xl transition-colors text-sm">
                      + Add Asset
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-[#333]">
              {(['identity', 'canvas'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'text-[#f5ed38] bg-[#222] border-b-2 border-[#f5ed38]' : 'text-slate-500 hover:text-white'}`}
                >
                  {tab === 'identity' ? '🎨 Brand Identity' : '📁 Asset Canvas'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'identity' ? renderIdentityPanel() : renderCanvasPanel()}
            </div>
          </div>
        ) : (
          <div className="h-[500px] border border-dashed border-[#333] rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
            <div className="text-center">
              <div className="text-5xl mb-4">❖</div>
              <h2 className="text-2xl font-black text-white mb-2">Select a Portfolio</h2>
              <p className="text-slate-500 max-w-sm">Open a portfolio from the sidebar or create a new one to start building your brand identity.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete / Archive Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-[#333] max-w-md w-full rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">Manage Portfolio</h3>
            <div className="flex flex-col gap-3">
              <button onClick={handleArchiveBrand} disabled={isArchiving || isDeleting} className="bg-[#222] hover:bg-[#333] text-white font-bold py-4 rounded-xl border border-[#464646] disabled:opacity-50 flex items-center justify-center gap-2">
                🗄️ {isArchiving ? 'Archiving...' : 'Archive (Preserves Files)'}
              </button>
              <button onClick={handleDeleteBrand} disabled={isDeleting || isArchiving} className="border border-red-900 text-red-500 hover:bg-red-900/30 font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                {isDeleting ? 'Deleting from cloud...' : 'Destroy Forever (Cannot Undo)'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:text-white mt-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-[#333] max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex border-b border-[#333]">
              <button onClick={() => setAssetTab('upload')} className={`flex-1 py-4 font-bold text-sm ${assetTab === 'upload' ? 'bg-[#222] text-[#f5ed38] border-b-2 border-[#f5ed38]' : 'text-slate-500'}`}>
                Layer Upload
              </button>
              <button onClick={() => setAssetTab('veo')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${assetTab === 'veo' ? 'bg-[#222] text-[#f5ed38] border-b-2 border-[#f5ed38]' : 'text-slate-500'}`}>
                ✨ Veo Studio
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={submitNewAsset} className="flex flex-col gap-5">
                {assetTab === 'upload' ? (
                  <>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Media File</label>
                      <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#333] file:text-white hover:file:bg-[#f5ed38] hover:file:text-black bg-black border border-[#333] rounded-xl p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Taxonomy Group</label>
                      <select value={assetClass} onChange={e => setAssetClass(e.target.value)} className="w-full bg-black border border-[#464646] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5ed38]">
                        {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3 bg-[#111] border border-[#333] p-3 rounded-xl">
                      <input type="checkbox" id="isPrimary" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-5 h-5 accent-[#f5ed38]" />
                      <label htmlFor="isPrimary" className="text-white font-medium cursor-pointer text-sm">Mark as Primary Branding Layer</label>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Tags (comma separated)</label>
                      <input type="text" value={assetTags} onChange={e => setAssetTags(e.target.value)} placeholder="e.g. dark-mode, transparent, web" className="w-full bg-black border border-[#464646] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5ed38]" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Describe what you want Veo to create</label>
                      <textarea value={veoPrompt} onChange={e => setVeoPrompt(e.target.value)} placeholder="E.g. A 15-second video ad for Republic Tax Relief showing stressed people finding relief, warm orange tones..." className="w-full bg-black border border-[#464646] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5ed38] h-28 resize-none" />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Reference Image (Optional — gives Veo creative context)</label>
                      <input type="file" accept="image/*,video/*" onChange={e => setVeoRefFile(e.target.files?.[0] || null)}
                        className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#333] file:text-white hover:file:bg-[#f5ed38] hover:file:text-black bg-black border border-[#333] rounded-xl p-2"
                      />
                      <p className="text-slate-600 text-xs mt-1">Upload an image or video as creative inspiration for Veo generation</p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#333]">
                  <button type="button" onClick={() => setShowAssetModal(false)} className="flex-1 text-slate-400 hover:text-white font-medium py-3 border border-[#333] rounded-xl text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUploading} className="flex-[2] bg-[#f5ed38] hover:bg-white text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                    {isUploading ? 'Processing...' : (assetTab === 'upload' ? 'Upload → Canvas' : 'Queue Veo → Drafts')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
