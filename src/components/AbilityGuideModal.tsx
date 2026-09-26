import React from 'react';
import { X, Flame, Zap, Sword, Wind, Sparkles } from 'lucide-react';
import { ABILITY_INFO } from '../game/constants';

interface AbilityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbilityGuideModal: React.FC<AbilityGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181328] border border-[#3e3158] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2442] mb-6">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-xl font-retro">★</span>
            <h2 className="text-lg font-bold font-retro text-pink-400">
              星之卡比 複製能力指南
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#28203c] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Abilities List */}
        <div className="space-y-6">
          {/* FIRE */}
          <div className="p-4 rounded-xl bg-[#231a38] border border-orange-500/30 flex flex-col md:flex-row gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/40">
              <Flame className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-orange-400 text-base">{ABILITY_INFO.FIRE.name}</h3>
                <span className="text-xs text-orange-300/80">獲得途徑：{ABILITY_INFO.FIRE.origin}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {ABILITY_INFO.FIRE.description}
              </p>
              <div className="mt-2 text-[11px] text-orange-300/70">
                操作：長按 <kbd className="px-1 py-0.5 bg-[#141021] rounded text-white font-mono">X 鍵</kbd> 或 B 按鈕發射連綿火焰
              </div>
            </div>
          </div>

          {/* SPARK */}
          <div className="p-4 rounded-xl bg-[#231a38] border border-cyan-500/30 flex flex-col md:flex-row gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-cyan-400 text-base">{ABILITY_INFO.SPARK.name}</h3>
                <span className="text-xs text-cyan-300/80">獲得途徑：{ABILITY_INFO.SPARK.origin}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {ABILITY_INFO.SPARK.description}
              </p>
              <div className="mt-2 text-[11px] text-cyan-300/70">
                操作：按住 <kbd className="px-1 py-0.5 bg-[#141021] rounded text-white font-mono">X 鍵</kbd> 召喚全方位 360 度電磁防護環
              </div>
            </div>
          </div>

          {/* SWORD */}
          <div className="p-4 rounded-xl bg-[#231a38] border border-emerald-500/30 flex flex-col md:flex-row gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Sword className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-400 text-base">{ABILITY_INFO.SWORD.name}</h3>
                <span className="text-xs text-emerald-300/80">獲得途徑：{ABILITY_INFO.SWORD.origin}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {ABILITY_INFO.SWORD.description}
              </p>
              <div className="mt-2 text-[11px] text-emerald-300/70">
                操作：按 <kbd className="px-1 py-0.5 bg-[#141021] rounded text-white font-mono">X 鍵</kbd> 斬擊；在空中或滿血時按 X 釋放飛射劍氣波！
              </div>
            </div>
          </div>

          {/* Core Kirby Mechanics */}
          <div className="border-t border-[#2d2442] pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#1e1730] rounded-lg">
              <h4 className="text-xs font-semibold text-pink-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                星型彈 (Star Spit)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                將敵人吸入口中後不按吞嚥，直接再次按 X，可吐出貫穿整條路線的金色大星！
              </p>
            </div>

            <div className="p-3 bg-[#1e1730] rounded-lg">
              <h4 className="text-xs font-semibold text-sky-300 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" />
                空氣彈 (Air Puff)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                在空中按 Z 或 ↑ 鼓氣漂浮飛行，飛行中按 X 鍵噴出空氣彈擊退敵人並平穩降落。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#2d2442] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            返回遊戲
          </button>
        </div>
      </div>
    </div>
  );
};
