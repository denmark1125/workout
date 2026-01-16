import React, { useState, useEffect } from 'react';
import { RewardItem, RewardIcon } from '../utils/rewardAssets';
import { Zap, ShieldCheck, Terminal, ArrowRight, Loader2 } from 'lucide-react';

interface DailyRewardModalProps {
  reward: RewardItem;
  streak: number;
  onClaim: () => void;
  briefing?: string | null;
  isLoadingBriefing?: boolean;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ reward, streak, onClaim, briefing, isLoadingBriefing }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white border-t-8 border-black p-6 md:p-10 my-auto space-y-6 md:space-y-8 relative shadow-[0_0_100px_rgba(190,242,100,0.2)] animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-lime-600 uppercase tracking-[0.4em]">Consistency Reward Unlocked</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">每日紀律戰利品</h2>
          </div>
          <div className="bg-black text-[#bef264] px-3 py-1 text-[10px] font-black">
            連續進步: {streak}D
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6 md:py-8 bg-gray-50/50 border border-gray-100 relative overflow-hidden group">
          <div className={`transition-all duration-1000 transform ${revealed ? 'scale-110 md:scale-125 rotate-0 opacity-100' : 'scale-50 rotate-180 opacity-0'}`}>
            <RewardIcon reward={reward} size={revealed ? 100 : 60} />
          </div>
          <div className="text-center space-y-2 mt-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">獲得模組編號</p>
            <h3 className="text-xl md:text-2xl font-black tracking-widest text-black uppercase">{reward.name}</h3>
          </div>
        </div>

        <div className="bg-black p-5 md:p-6 space-y-4">
           <div className="flex items-center gap-3 text-[#bef264]">
              <Terminal size={14} />
              <p className="text-[11px] font-black uppercase tracking-widest">David 教練指令:</p>
           </div>
           
           {isLoadingBriefing ? (
             <div className="flex items-center gap-2 text-white/50 text-xs py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Downloading Tactical Briefing...</span>
             </div>
           ) : (
             <p className="text-white text-sm font-bold italic leading-relaxed animate-in fade-in">
               {briefing ? (
                 briefing.startsWith('「') ? briefing : `「${briefing}」`
               ) : (
                 `「偵測到你已連續 ${streak} 天維持訓練紀律。這不只是數據的紀錄，更是你意志力的具現化。這是你應得的戰利品，封存它，讓它成為你訓練矩陣的基石。現在，準備開練。」`
               )}
             </p>
           )}
        </div>

        <button 
          onClick={onClaim}
          className="w-full bg-[#bef264] text-black py-4 md:py-5 font-black text-xs tracking-[0.5em] uppercase hover:bg-black hover:text-white transition-all shadow-xl flex items-center justify-center gap-4 sticky bottom-0"
        >
          封存戰利品並啟動系統 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DailyRewardModal;