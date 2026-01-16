
import React, { useState } from 'react';
import { UserProfile, UserMetrics, WorkoutLog, PhysiqueRecord } from '../types';
import { generateWeeklyReport } from '../services/geminiService';
import { getTaiwanWeekId } from '../utils/calculations';
import { FileText, Zap, Shield, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

interface WeeklyReportProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  logs: WorkoutLog[];
  physiqueRecords: PhysiqueRecord[];
  onProfileUpdate: (p: UserProfile) => void; // Added
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ profile, metrics, logs, physiqueRecords, onProfileUpdate }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gatekeeper UI Check
  const currentWeek = getTaiwanWeekId();
  // 檢查是否為新的一週，若是則視為 0 次
  const currentCount = profile.weeklyReportUsage?.weekId === currentWeek ? profile.weeklyReportUsage.count : 0;
  const isLimitReached = currentCount >= 2 && profile.role !== 'admin';

  const handleGenerate = async () => {
    if (metrics.length === 0 && logs.length === 0) {
      alert("數據不足，請先輸入健身數據或訓練日誌。");
      return;
    }
    setLoading(true);
    try {
      const result = await generateWeeklyReport(profile, metrics, logs, physiqueRecords);
      setReport(result || "生成失敗，系統無效回饋。");
      
      // 更新使用量
      if (profile.role !== 'admin' && !result.includes('存取限制')) {
        onProfileUpdate({
          ...profile,
          weeklyReportUsage: {
            weekId: currentWeek,
            count: currentCount + 1
          }
        });
      }
    } catch (err) {
      setReport("與核心引擎連線異常，請檢查網路狀態。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-20 pb-40">
      <header className="flex flex-col md:flex-row items-end justify-between border-b-4 border-black/5 pb-10 gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Fitness Command Hub</p>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase leading-none">健身戰略週報</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            WEEKLY LIMIT: {isLimitReached ? 'MAXED' : `${currentCount}/2`}
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading || isLimitReached}
            className={`px-10 py-5 font-black uppercase tracking-[0.4em] text-xs transition-all flex items-center gap-4 shadow-xl transform hover:-translate-y-1 rounded-sm
              ${loading || isLimitReached ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#bef264] text-black hover:bg-black hover:text-[#bef264] animate-glow'}`}
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> ANALYZING...</> : <><Zap className="w-5 h-5 fill-current" /> 生成 AI 週報</>}
          </button>
        </div>
      </header>

      {report ? (
        <div className="bg-[#fcfcfc] border border-gray-100 p-10 md:p-20 relative overflow-hidden shadow-2xl rounded-sm transition-all duration-700 animate-in fade-in slide-in-from-bottom-10">
          <div className="absolute -top-20 -right-20 opacity-[0.03] pointer-events-none select-none">
             <span className="text-[25rem] font-black italic leading-none text-black">AI</span>
          </div>

          <div className="max-w-3xl relative z-10 space-y-16">
            <div className="flex items-center gap-4">
               <div className="w-20 h-1 bg-[#bef264]"></div>
               <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em]">Official Fitness Intelligence Output</h3>
            </div>

            <div className="report-typography prose max-w-none text-gray-700">
              <div className="whitespace-pre-wrap font-sans">
                {report.split('\n').map((line, i) => {
                  if (line.startsWith('###')) {
                    return <h3 key={i} className="tracking-tighter !font-black !text-3xl !text-gray-900 border-none pl-0 !mb-8 !mt-12 first:mt-0">{line.replace('###', '').trim()}</h3>;
                  }
                  if (line.startsWith('-')) {
                    return (
                      <div key={i} className="flex gap-5 mb-6 items-start pl-2 group">
                        <ArrowRight className="w-5 h-5 text-[#bef264] mt-1 flex-shrink-0" />
                        <span className="text-gray-900 font-bold tracking-tight text-base md:text-lg leading-relaxed">{line.replace('-', '').trim()}</span>
                      </div>
                    );
                  }
                  if (line.trim() === '') return <div key={i} className="h-4" />;
                  return <p key={i} className="pl-6 border-l-2 border-gray-100 italic font-medium text-gray-500 mb-4">{line}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 bg-gray-100 gap-px p-px shadow-xl rounded-sm overflow-hidden border border-gray-100">
           <div className="md:col-span-4 bg-[#fcfcfc] p-16 flex flex-col items-center justify-center text-center space-y-6">
              <FileText className="w-12 h-12 text-gray-200" />
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">數據待命中</p>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.5em]">SYSTEM STANDBY</p>
              </div>
           </div>
           <div className="md:col-span-8 bg-[#fcfcfc] p-12 md:p-20 flex flex-col justify-center space-y-10 border-l border-gray-100">
             <p className="text-2xl md:text-3xl font-medium text-gray-400 tracking-tight leading-relaxed">
               <span className="text-gray-900 font-black">AI Fitness Hub</span> 正在監測生理矩陣。啟動健身週報生成，我們將整合您的訓練日誌、體標變化與視覺分析報告，提供下週戰術建議。
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;
