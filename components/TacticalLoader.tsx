
import React, { useState, useEffect } from 'react';
import { Loader2, Terminal, Zap, Activity } from 'lucide-react';

interface TacticalLoaderProps {
  title?: string;
  type?: 'GENERIC' | 'SCAN' | 'REPORT' | 'DIET';
}

const TacticalLoader: React.FC<TacticalLoaderProps> = ({ title = "David 教練分析中", type = 'GENERIC' }) => {
  const [statusIdx, setStatusIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const statuses = {
    GENERIC: ["連接 David AI 核心...", "對齊生物特徵矩陣...", "校準戰術建議...", "正在封存數據流..."],
    SCAN: ["掃描肌肉群邊界...", "估算皮下脂肪厚度...", "分析骨骼排列向量...", "生成體態診斷圖表..."],
    REPORT: ["聚合本週訓練日誌...", "計算進度偏離值...", "擬定下週訓練強度...", "繪製戰術圖卡..."],
    DIET: ["識別食物圖像特徵...", "比對營養成分數據庫...", "估算蛋白質/熱量比例...", "計算今日熱量赤字..."]
  };

  const davidQuotes = [
    "「紀律就是最強的補劑，哪怕只是等待。」",
    "「組間休息是為了下一組的爆發，系統運算也是。」",
    "「數據不會說謊，只有不認真訓練的汗水會。」",
    "「巨巨，耐性也是肌肉的一部分。」",
    "「正在為你的進化鋪路，請保持專注。」",
    "「每一次等待，都是為了更精準的突破。」"
  ];

  useEffect(() => {
    const sInterval = setInterval(() => setStatusIdx(prev => (prev + 1) % statuses[type].length), 2000);
    const qInterval = setInterval(() => setQuoteIdx(prev => (prev + 1) % davidQuotes.length), 5000);
    return () => { clearInterval(sInterval); clearInterval(qInterval); };
  }, [type]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-24 h-24 border-t-4 border-[#bef264] border-r-4 border-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="text-black animate-pulse" size={32} />
        </div>
        {type === 'SCAN' && (
           <div className="absolute -inset-4 border border-[#bef264]/20 rounded-full animate-ping"></div>
        )}
      </div>

      <div className="text-center space-y-4 max-w-xs">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-black text-[#bef264] bg-black px-2 py-0.5 inline-block uppercase tracking-[0.3em]">
            {statuses[type][statusIdx]}
          </p>
          <h3 className="text-xl font-black uppercase tracking-tighter text-black">{title}</h3>
        </div>
        
        <div className="bg-gray-50 p-4 border-l-4 border-black italic">
          <p className="text-xs font-bold text-gray-500 leading-relaxed">
            {davidQuotes[quoteIdx]}
          </p>
        </div>
        
        <div className="flex justify-center gap-1">
          {statuses[type].map((_, i) => (
            <div key={i} className={`h-1 w-4 rounded-full transition-all ${i === statusIdx ? 'bg-black w-8' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TacticalLoader;
