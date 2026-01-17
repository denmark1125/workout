
import React, { useState, useRef } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { getTaiwanDate } from '../utils/calculations';
import { Camera, ArrowRight, Trash2, Lock, Unlock, ChevronDown, ChevronUp, Loader2, Scan, Activity } from 'lucide-react';
import TacticalLoader from './TacticalLoader';

// === Rich Text Parser ===
const RichTextParser: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const cleanText = text.replace(/\*\*\*/g, '').replace(/```/g, '').replace(/##/g, '');
  const lines = cleanText.split('\n').filter(line => line.trim() !== '');
  
  return (
    <div className="space-y-6">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###') || (trimmed.length < 30 && trimmed.endsWith('：'))) {
           return <h3 key={index} className="text-xl font-black uppercase tracking-tight text-black mt-10 mb-4 border-b-2 border-[#bef264] pb-2 inline-block">{trimmed.replace(/###/g, '').replace(/\*\*/g, '')}</h3>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
           return (
             <div key={index} className="flex gap-4 items-start pl-1">
                <div className="w-2 h-2 bg-black mt-2.5 rounded-full flex-shrink-0"></div>
                <p className="text-gray-800 font-bold text-base leading-relaxed">
                  {trimmed.substring(1).trim().replace(/\*\*/g, '')}
                </p>
             </div>
           );
        }
        return <p key={index} className="text-gray-600 text-base leading-relaxed mb-4">{trimmed.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
};

interface PhysiqueScannerProps {
  profile: UserProfile;
  records: PhysiqueRecord[];
  onAddRecord: (record: PhysiqueRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const PhysiqueScanner: React.FC<PhysiqueScannerProps> = ({ profile, records, onAddRecord, onDeleteRecord, onProfileUpdate }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [unlockedImages, setUnlockedImages] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = getTaiwanDate();
  const isLimitReached = profile.lastPhysiqueAnalysisDate === today && profile.role !== 'admin';

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; // 稍微提升壓縮解析度
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
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
      const textResult = result || "系統分析異常，請重試。";
      setAnalysis(textResult);
      onAddRecord({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        image: image,
        analysis: textResult
      });
      if (profile.role !== 'admin' && !textResult.includes('限制') && !textResult.includes('逾時')) {
         onProfileUpdate({ ...profile, lastPhysiqueAnalysisDate: today });
      }
    } catch (err) {
      setAnalysis("連線至 AI 引擎失敗，請檢查網路。");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  const toggleImageLock = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(unlockedImages);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setUnlockedImages(newSet);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteRecord) onDeleteRecord(id);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-40 px-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6">
        <div>
          <p className="text-sm font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Visual Diagnostic Module</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-black">體態診斷</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border-2 border-gray-100 shadow-xl rounded-sm overflow-hidden">
        {/* 上傳區域 */}
        <div className="lg:col-span-5 p-10 space-y-8 flex flex-col items-center bg-gray-50/20 border-r border-gray-100">
          <div 
            onClick={() => !isLimitReached && !loading && fileInputRef.current?.click()}
            className={`w-full aspect-[4/5] bg-white border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden group relative rounded-sm
              ${isLimitReached || loading ? 'cursor-not-allowed border-gray-200 opacity-50' : 'cursor-pointer border-gray-200 hover:border-lime-400'}`}
          >
            {image ? (
              <div className="relative w-full h-full">
                <img src={image} className="w-full h-full object-cover transition-transform duration-700" alt="Physique" />
                {loading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="w-full h-1 bg-[#bef264] absolute top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#bef264]"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 space-y-6">
                <Camera className="w-14 h-14 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-black uppercase text-sm tracking-widest leading-relaxed">
                  {isLimitReached ? '今日額度已用盡' : '點擊上傳全身照\nDAVID 將啟動視覺分析'}
                </p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isLimitReached || loading} />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading || isLimitReached}
            className={`w-full py-6 font-black text-sm tracking-[0.5em] transition-all flex items-center justify-center gap-4 shadow-xl uppercase rounded-sm ${
              !image || loading || isLimitReached ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-[#bef264] hover:text-black'
            }`}
          >
            {loading ? <span className="animate-pulse">DAVID ANALYZING...</span> : isLimitReached ? 'COOLDOWN' : '啟動視覺診斷'}
          </button>
        </div>

        {/* 分析結果 */}
        <div className="lg:col-span-7 p-10 md:p-16 flex flex-col min-h-[600px] bg-[#fdfdfd] relative">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-gray-100">
            <Activity size={24} className="text-lime-500" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">David 戰略反饋矩陣</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <TacticalLoader type="SCAN" title="正在映射肌肉排列與對稱性" />
              </div>
            ) : analysis ? (
              <RichTextParser text={analysis} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
                <Scan size={80} className="text-black mb-6" />
                <p className="text-3xl font-black uppercase tracking-tighter text-black">Awaiting Visual Input</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysiqueScanner;
