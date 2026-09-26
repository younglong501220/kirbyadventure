/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { CopyAbility } from './types/game';
import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';
import { VirtualGamepad } from './components/VirtualGamepad';
import { ControlsGuide } from './components/ControlsGuide';
import { AbilityGuideModal } from './components/AbilityGuideModal';
import { StageSelectModal } from './components/StageSelectModal';
import { sound } from './audio/soundEngine';
import { ABILITY_INFO } from './game/constants';
import { Sparkles, Trophy, Flame, Zap, Sword, Heart } from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI state
  const [hp, setHp] = useState(6);
  const [maxHp, setMaxHp] = useState(6);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [ability, setAbility] = useState<CopyAbility | null>(null);
  const [currentStageId, setCurrentStageId] = useState(1);

  // Settings
  const [sfxMuted, setSfxMuted] = useState(false);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Modals / Tabs
  const [currentTab, setCurrentTab] = useState<'game' | 'guide' | 'stages'>('game');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);

  const handleTabChange = (tab: 'game' | 'guide' | 'stages') => {
    setCurrentTab(tab);
    if (tab === 'guide') {
      setIsGuideOpen(true);
    } else if (tab === 'stages') {
      setIsStageSelectOpen(true);
    }
  };

  const handleToggleSfx = () => {
    const nextState = !sfxMuted;
    setSfxMuted(nextState);
    sound.setSfxMuted(nextState);
  };

  const handleToggleBgm = () => {
    const nextState = !bgmMuted;
    setBgmMuted(nextState);
    sound.setBgmMuted(nextState);
  };

  const handleToggleCrt = () => {
    setCrtEnabled(!crtEnabled);
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetGame();
      setHp(6);
      setMaxHp(6);
      setLives(3);
      setScore(0);
      setStars(0);
      setAbility(null);
    }
  };

  const handleSelectStage = (stageIndex: number) => {
    if (engineRef.current) {
      engineRef.current.loadStage(stageIndex);
      setCurrentStageId(stageIndex + 1);
    }
  };

  // Dispatch virtual key press directly to game engine
  const handleVirtualKeyDown = (code: string) => {
    if (engineRef.current) {
      engineRef.current.setKey(code, true);
    }
  };

  const handleVirtualKeyUp = (code: string) => {
    if (engineRef.current) {
      engineRef.current.setKey(code, false);
    }
  };

  const currentAbilityData = ability ? ABILITY_INFO[ability] : null;

  return (
    <div className="min-h-screen bg-[#0d0a17] text-slate-100 flex flex-col items-center">
      {/* 3-Zone Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        sfxMuted={sfxMuted}
        onToggleSfx={handleToggleSfx}
        bgmMuted={bgmMuted}
        onToggleBgm={handleToggleBgm}
        crtEnabled={crtEnabled}
        onToggleCrt={handleToggleCrt}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto px-4 py-4 flex flex-col items-center flex-1">
        {/* Game Title & Stage Meta Bar */}
        <div className="w-full max-w-3xl flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
          <div className="flex items-center gap-2">
            <span className="text-pink-400 font-semibold">STAGE 0{currentStageId}</span>
            <span aria-hidden="true">·</span>
            <span>{currentStageId === 1 ? 'Vegetable Valley 綠意之谷' : 'Fountain of Dreams 夢之泉神殿'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold font-mono">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex items-center gap-1 text-pink-400 font-semibold font-mono">
              <Heart className="w-3.5 h-3.5 fill-pink-500" />
              <span>x{lives}</span>
            </div>
          </div>
        </div>

        {/* Arcade Screen Canvas */}
        <GameCanvas
          crtEnabled={crtEnabled}
          onHpChange={(newHp, newMaxHp) => {
            setHp(newHp);
            setMaxHp(newMaxHp);
          }}
          onLivesChange={(newLives) => setLives(newLives)}
          onScoreChange={(newScore) => setScore(newScore)}
          onStarsChange={(newStars) => setStars(newStars)}
          onAbilityChange={(newAbility) => setAbility(newAbility)}
          onStageChange={(newStageId) => setCurrentStageId(newStageId)}
          engineRef={engineRef}
        />

        {/* Current Ability Banner Card */}
        <div className="w-full max-w-3xl mt-3 p-3 bg-[#181226] border border-[#2b2140] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                ability === 'FIRE'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : ability === 'SPARK'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : ability === 'SWORD'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[#251d38] text-pink-300 border-[#382b54]'
              }`}
            >
              {ability === 'FIRE' ? (
                <Flame className="w-5 h-5" />
              ) : ability === 'SPARK' ? (
                <Zap className="w-5 h-5" />
              ) : ability === 'SWORD' ? (
                <Sword className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">
                  {currentAbilityData ? currentAbilityData.name : '普通型態 (NORMAL)'}
                </span>
                {currentAbilityData && (
                  <span className="text-[11px] text-slate-400">
                    {currentAbilityData.origin}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentAbilityData
                  ? currentAbilityData.description
                  : '按住攻擊鍵可真空吸入敵人；含住敵人時按「下」吞嚥，或按攻擊噴出星型彈！'}
              </p>
            </div>
          </div>

          {ability && (
            <button
              onClick={() => engineRef.current?.dropAbility()}
              className="px-3 py-1.5 bg-[#2b1f3b] hover:bg-[#3d2a54] text-pink-300 border border-pink-500/30 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              丟棄 (C 鍵)
            </button>
          )}
        </div>

        {/* Virtual Gamepad for Touch & Quick Mouse Play */}
        <VirtualGamepad
          onKeyDown={handleVirtualKeyDown}
          onKeyUp={handleVirtualKeyUp}
          hasAbility={Boolean(ability)}
          isMouthful={engineRef.current?.kirby?.state === 'mouthful'}
          isFloating={engineRef.current?.kirby?.state === 'floating'}
        />

        {/* Controls Guide */}
        <ControlsGuide />
      </main>

      {/* Ability Guide Modal */}
      <AbilityGuideModal
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          setCurrentTab('game');
        }}
      />

      {/* Stage Select Modal */}
      <StageSelectModal
        isOpen={isStageSelectOpen}
        onClose={() => {
          setIsStageSelectOpen(false);
          setCurrentTab('game');
        }}
        currentStageId={currentStageId}
        onSelectStage={handleSelectStage}
      />
    </div>
  );
}
