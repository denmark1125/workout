
import React, { useState } from 'react';
import { UserProfile, UserMetrics, WorkoutLog, PhysiqueRecord } from '../types';
import { generateWeeklyReport } from '../services/geminiService';
import { FileText, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';

interface WeeklyReportProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  logs: WorkoutLog[];
  physiqueRecords: PhysiqueRecord[];
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ profile, metrics, logs, physiqueRecords }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (metrics.length === 0 && logs.length === 0) {
      alert("數據不足。請先錄入訓練日誌或生理指標數據。");
      return;
    }
    setLoading(true);
    try {
      const result = await generateWeeklyReport(profile, metrics, logs, physiqueRecords);
      setReport(result || "生成失敗。");
    } catch (err) {
      console.error(err);
      setReport("與矩陣引擎連線異常。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-20 pb-40">
      <header className="flex flex-col md:flex-row items-end justify-between border-b-4 border-black pb-10 gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Tactical Command</p>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase leading-none">Strategic Intelligence</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white px-10 py-5 font-black uppercase tracking-[0.4em] text-xs hover:bg-[#bef264] hover:text-black transition-all flex items-center gap-4 group shadow-2xl transform hover:-translate-y-1"
        >
          {loading ? 'ANALYZING MATRIX...' : <><Zap className="w-5 h-5 fill-current group-hover:animate-bounce" /> 生成戰略週報</>}
        </button>
      </header>

      {report ? (
        <div className="bg-white border border-gray-200 p-10 md:p-24 relative overflow-hidden shadow-2xl rounded-sm transition-gentle">
          <div className="absolute -top-20 -right-20 opacity-[0.03] pointer-events-none select-none">
             <span className="text-[25rem] font-black italic leading-none">AI</span>
          </div>

          <div className="max-w-3xl relative z-10 space-y-20">
            <div className="flex items-center gap-4">
               <div className="w-20 h-1 bg-black"></div>
               <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em]">Official Tactical Analysis Report</h3>
            </div>

            <div className="report-typography prose prose-stone max-w-none text-black">
              <div className="whitespace-pre-wrap font-sans">
                {report.split('\n').map((line, i) => {
                  if (line.startsWith('###')) {
                    return <h3 key={i} className="tracking-tighter !font-black !text-3xl">{line.replace('###', '').trim()}</h3>;
                  }
                  if (line.startsWith('-')) {
                    return (
                      <div key={i} className="flex gap-5 mb-6 items-start pl-4 group">
                        <ArrowRight className="w-6 h-6 text-[#bef264] mt-1.5 flex-shrink-0 group-hover:translate-x-2 transition-transform duration-300" />
                        <span className="text-gray-900 font-bold tracking-tight text-base md:text-lg leading-relaxed">{line.replace('-', '').trim()}</span>
                      </div>
                    );
                  }
                  if (line.trim() === '') return <div key={i} className="h-6" />;
                  return <p key={i} className="pl-4 border-l-2 border-gray-100 italic font-medium">{line}</p>;
                })}
              </div>
            </div>
            
            <div className="pt-20 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="text-[9px] text-gray-400 font-mono font-black uppercase tracking-[0.5em]">Engine_Core_V3 // Strategic_Protocol // {new Date().toLocaleDateString()}</div>
               <div className="flex gap-3">
                 <div className="px-5 py-2 bg-black text-[#bef264] text-[8px] font-black uppercase tracking-[0.3em] shadow-lg">Authorization_L1</div>
                 <div className="px-5 py-2 bg-white text-gray-300 text-[8px] font-black uppercase tracking-[0.3em] italic border border-gray-100">Confidential_Access</div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 bg-gray-100 gap-px p-px shadow-2xl">
           <div className="md:col-span-4 bg-white p-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-gray-50 border border-gray-100 flex items-center justify-center rounded-full group hover:bg-[#bef264] transition-all transform hover:rotate-12 duration-500 shadow-sm">
                <FileText className="w-10 h-10 text-gray-200 group-hover:text-black" />
              </div>
              <div>
                <p className="text-2xl font-black text-black tracking-tighter uppercase mb-2">矩陣待命</p>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.5em]">MATRIX STANDBY</p>
              </div>
           </div>
           <div className="md:col-span-8 bg-white p-12 md:p-20 flex flex-col justify-center space-y-12">
             <p className="text-2xl md:text-3xl font-medium text-gray-800 tracking-tight leading-relaxed">
               <span className="text-black font-black">AI Command Engine</span> 目前處於閒置狀態。請啟動報告生成器，以綜合分析您的生理矩陣與近期訓練表現。
             </p>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: <TrendingUp className="w-4 h-4"/>, label: '生理指標' },
                  { icon: <Shield className="w-4 h-4"/>, label: '恢復狀態' },
                  { icon: <Zap className="w-4 h-4"/>, label: '器材效率' },
                  { icon: <ArrowRight className="w-4 h-4"/>, label: '成長向量' },
                ].map((tag, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 px-5 py-4 border border-gray-100 group hover:border-black transition-all shadow-sm">
                    <span className="text-[#bef264] bg-black p-2">{tag.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{tag.label}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;
