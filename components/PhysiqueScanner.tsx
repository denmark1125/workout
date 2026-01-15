
import React, { useState, useRef } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { Camera, FileText, ChevronRight, X, User, Loader2, Eye, EyeOff } from 'lucide-react';

interface PhysiqueScannerProps {
  profile: UserProfile;
  records: PhysiqueRecord[];
  onAddRecord: (record: PhysiqueRecord) => void;
}

const PhysiqueScanner: React.FC<PhysiqueScannerProps> = ({ profile, records, onAddRecord }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealedRecords, setRevealedRecords] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
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
    } catch (err) {
      setAnalysis("連線至 AI 引擎失敗，請檢查網路。");
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    const newSet = new Set(revealedRecords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedRecords(newSet);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Visual Diagnostic Module</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none text-black">視覺診斷</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-gray-100 shadow-2xl rounded-sm overflow-hidden">
        {/* 上傳區域 */}
        <div className="lg:col-span-5 p-10 space-y-8 flex flex-col items-center bg-gray-50/30">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-lime-400 transition-all overflow-hidden group relative"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover transition-transform duration-700" alt="Physique" />
            ) : (
              <div className="text-center p-8 space-y-4">
                <Camera className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">點擊或拖放照片</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading}
            className={`w-full py-6 font-black text-xs tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl ${
              !image || loading ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-lime-400 hover:text-black uppercase animate-glow'
            }`}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</> : '啟動 AI 體態診斷'}
          </button>
        </div>

        {/* 分析結果 */}
        <div className="lg:col-span-7 p-10 md:p-16 flex flex-col min-h-[500px] border-l border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">AI 即時反饋頻道</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {analysis ? (
              <div className="report-typography prose max-w-none">
                 <div className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm">
                    {analysis.split('\n').map((line, i) => {
                      if (line.startsWith('###')) return <h3 key={i} className="!mt-8 !mb-4 !text-gray-900 border-l-4 border-lime-400 pl-4 font-black">{line.replace('###', '').trim()}</h3>;
                      if (line.startsWith('-')) return <li key={i} className="ml-4 mb-2 font-medium">{line.replace('-', '').trim()}</li>;
                      return <p key={i} className="mb-4">{line}</p>;
                    })}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                <p className="text-5xl font-black uppercase italic tracking-tighter text-black">待命中</p>
                <p className="text-[9px] font-mono font-bold mt-4 tracking-[0.4em] text-black">AWAITING_VISUAL_FEED</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 歷史存檔 - 隱私優化 */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-6">
          視覺診斷存檔 <div className="h-1 bg-gray-100 flex-1"></div>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {records.map(record => (
            <div key={record.id} className="bg-white border border-gray-100 p-8 shadow-xl space-y-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-mono font-black text-gray-400">{record.date}</p>
                <button 
                  onClick={() => toggleReveal(record.id)}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  {revealedRecords.has(record.id) ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              
              <div className="aspect-square bg-gray-50 border border-gray-100 overflow-hidden relative">
                 <img 
                    src={record.image} 
                    className={`w-full h-full object-cover ${revealedRecords.has(record.id) ? '' : 'blur-privacy'}`} 
                    alt="History"
                 />
                 {!revealedRecords.has(record.id) && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/80 px-3 py-1">隱私保護中</p>
                   </div>
                 )}
              </div>

              <div className="max-h-32 overflow-y-auto text-[11px] text-gray-500 font-medium leading-relaxed custom-scrollbar border-t border-gray-50 pt-4">
                 {record.analysis.substring(0, 150)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhysiqueScanner;
