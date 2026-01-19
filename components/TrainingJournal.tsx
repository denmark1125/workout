
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutLog, WorkoutExercise, UserProfile, ExerciseType, DietLog } from '../types';
import { getTaiwanDate } from '../utils/calculations';
import { Trash2, Dumbbell, History as HistoryIcon, Clock, Zap, Wind, Target, Plus, Calendar as CalendarIcon, Save, RefreshCw, ChevronLeft, ChevronRight, Activity, Flame, Timer, Database, X } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  dietLogs?: DietLog[];
  onAddLog: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}

// 預設資料庫
const SUGGESTIONS = {
  STRENGTH: ['臥推', '深蹲', '硬舉', '肩推', '引體向上', '滑輪下拉', '划船', '二頭彎舉', '三頭下壓', '腿推', '腿伸展', '蝴蝶機', '飛鳥', '阿諾推舉'],
  CARDIO: ['跑步機', '橢圓機', '腳踏車', '划船機', '跳繩', '登山機', '戶外跑步', '游泳', 'HIIT']
};

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog, onDeleteLog, profile, onProfileUpdate }) => {
  // --- State Initialization ---
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  
  // Time States
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:30");

  // Input States
  const [exerciseType, setExerciseType] = useState<ExerciseType>('STRENGTH');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  
  // Custom Targets
  const [customTargets, setCustomTargets] = useState<string[]>([]);
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetName, setNewTargetName] = useState("");

  // Exercise Detail States
  const [exName, setExName] = useState('');
  const [exWeight, setExWeight] = useState(''); 
  const [exReps, setExReps] = useState('');     
  const [exSets, setExSets] = useState(4); // Default to 4
  const [exDuration, setExDuration] = useState(''); 
  const [exIntensity, setExIntensity] = useState(''); 
  
  const [pendingExercises, setPendingExercises] = useState<WorkoutExercise[]>([]);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  // Calendar State
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // --- Persistence Logic (Draft System & DB Sync) ---
  const getDraftKey = (date: string) => `matrix_draft_${profile.memberId}_${date}`;

  useEffect(() => {
    const dbLog = logs.find(l => l.date === selectedDate);
    
    if (dbLog) {
      setExistingLogId(dbLog.id);
      setPendingExercises(dbLog.exercises || []);
      setFeedback(dbLog.feedback || "");
      setStartTime(dbLog.startTime || "19:00");
      setEndTime(dbLog.endTime || "20:30");
      if (dbLog.focus) setSelectedTargets(dbLog.focus.split(' | '));
    } else {
      setExistingLogId(null);
      const savedDraft = localStorage.getItem(getDraftKey(selectedDate));
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setPendingExercises(draft.pendingExercises || []);
          setFeedback(draft.feedback || "");
          setStartTime(draft.startTime || "19:00");
          setEndTime(draft.endTime || "20:30");
          setSelectedTargets(draft.selectedTargets || []);
        } catch (e) { 
          setPendingExercises([]);
          setFeedback("");
        }
      } else {
        setPendingExercises([]);
        setFeedback("");
        setSelectedTargets([]);
      }
    }
  }, [selectedDate, logs, profile.memberId]);

  useEffect(() => {
    const draftData = {
      pendingExercises,
      feedback,
      startTime,
      endTime,
      selectedTargets,
      timestamp: Date.now()
    };
    localStorage.setItem(getDraftKey(selectedDate), JSON.stringify(draftData));
  }, [pendingExercises, feedback, startTime, endTime, selectedTargets, selectedDate, profile.memberId]);

  const clearDraft = () => {
    localStorage.removeItem(getDraftKey(selectedDate));
  };

  // --- Calculations ---

  const calculateTotalKcal = useMemo(() => {
    return pendingExercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
  }, [pendingExercises]);

  const calculateTotalDuration = useMemo(() => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 1440; 
      return diff;
    } catch(e) { return 0; }
  }, [startTime, endTime]);

  // --- Handlers ---

  const baseTargetOptions = ['胸', '背', '腿', '肩', '二頭', '三頭', '腹', '有氧', '全身', '伸展', '爆發力'];
  const allTargetOptions = [...baseTargetOptions, ...customTargets];

  const toggleTarget = (t: string) => {
    setSelectedTargets(prev => prev.includes(t) ? prev.filter(i => i !== t) : [...prev, t]);
  };

  const handleAddCustomTarget = () => {
    if (newTargetName.trim()) {
      setCustomTargets([...customTargets, newTargetName.trim()]);
      setSelectedTargets([...selectedTargets, newTargetName.trim()]);
      setNewTargetName("");
      setIsAddingTarget(false);
    }
  };

  const removeCustomTarget = (e: React.MouseEvent, t: string) => {
    e.stopPropagation();
    setCustomTargets(prev => prev.filter(item => item !== t));
    setSelectedTargets(prev => prev.filter(item => item !== t));
  };

  const addExercise = () => {
    if (!exName) return;
    const isStrength = exerciseType === 'STRENGTH';
    const newEx: WorkoutExercise = {
      id: Date.now().toString(),
      type: exerciseType,
      name: exName,
      weight: isStrength ? (parseFloat(exWeight) || 0) : 0,
      reps: isStrength ? (parseInt(exReps) || 0) : 0,
      sets: isStrength ? exSets : 1, 
      durationMinutes: !isStrength ? (parseInt(exDuration) || 0) : 0,
      distance: !isStrength ? (parseFloat(exIntensity) || 0) : 0, 
      caloriesBurned: isStrength 
        ? Math.round(((parseFloat(exWeight) || 0) * (parseInt(exReps) || 0) * exSets * 0.05) + (exSets * 10))
        : Math.round((parseInt(exDuration) || 0) * 10) 
    };
    setPendingExercises([...pendingExercises, newEx]);
    
    if (!isStrength) {
       setExDuration('');
       setExIntensity('');
    } else {
       // Optional: Clear weight/reps if desired, but user requested retention for previous fields. 
       // Keeping them allows rapid entry.
    }
  };

  const commitWorkout = () => {
    if (pendingExercises.length === 0) return;
    
    const newLog: WorkoutLog = {
      id: existingLogId || Date.now().toString(),
      date: selectedDate,
      startTime,
      endTime,
      focus: selectedTargets.join(' | ') || '綜合訓練',
      feedback,
      exercises: pendingExercises,
      durationMinutes: calculateTotalDuration,
      totalCaloriesBurned: calculateTotalKcal
    };

    onAddLog(newLog);
    clearDraft();
    alert(existingLogId ? "戰報更新完畢。" : "戰報已封存。");
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(calendarViewDate);
  const logDates = new Set(logs.map(l => l.date));

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-40 px-4 md:px-8 animate-in fade-in duration-500 font-sans">
      
      {/* 頂部控制台 (Header Console) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b-2 border-black pb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-3 h-3 bg-[#bef264] animate-pulse"></div>
             <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em]">Tactical Operation Center</p>
           </div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black uppercase leading-none">訓練日誌 <span className="text-gray-300">/ LOG</span></h2>
        </div>
        
        {/* 即時數據監控 */}
        <div className="flex gap-4 w-full xl:w-auto">
           <div className="flex-1 xl:w-48 bg-gray-50 border border-gray-200 p-4 flex flex-col justify-between h-24 hover:border-black transition-all group">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> 總時長 Duration</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-black group-hover:text-[#bef264] transition-colors">{calculateTotalDuration}</span>
                 <span className="text-[9px] font-black text-black uppercase">MIN</span>
              </div>
           </div>
           <div className="flex-1 xl:w-48 bg-black border border-black p-4 flex flex-col justify-between h-24 shadow-xl">
              <span className="text-[9px] font-black text-[#bef264] uppercase tracking-widest flex items-center gap-2"><Flame size={12}/> 消耗預估 Burn</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-white">{calculateTotalKcal}</span>
                 <span className="text-[9px] font-black text-gray-400 uppercase">KCAL</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 左側：戰術日曆與時間設定 (Calendar & Time) */}
        <div className="xl:col-span-4 space-y-8">
           {/* 日曆模組 */}
           <div className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-center mb-6">
                 <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth()-1, 1))} className="p-2 hover:bg-black hover:text-white transition-all"><ChevronLeft size={16}/></button>
                 <span className="text-lg font-black uppercase tracking-widest font-mono">
                    {calendarViewDate.getFullYear()}.{String(calendarViewDate.getMonth()+1).padStart(2,'0')}
                 </span>
                 <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth()+1, 1))} className="p-2 hover:bg-black hover:text-white transition-all"><ChevronRight size={16}/></button>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                 {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                 {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                 {Array.from({ length: days }).map((_, i) => {
                    const d = i + 1;
                    const dateStr = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const hasLog = logDates.has(dateStr);
                    const isSelected = selectedDate === dateStr;
                    
                    return (
                       <button 
                         key={d}
                         onClick={() => setSelectedDate(dateStr)}
                         className={`aspect-square flex flex-col items-center justify-center relative border transition-all hover:border-black
                           ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-transparent'}
                         `}
                       >
                          <span className="text-xs font-bold">{d}</span>
                          {hasLog && (
                             <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#bef264]' : 'bg-[#bef264] shadow-sm'}`}></div>
                          )}
                       </button>
                    );
                 })}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                 <div className="text-[10px] font-black uppercase text-gray-400">Selected Operation Date</div>
                 <div className="text-xl font-black font-mono bg-[#bef264] px-2 text-black">{selectedDate}</div>
              </div>
           </div>

           {/* 時間設定模組 */}
           <div className="border border-gray-200 p-6 bg-white hover:border-black transition-all group">
              <div className="flex items-center gap-3 mb-6">
                 <Timer size={18} className="text-black" />
                 <h3 className="text-sm font-black uppercase tracking-widest">任務時程 (TIMELINE)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">START</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-xl border-b-2 border-gray-200 focus:border-black outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">END</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-xl border-b-2 border-gray-200 focus:border-black outline-none transition-all" />
                 </div>
              </div>
           </div>
           
           {/* 訓練焦點 (Targets) */}
           <div className="border border-gray-200 p-6 bg-white hover:border-black transition-all">
              <div className="flex items-center gap-3 mb-4 justify-between">
                 <div className="flex items-center gap-3">
                   <Target size={18} className="text-black" />
                   <h3 className="text-sm font-black uppercase tracking-widest">肌群鎖定 (TARGETS)</h3>
                 </div>
                 <button onClick={() => setIsAddingTarget(true)} className="text-[10px] bg-black text-white px-2 py-1 hover:bg-[#bef264] hover:text-black transition-colors rounded">
                    + 自訂
                 </button>
              </div>
              
              {isAddingTarget && (
                <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-1">
                   <input 
                      autoFocus
                      value={newTargetName} 
                      onChange={e => setNewTargetName(e.target.value)}
                      placeholder="部位名稱..."
                      className="flex-1 bg-gray-50 border px-2 py-1 text-xs font-bold outline-none focus:border-black"
                   />
                   <button onClick={handleAddCustomTarget} className="bg-black text-[#bef264] px-2 text-xs font-bold">OK</button>
                   <button onClick={() => setIsAddingTarget(false)} className="bg-gray-200 text-gray-500 px-2 text-xs font-bold">X</button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                 {allTargetOptions.map(t => (
                    <button 
                      key={t} 
                      onClick={() => toggleTarget(t)}
                      className={`px-3 py-2 text-[10px] font-black border transition-all uppercase relative group/item ${selectedTargets.includes(t) ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
                    >
                       {t}
                       {customTargets.includes(t) && (
                          <span 
                            onClick={(e) => removeCustomTarget(e, t)}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover/item:opacity-100 hover:scale-110 transition-all z-10"
                          >
                            ×
                          </span>
                       )}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* 中間：輸入終端機 (Input Terminal) */}
        <div className="xl:col-span-5 space-y-6">
           <div className="border-4 border-black p-8 bg-white relative shadow-2xl">
              <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">Input Terminal</div>
              
              {/* Type Toggle */}
              <div className="flex border-b-2 border-black mb-8 mt-2">
                 <button onClick={() => setExerciseType('STRENGTH')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${exerciseType === 'STRENGTH' ? 'bg-[#bef264] text-black' : 'text-gray-400 hover:bg-gray-50'}`}>
                    <Dumbbell size={16}/> 重訓 Strength
                 </button>
                 <button onClick={() => setExerciseType('CARDIO')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${exerciseType === 'CARDIO' ? 'bg-[#bef264] text-black' : 'text-gray-400 hover:bg-gray-50'}`}>
                    <Wind size={16}/> 有氧 Cardio
                 </button>
              </div>

              {/* Autocomplete / Name Input */}
              <div className="relative mb-8 group">
                 <input 
                    value={exName}
                    onChange={e => setExName(e.target.value)}
                    placeholder={exerciseType === 'STRENGTH' ? "輸入動作名稱 (如: 臥推)..." : "輸入項目 (如: 跑步機)..."}
                    className="w-full text-3xl font-black text-black border-b-4 border-gray-200 py-2 outline-none focus:border-black placeholder:text-gray-200 uppercase transition-all"
                 />
                 {/* 預設選單 */}
                 <div className="flex flex-wrap gap-2 mt-3">
                    {SUGGESTIONS[exerciseType].map(s => (
                       <button 
                          key={s} 
                          onClick={() => setExName(s)}
                          className={`px-2 py-1 text-[9px] font-bold border uppercase transition-all ${exName === s ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                       >
                          {s}
                       </button>
                    ))}
                 </div>
              </div>

              {exerciseType === 'STRENGTH' ? (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">重量 (KG)</label>
                          <div className="relative">
                             <input 
                               type="number" step="0.5" 
                               value={exWeight} 
                               onChange={e => setExWeight(e.target.value)} 
                               className="w-full bg-gray-50 border-2 border-gray-200 p-3 font-mono font-black text-2xl outline-none focus:border-black text-center placeholder:text-gray-300" 
                               placeholder="KG" 
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">次數 (REPS)</label>
                          <div className="relative">
                             <input 
                               type="number" 
                               value={exReps} 
                               onChange={e => setExReps(e.target.value)} 
                               className="w-full bg-gray-50 border-2 border-gray-200 p-3 font-mono font-black text-2xl outline-none focus:border-black text-center placeholder:text-gray-300" 
                               placeholder="REPS" 
                             />
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex justify-between">
                          <span>組數 (SETS)</span>
                          <span className="text-black font-mono">{exSets}</span>
                       </label>
                       {/* 1-10 Grid Selector */}
                       <div className="grid grid-cols-10 gap-1">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                             <button 
                               key={n} 
                               onClick={() => setExSets(n)}
                               className={`aspect-square flex items-center justify-center font-mono font-bold text-sm border transition-all ${exSets === n ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-300 border-gray-200 hover:border-black hover:text-black'}`}
                             >
                                {n}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">時間 (MIN)</label>
                       <input 
                          type="number" 
                          value={exDuration} 
                          onChange={e => setExDuration(e.target.value)} 
                          className="w-full bg-blue-50/50 border-2 border-blue-100 p-3 font-mono font-black text-2xl outline-none focus:border-blue-500 text-center text-blue-900 placeholder:text-blue-200" 
                          placeholder="TIME" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">強度 (LV) / 距離 (M)</label>
                       <input 
                          type="number" 
                          value={exIntensity} 
                          onChange={e => setExIntensity(e.target.value)} 
                          className="w-full bg-blue-50/50 border-2 border-blue-100 p-3 font-mono font-black text-2xl outline-none focus:border-blue-500 text-center text-blue-900 placeholder:text-blue-200" 
                          placeholder="LV / M" 
                       />
                    </div>
                 </div>
              )}

              <button 
                onClick={addExercise}
                disabled={!exName}
                className="w-full mt-8 bg-black text-white py-5 font-black uppercase tracking-[0.3em] text-xs hover:bg-[#bef264] hover:text-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                 <Plus size={16} /> 加入暫存 (ADD TO QUEUE)
              </button>
           </div>

           {/* Feedback Input */}
           <div className="border border-gray-200 p-6 bg-white hover:border-black transition-all">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">今日訓練回饋 (DEBRIEF)</label>
              <textarea 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="紀錄今日狀況，如：肩膀微痠，狀況極佳..."
                className="w-full h-24 bg-gray-50 p-4 font-bold text-sm outline-none border border-transparent focus:border-black resize-none"
              />
           </div>
        </div>

        {/* 右側：佇列與封存 (Queue & Commit) */}
        <div className="xl:col-span-3 flex flex-col h-full">
           <div className="bg-white border-2 border-gray-200 flex flex-col h-[600px] xl:h-auto xl:flex-1 shadow-sm relative">
              <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Database size={12} className={existingLogId ? "text-green-500" : "text-gray-400"} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">待執行佇列 (QUEUE)</span>
                 </div>
                 <span className="bg-black text-white px-2 py-0.5 text-[10px] font-mono">{pendingExercises.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {pendingExercises.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-4">
                       <HistoryIcon size={48} />
                       <p className="text-xs font-black uppercase tracking-widest">NO ACTIVE DATA</p>
                    </div>
                 ) : (
                    pendingExercises.map((ex, idx) => (
                       <div key={ex.id} className="bg-white border border-gray-200 p-4 hover:border-black transition-all group relative shadow-sm">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-black text-sm uppercase">{ex.name}</h4>
                                <p className="text-[10px] font-mono text-gray-400 mt-1">
                                   {ex.type === 'STRENGTH' 
                                      ? `${ex.weight}KG × ${ex.reps} × ${ex.sets}` 
                                      : `${ex.durationMinutes}MIN (Lv.${ex.distance})`}
                                </p>
                             </div>
                             <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black group-hover:bg-[#bef264] transition-colors"></div>
                       </div>
                    ))
                 )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-gray-400">Total Sets</span>
                    <span className="font-mono font-bold">{pendingExercises.reduce((a,b) => a + (b.sets || 1), 0)}</span>
                 </div>
                 <button 
                   onClick={commitWorkout}
                   disabled={pendingExercises.length === 0}
                   className="w-full py-4 bg-[#bef264] text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-black hover:text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                    <Save size={16} /> {existingLogId ? '更新戰報 (UPDATE)' : '戰略封存 (COMMIT)'}
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TrainingJournal;
