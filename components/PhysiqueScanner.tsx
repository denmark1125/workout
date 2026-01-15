
import React, { useState, useRef } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { Camera, FileText, ChevronRight, X, User } from 'lucide-react';

interface PhysiqueScannerProps {
  profile: UserProfile;
  records: PhysiqueRecord[];
  onAddRecord: (record: PhysiqueRecord) => void;
}

const PhysiqueScanner: React.FC<PhysiqueScannerProps> = ({ profile, records, onAddRecord }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PhysiqueRecord | null>(null);
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
      const textResult = result || "無法生成分析，請重試。";
      setAnalysis(textResult);
      onAddRecord({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        image: image,
        analysis: textResult
      });
    } catch (err) {
      console.error(err);
      setAnalysis("掃描出錯，請檢查網路或 API 金鑰。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-4">
        <div>
          <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.3em] mb-1">視覺診斷模組 (Visual Module)</p>
          <h2 className="text-3xl md:text-4xl font-black text-black tracking-tighter uppercase leading-none">Vision Scan</h2>
        </div>
        <div className="bg-[#bef264] px-4 py-2 font-black text-[9px] tracking-widest uppercase italic">
          Evolution Record System
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-gray-100 gap-px p-px">
        <div className="lg:col-span-5 bg-white p-8 md:p-12 space-y-6 flex flex-col items-center">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] bg-gray-50 border border-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden group"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Physique" />
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 bg-white border border-gray-100 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-black font-black uppercase text-[10px] tracking-widest">Upload Profile</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5 font-mono">Max 5MB</p>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading}
            className={`w-full py-5 font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              !image || loading ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-black text-white hover:bg-[#bef264] hover:text-black uppercase'
            }`}
          >
            {loading ? '運算中 (PROCESSING)...' : '啟動 AI 診斷'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-white p-8 md:p-12 flex flex-col min-h-[400px]">
          <h3 className="text-[9px] font-mono font-black text-gray-400 uppercase mb-6 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#bef264] rounded-full"></div> Latest Tactical Insight
          </h3>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {analysis ? (
              <div className="report-typography prose prose-stone max-w-none">
                 <div className="whitespace-pre-wrap">
                    {analysis.split('\n').map((line, i) => {
                      if (line.startsWith('###')) return <h3 key={i} className="!mt-4 !mb-2">{line.replace('###', '').trim()}</h3>;
                      return <p key={i}>{line}</p>;
                    })}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                <p className="text-3xl font-black uppercase italic tracking-tighter">待命 Standby</p>
                <p className="text-[8px] font-mono font-bold mt-1 tracking-[0.3em]">AWAITING_VISUAL_FEED</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-gray-100 pb-2">
             <h3 className="text-xl font-black text-black tracking-tighter uppercase">Evolutionary Archive</h3>
             <span className="text-[8px] text-gray-400 font-mono font-black uppercase tracking-widest">Index // {records.length}</span>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-100 gap-px p-px">
             {records.map(rec => (
               <div 
                 key={rec.id} 
                 onClick={() => setSelectedRecord(rec)}
                 className="bg-white p-4 hover:bg-black group transition-all cursor-pointer"
               >
                 <div className="aspect-square bg-gray-50 mb-4 overflow-hidden">
                   <img src={rec.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                 </div>
                 <div>
                   <p className="text-[8px] font-mono text-[#bef264] font-black">{rec.date}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-h-[85vh] flex flex-col md:flex-row shadow-2xl overflow-hidden border-4 border-white">
            <div className="md:w-1/2 bg-gray-50 flex items-center justify-center relative overflow-hidden">
              <img src={selectedRecord.image} className="max-h-full object-contain z-10" />
              <button onClick={() => setSelectedRecord(null)} className="absolute top-4 left-4 md:hidden bg-white/80 p-2 rounded-full z-20"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-hidden bg-white">
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[8px] font-mono text-gray-400 font-black uppercase tracking-widest">Record Archive Entry</p>
                  <h4 className="text-2xl font-black text-black tracking-tighter mt-0.5">{selectedRecord.date}</h4>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="hidden md:block text-gray-300 hover:text-black transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar report-typography">
                <div className="whitespace-pre-wrap">
                  {selectedRecord.analysis.split('\n').map((line, i) => {
                     if (line.startsWith('###')) return <h3 key={i} className="!mt-4 !mb-2">{line.replace('###', '').trim()}</h3>;
                     return <p key={i}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysiqueScanner;
