import React from 'react';
import { Volume2, VolumeX, Music, Monitor, RotateCcw, BookOpen, Layers } from 'lucide-react';

interface TopBarProps {
  currentTab: 'game' | 'guide' | 'stages';
  onTabChange: (tab: 'game' | 'guide' | 'stages') => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
  bgmMuted: boolean;
  onToggleBgm: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onReset: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  sfxMuted,
  onToggleSfx,
  bgmMuted,
  onToggleBgm,
  crtEnabled,
  onToggleCrt,
  onReset
}) => {
  return (
    <header className="w-full bg-[#161224] border-b border-[#2e2645] px-4 md:px-8 py-3 flex items-center justify-between z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <span className="text-pink-400 font-bold tracking-tight text-lg md:text-xl font-retro flex items-center gap-2">
          <span className="text-yellow-400">★</span>
          星之卡比：夢之泉物語
        </span>
      </div>

      {/* Zone 2: 3-4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('game')}
          className={`cursor-pointer transition-colors pb-1 border-b-2 ${
            currentTab === 'game'
              ? 'text-pink-400 border-pink-400 font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          遊戲冒險
        </button>
        <button
          onClick={() => onTabChange('guide')}
          className={`cursor-pointer transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
            currentTab === 'guide'
              ? 'text-pink-400 border-pink-400 font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          複製能力指南
        </button>
        <button
          onClick={() => onTabChange('stages')}
          className={`cursor-pointer transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
            currentTab === 'stages'
              ? 'text-pink-400 border-pink-400 font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          關卡切換
        </button>
      </nav>

      {/* Zone 3: 1-2 primary functional actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSfx}
          title={sfxMuted ? '開啟音效' : '靜音音效'}
          className={`p-2 rounded-lg transition-colors border ${
            !sfxMuted
              ? 'bg-[#241c38] text-pink-300 border-pink-500/40 hover:bg-[#30254b]'
              : 'bg-[#1a1728] text-slate-500 border-slate-700 hover:text-slate-300'
          }`}
        >
          {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleBgm}
          title={bgmMuted ? '開啟 8-bit 背景音樂' : '關閉背景音樂'}
          className={`p-2 rounded-lg transition-colors border ${
            !bgmMuted
              ? 'bg-[#241c38] text-yellow-300 border-yellow-500/40 hover:bg-[#30254b]'
              : 'bg-[#1a1728] text-slate-500 border-slate-700 hover:text-slate-300'
          }`}
        >
          <Music className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleCrt}
          title={crtEnabled ? '關閉 CRT 復古濾鏡' : '開啟 CRT 復古濾鏡'}
          className={`p-2 rounded-lg transition-colors border ${
            crtEnabled
              ? 'bg-[#241c38] text-cyan-300 border-cyan-500/40 hover:bg-[#30254b]'
              : 'bg-[#1a1728] text-slate-500 border-slate-700 hover:text-slate-300'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          title="重新開始遊戲"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-lg transition-colors shadow-sm ml-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">重置</span>
        </button>
      </div>
    </header>
  );
};
