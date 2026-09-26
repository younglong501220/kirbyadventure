import React from 'react';
import { Keyboard, Smartphone } from 'lucide-react';

export const ControlsGuide: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 px-4 py-3 bg-[#161224] border border-[#2b223d] rounded-xl text-slate-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Keyboard section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 mb-2">
            <Keyboard className="w-4 h-4" />
            <span>鍵盤操作指南 (Classic NES Layout)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                ← → / A D
              </kbd>
              <span className="text-slate-400">左右移動</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                ↓ / S
              </kbd>
              <span className="text-slate-400">蹲下 / 吞嚥敵人</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                Z / Space
              </kbd>
              <span className="text-slate-400">跳躍 / 鼓氣浮空</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                X 鍵
              </kbd>
              <span className="text-slate-400">吸入 / 吐星 / 能力攻擊</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                ↓ + Z
              </kbd>
              <span className="text-slate-400">滑踢 (Slide)</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[#251e3b] text-slate-200 border border-slate-700 rounded font-mono text-[10px]">
                C 鍵
              </kbd>
              <span className="text-slate-400">丟棄複製能力星</span>
            </div>
          </div>
        </div>

        {/* Mobile touch tip */}
        <div className="hidden lg:flex items-center gap-3 border-l border-[#2e2646] pl-6 text-xs text-slate-400 max-w-xs">
          <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
          <p>
            支援行動裝置觸控虛擬手把，或直接插入 USB/藍牙 遊戲手把遊玩！
          </p>
        </div>
      </div>
    </div>
  );
};
