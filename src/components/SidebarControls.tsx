import React, { useRef, useState } from 'react';
import { 
  Sliders, Image as ImageIcon, Volume2, Sparkles, Upload, 
  Trash2, Play, Trophy, HelpCircle, ArrowRight, Video, Download,
  Music, Radio, RefreshCw, Layers, Zap, ShieldAlert
} from 'lucide-react';
import { MemePreset, HighlightClip, SoundPreset } from '../types';

interface SidebarControlsProps {
  rows: number;
  setRows: (r: number) => void;
  gravity: number;
  setGravity: (g: number) => void;
  friction: number;
  setFriction: (f: number) => void;
  bounceDamping: number;
  setBounceDamping: (b: number) => void;
  title: string;
  setTitle: (t: string) => void;
  subtitle: string;
  setSubtitle: (s: string) => void;
  ballPreset: MemePreset;
  setBallPreset: (p: MemePreset) => void;
  customBallImage: string | null;
  setCustomBallImage: (img: string | null) => void;
  bgMusicFile: File | null;
  setBgMusicFile: (f: File | null) => void;
  bounceSoundFile: File | null;
  setBounceSoundFile: (f: File | null) => void;
  custom100xSfxFile: File | null;
  setCustom100xSfxFile: (f: File | null) => void;
  custom0xSfxFile: File | null;
  setCustom0xSfxFile: (f: File | null) => void;
  neonThemeColor: string;
  setNeonThemeColor: (color: string) => void;
  customBgImage: string | null;
  setCustomBgImage: (img: string | null) => void;
  clipsList: HighlightClip[];
  onClearClips: () => void;
}

// Pre-configured funny viral meme presets
const BALL_PRESETS: MemePreset[] = [
  {
    id: 'pepe',
    name: 'Pepe',
    imgUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&q=80&w=256', // Geometric abstract placeholder, we will generate or use funny color mask fallback inside canvas
    defaultTitle: 'PEPE MEME PLINKO 🐸',
    defaultSubtitle: 'COULD WE HIT THE 100x JACKPOT?! 💀',
    defaultColor: '#22c55e', // Green
    reactionStyle: 'hype',
  },
  {
    id: 'doge',
    name: 'Doge',
    imgUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=256', // Dog placeholder
    defaultTitle: 'DOGE RICH CHALLENGE 🐕',
    defaultSubtitle: 'SUBSCRIBE FOR SHIBA LUCK! 🍀',
    defaultColor: '#eab308', // Yellow
    reactionStyle: 'hype',
  },
  {
    id: 'gigachad',
    name: 'GigaChad',
    imgUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256', // Portrait placeholder
    defaultTitle: 'GIGACHAD PLINKO CHILL 🗿',
    defaultSubtitle: 'IF THIS HITS 100x YOU ARE CRACKED',
    defaultColor: '#06b6d4', // Cyan
    reactionStyle: 'hype',
  },
  {
    id: 'stonks',
    name: 'Stonks',
    imgUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=256', // Finance/Graph
    defaultTitle: 'STONKS INVESTMENT SIM 📈',
    defaultSubtitle: 'PEPE VS MY ENTIRE SAVINGS! 💀',
    defaultColor: '#ec4899', // Pink
    reactionStyle: 'stonks',
  },
];

