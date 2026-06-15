'use client';

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FontStyle { family: string; size: string; weight: string; label: string; }
interface SocialLink { platform: string; url: string; }
interface LegacyAsset {
  id: string; title: string; fileUrl: string; thumbnailUrl?: string | null;
  classification?: string | null; type: string; isPrimary?: boolean;
  status: string; tags?: string | null;
}

interface ProjectAsset {
  id: string;
  title: string;
  assetType: 'website' | 'email' | 'video' | 'image';
  platform?: string | null;
  videoMode?: string | null;
  aiPrompt?: string | null;
  specs?: string | null;
  imageMode?: string | null;
  youtubeUrl?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  coverColor?: string | null;
  createdAt: string;
  updatedAt: string;
  assets: ProjectAsset[];
}

interface Brand {
  id: string; brandName: string; website?: string | null; status?: string;
  brandBackground?: string | null; brandHeaderColor?: string | null;
  brandTextColor?: string | null; brandCtaColor?: string | null;
  primaryColor?: string | null; typography?: string | null;
  fontH1?: string | null; fontH2?: string | null; fontBody?: string | null;
  logoUrl?: string | null; brandVoice?: string | null;
  brandVoiceDocUrl?: string | null; iconUrls?: string | null;
  socialLinks?: string | null;
  assets?: LegacyAsset[];
  projects?: Project[];
}

// ─── Video Specs ──────────────────────────────────────────────────────────────

const VIDEO_PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵', resolution: '1080×1920', aspect: '9:16', maxDuration: '10 min', format: 'MP4/MOV', fps: '30-60', bitrate: '10-15 Mbps' },
  { id: 'meta_stories', label: 'Meta Stories', icon: '📱', resolution: '1080×1920', aspect: '9:16', maxDuration: '60 min', format: 'MP4/MOV', fps: '30-60', bitrate: '10-15 Mbps' },
  { id: 'meta_reels', label: 'Meta Reels', icon: '🎬', resolution: '1080×1920', aspect: '9:16', maxDuration: '60 min', format: 'MP4/MOV', fps: '30-60', bitrate: '10-15 Mbps' },
  { id: 'yt_shorts', label: 'YouTube Shorts', icon: '▶️', resolution: '1080×1920', aspect: '9:16', maxDuration: '60 sec', format: 'MP4', fps: '30-60', bitrate: '10-15 Mbps' },
  { id: 'yt_main', label: 'YouTube Main', icon: '📺', resolution: '1920×1080', aspect: '16:9', maxDuration: 'No limit', format: 'MP4', fps: '30-60', bitrate: '10-15 Mbps' },
];

const COVER_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4'];

const SOCIAL_CONFIG: Record<string, { icon: string; label: string }> = {
  'twitter.com':   { icon: '𝕏', label: 'Twitter/X' },
  'x.com':         { icon: '𝕏', label: 'X' },
  'instagram.com': { icon: '📷', label: 'Instagram' },
  'facebook.com':  { icon: '📘', label: 'Facebook' },
  'linkedin.com':  { icon: '💼', label: 'LinkedIn' },
  'youtube.com':   { icon: '▶️', label: 'YouTube' },
  'tiktok.com':    { icon: '🎵', label: 'TikTok' },
  'pinterest.com': { icon: '📌', label: 'Pinterest' },
};

function getSocialInfo(platform: string) {
  for (const [key, val] of Object.entries(SOCIAL_CONFIG)) {
    if (platform.includes(key)) return val;
  }
  return { icon: '🔗', label: platform };
}

// ─── Editable Color Token ────────────────────────────────────────────────────

