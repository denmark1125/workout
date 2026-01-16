
import React, { useState } from 'react';
import { Terminal, ArrowRight, Zap, Target, ShieldCheck, X } from 'lucide-react';

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "歡迎連結至 MATRIX AI",
      icon: <Terminal className="w-12 h-12 text-[#bef264]" />,
      content: `你好，${userName}。我是 David 教練，負責監管你的進化軌跡。在這裡，每一滴汗水都將被轉化為數據，每一筆紀錄都是你對抗平庸的戰報。準備好啟動你的健身矩陣了嗎？`,
      highlight: null
    },
    {
      title: "生理矩陣：精準監控",
      icon: <Zap className="w-12 h-12 text-[#bef264]" />,
      content: "這是你的核心數據引擎。我們會追蹤 BMI、FFMI 與體脂變化。透過雷達圖，你可以一眼看出自己的強項與弱點。記住，無法衡量的東西就無法優化。",
      highlight: "data-engine"
    },
    {
      title: "訓練日誌：意志的封存",
      icon: <Target className="w-12 h-12 text-[#bef264]" />,
      content: "每次踏入健身房都是一場戰役。請利用日誌系統詳細記錄你的組數、重量與體感。這些原始資料將成為 AI 戰略分析的核心燃料。",
      highlight: "journal"
    },
    {
      title: "AI 首席戰略：突破極限",
      icon: <ShieldCheck className="w-12 h-12 text-[#bef264]" />,
      content: "體態診斷模組會運用視覺分析糾正你的弱點，而戰略週報則會結合全球最新的運動科學，為你量身打造下週的進化計畫。",
      highlight: "ai-module"
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
      
      {/* 跳過按鈕 */}
      <button 
        onClick={onComplete}
        className="absolute top-8 right-8 text-gray-400 hover:text-[#bef264] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all z-[310]"
      >
        SKIP TUTORIAL 跳過教學 <X size={16} />
      </button>

      <div className="w-full max-w-xl bg-white border-t-8 border-black p-10 space-y-8 relative shadow-[0_0_150px_rgba(190,242,100,0.25)] animate-in zoom-in duration-500">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
             <Terminal size={16} className="text-gray-300" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Tactical Onboarding v2.5</p>
          </div>
          <p className="text-[10px] font-mono font-black bg-black text-[#bef264] px-3 py-1">
            STEP {step + 1} / {steps.length}
          </p>
        </div>

        <div className="space-y-6 min-h-[220px] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6 py-4">
             <div className="animate-pulse">{current.icon}</div>
             <h2 className="text-3xl font-black tracking-tighter uppercase text-center">{current.title}</h2>
          </div>
          <p className="text-lg font-bold text-gray-700 leading-relaxed text-center italic">
            「{current.content}」
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={nextStep}
            className="w-full bg-black text-white py-6 font-black text-xs tracking-[0.5em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-xl flex items-center justify-center gap-4"
          >
            {step === steps.length - 1 ? '啟動戰略矩陣 START' : '理解，進入下一步 NEXT'} <ArrowRight size={18} />
          </button>
          
          {step === 0 && (
            <button 
              onClick={onComplete}
              className="w-full text-center text-gray-300 hover:text-red-500 text-[10px] font-black uppercase tracking-widest pt-2"
            >
              我不需要引導，直接開始訓練
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
