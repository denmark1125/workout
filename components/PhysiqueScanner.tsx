
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { getTaiwanDate } from '../utils/calculations';
import { Camera, Scan, Activity, ShieldCheck, Terminal, Brain } from 'lucide-react';
import TacticalLoader from './TacticalLoader';

const RichTextParser: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const cleanText = text.replace(/\*\*\*/g, '').replace(/```/g, '').replace(/##/g, '');
  const lines = cleanText.split('\n').filter(line => line.trim() !== '');
  
  return (
    <div className="space-y-5">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###') || (trimmed.length < 30 && trimmed.endsWith('：'))) {
           return <h3 key={index} className="text-base font-black uppercase tracking-tight text-black mt-8 mb-3 border-b-2 border-[#bef264] pb-1 inline-block">{trimmed.replace(/###/g, '').replace(/\*\*/g, '')}</h3>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
           return (
             <div key={index} className="flex gap-3 items-start pl-1">
                <div className="w-1.5 h-1.5 bg-black mt-1.5 rounded-full flex-shrink-0"></div>
                <p className="text-gray-700 font-bold text-sm leading-relaxed">
                  {trimmed.substring(1).trim().replace(/\*\*/g, '')}
                </p>
             </div>
           );
        }
        return <p key={index} className="text-gray-600 text-sm leading-relaxed mb-3">{trimmed.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
};

const PhysiqueScanner: React.FC<{ profile: UserProfile; records: PhysiqueRecord[]; onAddRecord: (r: PhysiqueRecord) => void; onDeleteRecord?: (id: string) => void; onProfileUpdate: (p: UserProfile) => void; }> = ({ profile, records, onAddRecord, onProfileUpdate }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logsPool = [
    "定位肌肉群邊界模組...", 
    "估算皮下脂肪密度矩陣...", 
    "分析骨骼排列對稱向量...", 
    "映射神經反饋建議...", 
    "檢索專業健身戰略數據庫...", 
    "正在生成最終進化校準報告..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setScanLogs([logsPool[0]]);
      let i = 1;
      interval = setInterval(() => {
        setScanLogs(prev => [...prev.slice(-2), logsPool[i % logsPool.length]]);
        i++;
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // 省錢戰術：強制將體態照片限制在 800px，這能大幅降低影像 Token
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 800; // 下修至 800px
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // 品質 0.7 達成體積與清晰度的平衡
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImage(compressed);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await getPhysiqueAnalysis(image, profile);
      setAnalysis(result);
      onAddRecord({
        id: Date.now().toString(),
        date: getTaiwanDate(),
        image: image,
        analysis: result
      });
      onProfileUpdate({ ...profile, lastPhysiqueAnalysisDate: getTaiwanDate() });
    } catch (err) {
      setAnalysis("AI 系統分析超時。請確保網路連線穩定後再試。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-40 px-4">
      <header className="border-b border-black pb-6">
        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-0.3em mb-1">Visual Diagnostic Module</p>
        <h2 className="text-3xl font-black tracking-tighter uppercase text-black">體態診斷</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-gray-100 shadow-xl rounded-sm overflow-hidden">
        <div className="lg:col-span-5 p-6 flex flex-col items-center bg-gray-50/20 border-r border-gray-100">
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`w-full aspect-[4/5] bg-white border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative rounded-sm
              ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer border-gray-200 hover:border-black'}`}
          >
            {image ? (
              <div className="relative w-full h-full">
                <img src={image} className="w-full h-full object-cover" alt="Physique" />
                {loading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <div className="w-full h-1 bg-[#bef264] absolute top-0 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_20px_#bef264] z-10"></div>
                    <div className="mt-4 flex flex-col items-center gap-3 z-20">
                       <Brain size={24} className="text-[#bef264] animate-pulse" />
                       <div className="space-y-1 text-center bg-black/60 px-4 py-2 rounded-sm border border-[#bef264]/20">
                          {scanLogs.map((log, i) => (
                             <p key={i} className={`text-[8px] font-mono text-[#bef264] uppercase transition-all duration-500 ${i === scanLogs.length - 1 ? 'opacity-100 scale-110' : 'opacity-30'}`}>{log}</p>
                          ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <Camera className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">點擊上傳全身照片<br/>啟動深度視覺分析<br/><span className="text-[9px] text-[#bef264] bg-black px-1 mt-2 inline-block">系統已啟動省錢壓縮模式 (800px)</span></p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={loading} />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading}
            className={`w-full py-4 mt-6 font-bold text-[10px] tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-lg uppercase rounded-sm ${
              !image || loading ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-[#bef264] hover:text-black'
            }`}
          >
            {loading ? 'ANALYZING...' : '啟動視覺診斷'}
          </button>
        </div>

        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col min-h-[550px] bg-white">
          <div className="flex items-center gap-3 mb-8 pb-3 border-b border-gray-50">
             <ShieldCheck size={16} className="text-lime-500" />
             <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">David 戰術反饋矩陣</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
            {loading ? (
              <TacticalLoader type="SCAN" title="正在映射生物指標與進化潛力" />
            ) : analysis ? (
              <RichTextParser text={analysis} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                <Scan size={56} className="text-black mb-4" />
                <p className="text-xl font-black uppercase tracking-tighter text-black">Awaiting Input</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">請先上傳照片以進行分析</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysiqueScanner;
