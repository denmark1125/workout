
import React, { useState, useRef } from 'react';
import { UserProfile, UserMetrics, WorkoutLog, PhysiqueRecord, GoalMetadata, WeeklyReportData } from '../types';
import { generateWeeklyReport } from '../services/geminiService';
import { getTaiwanWeekId } from '../utils/calculations';
import { FileText, Zap, ArrowRight, Loader2, Target, Brain, Activity, User, Calendar, Image as ImageIcon, ChevronDown, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import TacticalLoader from './TacticalLoader';

// === Rich Text Parser Optimized for High Contrast ===
const RichTextParser: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const cleanText = text.replace(/\*\*\*/g, '').replace(/```/g, '').replace(/##/g, '');
  const lines = cleanText.split('\n').filter(line => line.trim() !== '');
  
  return (
    <div className="space-y-8">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###') || (trimmed.length < 35 && trimmed.endsWith('：')) || (trimmed.length < 35 && trimmed.endsWith(':'))) {
           return (
             <div key={index} className="mt-12 mb-6">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#bef264] flex items-center gap-4">
                  <span className="w-8 h-1 bg-white"></span>
                  {trimmed.replace(/###/g, '').replace(/\*\*/g, '')}
                </h3>
             </div>
           );
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
           const content = trimmed.substring(1).trim();
           return (
             <div key={index} className="flex gap-4 items-start pl-2 group">
                <div className="w-2 h-2 bg-[#bef264] mt-2.5 flex-shrink-0 shadow-[0_0_8px_#bef264]"></div>
                <p className="text-white font-bold leading-relaxed text-base md:text-lg">
                  {content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <span key={i} className="text-[#bef264] font-black border-b-2 border-[#bef264] mx-1">{part.replace(/\*\*/g, '')}</span> 
                      : part
                  )}
                </p>
             </div>
           );
        }
        return (
           <p key={index} className="text-white/90 leading-relaxed text-base md:text-lg pl-6 border-l-2 border-white/20 ml-2 py-1">
              {trimmed.split(/(\*\*.*?\*\*)/).map((part, i) => 
                 part.startsWith('**') && part.endsWith('**') 
                   ? <span key={i} className="text-[#bef264] font-black">{part.replace(/\*\*/g, '')}</span> 
                   : part
              )}
           </p>
        );
      })}
    </div>
  );
};

interface WeeklyReportProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  logs: WorkoutLog[];
  physiqueRecords: PhysiqueRecord[];
  onProfileUpdate: (profile: UserProfile) => void;
  weeklyReports: WeeklyReportData[];
  onAddReport: (report: WeeklyReportData) => void;
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ profile, metrics, logs, physiqueRecords, onProfileUpdate, weeklyReports, onAddReport }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const currentWeek = getTaiwanWeekId();
  const currentCount = profile.weeklyReportUsage?.weekId === currentWeek ? profile.weeklyReportUsage.count : 0;
  const isLimitReached = currentCount >= 2 && profile.role !== 'admin';

  const handleGenerate = async () => {
    if (metrics.length === 0 && logs.length === 0) {
      alert("數據不足，請先輸入健身數據或訓練日誌。");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const result = await generateWeeklyReport(profile, metrics, logs, physiqueRecords);
      const textResult = result || "生成失敗，系統無效回饋。";
      setReport(textResult);
      
      const newReportData: WeeklyReportData = {
         id: Date.now().toString(),
         weekId: currentWeek,
         date: new Date().toLocaleDateString(),
         content: textResult
      };
      onAddReport(newReportData);

      onProfileUpdate({
        ...profile,
        weeklyReportUsage: { weekId: currentWeek, count: currentCount + 1 }
      });
    } catch (err: any) {
      setReport("與核心引擎連線異常。");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJpg = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#000000', scale: 2 });
      const link = document.createElement('a');
      link.download = `MATRIX_REPORT_${currentWeek}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (e) { alert("輸出失敗。"); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-40 px-4">
      <header className="flex flex-col md:flex-row items-end justify-between border-b-4 border-black pb-10 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Tactical Intelligence</p>
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">戰略週報</h2>
        </div>
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <p className="text-[9px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded uppercase tracking-widest">
            REPORT_LIMIT: {isLimitReached ? 'MAXED' : `${currentCount}/2`}
          </p>
          <div className="flex gap-2 w-full md:w-auto">
             <button
               onClick={handleGenerate}
               disabled={loading || isLimitReached}
               className={`flex-1 md:flex-none px-8 py-5 font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 shadow-xl ${loading || isLimitReached ? 'bg-gray-100 text-gray-300' : 'bg-black text-[#bef264] hover:bg-[#bef264] hover:text-black hover:-translate-y-1'}`}
             >
               {loading ? <span className="animate-pulse">Analyzing...</span> : <><Zap className="w-5 h-5 fill-current" /> 啟動 AI 戰略分析</>}
             </button>
             {report && (
                <button onClick={handleExportJpg} className="px-6 py-5 bg-white border border-gray-200 text-black hover:border-black font-black uppercase transition-all shadow-sm flex items-center justify-center"><ImageIcon className="w-5 h-5" /></button>
             )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-inner min-h-[500px] flex items-center justify-center">
          <TacticalLoader type="REPORT" title="正在深度檢索本週訓練數據" />
        </div>
      ) : report ? (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[900px]" ref={reportRef}>
            {/* 左側資訊區 */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white p-10 relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#bef264] blur-[100px] opacity-10 rounded-full"></div>
                  <div className="relative z-10 space-y-8">
                     <div className="w-20 h-20 bg-[#bef264] text-black flex items-center justify-center font-black text-3xl italic shadow-[0_0_20px_rgba(190,242,100,0.4)]">M</div>
                     <div>
                        <p className="text-[11px] font-black text-[#bef264] uppercase tracking-widest mb-1">Operative_ID</p>
                        <h3 className="text-4xl font-black uppercase tracking-tighter text-white">{profile.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1 opacity-70">UID_{profile.memberId}</p>
                     </div>
                     <div className="h-px bg-white/10 w-full"></div>
                     <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                           <span className="text-[10px] font-black uppercase text-gray-400">Tactical Goal</span>
                           <span className="text-sm font-bold text-[#bef264]">{GoalMetadata[profile.goal]?.label}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                           <span className="text-[10px] font-black uppercase text-gray-400">Current Streak</span>
                           <span className="text-sm font-bold text-white">{profile.loginStreak} Days</span>
                        </div>
                     </div>
                  </div>
               </div>
               {/* 數據卡片 */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl flex flex-col justify-between h-40 shadow-sm">
                     <Target className="w-8 h-8 text-black" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Target_Core</p>
                        <p className="text-xl font-black tracking-tight">{GoalMetadata[profile.goal]?.focus.split('與')[0]}</p>
                     </div>
                  </div>
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl flex flex-col justify-between h-40 shadow-sm">
                     <Activity className="w-8 h-8 text-black" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Status_LV</p>
                        <p className="text-xl font-black tracking-tight">Active Elite</p>
                     </div>
                  </div>
               </div>
            </div>
            {/* 右側報告區 */}
            <div className="lg:col-span-8 bg-[#000000] p-12 md:p-20 relative overflow-hidden shadow-2xl rounded-3xl flex flex-col border border-white/5">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#bef264] to-transparent opacity-50"></div>
               <div className="flex items-center gap-6 mb-16">
                  <div className="w-4 h-4 bg-[#bef264] shadow-[0_0_15px_#bef264] animate-pulse"></div>
                  <h3 className="text-xs font-mono font-black text-[#bef264] uppercase tracking-[0.5em]">Weekly Intelligence Briefing</h3>
               </div>
               <div className="relative z-10 flex-1 custom-scrollbar overflow-y-auto">
                  <RichTextParser text={report} />
               </div>
               <div className="mt-20 pt-10 border-t border-white/10 flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Authorized By</p>
                     <p className="text-2xl font-black text-white uppercase tracking-tighter">David AI Core 5.0</p>
                  </div>
                  <div className="flex flex-col items-end opacity-20 group hover:opacity-100 transition-opacity">
                    <Brain className="w-12 h-12 text-white mb-2" />
                    <span className="text-[8px] font-mono text-white">SYSTEM_STABLE_VER_3.0</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-100 p-20 flex flex-col items-center justify-center text-center space-y-8 rounded-3xl shadow-inner min-h-[500px]">
           <FileText className="w-20 h-20 text-gray-200" />
           <div className="max-w-md space-y-4">
              <h3 className="text-3xl font-black tracking-tighter uppercase">數據準備就緒</h3>
              <p className="text-gray-400 font-bold leading-relaxed text-lg">AI 戰略中樞正在待命。請點擊上方按鈕開始分析本週所有訓練、體態與飲食數據。</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;
