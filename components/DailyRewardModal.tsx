
import React, { useState, useEffect } from 'react';
import { RewardItem, RewardIcon } from '../utils/rewardAssets';
import { Zap, ShieldCheck, Terminal, ArrowRight } from 'lucide-react';

interface DailyRewardModalProps {
  reward: RewardItem;
  streak: number;
  onClaim: () => void;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ reward, streak, onClaim }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white border-t-8 border-black p-10 space-y-8 relative shadow-[0_0_100px_rgba(190,242,100,0.2)] animate-in zoom-in duration-300">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-lime-600 uppercase tracking-[0.4em]">Uplink Sync Successful</p>
            <h2 className="text-3xl font-black tracking-tighter uppercase">每日資產補給</h2>
          </div>
          <div className="bg-black text-[#bef264] px-3 py-1 text-[10px] font-black">
            STREAK: {streak}D
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 space-y-6 bg-gray-50/50 border border-gray-100 relative overflow-hidden group">
          <div className={`transition-all duration-1000 transform ${revealed ? 'scale-125 rotate-0 opacity-100' : 'scale-50 rotate-180 opacity-0'}`}>
            <RewardIcon reward={reward} size={120} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">解鎖模組編號</p>
            <h3 className="text-2xl font-black tracking-widest text-black uppercase">{reward.name}</h3>
          </div>
        </div>

        <div className="bg-black p-6 space-y-4">
           <div className="flex items-center gap-3 text-[#bef264]">
              <Terminal size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">David教練指令:</p>
           </div>
           <p className="text-white text-sm font-bold italic leading-relaxed">
             「偵測到生物信號連續同步。這是你今日的進化補給，封存它，讓它成為你意志的一部分。現在，準備進入訓練矩陣。」
           </p>
        </div>

        <button 
          onClick={onClaim}
          className="w-full bg-[#bef264] text-black py-5 font-black text-xs tracking-[0.5em] uppercase hover:bg-black hover:text-white transition-all shadow-xl flex items-center justify-center gap-4"
        >
          封存此資產並啟動系統 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DailyRewardModal;
