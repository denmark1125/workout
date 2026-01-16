
import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight, Zap, Target, ShieldCheck, X } from 'lucide-react';

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
  onStepChange?: (tabId: string) => void; 
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onComplete, onStepChange }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      id: 'welcome',
      title: "連結 MATRIX 系統",
      icon: <Terminal className="w-8 h-8 text-[#bef264]" />,
      content: `你好，${userName}。David 教練已上線。為了確保你的進化效率，我將快速校準你的系統介面。`,
      tab: 'dashboard'
    },
    {
      id: 'data',
      title: "數據引擎 DATA ENGINE",
      icon: <Zap className="w-8 h-8 text-[#bef264]" />,
      content: "注意畫面上的「DATA ENGINE」。這是你的生理儀表板，雷達圖與趨勢線會即時反映你的強項與弱點。記住，無法衡量的東西就無法強化。",
      tab: 'dashboard'
    },
    {
      id: 'journal',
      title: "戰術日誌 TACTICAL LOG",
      icon: <Target className="w-8 h-8 text-[#bef264]" />,
      content: "切換至訓練日誌。這裡不只是紀錄次數，更是封存你意志力的地方。每次訓練結束後的「Commit」，都是給 AI 分析引擎的重要燃料。",
      tab: 'journal'
    },
    {
      id: 'ai',
      title: "AI 戰略週報",
      icon: <ShieldCheck className="w-8 h-8 text-[#bef264]" />,
      content: "最後，週報系統會結合全球運動科學，為你生成每週進化建議。現在，系統校準完畢。開始你的訓練。",
      tab: 'report'
    }
  ];

  useEffect(() => {
    if (onStepChange) {
      onStepChange(steps[step].tab);
    }
  }, [step]);

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[step];

  return (
    // 修改：背景改為 pointer-events-none 且透明，讓使用者能看到後面
    <div className="fixed inset-0 z-[300] flex flex-col justify-end items-center md:items-end p-6 md:p-12 pointer-events-none">
      
      {/* 遮罩：僅在周圍稍微變暗，不完全遮擋 */}
      <div className="absolute inset-0 bg-black/10 transition-colors pointer-events-auto" onClick={onComplete}></div>

      <div className="w-full max-w-md bg-white border-l-8 border-black p-8 space-y-6 relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-500 pointer-events-auto">
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#bef264] border-2 border-white rotate-45"></div>
        
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-[#bef264]">{current.icon}</div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Onboarding Sequence</p>
                <h2 className="text-xl font-black tracking-tighter uppercase">{current.title}</h2>
              </div>
           </div>
           <button onClick={onComplete} className="text-gray-300 hover:text-black"><X size={20}/></button>
        </div>

        <p className="text-sm font-bold text-gray-700 leading-relaxed italic border-l-2 border-gray-100 pl-4">
          「{current.content}」
        </p>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={nextStep}
            className="flex-1 bg-black text-white py-4 font-black text-[10px] tracking-[0.3em] uppercase hover:bg-[#bef264] hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {step === steps.length - 1 ? '啟動系統' : '下一步'} <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex justify-between items-center pt-2">
           <div className="flex gap-1">
             {steps.map((_, i) => (
               <div key={i} className={`h-1 w-6 rounded-full transition-all ${i === step ? 'bg-black' : 'bg-gray-100'}`}></div>
             ))}
           </div>
           <p className="text-[9px] font-mono font-black text-gray-300">{(step + 1).toString().padStart(2,'0')} / {steps.length.toString().padStart(2,'0')}</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