function ColorSwatch({ hex, label, fieldKey, onSave }: {
  hex?: string | null; label: string; fieldKey: string; onSave: (k: string, v: string) => void;
}) {
  const isEmpty = !hex || hex === '#333333';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(isEmpty ? '#ffffff' : hex!);
  return (
    <div className="flex items-center gap-3 group">
      <div
        onClick={() => setEditing(true)}
        className={`w-12 h-12 rounded-xl border-2 cursor-pointer transition-all flex-shrink-0 relative flex items-center justify-center ${isEmpty ? 'border-dashed border-white/10 bg-white/5 hover:border-white/30' : 'border-white/10 hover:scale-105 hover:ring-2 hover:ring-white/20'}`}
        style={isEmpty ? {} : { backgroundColor: draft }}
        title={`Edit ${label}`}
      >
        {isEmpty ? <span className="text-white/30 text-lg">+</span> : (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl text-white text-xs">✏️</span>
        )}
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-white/40 font-mono text-xs">{isEmpty ? 'not set' : draft}</p>
      </div>
      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setEditing(false)}>
          <div className="bg-[#1c1c2e] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl w-72" onClick={e => e.stopPropagation()}>
            <p className="text-white font-bold text-sm uppercase tracking-wide">{label}</p>
            <div className="w-20 h-20 rounded-xl border border-white/10" style={{ backgroundColor: draft }} />
            <input type="color" value={draft} onChange={e => setDraft(e.target.value)} className="w-full h-10 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="#f13729" className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-indigo-400 outline-none w-full text-center" />
            <div className="flex gap-3 w-full">
              <button onClick={() => setEditing(false)} className="flex-1 border border-white/10 text-white/50 py-2 rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={() => { setEditing(false); onSave(fieldKey, draft); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrandBookManager({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [activeSection, setActiveSection] = useState<'brand' | 'projects' | 'library'>('brand');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTab, setProjectTab] = useState<'website' | 'email' | 'video' | 'image'>('video');
  const [newBrandName, setNewBrandName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [brandVoiceDraft, setBrandVoiceDraft] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(COVER_COLORS[0]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [pollingAssetId, setPollingAssetId] = useState<string | null>(null);
  
  // Omni-Channel video formats
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isProcessingDerivatives, setIsProcessingDerivatives] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const OMNI_FORMATS = [
    { id: '9:16', label: '1080x1920 (9:16)', platforms: ['TikTok', 'IG Reels', 'YouTube Shorts'] },
    { id: '16:9', label: '1920x1080 (16:9)', platforms: ['YouTube Standard'] },
    { id: '1:1', label: '1080x1080 (1:1)', platforms: ['FB Carousel', 'IG Post'] },
    { id: '4:5', label: '1080x1350 (4:5)', platforms: ['IG Portrait'] },
  ];
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<'upload' | 'upload_to_edit' | 'ai_generate' | null>(null);
  const [assetTitle, setAssetTitle] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'ai_generate' | null>(null);
  // doc upload
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  // video preview before save
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  // library: move-to-project
  const [movingAssetId, setMovingAssetId] = useState<string | null>(null);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState<string | null>(null);
  const [isMovingAsset, setIsMovingAsset] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const updateBrandInList = useCallback((updated: Brand) => {
    setBrands(prev => prev.map(b => b.id === updated.id ? { ...updated, assets: b.assets, projects: b.projects } : b));
    setSelectedBrand(prev => prev?.id === updated.id ? { ...updated, assets: prev.assets, projects: prev.projects } : prev);
  }, []);

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setActiveSection('brand');
    setSelectedProject(null);
    setBrandVoiceDraft(brand.brandVoice || '');
  };

  // ─── Brand Actions ────────────────────────────────────────────────────────

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: newBrandName, website: newWebsite }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const nb: Brand = await res.json();
      nb.projects = [];
      setBrands(prev => [nb, ...prev]);
      setSelectedBrand(nb);
      setBrandVoiceDraft(nb.brandVoice || '');
      setActiveSection('brand');
      setNewBrandName(''); setNewWebsite('');
    } catch (err: any) { alert(err.message); }
    finally { setIsCreating(false); }
  };

  const handleRescan = async () => {
    if (!selectedBrand) return;
    setIsRescanning(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/rescan`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      updateBrandInList(updated);
      setBrandVoiceDraft(updated.brandVoice || '');
    } catch (err: any) { alert('Rescan failed: ' + err.message); }
    finally { setIsRescanning(false); }
  };

  const handleSaveToken = async (fieldKey: string, value: string) => {
    if (!selectedBrand || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: value }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      updateBrandInList(updated);
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleSaveBrandVoice = async () => {
    await handleSaveToken('brandVoice', brandVoiceDraft);
  };

  const handleBrandVoiceDocUpload = async (file: File) => {
    if (!selectedBrand) return;
    setIsUploadingDoc(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`/api/brands/${selectedBrand.id}/brand-voice-doc`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      const { brand: updated } = await res.json();
      updateBrandInList(updated);
    } catch (err: any) { alert('Upload failed: ' + err.message); }
    finally { setIsUploadingDoc(false); }
  };

  const handleDeleteBrandVoiceDoc = async () => {
    if (!selectedBrand || !confirm('Remove this document?')) return;
    setIsDeletingDoc(true);
    try {
      await fetch(`/api/brands/${selectedBrand.id}/brand-voice-doc`, { method: 'DELETE' });
      updateBrandInList({ ...selectedBrand, brandVoiceDocUrl: null });
    } catch (err: any) { alert(err.message); }
    finally { setIsDeletingDoc(false); }
  };

  const handleConfirmPreview = async () => {
    if (!selectedProject || !selectedBrand || !previewUrl || !previewTitle) return;
    setIsAddingAsset(true);
    try {
      const plat = VIDEO_PLATFORMS.find(p => p.id === selectedPlatform);
      const body = {
        title: previewTitle, assetType: 'video', platform: selectedPlatform,
        videoMode: 'upload_to_edit', fileUrl: previewUrl, status: 'ACTIVE',
        specs: plat ? JSON.stringify({ resolution: plat.resolution, aspectRatio: plat.aspect }) : null,
      };
      const res = await fetch(`/api/brands/${selectedBrand.id}/projects/${selectedProject.id}/assets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newAsset: ProjectAsset = await res.json();
      const updatedProject = { ...selectedProject, assets: [newAsset, ...selectedProject.assets] };
      setSelectedProject(updatedProject);
      const updatedBrand = { ...selectedBrand, projects: (selectedBrand.projects || []).map(p => p.id === selectedProject.id ? updatedProject : p) };
      setSelectedBrand(updatedBrand);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updatedBrand : b));
      setPreviewUrl(null); setPreviewTitle(''); setShowAddAsset(false);
    } catch (err: any) { alert(err.message); }
    finally { setIsAddingAsset(false); }
  };

  const handleMoveToProject = async (asset: LegacyAsset, targetProjectId: string) => {
    if (!selectedBrand) return;
    setIsMovingAsset(true);
    try {
      const ext = asset.fileUrl?.split('.').pop()?.toLowerCase() || '';
      const assetType = ['mp4','mov','webm','avi'].includes(ext) ? 'video' : ['jpg','jpeg','png','gif','webp','svg'].includes(ext) ? 'image' : 'image';
      const body = { title: asset.title || 'Untitled', assetType, fileUrl: asset.fileUrl, thumbnailUrl: asset.thumbnailUrl, status: 'ACTIVE' };
      await fetch(`/api/brands/${selectedBrand.id}/projects/${targetProjectId}/assets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      setMovingAssetId(null); setMoveTargetProjectId(null);
      alert('Asset added to project!');
    } catch (err: any) { alert(err.message); }
    finally { setIsMovingAsset(false); }
  };


  const handleCreateProject = async () => {
    if (!selectedBrand || !newProjectName) return;
    setIsCreatingProject(true);
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, coverColor: newProjectColor }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const proj: Project = await res.json();
      const updated = { ...selectedBrand, projects: [proj, ...(selectedBrand.projects || [])] };
      setSelectedBrand(updated);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updated : b));
      setShowNewProject(false);
      setNewProjectName('');
    } catch (err: any) { alert(err.message); }
    finally { setIsCreatingProject(false); }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!selectedBrand || !confirm('Delete this project and all its assets?')) return;
    try {
      await fetch(`/api/brands/${selectedBrand.id}/projects/${projectId}`, { method: 'DELETE' });
      const updated = { ...selectedBrand, projects: (selectedBrand.projects || []).filter(p => p.id !== projectId) };
      setSelectedBrand(updated);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updated : b));
      if (selectedProject?.id === projectId) setSelectedProject(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleRenameProject = async (projectId: string, currentName: string) => {
    const newName = window.prompt('Rename project:', currentName);
    if (!newName || newName === currentName || !selectedBrand) return;
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}/projects/${projectId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName })
      });
      if (!res.ok) throw new Error('Failed to rename project');
      const updatedProject = await res.json();
      const updatedBrand = { ...selectedBrand, projects: (selectedBrand.projects || []).map(p => p.id === projectId ? updatedProject : p) };
      setSelectedBrand(updatedBrand);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updatedBrand : b));
      if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
    } catch (err: any) { alert(err.message); }
  };

  // ─── Asset Actions ────────────────────────────────────────────────────────

  const uploadFileToCDN = async (file: File): Promise<string> => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };



  const handleAddAsset = async () => {
    if (!selectedProject || !selectedBrand || !assetTitle) return;
    setIsAddingAsset(true);
    try {
      let fileUrl: string | undefined;
      const generatedId = crypto.randomUUID();

      if (uploadFile) {
        if (videoMode === 'upload_master') {
          const fd = new FormData();
          fd.append('file', uploadFile);
          fd.append('formats', JSON.stringify(selectedFormats));
          fd.append('context', JSON.stringify({ 
              projectId: selectedProject.id, 
              brandId: selectedBrand.id, 
              parentAssetId: generatedId,
              assetTitle: assetTitle, 
              projectTab 
          }));
          const cloudRes = await fetch('/api/video/process', { method: 'POST', body: fd });
          const cloudData = await cloudRes.json();
          if (!cloudRes.ok) throw new Error(cloudData.error || 'Cloudinary upload failed');
          fileUrl = cloudData.url;
          cloudinaryPublicId = cloudData.public_id;
          alert('Master Video queued! Omni-Channel outputs will asynchronously push to your gallery when finished.');
        } else {
          fileUrl = await uploadFileToCDN(uploadFile);
        }
      }

      const specPayload = cloudinaryPublicId ? { cloudinaryPublicId } : null;

      const body: Record<string, unknown> = {
        id: generatedId,
        title: assetTitle,
        assetType: projectTab,
        platform: selectedPlatform,
        videoMode,
        aiPrompt: aiPrompt || null,
        imageMode,
        youtubeUrl: youtubeUrl || null,
        fileUrl: fileUrl || null,
        status: fileUrl || youtubeUrl ? 'ACTIVE' : 'DRAFT',
        specs: specPayload ? JSON.stringify(specPayload) : null,
      };

      if (selectedPlatform) {
        const plat = VIDEO_PLATFORMS.find(p => p.id === selectedPlatform);
        if (plat) body.specs = JSON.stringify({ ...specPayload, resolution: plat.resolution, aspectRatio: plat.aspect, maxDuration: plat.maxDuration, format: plat.format, fps: plat.fps, bitrate: plat.bitrate });
      }

      if (videoMode === 'upload_master') {
        body.isMasterAsset = true;
        body.status = 'ACTIVE';
      }

      const res = await fetch(`/api/brands/${selectedBrand.id}/projects/${selectedProject.id}/assets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newAsset: ProjectAsset = await res.json();
      let allAssets = [newAsset, ...selectedProject.assets];



      const updatedProject = { ...selectedProject, assets: allAssets };
      setSelectedProject(updatedProject);
      const updatedBrand = { ...selectedBrand, projects: (selectedBrand.projects || []).map(p => p.id === selectedProject.id ? updatedProject : p) };
      setSelectedBrand(updatedBrand);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updatedBrand : b));
      setShowAddAsset(false); setAssetTitle(''); setAiPrompt(''); setUploadFile(null); setYoutubeUrl(''); setSelectedPlatform(null); setVideoMode(null); setImageMode(null); setSelectedFormats([]);
    } catch (err: any) { alert(err.message); }
    finally { setIsAddingAsset(false); }
  };

  const handlePollCloudinary = async (masterAssetId: string) => {
    setPollingAssetId(masterAssetId);
    try {
      const res = await fetch(`/api/video/poll?assetId=${masterAssetId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (result.addedCount > 0) {
        alert(`Successfully synced ${result.addedCount} Omni-Channel derivatives!`);
        const updatedProject = {
          ...selectedProject!,
          assets: selectedProject!.assets.filter(a => !result.refreshedChildren.find((r: any) => r.id === a.id)).concat(result.refreshedChildren)
        };
        setSelectedProject(updatedProject);
        const updatedBrand = { ...selectedBrand!, projects: (selectedBrand!.projects || []).map(p => p.id === selectedProject!.id ? updatedProject : p) };
        setSelectedBrand(updatedBrand);
        setBrands(prev => prev.map(b => b.id === selectedBrand!.id ? updatedBrand : b));
      } else {
        alert('Cloudinary is still processing these videos. Please check back in a few moments!');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPollingAssetId(null);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!selectedProject || !selectedBrand) return;
    try {
      await fetch(`/api/brands/${selectedBrand.id}/projects/${selectedProject.id}/assets?assetId=${assetId}`, { method: 'DELETE' });
      const updatedProject = { ...selectedProject, assets: selectedProject.assets.filter(a => a.id !== assetId) };
      setSelectedProject(updatedProject);
      const updatedBrand = { ...selectedBrand, projects: (selectedBrand.projects || []).map(p => p.id === selectedProject.id ? updatedProject : p) };
      setSelectedBrand(updatedBrand);
      setBrands(prev => prev.map(b => b.id === selectedBrand.id ? updatedBrand : b));
    } catch (err: any) { alert(err.message); }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const parseFontStyle = (s?: string | null): FontStyle | null => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

  const activeBrands = brands.filter(b => b.status !== 'ARCHIVED');

  // ─── Brand Section ────────────────────────────────────────────────────────

  const renderBrandSection = () => {
    if (!selectedBrand) return null;
    const h1 = parseFontStyle(selectedBrand.fontH1);
    const h2 = parseFontStyle(selectedBrand.fontH2);
    const body = parseFontStyle(selectedBrand.fontBody);
    const icons: string[] = (() => { try { return selectedBrand.iconUrls ? JSON.parse(selectedBrand.iconUrls) : []; } catch { return []; } })();

    const BRAND_TOKENS = [
      { label: 'Background', fieldKey: 'brandBackground', hex: selectedBrand.brandBackground },
      { label: 'Header Color', fieldKey: 'brandHeaderColor', hex: selectedBrand.brandHeaderColor },
      { label: 'Text Color', fieldKey: 'brandTextColor', hex: selectedBrand.brandTextColor },
      { label: 'CTA Color', fieldKey: 'brandCtaColor', hex: selectedBrand.brandCtaColor },
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Rescan bar */}
        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-5 py-3 border border-white/8">
          <div>
            <p className="text-white font-semibold text-sm">Brand Intelligence</p>
            {selectedBrand.website && <a href={selectedBrand.website} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300">{selectedBrand.website}</a>}
          </div>
          {selectedBrand.website && (
            <button onClick={handleRescan} disabled={isRescanning} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all">
              {isRescanning ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning...</> : '🔄 Re-scan Website'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Logo */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Logo</p>
            {selectedBrand.logoUrl ? (
              <a href={selectedBrand.logoUrl} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedBrand.logoUrl} alt={selectedBrand.brandName + ' logo'} className="max-h-20 object-contain" />
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-white/10 rounded-xl">
                <span className="text-white/20 text-xs">No logo detected — upload via Brand Library</span>
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Brand Colors</p>
              {isSaving && <span className="text-indigo-400 text-xs animate-pulse">Saving...</span>}
            </div>
            <div className="flex flex-col gap-3">
              {BRAND_TOKENS.map(t => (
                <ColorSwatch key={t.fieldKey} hex={t.hex} label={t.label} fieldKey={t.fieldKey} onSave={handleSaveToken} />
              ))}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Typography</p>
          {selectedBrand.typography || h1 || h2 || body ? (
            <div className="flex flex-col gap-4">
              {selectedBrand.typography && (
                <div className="pb-4 border-b border-white/8">
                  <p className="text-white/30 text-xs mb-1">Primary Family</p>
                  <p className="text-white text-2xl font-bold" style={{ fontFamily: selectedBrand.typography }}>{selectedBrand.typography}</p>
                </div>
              )}
              {h1 && <div className="pb-3 border-b border-white/8 flex items-end justify-between"><div><p className="text-white/30 text-xs mb-1">H1 · {h1.size}</p><p className="text-white" style={{ fontSize: 'clamp(1.5rem,4vw,3rem)', fontWeight: h1.weight, fontFamily: h1.family }}>Aa</p></div><span className="text-white/20 text-xs font-mono">{h1.size} / w{h1.weight}</span></div>}
              {h2 && <div className="pb-3 border-b border-white/8 flex items-end justify-between"><div><p className="text-white/30 text-xs mb-1">H2 · {h2.size}</p><p className="text-white" style={{ fontSize: 'clamp(1.2rem,3vw,2rem)', fontWeight: h2.weight, fontFamily: h2.family }}>Bb</p></div><span className="text-white/20 text-xs font-mono">{h2.size} / w{h2.weight}</span></div>}
              {body && <div className="flex items-end justify-between"><div><p className="text-white/30 text-xs mb-1">Body</p><p className="text-white/70" style={{ fontSize: body.size, fontFamily: body.family }}>The quick brown fox jumps over the lazy dog</p></div><span className="text-white/20 text-xs font-mono">{body.size}</span></div>}
            </div>
          ) : <p className="text-white/20 italic text-sm">No typography detected. Try re-scanning the website.</p>}
        </div>

        {/* Icons */}
        {icons.length > 0 && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Detected Icons & Graphics</p>
            <div className="flex flex-wrap gap-3">
              {icons.slice(0,8).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
              ))}
            </div>
          </div>
        )}

        {/* Social Handles */}
        {(() => {
          const socials: SocialLink[] = (() => { try { return selectedBrand.socialLinks ? JSON.parse(selectedBrand.socialLinks) : []; } catch { return []; } })();
          return socials.length > 0 ? (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Social Handles</p>
              <div className="flex flex-wrap gap-2">
                {socials.map((s, i) => {
                  const info = getSocialInfo(s.platform);
                  return (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 text-white/70 hover:text-white text-sm font-semibold transition-all">
                      <span>{info.icon}</span><span>{info.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null;
        })()}

        {/* Brand Voice */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Brand Voice &amp; Copy Guidelines</p>
          <textarea
            value={brandVoiceDraft}
            onChange={e => setBrandVoiceDraft(e.target.value)}
            placeholder="Describe this brand's tone of voice, writing style, key messages, and copy guidelines..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 resize-none h-32 placeholder:text-white/20"
          />
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button onClick={handleSaveBrandVoice} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all">
              {isSaving ? 'Saving...' : 'Save Brand Voice'}
            </button>
            {/* Doc upload */}
            <label className={`cursor-pointer flex items-center gap-2 border border-white/10 hover:border-indigo-500 text-white/50 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploadingDoc ? '⏳ Uploading...' : '📎 Upload Document'}
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleBrandVoiceDocUpload(f); }} />
            </label>
          </div>
          {/* Existing doc */}
          {selectedBrand.brandVoiceDocUrl && (
            <div className="mt-4 flex items-center gap-3 bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <a href={selectedBrand.brandVoiceDocUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200 text-sm font-semibold truncate block">
                  {selectedBrand.brandVoiceDocUrl.split('/').pop()}
                </a>
                <p className="text-white/20 text-xs mt-0.5">Brand Voice Document</p>
              </div>
              <button onClick={handleDeleteBrandVoiceDoc} disabled={isDeletingDoc} className="text-red-400/50 hover:text-red-400 text-xs font-bold transition-colors">
                {isDeletingDoc ? '...' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


  // ─── Projects Grid ────────────────────────────────────────────────────────

  const renderProjectsGrid = () => {
    const projects = selectedBrand?.projects || [];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Projects</h3>
          <button onClick={() => setShowNewProject(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all">
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/10 rounded-3xl">
            <span className="text-5xl mb-4">📁</span>
            <p className="text-white/40 font-semibold">No projects yet</p>
            <p className="text-white/20 text-sm mt-1">Create a project to organize your creative assets</p>
            <button onClick={() => setShowNewProject(true)} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all">
              + Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(proj => (
              <div key={proj.id} className="group relative bg-white/5 border border-white/8 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl" onClick={() => setSelectedProject(proj)}>
                <div className="h-28 w-full relative flex items-center justify-center" style={{ backgroundColor: proj.coverColor || '#6366f1' }}>
                  <span className="text-white/20 text-5xl font-black">{proj.name.charAt(0)}</span>
                </div>
                <div className="p-4">
                  <p className="text-white font-bold text-sm truncate">{proj.name}</p>
                  <p className="text-white/40 text-xs mt-1">{proj.assets?.length || 0} assets</p>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDeleteProject(proj.id); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-900/60 text-white/60 hover:text-red-400 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Library Section ──────────────────────────────────────────────────────

  const renderLibrarySection = () => {
    if (!selectedBrand) return null;
    const legacyAssets: LegacyAsset[] = (selectedBrand.assets || []) as LegacyAsset[];
    const projects = selectedBrand.projects || [];

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Asset Library</h3>
            <p className="text-white/30 text-sm mt-0.5">Existing assets — not yet sorted into projects</p>
          </div>
          <span className="bg-white/10 border border-white/10 text-white/40 text-xs font-bold px-3 py-1.5 rounded-full">{legacyAssets.length} assets</span>
        </div>

        {legacyAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
            <span className="text-4xl mb-3 opacity-30">📦</span>
            <p className="text-white/30 text-sm">No legacy assets found for this brand</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {legacyAssets.map(asset => {
              const ext = asset.fileUrl?.split('.').pop()?.toLowerCase() || '';
              const isVideo = ['mp4','mov','webm','avi'].includes(ext);
              const isImg = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
              const isMoving = movingAssetId === asset.id;

              return (
                <div key={asset.id} className="group bg-white/5 border border-white/8 hover:border-white/20 rounded-2xl overflow-hidden transition-all">
                  <div className="aspect-video bg-black/40 flex items-center justify-center relative overflow-hidden">
                    {isImg && asset.fileUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.thumbnailUrl || asset.fileUrl} alt={asset.title} className="w-full h-full object-contain" />
                    ) : isVideo ? (
                      <span className="text-4xl opacity-40">🎬</span>
                    ) : (
                      <span className="text-4xl opacity-40">📄</span>
                    )}
                    {asset.classification && (
                      <span className="absolute top-2 left-2 bg-black/60 text-white/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{asset.classification}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white/70 font-semibold text-xs truncate mb-3">{asset.title || 'Untitled'}</p>
                    {/* Move to project */}
                    {isMoving ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-white/30 text-[10px] font-bold uppercase">Move to project:</p>
                        {projects.length === 0 ? (
                          <p className="text-white/20 text-xs">No projects yet</p>
                        ) : (
                          projects.map(p => (
                            <button key={p.id} onClick={() => handleMoveToProject(asset, p.id)} disabled={isMovingAsset}
                              className="text-left text-xs text-white/60 hover:text-white bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500 px-2 py-1.5 rounded-lg transition-all truncate">
                              {isMovingAsset ? '⏳' : '→'} {p.name}
                            </button>
                          ))
                        )}
                        <button onClick={() => setMovingAssetId(null)} className="text-white/20 hover:text-white/40 text-xs mt-1">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setMovingAssetId(asset.id)}
                        className="w-full text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 py-1.5 rounded-lg transition-all font-bold">
                        + Add to Project
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Project Detail ───────────────────────────────────────────────────────

  const renderProjectDetail = () => {
    if (!selectedProject) return null;
    const tabAssets = selectedProject.assets.filter(a => a.assetType === projectTab);

    const ASSET_TABS = [
      { id: 'website', label: '🌐 Website', color: 'blue' },
      { id: 'email', label: '📧 Email', color: 'green' },
      { id: 'video', label: '🎬 Video', color: 'purple' },
      { id: 'image', label: '🖼️ Images', color: 'amber' },
    ] as const;

    return (
      <div className="flex flex-col gap-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedProject(null)} className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Projects
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white font-bold">{selectedProject.name}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl w-fit">
          {ASSET_TABS.map(tab => (
            <button key={tab.id} onClick={() => setProjectTab(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${projectTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex flex-col gap-4">
          {/* Video platform selector */}
          {projectTab === 'video' && (
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-4">Select Platform</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {VIDEO_PLATFORMS.map(plat => (
                  <button key={plat.id} onClick={() => setSelectedPlatform(prev => prev === plat.id ? null : plat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectedPlatform === plat.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}`}>
                    <span className="text-2xl">{plat.icon}</span>
                    <span className="text-xs font-bold text-center leading-tight">{plat.label}</span>
                    <span className="text-[10px] font-mono opacity-60">{plat.aspect}</span>
                  </button>
                ))}
              </div>
              {selectedPlatform && (() => {
                const plat = VIDEO_PLATFORMS.find(p => p.id === selectedPlatform)!;
                return (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[['Resolution', plat.resolution], ['Aspect', plat.aspect], ['Duration', plat.maxDuration], ['Format', plat.format], ['FPS', plat.fps], ['Bitrate', plat.bitrate]].map(([k, v]) => (
                      <div key={k} className="bg-black/30 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest">{k}</p>
                        <p className="text-white font-bold text-xs mt-1">{v}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Asset list + Add button */}
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold">{tabAssets.length} {projectTab} asset{tabAssets.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAddAsset(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all">
              + Add {projectTab.charAt(0).toUpperCase() + projectTab.slice(1)}
            </button>
          </div>

          {tabAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
              <span className="text-3xl mb-3 opacity-30">{projectTab === 'video' ? '🎬' : projectTab === 'image' ? '🖼️' : projectTab === 'email' ? '📧' : '🌐'}</span>
              <p className="text-white/30 text-sm">No {projectTab} assets yet</p>
              <button onClick={() => setShowAddAsset(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors">+ Add one</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabAssets.filter(a => !a.parentAssetId).map(asset => {
                const specs = (() => { try { return asset.specs ? JSON.parse(asset.specs) : null; } catch { return null; } })();
                const children = tabAssets.filter(c => c.parentAssetId === asset.id);
                return (
                  <div key={asset.id} className="group bg-white/5 border border-white/8 hover:border-white/20 rounded-2xl overflow-hidden transition-all flex flex-col">
                    <div className="aspect-video bg-black/40 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {asset.fileUrl && asset.assetType === 'video' ? (
                        <video src={asset.fileUrl} className="w-full h-full object-contain opacity-60" />
                      ) : asset.fileUrl && asset.assetType === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.fileUrl} alt={asset.title} className="w-full h-full object-contain" />
                      ) : asset.youtubeUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl">▶️</span>
                          <span className="text-white/40 text-xs font-mono truncate px-4 text-center">{asset.youtubeUrl}</span>
                        </div>
                      ) : asset.aiPrompt ? (
                        <div className="flex flex-col items-center gap-2 px-4 text-center">
                          <span className="text-3xl">✨</span>
                          <span className="text-white/40 text-xs line-clamp-2">{asset.aiPrompt}</span>
                        </div>
                      ) : (
                        <span className="text-4xl opacity-20">{asset.assetType === 'video' ? '🎬' : asset.assetType === 'image' ? '🖼️' : asset.assetType === 'email' ? '📧' : '🌐'}</span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${asset.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/40'}`}>{asset.status}</span>
                        {asset.platform && <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">{asset.platform.replace('_', ' ')}</span>}
                      </div>
                    </div>
                    <div className="p-4 bg-white/5">
                      <p className="text-white font-bold text-sm truncate">{asset.title}</p>
                      {specs && <p className="text-white/30 text-xs mt-1 font-mono">{specs.resolution} · {specs.aspectRatio}</p>}
                      {asset.videoMode && <p className="text-purple-400 text-xs mt-1 capitalize">{asset.videoMode.replace('_', ' ')}</p>}
                      <div className="flex items-center gap-3 mt-3">
                        {asset.videoMode === 'upload_master' && (
                          <button onClick={() => handlePollCloudinary(asset.id)} disabled={pollingAssetId === asset.id} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-wider transition-colors">
                            {pollingAssetId === asset.id ? '↻ Syncing...' : '↻ Check Status'}
                          </button>
                        )}
                        <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-500/40 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100 ml-auto">Delete</button>
                      </div>
                    </div>
                    {children.length > 0 && (
                      <div className="bg-black/30 border-t border-white/5 p-3 flex-1 flex flex-col gap-2">
                        <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Derivatives ({children.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {children.map(c => (
                            <div key={c.id} className="bg-white/5 border border-white/10 rounded px-2 py-1.5 flex flex-col w-full">
                              <span className="text-indigo-300 font-bold text-[10px]">{c.aspectRatio}</span>
                              <span className="text-white/40 text-[9px] truncate">{(c.platformTarget || []).join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Add Asset Modal ──────────────────────────────────────────────────────

  const renderAddAssetModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setShowAddAsset(false); setPreviewUrl(null); }}>
      <div className="bg-[#13131f] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* ── Video Preview State ── */}
        {previewUrl ? (
          <>
            <div className="p-6 border-b border-white/8">
              <h3 className="text-white font-bold text-lg">Preview Edited Video</h3>
              <p className="text-white/30 text-sm mt-1">Review the AI-edited result before saving as a new version</p>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <video src={previewUrl} controls className="w-full rounded-xl bg-black/40 max-h-72" />
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Version Title *</label>
                <input type="text" value={previewTitle} onChange={e => setPreviewTitle(e.target.value)} placeholder="e.g. TikTok v2 — edited" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" />
              </div>
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-300 text-xs font-bold">💡 The original upload is kept in your project. This saves a new version alongside it.</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/8 flex gap-3">
              <button onClick={() => setPreviewUrl(null)} className="flex-1 border border-white/10 text-white/40 hover:text-white py-3 rounded-xl font-bold text-sm transition-all">← Discard</button>
              <button onClick={handleConfirmPreview} disabled={isAddingAsset || !previewTitle} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {isAddingAsset ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : '✅ Save as New Version'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-white/8">
              <h3 className="text-white font-bold text-lg">Add {projectTab.charAt(0).toUpperCase() + projectTab.slice(1)} Asset</h3>
              {selectedProject && <p className="text-white/30 text-sm mt-1">→ {selectedProject.name}</p>}
            </div>
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Asset Title *</label>
            <input type="text" value={assetTitle} onChange={e => setAssetTitle(e.target.value)} placeholder={`e.g. Q2 ${projectTab} campaign`} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" />
          </div>

          {/* Website / Email: YouTube URL */}
          {(projectTab === 'website' || projectTab === 'email') && (
            <div>
              <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">YouTube Video URL (optional)</label>
              <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" />
              <p className="text-white/20 text-xs mt-1">Paste the YouTube URL after uploading to the brand&rsquo;s channel</p>
            </div>
          )}

          {/* Video: platform + creation mode */}
          {projectTab === 'video' && (
            <>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {VIDEO_PLATFORMS.map(p => (
                    <button key={p.id} type="button" onClick={() => setSelectedPlatform(prev => prev === p.id ? null : p.id)} className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-all ${selectedPlatform === p.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
                      <span className="text-lg">{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Creation Mode</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'upload_master', icon: '🌍', label: 'Omni-Channel Master', desc: 'Upload a master video and map to formats' },
                    { id: 'upload', icon: '⬆️', label: 'Upload Finished Video', desc: 'Upload a completed video file' },
                    { id: 'upload_to_edit', icon: '✂️', label: 'Upload to Edit', desc: 'Upload raw footage · AI will refine it' },
                    { id: 'ai_generate', icon: '✨', label: 'Generate with AI', desc: 'Describe the video · Veo creates it' },
                  ].map(mode => (
                    <button key={mode.id} type="button" onClick={() => setVideoMode(prev => prev === mode.id as typeof videoMode ? null : mode.id as typeof videoMode)} className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${videoMode === mode.id ? 'bg-indigo-600/20 border-indigo-500' : 'border-white/10 hover:border-white/20'}`}>
                      <span className="text-2xl">{mode.icon}</span>
                      <div><p className={`text-sm font-bold ${videoMode === mode.id ? 'text-white' : 'text-white/60'}`}>{mode.label}</p><p className="text-white/30 text-xs">{mode.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              {(videoMode === 'ai_generate' || videoMode === 'upload_to_edit') && (
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">
                    {videoMode === 'ai_generate' ? 'AI Prompt (describe the video)' : 'Edit Instructions'}
                  </label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder={videoMode === 'ai_generate' ? 'E.g. A 15-second brand video showing...' : 'E.g. Add captions, trim first 3 seconds, add logo overlay...'} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 h-24 resize-none placeholder:text-white/20" />
                </div>
              )}
              {(videoMode === 'upload' || videoMode === 'upload_to_edit' || videoMode === 'upload_master') && (
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Video File</label>
                  <input type="file" accept="video/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 bg-black/40 border border-white/10 rounded-xl p-2" />
                </div>
              )}
              {videoMode === 'upload_master' && (
                <div className="mt-2 bg-[#1a1a2e] border border-indigo-500/30 rounded-xl p-4">
                  <p className="text-indigo-300 text-xs uppercase tracking-widest font-bold mb-3">Map to Configurations</p>
                  <div className="flex flex-col gap-2">
                    {OMNI_FORMATS.map(f => (
                      <label key={f.id} className="flex items-center gap-3 bg-black/40 border border-white/10 hover:border-indigo-500 p-3 rounded-lg cursor-pointer transition-all">
                        <input type="checkbox" checked={selectedFormats.includes(f.id)} onChange={e => {
                          if (e.target.checked) setSelectedFormats(prev => [...prev, f.id]);
                          else setSelectedFormats(prev => prev.filter(id => id !== f.id));
                        }} className="w-4 h-4 rounded appearance-none border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 flex items-center justify-center relative after:content-['✓'] after:absolute after:text-white after:text-xs after:opacity-0 checked:after:opacity-100" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-bold">{f.label}</p>
                          <p className="text-white/40 text-xs truncate">{f.platforms.join(', ')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Images: creation mode */}
          {projectTab === 'image' && (
            <>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Creation Mode</label>
                <div className="flex gap-3">
                  {[
                    { id: 'upload', icon: '⬆️', label: 'Upload Image' },
                    { id: 'ai_generate', icon: '✨', label: 'AI Generate' },
                  ].map(mode => (
                    <button key={mode.id} type="button" onClick={() => setImageMode(prev => prev === mode.id as typeof imageMode ? null : mode.id as typeof imageMode)} className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border font-bold text-sm transition-all ${imageMode === mode.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
                      <span className="text-2xl">{mode.icon}</span>{mode.label}
                    </button>
                  ))}
                </div>
              </div>
              {imageMode === 'upload' && (
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Image File</label>
                  <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 bg-black/40 border border-white/10 rounded-xl p-2" />
                </div>
              )}
              {imageMode === 'ai_generate' && (
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Image Prompt</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe the image you want AI to generate..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 h-24 resize-none placeholder:text-white/20" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-white/8 flex gap-3">
          <button type="button" onClick={() => setShowAddAsset(false)} className="flex-1 border border-white/10 text-white/40 hover:text-white py-3 rounded-xl font-bold text-sm transition-all">Cancel</button>
          <button type="button" onClick={handleAddAsset} disabled={isAddingAsset || isProcessingDerivatives || !assetTitle} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            {isProcessingDerivatives ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{processingStatus}</>
            ) : isAddingAsset ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</>
            ) : `+ Add ${projectTab.charAt(0).toUpperCase() + projectTab.slice(1)}`}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );

  // ─── Layout ───────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 min-h-[80vh]">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* New brand form */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <p className="text-white font-bold text-sm mb-4">New Brand Portfolio</p>
          <form onSubmit={handleCreateBrand} className="flex flex-col gap-3">
            <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Brand name" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" suppressHydrationWarning />
            <input type="text" value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="Website URL (for scraping)" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" suppressHydrationWarning />
            <button type="submit" disabled={isCreating || !newBrandName} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              {isCreating ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning...</> : '🔍 Create + Scan'}
            </button>
          </form>
        </div>

        {/* Brand list */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4 flex-1">
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-3">Portfolios</p>
          <div className="flex flex-col gap-1">
            {activeBrands.length === 0 && <p className="text-white/20 text-sm text-center py-6">No brands yet</p>}
            {activeBrands.map(b => (
              <button key={b.id} onClick={() => handleSelectBrand(b)} className={`text-left w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${selectedBrand?.id === b.id ? 'bg-indigo-600/20 border-indigo-500' : 'border-transparent hover:border-white/10 hover:bg-white/5'}`}>
                <div className="min-w-0">
                  <span className={`font-bold text-sm truncate block ${selectedBrand?.id === b.id ? 'text-indigo-300' : 'text-white/80'}`}>{b.brandName}</span>
                  {b.website && <span className="text-white/20 text-xs truncate block">{b.website.replace(/^https?:\/\//, '')}</span>}
                </div>
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/30 flex-shrink-0 ml-2">{b.projects?.length || 0}p</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section nav (shown when brand selected) */}
        {selectedBrand && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-2 flex flex-col gap-1">
            {[
              { id: 'brand', icon: '🎨', label: 'Brand' },
              { id: 'projects', icon: '📁', label: 'Projects' },
              { id: 'library', icon: '📦', label: 'Asset Library', badge: (selectedBrand.assets?.length || 0) },
            ].map(sec => (
              <button key={sec.id} onClick={() => { setActiveSection(sec.id as 'brand' | 'projects' | 'library'); setSelectedProject(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeSection === sec.id ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <span>{sec.icon}</span><span className="flex-1">{sec.label}</span>
                {'badge' in sec && (sec as {badge: number}).badge > 0 && <span className="bg-white/10 text-white/40 text-[10px] px-1.5 py-0.5 rounded-full">{(sec as {badge: number}).badge}</span>}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ── MAIN CANVAS ── */}
      <main className="flex-1 min-w-0">
        {!selectedBrand ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl py-32">
            <div className="text-6xl mb-6">✦</div>
            <h2 className="text-2xl font-black text-white mb-2">Select a Portfolio</h2>
            <p className="text-white/30 max-w-sm text-center">Choose a brand from the sidebar or create a new one to get started.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/8 rounded-3xl overflow-hidden">
            {/* Brand header */}
            <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedBrand.brandName}</h2>
                <p className="text-white/30 text-sm mt-0.5 capitalize">{activeSection === 'projects' && selectedProject ? `Projects › ${selectedProject.name}` : activeSection === 'projects' ? 'Projects' : activeSection === 'library' ? 'Asset Library' : 'Brand Identity'}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {activeSection === 'brand' && renderBrandSection()}
              {activeSection === 'projects' && !selectedProject && renderProjectsGrid()}
              {activeSection === 'projects' && selectedProject && renderProjectDetail()}
              {activeSection === 'library' && renderLibrarySection()}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowNewProject(false)}>
          <div className="bg-[#13131f] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black text-xl mb-6">New Project</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Project Name</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g. Q2 Campaign 2026" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 placeholder:text-white/20" autoFocus />
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Cover Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button key={c} onClick={() => setNewProjectColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all flex-shrink-0 ${newProjectColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowNewProject(false)} className="flex-1 border border-white/10 text-white/40 hover:text-white py-3 rounded-xl font-bold text-sm transition-all">Cancel</button>
              <button onClick={handleCreateProject} disabled={isCreatingProject || !newProjectName} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {isCreatingProject ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : '+ Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAsset && renderAddAssetModal()}
    </div>
  );
}
