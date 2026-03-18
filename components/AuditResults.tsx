import { useState } from 'react';

export default function AuditResults({ result }: { result: any }) {
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const copyShareLink = async () => {
    if (!videoUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(videoUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = videoUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const copyScript = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result.script);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = result.script;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const generateHeyGenVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoStatus('Initializing AI Render...');
    setVideoError('');
    setVideoUrl(null);
    
    try {
      const res = await fetch('/api/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: result.script, url: result.url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate video');
      
      pollVideoStatus(data.videoId);
    } catch (e: any) {
      setVideoError(e.message);
      setIsGeneratingVideo(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    try {
      const res = await fetch(`/api/heygen/status?videoId=${videoId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.status === 'completed' || data.status === 'success') {
        setVideoUrl(data.video_url);
        setVideoStatus('Video Ready!');
        setIsGeneratingVideo(false);
      } else if (data.status === 'failed') {
        throw new Error('HeyGen rendering failed. Please check your HeyGen dashboard.');
      } else {
        setVideoStatus(`Rendering... ${data.status} (this usually takes 2-3 minutes)`);
        setTimeout(() => pollVideoStatus(videoId), 10000); // Poll every 10 seconds
      }
    } catch (e: any) {
      setVideoError(e.message);
      setIsGeneratingVideo(false);
    }
  };

  if (!result) return null;

  return (
    <div className="w-full space-y-6">
      
      {/* Header section with Meta Pixel status */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#f5ed38]">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f5ed38] to-[#dc9f0f]">
            Audit Generated Successfully
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Target: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[#f5ed38] hover:underline font-medium">{result.url}</a>
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${result.metaPixelFound ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">
              Meta Pixel: {result.metaPixelFound ? 'Found' : 'Not Found'}
            </span>
          </div>
        </div>
      </div>

      {/* Ad Library Quick Links */}
      {(result.brandName || result.apexDomain) && (
        <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-4 border border-[#464646]">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2">Advertising Quick Research</h4>
            <p className="text-sm text-slate-400 mb-4">Click below to open the active ad sets for this domain in a new tab.</p>
            <div className="flex flex-wrap gap-3">
              <a 
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${result.brandName}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Meta Ads Library
              </a>
              <a 
                href={`https://adstransparency.google.com/?region=US&domain=${result.apexDomain}`}
                target="_blank"  
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-100 text-[#ea4335] font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1 border border-slate-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google Ads Library
              </a>
            </div>
          </div>
        </div>
      )}

      {/* HeyGen Video Generation Section */}
      <div className="glass-card rounded-2xl p-6 border border-[#464646]">
        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Video
        </h4>
        
        {!videoUrl ? (
          <div className="space-y-4">
            <p className="text-slate-300">Generate a personalized video from Joel</p>
            <button
              onClick={generateHeyGenVideo}
              disabled={isGeneratingVideo}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {isGeneratingVideo ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {videoStatus}
                </>
              ) : (
                'Generate Video'
              )}
            </button>
            {videoError && <p className="text-red-400 text-sm mt-2 font-medium">{videoError}</p>}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-black border border-[#464646]">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center w-full max-w-md bg-[#222222] border border-[#464646] rounded-lg overflow-hidden shrink-[2]">
                <input 
                  type="text" 
                  readOnly 
                  value={videoUrl} 
                  className="bg-transparent text-slate-300 text-sm px-4 py-3 flex-1 outline-none w-full"
                />
                <button 
                  onClick={copyShareLink}
                  className="bg-[#333333] hover:bg-[#464646] text-[#f5ed38] px-4 py-3 border-l border-[#464646] transition-colors flex items-center justify-center min-w-[120px] text-sm font-medium"
                >
                  {isLinkCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <a 
                href={videoUrl} 
                download="heygen_outreach.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#f5ed38] hover:bg-[#dc9f0f] text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download MP4
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Script section */}
      <div className="glass-card rounded-2xl p-8 shadow-xl border border-[#464646]">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#464646]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-[#f5ed38]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            Audit Script
          </h2>
          <button 
            onClick={copyScript}
            className="text-sm bg-[#333333] hover:bg-[#464646] text-[#f5ed38] py-2 px-4 rounded-lg flex items-center gap-2 transition-colors border border-[#464646]"
          >
            {isCopied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            )}
            {isCopied ? "Copied!" : "Copy Script"}
          </button>
        </div>
        
        <div className="prose prose-invert prose-blue max-w-none">
          {/* We use a simple pre-wrap to respect the LLMs formatting, or map through lines */}
          <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
            {result.script}
          </div>
        </div>
      </div>

    </div>
  );
}
