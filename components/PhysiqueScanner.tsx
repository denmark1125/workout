
import React, { useState, useRef } from 'react';
import { UserProfile, PhysiqueRecord } from '../types';
import { getPhysiqueAnalysis } from '../services/geminiService';
import { Camera, FileText, ChevronRight, X, User, Loader2 } from 'lucide-react';

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
      setAnalysis("掃描出錯，請檢查網路或 API 金鑰。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-white/10 pb-6 gap-4">
        <div>
          <p className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Visual Intelligence Module</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">Vision Scan</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-gray-200 gap-px p-px shadow-2xl rounded-sm overflow-hidden">
        <div className="lg:col-span-5 bg-[#fcfcfc] p-8 md:p-12 space-y-6 flex flex-col items-center">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/5] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-[#bef264] transition-all overflow-hidden group"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Physique" />
            ) : (
              <div className="text-center p-8 space-y-3">
                <Camera className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Upload Profile</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <button
            onClick={handleScan}
            disabled={!image || loading}
            className={`w-full py-5 font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg ${
              !image || loading ? 'bg-gray-100 text-gray-300' : 'bg-[#bef264] text-black hover:bg-black hover:text-[#bef264] uppercase transform hover:-translate-y-1'
            }`}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> ANALYZING...</> : '啟動視覺分析'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-[#fcfcfc] p-8 md:p-12 flex flex-col min-h-[450px] border-l border-gray-100">
          <h3 className="text-[9px] font-mono font-black text-gray-400 uppercase mb-6 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#bef264] rounded-full"></div> Matrix Tactical Feed
          </h3>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {analysis ? (
              <div className="report-typography prose prose-invert max-w-none">
                 <div className="whitespace-pre-wrap font-sans text-gray-700">
                    {analysis.split('\n').map((line, i) => {
                      if (line.startsWith('###')) return <h3 key={i} className="!mt-4 !mb-2 !text-gray-900 border-l-4 border-[#bef264] pl-4">{line.replace('###', '').trim()}</h3>;
                      return <p key={i} className="mb-4 leading-relaxed text-sm">{line}</p>;
                    })}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 grayscale opacity-20">
                <p className="text-4xl font-black uppercase italic tracking-tighter text-black">Standby</p>
                <p className="text-[8px] font-mono font-bold mt-2 tracking-[0.4em] text-black">AWAITING_VISUAL_DATA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysiqueScanner;
