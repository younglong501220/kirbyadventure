import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Sparkles, Wind, Zap } from 'lucide-react';

interface VirtualGamepadProps {
  onKeyDown: (code: string) => void;
  onKeyUp: (code: string) => void;
  hasAbility: boolean;
  isMouthful: boolean;
  isFloating: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onKeyDown,
  onKeyUp,
  hasAbility,
  isMouthful,
  isFloating
}) => {
  const handleTouchStart = (code: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onKeyDown(code);
  };

  const handleTouchEnd = (code: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onKeyUp(code);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 select-none flex flex-wrap items-center justify-between gap-4 bg-[#141021]/80 backdrop-blur border border-[#2b223d] rounded-2xl shadow-xl mt-3">
      {/* Left: Classic D-Pad */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Cross background */}
        <div className="absolute w-12 h-36 bg-[#211a33] rounded-xl border border-[#3c305a]" />
        <div className="absolute w-36 h-12 bg-[#211a33] rounded-xl border border-[#3c305a]" />

        {/* Up */}
        <button
          className="absolute top-1 w-11 h-11 bg-[#2c2245] active:bg-pink-600 rounded-lg flex flex-col items-center justify-center text-slate-200 shadow z-10 transition-colors"
          onTouchStart={(e) => handleTouchStart('ArrowUp', e)}
          onTouchEnd={(e) => handleTouchEnd('ArrowUp', e)}
          onMouseDown={(e) => handleTouchStart('ArrowUp', e)}
          onMouseUp={(e) => handleTouchEnd('ArrowUp', e)}
          title="鼓氣浮空"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Down */}
        <button
          className={`absolute bottom-1 w-11 h-11 rounded-lg flex flex-col items-center justify-center shadow z-10 transition-colors ${
            isMouthful
              ? 'bg-yellow-500 text-slate-900 font-bold animate-pulse'
              : 'bg-[#2c2245] active:bg-pink-600 text-slate-200'
          }`}
          onTouchStart={(e) => handleTouchStart('ArrowDown', e)}
          onTouchEnd={(e) => handleTouchEnd('ArrowDown', e)}
          onMouseDown={(e) => handleTouchStart('ArrowDown', e)}
          onMouseUp={(e) => handleTouchEnd('ArrowDown', e)}
          title={isMouthful ? '吞嚥複製能力！' : '蹲下 / 吞嚥'}
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[8px] font-bold leading-none">{isMouthful ? '吞嚥' : '蹲下'}</span>
        </button>

        {/* Left */}
        <button
          className="absolute left-1 w-11 h-11 bg-[#2c2245] active:bg-pink-600 rounded-lg flex items-center justify-center text-slate-200 shadow z-10 transition-colors"
          onTouchStart={(e) => handleTouchStart('ArrowLeft', e)}
          onTouchEnd={(e) => handleTouchEnd('ArrowLeft', e)}
          onMouseDown={(e) => handleTouchStart('ArrowLeft', e)}
          onMouseUp={(e) => handleTouchEnd('ArrowLeft', e)}
          title="向左移動"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right */}
        <button
          className="absolute right-1 w-11 h-11 bg-[#2c2245] active:bg-pink-600 rounded-lg flex items-center justify-center text-slate-200 shadow z-10 transition-colors"
          onTouchStart={(e) => handleTouchStart('ArrowRight', e)}
          onTouchEnd={(e) => handleTouchEnd('ArrowRight', e)}
          onMouseDown={(e) => handleTouchStart('ArrowRight', e)}
          onMouseUp={(e) => handleTouchEnd('ArrowRight', e)}
          title="向右移動"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Center hub */}
        <div className="w-6 h-6 rounded-full bg-[#1b152b] z-20 pointer-events-none" />
      </div>

      {/* Middle: Shortcut Assist Buttons */}
      <div className="flex flex-row md:flex-col items-center justify-center gap-2">
        <button
          className="px-3 py-2 bg-[#261f3b] hover:bg-[#342a52] active:bg-amber-600 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition-colors"
          onTouchStart={(e) => {
            e.preventDefault();
            onKeyDown('ArrowDown');
            onKeyDown('KeyZ');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onKeyUp('ArrowDown');
            onKeyUp('KeyZ');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onKeyDown('ArrowDown');
            onKeyDown('KeyZ');
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            onKeyUp('ArrowDown');
            onKeyUp('KeyZ');
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          滑踢 (Slide)
        </button>

        {hasAbility && (
          <button
            className="px-3 py-2 bg-[#3b1f28] hover:bg-[#522a36] active:bg-red-600 text-pink-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-pink-500/40 transition-colors"
            onTouchStart={(e) => handleTouchStart('KeyC', e)}
            onTouchEnd={(e) => handleTouchEnd('KeyC', e)}
            onMouseDown={(e) => handleTouchStart('KeyC', e)}
            onMouseUp={(e) => handleTouchEnd('KeyC', e)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            丟棄能力 (Drop)
          </button>
        )}
      </div>

      {/* Right: Action Buttons A & B */}
      <div className="flex items-center gap-4">
        {/* Button B: Attack / Inhale / Spit */}
        <div className="flex flex-col items-center gap-1">
          <button
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-transform active:scale-95 border-2 ${
              isMouthful
                ? 'bg-yellow-500 border-yellow-300 hover:bg-yellow-400'
                : isFloating
                ? 'bg-sky-500 border-sky-300 hover:bg-sky-400'
                : hasAbility
                ? 'bg-red-600 border-red-400 hover:bg-red-500'
                : 'bg-rose-600 border-rose-400 hover:bg-rose-500'
            }`}
            onTouchStart={(e) => handleTouchStart('KeyX', e)}
            onTouchEnd={(e) => handleTouchEnd('KeyX', e)}
            onMouseDown={(e) => handleTouchStart('KeyX', e)}
            onMouseUp={(e) => handleTouchEnd('KeyX', e)}
          >
            <span className="text-lg leading-none">B</span>
            <span className="text-[9px] font-normal leading-tight">
              {isMouthful ? '吐星' : isFloating ? '吐氣' : hasAbility ? '攻擊' : '吸入'}
            </span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">X 鍵</span>
        </div>

        {/* Button A: Jump / Hover */}
        <div className="flex flex-col items-center gap-1">
          <button
            className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 active:scale-95 flex flex-col items-center justify-center text-white font-bold shadow-lg transition-transform"
            onTouchStart={(e) => handleTouchStart('KeyZ', e)}
            onTouchEnd={(e) => handleTouchEnd('KeyZ', e)}
            onMouseDown={(e) => handleTouchStart('KeyZ', e)}
            onMouseUp={(e) => handleTouchEnd('KeyZ', e)}
          >
            <span className="text-lg leading-none">A</span>
            <span className="text-[9px] font-normal leading-tight flex items-center gap-0.5">
              <Wind className="w-2.5 h-2.5" />
              {isFloating ? '鼓氣' : '跳躍'}
            </span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">Z 鍵</span>
        </div>
      </div>
    </div>
  );
};
