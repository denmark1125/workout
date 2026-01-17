
import React, { useState, useEffect } from 'react';
import { Loader2, Terminal, Zap, Activity, Brain, Beef, Target, ShieldCheck } from 'lucide-react';

interface TacticalLoaderProps {
  title?: string;
  type?: 'GENERIC' | 'SCAN' | 'REPORT' | 'DIET';
}

const TacticalLoader: React.FC<TacticalLoaderProps> = ({ title = "David 教練分析中", type = 'GENERIC' }) => {
  const [statusIdx, setStatusIdx] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // 狀態文字列表：營造系統正在運算的感覺
  const statuses = {
    GENERIC: ["建立神經網絡連接...", "對齊生物特徵矩陣...", "校準戰術建議...", "封存數據流..."],
    SCAN: ["偵測肌肉群動態邊界...", "估算皮下脂肪密度...", "分析骨骼排列向量...", "映射視覺反饋模組..."],
    REPORT: ["聚合本週訓練數據...", "計算進度偏離值...", "模擬下週進化曲線...", "生成戰術圖卡中..."],
    DIET: ["解析食物圖像光譜...", "檢索營養成分矩陣...", "計算宏量元素比例...", "正在封存補給日誌..."]
  };

  const coldFacts = {
    GENERIC: [
      "David 提示：組間休息建議 60-90 秒，這是神經修復的最佳窗口。",
      "冷知識：人體最長且最強壯的骨頭是大腿的「股骨」。",
      "David 提示：肌肉不是在健身房長的，是在睡眠中修復生成的。",
      "冷知識：心臟是全身唯一的「不倦肌」，平均每天跳動 10 萬次。"
    ],
    SCAN: [
      "David 提示：體態照片建議在同一光線下拍攝，以獲得精確對比。",
      "冷知識：人體最長的肌肉是「縫匠肌」，從大腿外側斜跨到膝蓋內側。",
      "David 提示：對稱性比絕對維度更重要，那是力與美的平衡點。"
    ],
    REPORT: [
      "David 提示：進步不是直線的，平台期是身體在適應新的強度。",
      "冷知識：肌肉組織的密度大於脂肪，所以體重增加不代表變胖。",
      "David 提示：漸進式超負荷是進步的唯一捷徑，別在舒適區逗留。"
    ],
    DIET: [
      "David 提示：蛋白質熱量效應最高，消化蛋白質會消耗更多熱量。",
      "冷知識：一小把堅果雖然健康，但熱量等同於兩碗白飯，請小心。",
      "冷知識：身體無法在缺乏水分的情況下高效代謝脂肪，請多喝水。"
    ]
  };

  useEffect(() => {
    const sInterval = setInterval(() => setStatusIdx(prev => (prev + 1) % statuses[type].length), 2000);
    const fInterval = setInterval(() => setFactIdx(prev => (prev + 1) % coldFacts[type].length), 6000);
    
    // 模擬進度條 (0-98%)
    const pInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98;
        return prev + (prev < 60 ? 0.8 : 0.05);
      });
    }, 100);

    return () => {
      clearInterval(sInterval);
      clearInterval(fInterval);
      clearInterval(pInterval);
    };
  }, [type]);

  const icons = {
    GENERIC: <Terminal className="text-black" size={32} />,
    SCAN: <Brain className="text-black" size={32} />,
    REPORT: <ShieldCheck className="text-black" size={32} />,
    DIET: <Beef className="text-black" size={32} />
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-16 animate-in fade-in duration-500 relative overflow-hidden w-full">
      {/* 掃描背景動畫 */}
      <div className="absolute inset-0 bg-matrix-grid opacity-10 pointer-events-none"></div>

      {/* 中央主圖標動畫 */}
      <div className="relative">
        <div className="w-32 h-32 border-[8px] border-black/5 rounded-full"></div>
        <div className="absolute inset-0 border-[8px] border-t-[#bef264] border-r-[#bef264] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center animate-matrix-pulse">
          {icons[type]}
        </div>
      </div>

      <div className="text-center space-y-6 max-w-sm relative z-10 px-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-black flex items-center justify-center gap-3">
            {title}
            <span className="text-sm font-mono text-gray-400">[{Math.floor(progress)}%]</span>
          </h3>
          <p className="text-xs font-mono font-black text-[#bef264] bg-black px-4 py-1.5 inline-block uppercase tracking-[0.3em] animate-pulse">
            {statuses[type][statusIdx]}
          </p>
        </div>

        {/* 擬真進度條 */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-200">
           <div 
             className="h-full bg-black transition-all duration-300 ease-out"
             style={{ width: `${progress}%` }}
           ></div>
        </div>
        
        {/* 教練冷知識區 */}
        <div className="bg-white p-6 border-2 border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] text-left min-h-[130px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3 text-gray-300">
             <Zap size={14} fill="currentColor" />
             <span className="text-[10px] font-black uppercase tracking-widest">Tactical Briefing</span>
          </div>
          <p className="text-sm font-bold text-gray-800 leading-relaxed italic animate-in fade-in duration-500" key={factIdx}>
            {coldFacts[type][factIdx]}
          </p>
        </div>
        
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">SYSTEM_STABLE / SYNCING</p>
      </div>
    </div>
  );
};

export default TacticalLoader;