export default function SidebarControls({
  rows, setRows,
  gravity, setGravity,
  friction, setFriction,
  bounceDamping, setBounceDamping,
  title, setTitle,
  subtitle, setSubtitle,
  ballPreset, setBallPreset,
  customBallImage, setCustomBallImage,
  bgMusicFile, setBgMusicFile,
  bounceSoundFile, setBounceSoundFile,
  custom100xSfxFile, setCustom100xSfxFile,
  custom0xSfxFile, setCustom0xSfxFile,
  neonThemeColor, setNeonThemeColor,
  customBgImage, setCustomBgImage,
  clipsList, onClearClips
}: SidebarControlsProps) {
  const ballInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const sfxInputRef = useRef<HTMLInputElement | null>(null);
  const jackpotSfxInputRef = useRef<HTMLInputElement | null>(null);
  const loseSfxInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'assets'>('board');

  // Handle image upload and convert to base64 to texture-map canvas
  const handleBallImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCustomBallImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle background image upload and convert to base64
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCustomBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: MemePreset) => {
    setBallPreset(preset);
    setTitle(preset.defaultTitle);
    setSubtitle(preset.defaultSubtitle);
    setNeonThemeColor(preset.defaultColor);
    setCustomBallImage(null); // Clear custom upload when picking preset
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Configuration Tabs Header */}
      <div className="flex border-b border-slate-800 pb-3 mb-5 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'board' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Physics</span>
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'assets' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Ball & Media</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-200">
        {/* PHYSICS CONFIG TAB */}
        {activeTab === 'board' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Plinko Board Matrix</h4>
            
            {/* Rows / Peg Density */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Peg Rows (Density)</span>
                </span>
                <span className="text-cyan-400 font-mono text-sm">{rows} Rows</span>
              </div>
              <input
                type="range"
                min="5"
                max="12"
                step="1"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 (Easy/Fast)</span>
                <span>12 (Intense Grid)</span>
              </div>
            </div>

            {/* Gravity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Gravity strength</span>
                <span className="text-cyan-400 font-mono text-sm">{gravity}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.02"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Friction */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Air Resistance</span>
                <span className="text-cyan-400 font-mono text-sm">{(1 - friction).toFixed(4)}</span>
              </div>
              <input
                type="range"
                min="0.985"
                max="1.0"
                step="0.001"
                value={friction}
                onChange={(e) => setFriction(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Elasticity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Elasticity (Bounce)</span>
                <span className="text-cyan-400 font-mono text-sm">{bounceDamping}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.8"
                step="0.02"
                value={bounceDamping}
                onChange={(e) => setBounceDamping(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Neon Glow Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Neon Visual Accent Theme</label>
              <div className="flex items-center space-x-2">
                {['#22c55e', '#ef4444', '#06b6d4', '#eab308', '#a855f7', '#ec4899'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setNeonThemeColor(col)}
                    className="h-7 w-7 rounded-full border-2 transition-transform transform active:scale-95"
                    style={{ 
                      backgroundColor: col, 
                      borderColor: neonThemeColor === col ? '#ffffff' : 'transparent',
                      boxShadow: neonThemeColor === col ? `0 0 10px ${col}` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BALLS AND AUDIO ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Meme Character selector */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Viral Ball Characters</h4>
              <div className="grid grid-cols-2 gap-2">
                {BALL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all ${
                      ballPreset.id === preset.id && !customBallImage
                        ? 'bg-cyan-500/10 border-cyan-500 text-slate-100'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div 
                      className="h-8 w-8 rounded-full bg-cover bg-center border-2" 
                      style={{ 
                        backgroundImage: `url(${preset.imgUrl})`,
                        borderColor: ballPreset.id === preset.id ? preset.defaultColor : '#334155' 
                      }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{preset.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{preset.reactionStyle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom ball image upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Custom Ball Photo (Texture)</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => ballInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border-2 border-dashed text-xs transition-all ${
                    customBallImage 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>{customBallImage ? 'Photo uploaded' : 'Upload custom photo'}</span>
                </button>
                {customBallImage && (
                  <button
                    onClick={() => setCustomBallImage(null)}
                    className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    title="Remove custom photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={ballInputRef}
                type="file"
                accept="image/*"
                onChange={handleBallImageUpload}
                className="hidden"
              />
            </div>

            {/* Custom Background Image upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Custom Board Background Photo</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border-2 border-dashed text-xs transition-all ${
                    customBgImage 
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>{customBgImage ? 'Background uploaded' : 'Upload background photo'}</span>
                </button>
                {customBgImage && (
                  <button
                    onClick={() => setCustomBgImage(null)}
                    className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    title="Remove custom background"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgImageUpload}
                className="hidden"
              />
            </div>

            {/* Music & Sound Effects uploads */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Media Soundtrack Setup</h4>
              
              {/* Background Music file upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Music className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Background Music (TikTok/Shorts Track)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-800 text-xs transition-all ${
                      bgMusicFile 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{bgMusicFile ? bgMusicFile.name : 'Upload background MP3/WAV'}</span>
                  </button>
                  {bgMusicFile && (
                    <button
                      onClick={() => setBgMusicFile(null)}
                      className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={musicInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBgMusicFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Peg Bounce SFX upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Radio className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Peg Bounce Custom SFX (Replaces Synth)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => sfxInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-800 text-xs transition-all ${
                      bounceSoundFile 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{bounceSoundFile ? bounceSoundFile.name : 'Upload bounce wave file'}</span>
                  </button>
                  {bounceSoundFile && (
                    <button
                      onClick={() => setBounceSoundFile(null)}
                      className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={sfxInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBounceSoundFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* 100x Multiplier Jackpot SFX upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>100x Jackpot Custom SFX</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => jackpotSfxInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-800 text-xs transition-all ${
                      custom100xSfxFile 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{custom100xSfxFile ? custom100xSfxFile.name : 'Upload 100x Jackpot MP3/WAV'}</span>
                  </button>
                  {custom100xSfxFile && (
                    <button
                      onClick={() => setCustom100xSfxFile(null)}
                      className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={jackpotSfxInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCustom100xSfxFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* 0x Multiplier Lose SFX upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                  <span>0x Lose Custom SFX</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loseSfxInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border border-slate-800 text-xs transition-all ${
                      custom0xSfxFile 
                        ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{custom0xSfxFile ? custom0xSfxFile.name : 'Upload 0x Lose MP3/WAV'}</span>
                  </button>
                  {custom0xSfxFile && (
                    <button
                      onClick={() => setCustom0xSfxFile(null)}
                      className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl border border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={loseSfxInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCustom0xSfxFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
