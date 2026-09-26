import React from 'react';
import { X, Play, MapPin, Sparkles } from 'lucide-react';
import { STAGES } from '../game/constants';

interface StageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStageId: number;
  onSelectStage: (stageIndex: number) => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  isOpen,
  onClose,
  currentStageId,
  onSelectStage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181328] border border-[#3e3158] rounded-2xl max-w-xl w-full p-6 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2442] mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold font-retro text-pink-400">
              選擇冒險關卡
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#28203c] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {STAGES.map((stage, index) => {
            const isCurrent = stage.id === currentStageId;
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-[#2b1f42] border-pink-500/60 shadow-lg shadow-pink-500/10'
                    : 'bg-[#201833] border-[#362b4e] hover:border-pink-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pink-400">
                      STAGE 0{stage.id}
                    </span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs text-slate-400">{stage.subtitle}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-semibold">
                        當前關卡
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100 text-base mt-1">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-400/80" />
                    {stage.theme === 'plains'
                      ? '經典平原地形，豐富星之方塊與全複製能力怪物'
                      : '夜幕夢之泉殿堂，星夜極光與終極夢之泉大星'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectStage(index);
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-pink-600 hover:bg-pink-500 text-white shadow'
                      : 'bg-[#352952] hover:bg-[#483770] text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  {isCurrent ? '重啟本關' : '挑戰此關'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#2d2442] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2a2140] hover:bg-[#382c57] text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
