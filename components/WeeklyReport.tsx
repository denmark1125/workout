
import React, { useState, useRef } from 'react';
import { UserProfile, UserMetrics, WorkoutLog, PhysiqueRecord, GoalMetadata, WeeklyReportData } from '../types';
import { generateWeeklyReport } from '../services/geminiService';
import { getTaiwanWeekId } from '../utils/calculations';
import { FileText, Zap, ArrowRight, Loader2, Target, Brain, Activity, User, Calendar, Image as ImageIcon, ChevronDown, History } from 'lucide-react';
import html2canvas from 'html2canvas';

interface WeeklyReportProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  logs: WorkoutLog[];
  physiqueRecords: PhysiqueRecord[];
  onProfileUpdate: (p: UserProfile) => void;
  weeklyReports: WeeklyReportData[];
  onAddReport: (r: WeeklyReportData) => void;
}

// === Rich Text Parser for Beautiful Rendering ===
const RichTextParser: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Pre-process: Remove common markdown clutter that AI might output
  const cleanText = text
    .replace(/\*\*\*/g, '') // Remove triple asterisks
    .replace(/```/g, '') // Remove code blocks
    .replace(/##/g, ''); // Remove header markers (we handle headers by logic)

  const lines = cleanText.split('\n').filter(line => line.trim() !== '');
  
  return (
    <div className="space-y-6">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // 1. Headers (Often starts with "###" or is short and ends with colon)
        if (trimmed.startsWith('###') || (trimmed.length < 30 && trimmed.endsWith('：')) || (trimmed.length < 30 && trimmed.endsWith(':'))) {
           return (
             <h3 key={index} className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white mt-8 mb-4 border-l-4 border-[#bef264] pl-4">
               {trimmed.replace(/###/g, '').replace(/\*\*/g, '')}
             </h3>
           );
        }

        // 2. Bullet Points
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
           // Highlight bold parts within the list item
           const content = trimmed.substring(1).trim();
           return (
             <div key={index} className="flex gap-4 items-start pl-2 group">
                <ArrowRight className="w-4 h-4 text-[#bef264] mt-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                <p className="text-gray-300 font-medium leading-relaxed text-sm md:text-base">
                  {content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <span key={i} className="text-white font-bold mx-1 border-b border-[#bef264]/30">{part.replace(/\*\*/g, '')}</span> 
                      : part
                  )}
                </p>
             </div>
           );
        }

        // 3. Regular Paragraphs
        return (
           <p key={index} className="text-gray-400 leading-relaxed text-sm md:text-base pl-6 border-l border-white/10">
              {trimmed.split(/(\*\*.*?\*\*)/).map((part, i) => 
                 part.startsWith('**') && part.endsWith('**') 
                   ? <span key={i} className="text-[#bef264] font-bold mx-1">{part.replace(/\*\*/g, '')}</span> 
                   : part
              )}
           </p>
        );
      })}
    </div>
  );
};

const WeeklyReport: React.FC<WeeklyReportProps> = ({ profile, metrics, logs, physiqueRecords, onProfileUpdate, weeklyReports, onAddReport }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const currentWeek = getTaiwanWeekId();
  const currentCount = profile.weeklyReportUsage?.weekId === currentWeek ? profile.weeklyReportUsage.count : 0;
  const isLimitReached = currentCount >= 2 && profile.role !== 'admin';

  // Load latest report if exists and we haven't generated one this session
  React.useEffect(() => {
     if (!report && weeklyReports.length > 0) {
        setReport(weeklyReports[0].content);
     }
  }, [weeklyReports]);

  const handleGenerate = async () => {
    if (metrics.length === 0 && logs.length === 0) {
      alert("數據不足，請先輸入健身數據或訓練日誌。");
      return;
    }
    setLoading(true);
    try {
      const result = await generateWeeklyReport(profile, metrics, logs, physiqueRecords);
      const textResult = result || "生成失敗，系統無效回饋。";
      setReport(textResult);
      
      // Auto-save the report
      if (profile.role !== 'admin' && !textResult.includes('存取限制') && !textResult.includes('流量管制')) {
        const newReportData: WeeklyReportData = {
           id: Date.now().toString(),
           weekId: currentWeek,
           date: new Date().toLocaleDateString(),
           content: textResult
        };
        onAddReport(newReportData);

        onProfileUpdate({
          ...profile,
          weeklyReportUsage: {
            weekId: currentWeek,
            count: currentCount + 1
          }
        });
      }
    } catch (err: any) {
      setReport(err.message || "與核心引擎連線異常，請檢查網路狀態。");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJpg = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#111111',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `MATRIX_REPORT_${currentWeek}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (e) {
      alert("輸出戰術圖卡失敗，請重試。");
    }
  };

  const selectReport = (r: WeeklyReportData) => {
     setReport(r.content);
     setShowHistory(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 pb-40 px-4">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row items-end justify-between border-b-4 border-black pb-10 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Tactical Intelligence</p>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase leading-none">戰略週報</h2>
        </div>
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-sm">
            WEEKLY LIMIT: {isLimitReached ? 'MAXED' : `${currentCount}/2`}
          </p>
          <div className="flex gap-2 w-full md:w-auto">
             <button
               onClick={handleGenerate}
               disabled={loading || isLimitReached}
               className={`flex-1 md:flex-none px-6 py-5 font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 shadow-xl transform hover:-translate-y-1
                 ${loading || isLimitReached ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-[#bef264] hover:bg-[#bef264] hover:text-black'}`}
             >
               {loading ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" /> 
                   <span className="animate-pulse">Analyzing...</span>
                 </>
               ) : (
                 <><Zap className="w-5 h-5 fill-current" /> 生成戰略報告</>
               )}
             </button>
             
             {report && (
                <button
                  onClick={handleExportJpg}
                  className="px-5 py-5 bg-white border border-gray-200 text-black hover:border-black font-black uppercase transition-all shadow-sm flex items-center justify-center"
                  title="輸出圖卡"
                >
                   <ImageIcon className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>
      </header>

      {/* History Dropdown */}
      {weeklyReports.length > 0 && (
         <div className="relative z-20">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 shadow-sm hover:border-black transition-all w-full md:w-80 justify-between group">
               <div className="flex items-center gap-3">
                  <History size={16} className="text-gray-400 group-hover:text-black" />
                  <span className="text-xs font-black uppercase tracking-widest">歷史週報 ({weeklyReports.length})</span>
               </div>
               <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
               <div className="absolute top-full left-0 w-full md:w-80 bg-white border border-black shadow-xl mt-2 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                  {weeklyReports.map(r => (
                     <button key={r.id} onClick={() => selectReport(r)} className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-gray-800">{r.date}</span>
                           <span className="text-[9px] font-mono text-gray-400">{r.weekId}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">{r.content.substring(0, 30)}...</p>
                     </button>
                  ))}
               </div>
            )}
         </div>
      )}

      {report ? (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[800px]" ref={reportRef}>
            
            {/* Left Column: Physiological DNA (Profile Card) */}
            <div className="lg:col-span-4 space-y-6">
               {/* Identity Card */}
               <div className="bg-black text-white p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
                  <div className="relative z-10 space-y-6">
                     <div className="w-16 h-16 bg-[#bef264] text-black flex items-center justify-center font-black text-2xl italic">M</div>
                     <div>
                        <p className="text-[10px] font-black text-[#bef264] uppercase tracking-widest mb-1">Operative ID</p>
                        <h3 className="text-3xl font-black uppercase tracking-tighter">{profile.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">@{profile.memberId}</p>
                     </div>
                     <div className="h-px bg-white/20 w-full"></div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gray-500">Goal</span>
                           <span className="text-sm font-bold">{GoalMetadata[profile.goal]?.label}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gray-500">Metrics</span>
                           <span className="text-sm font-bold">{profile.height}cm / {metrics[metrics.length-1]?.weight || '-'}kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gray-500">Streak</span>
                           <span className="text-sm font-bold text-[#bef264]">{profile.loginStreak} Days</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Stat Grid */}
               <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-gray-200 p-6 flex flex-col justify-between h-32 hover:border-black transition-colors">
                     <Target className="w-6 h-6 text-black mb-2" />
                     <div>
                        <p className="text-[9px] font-black uppercase text-gray-400">Target Focus</p>
                        <p className="text-lg font-black leading-none">{GoalMetadata[profile.goal]?.focus.split('與')[0]}</p>
                     </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 flex flex-col justify-between h-32 hover:border-black transition-colors">
                     <Activity className="w-6 h-6 text-black mb-2" />
                     <div>
                        <p className="text-[9px] font-black uppercase text-gray-400">Activity</p>
                        <p className="text-lg font-black leading-none">Level {profile.activityLevel}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Tactical Report (The Main Content) */}
            <div className="lg:col-span-8 bg-[#111] text-gray-200 p-10 md:p-16 relative overflow-hidden shadow-2xl rounded-sm flex flex-col">
               {/* Background Deco */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bef264] to-transparent"></div>
               <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-[#bef264] to-transparent"></div>
               
               <div className="flex items-center gap-4 mb-12">
                  <div className="w-3 h-3 bg-[#bef264] animate-pulse"></div>
                  <h3 className="text-sm font-mono font-black text-[#bef264] uppercase tracking-[0.4em]">Tactical Analysis Report</h3>
               </div>

               <div className="relative z-10 flex-1">
                  <RichTextParser text={report} />
               </div>

               <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-end">
                  <div>
                     <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Authorized By</p>
                     <p className="text-xl font-black text-white uppercase tracking-tighter">David AI Core</p>
                  </div>
                  <Brain className="w-10 h-10 text-white/10" />
               </div>
            </div>

          </div>
        </div>
      ) : (
        /* Standby State */
        <div className="grid grid-cols-1 md:grid-cols-12 bg-white gap-px p-px shadow-xl rounded-sm overflow-hidden border border-gray-200 min-h-[400px]">
           <div className="md:col-span-4 bg-gray-50 p-16 flex flex-col items-center justify-center text-center space-y-6">
              <FileText className="w-12 h-12 text-gray-300" />
              <div>
                <p className="text-2xl font-black text-black tracking-tighter uppercase mb-2">數據待命中</p>
                <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.5em]">SYSTEM STANDBY</p>
              </div>
           </div>
           <div className="md:col-span-8 bg-white p-12 md:p-20 flex flex-col justify-center space-y-10 border-l border-gray-100">
             <div className="space-y-4 max-w-lg">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Ready for Analysis</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                   AI 健身戰略中樞正在待命。啟動後，系統將整合您的 <span className="text-black font-bold">訓練日誌</span>、<span className="text-black font-bold">生理矩陣</span> 與 <span className="text-black font-bold">視覺診斷</span>，生成一份專屬於您的戰術週報。
                </p>
             </div>
             <div className="flex gap-4">
                <div className="h-1 w-12 bg-black"></div>
                <div className="h-1 w-4 bg-gray-200"></div>
                <div className="h-1 w-4 bg-gray-200"></div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;
