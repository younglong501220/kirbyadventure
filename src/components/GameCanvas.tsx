import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/engine';
import { CopyAbility } from '../types/game';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface GameCanvasProps {
  crtEnabled: boolean;
  onHpChange: (hp: number, maxHp: number) => void;
  onLivesChange: (lives: number) => void;
  onScoreChange: (score: number) => void;
  onStarsChange: (stars: number) => void;
  onAbilityChange: (ability: CopyAbility | null) => void;
  onStageChange: (stageId: number) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  crtEnabled,
  onHpChange,
  onLivesChange,
  onScoreChange,
  onStarsChange,
  onAbilityChange,
  onStageChange,
  engineRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [stageCleared, setStageCleared] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, {
      onHpChange,
      onLivesChange,
      onScoreChange,
      onStarsChange,
      onAbilityChange,
      onStageClear: (stageId) => {
        setStageCleared(true);
        onStageChange(stageId);
      },
      onGameOver: () => {
        setGameOver(true);
      }
    });

    engineRef.current = engine;
    engine.start();

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      engine.setKey(e.code, true);

      // Prevent window scrolling on arrow keys and space
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      // Quick advance on Space when stage cleared
      if (engine.isClear && e.code === 'Space') {
        engine.nextStage();
        setStageCleared(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.setKey(e.code, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Physical Gamepad API polling loop
    let gamepadAnimId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp && engineRef.current) {
        const eng = engineRef.current;
        // D-Pad or left analog stick
        eng.setKey('ArrowLeft', gp.axes[0] < -0.4 || gp.buttons[14]?.pressed);
        eng.setKey('ArrowRight', gp.axes[0] > 0.4 || gp.buttons[15]?.pressed);
        eng.setKey('ArrowUp', gp.axes[1] < -0.4 || gp.buttons[12]?.pressed);
        eng.setKey('ArrowDown', gp.axes[1] > 0.4 || gp.buttons[13]?.pressed);
        // A button (button 0) -> Jump (KeyZ)
        eng.setKey('KeyZ', gp.buttons[0]?.pressed);
        // B button (button 2 or 1) -> Attack (KeyX)
        eng.setKey('KeyX', gp.buttons[2]?.pressed || gp.buttons[1]?.pressed);
        // Y button or shoulder -> Drop (KeyC)
        eng.setKey('KeyC', gp.buttons[3]?.pressed || gp.buttons[4]?.pressed);
      }
      gamepadAnimId = requestAnimationFrame(pollGamepad);
    };
    gamepadAnimId = requestAnimationFrame(pollGamepad);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gamepadAnimId);
    };
  }, []);

  const togglePause = () => {
    if (!engineRef.current) return;
    const nextState = !isPaused;
    engineRef.current.paused = nextState;
    setIsPaused(nextState);
  };

  const handleNextStage = () => {
    if (!engineRef.current) return;
    engineRef.current.nextStage();
    setStageCleared(false);
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setStageCleared(false);
    setGameOver(false);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer arcade bezel */}
      <div
        className={`relative rounded-2xl overflow-hidden p-2 md:p-3 bg-gradient-to-b from-[#2a223e] to-[#130f1e] shadow-2xl border-4 border-[#f3a6b2]/50 ${
          crtEnabled ? 'crt-overlay' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          width={768}
          height={672}
          className="pixelated block bg-black rounded-lg max-w-full h-auto aspect-[256/224]"
        />

        {/* In-game Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center z-40">
            <h3 className="text-xl md:text-2xl font-bold font-retro text-yellow-400 mb-4 animate-pulse">
              PAUSE · 暫停中
            </h3>
            <button
              onClick={togglePause}
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4" />
              繼續冒險
            </button>
          </div>
        )}

        {/* Clear stage banner action */}
        {stageCleared && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center z-30">
            <button
              onClick={handleNextStage}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold rounded-xl shadow-2xl font-retro text-xs transition-transform hover:scale-105 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-900" />
              前往下一關 (STAGE 2)
            </button>
          </div>
        )}

        {/* Game over restart action */}
        {gameOver && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center z-30">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-2xl font-retro text-xs transition-transform hover:scale-105 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新開始遊戲
            </button>
          </div>
        )}
      </div>

      {/* Floating Canvas Controls (Pause toggle) */}
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
        <button
          onClick={togglePause}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#1e1830] hover:bg-[#2b2245] text-slate-300 rounded-lg border border-[#372b53] transition-colors"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? '繼續' : '暫停 (P)'}</span>
        </button>
      </div>
    </div>
  );
};
