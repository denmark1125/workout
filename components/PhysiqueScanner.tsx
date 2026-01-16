
import React, { useState, useRef } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { Camera, FileText, ChevronRight, X, User, Loader2, Eye, EyeOff, Trash2, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

interface PhysiqueScannerProps {
  profile: UserProfile;
  records: PhysiqueRecord[];
  onAddRecord: (record: PhysiqueRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

const PhysiqueScanner: React.FC<PhysiqueScannerProps> = ({ profile, records, onAddRecord, onDeleteRecord }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 記錄展開狀態 (ID)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  // 記錄解鎖模糊狀態 (ID Set) - 即使展開也預設模糊，需二次點擊解鎖
  const [unlockedImages, setUnlockedImages] = useState<Set<string>>(new Set());
  
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

  const toggleExpand = (id: string) => {
    if (expandedRecordId === id) {
      setExpandedRecordId(null);
    } else {
      setExpandedRecordId(id);
    }
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

      {/* 歷史存檔 - 加密日誌列表樣式 (隱私優化版) */}
      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-gray-100 pb-4">
           <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
             <Lock size={20} className="text-black" />
             加密診斷存檔 
             <span className="text-[10px] text-gray-400 font-mono tracking-widest translate-y-1">SECURE_LOGS</span>
           </h3>
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">TOTAL_RECORDS: {records.length}</p>
        </div>

        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-100 border-dashed">
              <p className="text-gray-400 font-black text-xs uppercase tracking-widest">暫無存檔紀錄</p>
            </div>
          ) : (
            records.map(record => {
              const isExpanded = expandedRecordId === record.id;
              const isUnlocked = unlockedImages.has(record.id);

              return (
                <div key={record.id} className="bg-white border border-gray-100 transition-all hover:border-gray-300">
                  {/* Log Header (Compact Row) */}
                  <div 
                    onClick={() => toggleExpand(record.id)}
                    className={`flex items-center justify-between p-5 cursor-pointer select-none ${isExpanded ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-6 overflow-hidden">
                       <div className={`p-2 rounded-sm ${isExpanded ? 'bg-[#bef264] text-black' : 'bg-gray-100 text-gray-400'}`}>
                         {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                       </div>
                       <div className="font-mono text-xs font-bold tracking-widest truncate">
                         <span className={isExpanded ? 'text-gray-400' : 'text-gray-900'}>{record.date}</span>
                         <span className="mx-3 opacity-30">|</span>
                         <span className={isExpanded ? 'text-[#bef264]' : 'text-gray-500'}>LOG_ID_{record.id.slice(-6).toUpperCase()}</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pl-4 shrink-0">
                       <div className={`text-[9px] font-black uppercase tracking-widest border px-2 py-1 ${isExpanded ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-300'}`}>
                          {isExpanded ? 'ACCESSING...' : 'ENCRYPTED'}
                       </div>
                       <button 
                         onClick={(e) => handleDelete(e, record.id)}
                         className={`p-2 transition-colors ${isExpanded ? 'text-gray-600 hover:text-red-500' : 'text-gray-200 hover:text-red-500'}`}
                         title="銷毀紀錄"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>

                  {/* Expanded Content (Hidden by default for privacy) */}
                  {isExpanded && (
                    <div className="p-8 border-t border-gray-100 bg-[#fcfcfc] animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Image Section - Blurred by default */}
                        <div className="w-full md:w-64 shrink-0 space-y-3">
                           <div className="aspect-[3/4] bg-black relative overflow-hidden group shadow-inner border border-gray-200">
                              <img 
                                src={record.image} 
                                className={`w-full h-full object-cover transition-all duration-700 ${isUnlocked ? 'blur-0 opacity-100' : 'blur-xl opacity-50'}`} 
                                alt="Secure Content"
                              />
                              
                              <button 
                                onClick={(e) => toggleImageLock(e, record.id)}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/10 hover:bg-black/20 transition-all z-10 w-full"
                              >
                                 <div className={`p-4 rounded-full backdrop-blur-md border ${isUnlocked ? 'bg-white/10 border-white/20' : 'bg-black/50 border-white/10'}`}>
                                   {isUnlocked ? <Unlock size={24} className="text-white" /> : <Lock size={24} className="text-white" />}
                                 </div>
                                 <p className="text-[9px] font-black text-white uppercase tracking-widest shadow-black drop-shadow-md">
                                   {isUnlocked ? 'TAP TO LOCK' : 'TAP TO DECRYPT'}
                                 </p>
                              </button>
                           </div>
                        </div>

                        {/* Text Analysis */}
                        <div className="flex-1 space-y-4">
                           <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">Analysis Data</h4>
                           <div className="text-xs font-medium text-gray-600 leading-loose whitespace-pre-wrap font-sans h-64 overflow-y-auto custom-scrollbar pr-2">
                             {record.analysis}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PhysiqueScanner;
