import React, { useState } from 'react';
import { Sparkles, Terminal, FileCode, Play, Radio, Flame, MessageSquare, Video, ShieldAlert } from 'lucide-react';
import PlinkoGame from './components/PlinkoGame';
import SidebarControls from './components/SidebarControls';
import PythonScriptExporter from './components/PythonScriptExporter';
import { MemePreset, HighlightClip } from './types';

export default function App() {
  // Main settings states
  const [rows, setRows] = useState(8);
  const [gravity, setGravity] = useState(0.24);
  const [friction, setFriction] = useState(0.994);
  const [bounceDamping, setBounceDamping] = useState(0.55);
  
  // Captions overlay
  const [title, setTitle] = useState('PEPE PLINKO CHALLENGE 🐸');
  const [subtitle, setSubtitle] = useState('COULD WE HIT THE 100x JACKPOT?! 💀');

  // Meme presets and uploaded custom media assets
  const [ballPreset, setBallPreset] = useState<MemePreset>({
    id: 'pepe',
    name: 'Pepe',
    imgUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&q=80&w=256',
    defaultTitle: 'PEPE MEME PLINKO 🐸',
    defaultSubtitle: 'COULD WE HIT THE 100x JACKPOT?! 💀',
    defaultColor: '#22c55e',
    reactionStyle: 'hype',
  });
  const [customBallImage, setCustomBallImage] = useState<string | null>(null);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const [bounceSoundFile, setBounceSoundFile] = useState<File | null>(null);
  const [custom100xSfxFile, setCustom100xSfxFile] = useState<File | null>(null);
  const [custom0xSfxFile, setCustom0xSfxFile] = useState<File | null>(null);
  const [neonThemeColor, setNeonThemeColor] = useState('#22c55e');

  // Sliced clips log
  const [clipsList, setClipsList] = useState<HighlightClip[]>([]);

  const handleHighlightClipped = (newClip: HighlightClip) => {
    setClipsList((prev) => [newClip, ...prev]);
  };

  const handleClearClips = () => {
    setClipsList([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Sleek Viral Studio Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-cyan-950/40">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">Plinko YouTube Shorts Studio</h1>
              <p className="text-xs text-slate-400">Generate high-adrenaline viral short-form clips with custom physics, sound triggers & AI subtitles</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Viral Mode Ready</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Primary Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Layout settings & uploaded materials (5 Columns) */}
        <section className="lg:col-span-5 h-[620px] lg:h-auto flex flex-col">
          <SidebarControls
            rows={rows}
            setRows={setRows}
            gravity={gravity}
            setGravity={setGravity}
            friction={friction}
            setFriction={setFriction}
            bounceDamping={bounceDamping}
            setBounceDamping={setBounceDamping}
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            ballPreset={ballPreset}
            setBallPreset={setBallPreset}
            customBallImage={customBallImage}
            setCustomBallImage={setCustomBallImage}
            customBgImage={customBgImage}
            setCustomBgImage={setCustomBgImage}
            bgMusicFile={bgMusicFile}
            setBgMusicFile={setBgMusicFile}
            bounceSoundFile={bounceSoundFile}
            setBounceSoundFile={setBounceSoundFile}
            custom100xSfxFile={custom100xSfxFile}
            setCustom100xSfxFile={setCustom100xSfxFile}
            custom0xSfxFile={custom0xSfxFile}
            setCustom0xSfxFile={setCustom0xSfxFile}
            neonThemeColor={neonThemeColor}
            setNeonThemeColor={setNeonThemeColor}
            clipsList={clipsList}
            onClearClips={handleClearClips}
          />
        </section>

        {/* Right Side: Portrait Shorts Preview Stage & Canvas Engine (7 Columns) */}
        <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-200">Interactive Shorts Port Preview</h3>
              <p className="text-xs text-slate-400">Recorded streams will be exported as 9:16 vertical short files</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Video className="h-4 w-4 text-slate-500" />
              <span>Canvas Direct Stream</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <PlinkoGame
              rows={rows}
              gravity={gravity}
              friction={friction}
              bounceDamping={bounceDamping}
              title={title}
              subtitle={subtitle}
              ballPreset={ballPreset}
              customBallImage={customBallImage}
              customBgImage={customBgImage}
              bgMusicFile={bgMusicFile}
              bounceSoundFile={bounceSoundFile}
              custom100xSfxFile={custom100xSfxFile}
              custom0xSfxFile={custom0xSfxFile}
              neonThemeColor={neonThemeColor}
              onHighlightClipped={handleHighlightClipped}
              clipsList={clipsList}
            />
          </div>

          {/* Quick instructions bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-500">
            <ShieldAlert className="h-4 w-4 text-cyan-500/60 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              *Microphone recording: If you want to add voiceover commentaries, configure your system microphone input before clicking the **Record** button. Audio tracks are mixed automatically into the download payload.
            </p>
          </div>
        </section>
      </main>

      {/* 3. CLI Script Downloader Section */}
      <section className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-12 mt-6">
        <div className="border-t border-slate-900 pt-8">
          <div className="mb-4">
            <h3 className="text-md font-bold text-slate-200 flex items-center space-x-2">
              <FileCode className="h-5 w-5 text-cyan-400" />
              <span>Offline Python Script Exporter</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Want to run video compiling locally or set up automated batch renderers? Download your script here.</p>
          </div>
          <PythonScriptExporter />
        </div>
      </section>
    </div>
  );
}
