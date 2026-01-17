
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutLog, WorkoutExercise, UserProfile, ExerciseType } from '../types';
import { getDailyFeedback } from '../services/geminiService';
import { getTaiwanDate } from '../utils/calculations';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, MessageSquare, Zap, Loader2, RotateCcw, History, Save, Edit2, Check, Tag, ChevronUp, ChevronDown, Activity, Dumbbell, Flame } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  onAddLog: (log: WorkoutLog) => void;
  onUpdateLog?: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog, onUpdateLog, onDeleteLog, profile, onProfileUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // 登錄模組狀態
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocusInput, setCustomFocusInput] = useState('');
  const [userCustomFocuses, setUserCustomFocuses] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  // 動作輸入狀態
  const [exerciseType, setExerciseType] = useState<ExerciseType>('STRENGTH'); // 新增類型切換
  const [exName, setExName] = useState('');
  
  // Strength Data
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');
  const [exSets, setExSets] = useState(1);
  
  // Cardio Data
  const [exDuration, setExDuration] = useState(''); // minutes
  const [exDistance, setExDistance] = useState(''); // km
  const [exIntensity, setExIntensity] = useState<'LOW'|'MED'|'HIGH'>('MED');

  const [pendingExercises, setPendingExercises] = useState<WorkoutExercise[]>([]);
  
  // 編輯歷史/暫存狀態
  const [isEditingHistory, setIsEditingHistory] = useState<string | null>(null);
  const [editingExId, setEditingExId] = useState<string | null>(null);

  const focusPresets = ['胸', '背', '腿', '肩', '手', '二頭', '三頭', '核心', '有氧', '拉伸'];

  // 1. 自動草稿恢復與存檔
  useEffect(() => {
    const savedDraft = localStorage.getItem(`matrix_draft_${profile.memberId}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (!isEditingHistory) {
          setPendingExercises(draft.exercises || []);
          setSelectedFocus(draft.selectedFocus || []);
          setUserCustomFocuses(draft.userCustomFocuses || []);
          setFeedback(draft.feedback || '');
          setStartTime(draft.startTime || "18:00");
          setEndTime(draft.endTime || "19:00");
        }
      } catch (e) { console.error("Draft restore failed"); }
    }
  }, [profile.memberId, isEditingHistory]);

  useEffect(() => {
    if (isEditingHistory) return;
    const draft = { exercises: pendingExercises, selectedFocus, userCustomFocuses, feedback, startTime, endTime };
    localStorage.setItem(`matrix_draft_${profile.memberId}`, JSON.stringify(draft));
  }, [pendingExercises, selectedFocus, userCustomFocuses, feedback, startTime, endTime, isEditingHistory]);

  // 2. 智能動作建議
  const exerciseSuggestions = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.exercises.forEach(ex => {
        // Only suggest matching type
        if (exerciseType === 'CARDIO' && ex.type !== 'CARDIO') return;
        if (exerciseType === 'STRENGTH' && ex.type === 'CARDIO') return;
        counts[ex.name] = (counts[ex.name] || 0) + 1;
      });
    });
    
    // Default suggestions if empty
    if (Object.keys(counts).length === 0) {
       if (exerciseType === 'CARDIO') return ['跑步機', '飛輪', '划船機', '橢圓機', '跳繩', '游泳', '爬樓梯'];
       return ['深蹲', '硬舉', '臥推', '肩推', '引體向上', '划船'];
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }, [logs, exerciseType]);

  const duration = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff < 0 ? diff + 1440 : diff;
  }, [startTime, endTime]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  }, [currentMonth]);

  const toggleFocus = (f: string) => {
    setSelectedFocus(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]);
  };

  const handleAddCustomFocus = () => {
    const val = customFocusInput.trim();
    if (val && !focusPresets.includes(val) && !userCustomFocuses.includes(val)) {
      setUserCustomFocuses([...userCustomFocuses, val]);
      setSelectedFocus([...selectedFocus, val]);
      setCustomFocusInput('');
    }
  };

  const removeCustomFocus = (f: string) => {
    setUserCustomFocuses(userCustomFocuses.filter(i => i !== f));
    setSelectedFocus(selectedFocus.filter(i => i !== f));
  };

  // 簡單的有氧熱量估算 (METs)
  const calculateCardioCalories = (duration: number, intensity: string) => {
     let mets = 3;
     if (intensity === 'LOW') mets = 4; // 快走
     if (intensity === 'MED') mets = 8; // 慢跑
     if (intensity === 'HIGH') mets = 11; // 衝刺/HIIT
     // Formula: Kcal = METs * weight(kg) * time(hr)
     // Use profile weight or default 70
     // Assuming accessing weight from outside is hard here, use rough estimate or pass metrics. 
     // For now, let's use 75kg as base if we can't get metric easily, or simplified formula.
     // Simplified: Intensity Factor * Duration
     const factors = { 'LOW': 5, 'MED': 8, 'HIGH': 12 }; // kcal per min approx
     return Math.round(factors[intensity as keyof typeof factors] * duration);
  };

  const addOrUpdateExercise = () => {
    if (!exName) return;
    
    let calories = 0;
    if (exerciseType === 'CARDIO') {
       calories = calculateCardioCalories(parseInt(exDuration) || 0, exIntensity);
    } else {
       // Strength estimated very roughly: 4 kcal per min of active work.
       // Assume 1 set takes 1.5 min
       calories = exSets * 1.5 * 5; 
    }

    const newExData: WorkoutExercise = {
      id: editingExId || Date.now().toString(),
      type: exerciseType,
      name: exName,
      weight: parseFloat(exWeight) || 0,
      reps: parseInt(exReps) || 0,
      sets: exSets,
      durationMinutes: parseInt(exDuration) || 0,
      distance: parseFloat(exDistance) || 0,
      caloriesBurned: calories
    };
    
    if (editingExId) {
      setPendingExercises(prev => prev.map(ex => ex.id === editingExId ? newExData : ex));
      setEditingExId(null);
    } else {
      setPendingExercises([...pendingExercises, newExData]);
    }
    
    // Reset Form
    setExWeight(''); setExReps(''); setExSets(1);
    setExDuration(''); setExDistance(''); setExIntensity('MED');
  };

  const handleEditHistory = (log: WorkoutLog) => {
    setIsEditingHistory(log.id);
    setStartTime(log.startTime);
    setEndTime(log.endTime);
    setPendingExercises(log.exercises);
    setFeedback(log.feedback || '');
    const focuses = (log.focus || '').split(', ').filter(f => f.trim() !== '');
    setSelectedFocus(focuses);
    const customs = focuses.filter(f => !focusPresets.includes(f));
    setUserCustomFocuses(Array.from(new Set([...userCustomFocuses, ...customs])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditExercise = (ex: WorkoutExercise) => {
     setEditingExId(ex.id);
     setExerciseType(ex.type || 'STRENGTH');
     setExName(ex.name);
     
     if (ex.type === 'CARDIO') {
        setExDuration(ex.durationMinutes?.toString() || '');
        setExDistance(ex.distance?.toString() || '');
        // Infer intensity if not saved? For now simple logic.
        setExIntensity('MED'); 
     } else {
        setExWeight(ex.weight.toString());
        setExReps(ex.reps.toString());
        setExSets(ex.sets);
     }
     
     document.getElementById('exercise-input-zone')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCommit = async () => {
    if (pendingExercises.length === 0) {
      alert("David教練: 至少需新增一個動作項目。");
      return;
    }
    
    setIsAiProcessing(true);
    const logFocus = selectedFocus.filter(f => f.trim() !== '').join(', ');
    const totalBurn = pendingExercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
    
    const newLog: WorkoutLog = {
      id: isEditingHistory || Date.now().toString(),
      date: selectedDate,
      startTime, endTime,
      focus: logFocus,
      feedback: feedback,
      durationMinutes: duration,
      exercises: pendingExercises,
      totalCaloriesBurned: totalBurn
    };

    if (isEditingHistory && onUpdateLog) {
      onUpdateLog(newLog);
      setIsEditingHistory(null);
    } else {
      onAddLog(newLog);
    }

    const today = getTaiwanDate();
    let aiResponse = "";
    
    if (selectedDate === today) {
       aiResponse = await getDailyFeedback(profile, newLog);
       if (profile.lastDailyFeedbackDate !== today) {
         onProfileUpdate({ ...profile, lastDailyFeedbackDate: today });
       }
    } else {
       aiResponse = isEditingHistory ? "David教練: 歷史軌跡已修正。" : "David教練: 紀錄已封存。";
    }

    setFeedbackMsg(aiResponse);
    setShowCoachFeedback(true);
    setIsAiProcessing(false);
    
    localStorage.removeItem(`matrix_draft_${profile.memberId}`);
    setTimeout(() => setShowCoachFeedback(false), 4000);

    setPendingExercises([]);
    setFeedback('');
    setSelectedFocus([]);
    setExName('');
    setExWeight('');
    setExReps('');
    setExSets(1);
    setExDuration(''); setExDistance('');
  };

  const todayLogs = logs.filter(l => l.date === selectedDate);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8 pb-40 px-2 md:px-0">
      <div className="flex flex-col lg:flex-row bg-white border border-gray-100 shadow-2xl rounded-sm overflow-hidden">
        
        {/* 左側：日曆與歷史紀錄 */}
        <div className="lg:w-80 p-6 border-r border-gray-100 bg-[#fcfcfc]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black">{currentMonth.getFullYear()}年 {currentMonth.getMonth()+1}月</h3>
            <div className="flex gap-2">
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))} className="p-1 hover:bg-gray-100"><ChevronLeft size={16}/></button>
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))} className="p-1 hover:bg-gray-100"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-2 mb-8">
            {['日','一','二','三','四','五','六'].map(d => <span key={d} className="text-[10px] font-black text-gray-300 uppercase">{d}</span>)}
            {Array.from({length: daysInMonth.firstDay}).map((_, i) => <div key={i}/>)}
            {Array.from({length: daysInMonth.days}).map((_, i) => {
              const d = i + 1;
              const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const isSelected = selectedDate === ds;
              const hasLog = logs.some(l => l.date === ds);
              return (
                <button 
                  key={d} onClick={() => { setSelectedDate(ds); setIsEditingHistory(null); }}
                  className={`relative w-8 h-8 flex items-center justify-center text-xs font-black mx-auto transition-all ${isSelected ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
                >
                  {d}
                  {hasLog && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-lime-400 rounded-full"></div>}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">今日航跡 ({todayLogs.length})</p>
             {todayLogs.length === 0 ? (
               <p className="text-[10px] text-gray-300 italic py-4 text-center">本日尚無紀錄</p>
             ) : (
               todayLogs.map(log => (
                 <div key={log.id} className="bg-white border border-gray-50 p-4 shadow-sm group relative hover:border-black transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[11px] font-black uppercase text-gray-900 truncate pr-4">{log.focus || '一般訓練'}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditHistory(log)} className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={12}/></button>
                        <button onClick={() => onDeleteLog(log.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                       <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">{log.startTime}-{log.endTime}</p>
                       <div className="text-right">
                         <p className="text-[9px] font-black text-gray-300">{log.exercises.length} EX</p>
                         {log.totalCaloriesBurned ? <p className="text-[8px] font-bold text-lime-600">-{log.totalCaloriesBurned} kcal</p> : null}
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* 右側：登錄模組 */}
        <div className="flex-1 p-6 md:p-10 space-y-8 relative">
          {isEditingHistory && (
            <div className="absolute top-4 right-10 flex items-center gap-3">
               <div className="bg-blue-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">修正歷史紀錄中</div>
               <button onClick={() => { setIsEditingHistory(null); setPendingExercises([]); setExName(''); }} className="text-gray-400 hover:text-black"><X size={18}/></button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 flex items-center justify-center shadow-lg transition-colors ${isEditingHistory ? 'bg-blue-600 text-white' : 'bg-black text-[#bef264]'}`}><Zap size={20}/></div>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">
                  {isEditingHistory ? 'MOD_LOG_SYSTEM' : '快速登錄系統'}
                </h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Training Draft Auto-Saved</p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border border-gray-100 shrink-0">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center">DURATION</p>
              <p className="text-xl font-black font-mono leading-none text-center">{duration}<span className="text-[10px] ml-1 uppercase">min</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-8">
              {/* 時間區塊 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 min-w-0">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block">開始時間 START</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                      className="w-full bg-gray-50 border border-transparent px-2 py-4 text-lg font-black font-mono outline-none focus:bg-white focus:border-black transition-all text-center appearance-none" 
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block">結束時間 END</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                      className="w-full bg-gray-50 border border-transparent px-2 py-4 text-lg font-black font-mono outline-none focus:bg-white focus:border-black transition-all text-center appearance-none" 
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* 訓練焦點 */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">訓練焦點 TARGET (可複選)</label>
                <div className="flex flex-wrap gap-2">
                   {focusPresets.map(f => (
                     <button key={f} onClick={() => toggleFocus(f)} className={`px-3 py-2 text-[10px] font-black transition-all border ${selectedFocus.includes(f) ? 'bg-black text-[#bef264] border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}>
                        {f}
                     </button>
                   ))}
                   
                   {userCustomFocuses.map(f => (
                     <div key={f} className="relative group">
                        <button onClick={() => toggleFocus(f)} className={`px-3 py-2 text-[10px] font-black transition-all border ${selectedFocus.includes(f) ? 'bg-[#bef264] text-black border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          {f}
                        </button>
                        <button onClick={() => removeCustomFocus(f)} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                           <X size={8} />
                        </button>
                     </div>
                   ))}

                   <div className="flex border border-dashed border-gray-200 focus-within:border-black transition-all">
                      <input 
                        type="text"
                        value={customFocusInput}
                        onChange={e => setCustomFocusInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomFocus())}
                        placeholder="自定義..."
                        className="w-20 px-2 py-2 text-[10px] font-black outline-none placeholder:text-gray-300"
                      />
                      <button onClick={handleAddCustomFocus} className="px-2 text-gray-400 hover:text-black transition-colors">
                         <Plus size={12} />
                      </button>
                   </div>
                </div>
              </div>

              {/* 核心動作輸入 */}
              <div id="exercise-input-zone" className="bg-gray-50 p-6 space-y-6 rounded-sm border border-gray-100 shadow-inner relative">
                 <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       {editingExId ? <Edit2 size={12} className="text-blue-500" /> : <Plus size={12} className="text-lime-500" />}
                       {editingExId ? '動作數據修正' : '動作即時速記'}
                    </p>
                    {pendingExercises.length > 0 && !editingExId && (
                      <button onClick={() => { 
                        const last = pendingExercises[pendingExercises.length - 1]; 
                        setExerciseType(last.type || 'STRENGTH');
                        setExName(last.name); 
                        if(last.type === 'CARDIO') {
                            setExDuration(last.durationMinutes?.toString() || '');
                            setExDistance(last.distance?.toString() || '');
                        } else {
                            setExWeight(last.weight.toString()); setExReps(last.reps.toString()); setExSets(last.sets);
                        }
                      }} className="text-[9px] font-black text-gray-400 uppercase hover:text-black flex items-center gap-1">
                        <RotateCcw size={10} /> 複製上一組
                      </button>
                    )}
                 </div>

                 {/* Type Toggle */}
                 <div className="flex bg-white border border-gray-200 p-1 rounded-sm">
                    <button 
                      onClick={() => setExerciseType('STRENGTH')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase transition-all ${exerciseType === 'STRENGTH' ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
                    >
                      <Dumbbell size={14} /> 重量訓練 STRENGTH
                    </button>
                    <button 
                      onClick={() => setExerciseType('CARDIO')} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase transition-all ${exerciseType === 'CARDIO' ? 'bg-black text-[#bef264] shadow-md' : 'text-gray-400'}`}
                    >
                      <Activity size={14} /> 有氧代謝 CARDIO
                    </button>
                 </div>

                 {/* Suggestions */}
                 <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto no-scrollbar">
                    {exerciseSuggestions.map(tag => (
                      <button key={tag} onClick={() => setExName(tag)} className={`px-2 py-1 text-[9px] font-bold border transition-all whitespace-nowrap ${exName === tag ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>
                        #{tag}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-6">
                    <input 
                      placeholder={exerciseType === 'STRENGTH' ? "輸入動作名稱 (如：槓鈴臥推)" : "輸入項目 (如：跑步機 10K)"}
                      value={exName} 
                      onChange={e => setExName(e.target.value)} 
                      className="w-full bg-white px-5 py-5 text-lg font-black shadow-sm outline-none border border-transparent focus:border-black" 
                    />
                    
                    {exerciseType === 'STRENGTH' ? (
                       <>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block">重量 WEIGHT (KG)</label>
                             <input type="number" step="0.5" placeholder="0" value={exWeight} onChange={e => setExWeight(e.target.value)} className="w-full bg-white p-4 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-2xl" />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block">次數 REPS</label>
                             <input type="number" placeholder="0" value={exReps} onChange={e => setExReps(e.target.value)} className="w-full bg-white p-4 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-2xl" />
                           </div>
                         </div>

                         <div className="space-y-3">
                           <div className="flex justify-between items-center px-1">
                             <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest">組數 SETS (滑動選擇)</label>
                             <span className="text-xl font-black font-mono text-black">{exSets} <span className="text-[10px] uppercase text-gray-400">組</span></span>
                           </div>
                           <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                              {[1,2,3,4,5,6,7,8,9,10].map(s => (
                                <button key={s} onClick={() => setExSets(s)} className={`flex-shrink-0 w-10 h-10 text-xs font-black transition-all border ${exSets === s ? 'bg-black text-[#bef264] border-black scale-105' : 'bg-white text-gray-300 border-gray-100 hover:border-gray-200'}`}>
                                  {s}
                                </button>
                              ))}
                           </div>
                         </div>
                       </>
                    ) : (
                       // Cardio Inputs
                       <>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                               <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block">時間 DURATION (MIN)</label>
                               <input type="number" placeholder="0" value={exDuration} onChange={e => setExDuration(e.target.value)} className="w-full bg-white p-4 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-2xl" />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block">距離 DISTANCE (KM)</label>
                               <input type="number" step="0.1" placeholder="0" value={exDistance} onChange={e => setExDistance(e.target.value)} className="w-full bg-white p-4 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-2xl" />
                             </div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest block mb-2">強度 INTENSITY</label>
                             <div className="flex gap-2">
                                {(['LOW', 'MED', 'HIGH'] as const).map(level => (
                                   <button 
                                     key={level} 
                                     onClick={() => setExIntensity(level)}
                                     className={`flex-1 py-3 text-[10px] font-black border uppercase transition-all ${exIntensity === level ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                                   >
                                     {level}
                                   </button>
                                ))}
                             </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-3 bg-gray-100/50 text-gray-400">
                             <Flame size={12} className="text-orange-400" />
                             <span className="text-[10px] font-black uppercase">預估消耗: ~{Math.round((parseInt(exDuration)||0) * (exIntensity==='LOW'?5:exIntensity==='MED'?8:12))} kcal</span>
                          </div>
                       </>
                    )}

                    <div className="flex gap-2 pt-2">
                       {editingExId && (
                         <button onClick={() => { setEditingExId(null); setExName(''); setExWeight(''); setExReps(''); setExSets(1); setExDuration(''); setExDistance(''); }} className="flex-1 bg-gray-100 text-gray-400 py-4 text-[10px] font-black uppercase tracking-widest">取消</button>
                       )}
                       <button onClick={addOrUpdateExercise} disabled={!exName} className={`flex-[2] py-5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editingExId ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-black text-[#bef264] hover:bg-lime-400 hover:text-black shadow-lg'} disabled:opacity-20`}>
                          {editingExId ? <><Check size={16}/> 更新數據</> : <><Plus size={16}/> 暫存此組動作</>}
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex flex-col h-full space-y-6">
              {/* 暫存列表清單 */}
              <div className="flex-1 min-h-[400px] border border-gray-100 bg-[#fcfcfc] rounded-sm flex flex-col shadow-inner">
                 <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">SESSION_BUFFER</p>
                    <span className="text-[10px] font-mono text-black font-black bg-lime-400 px-2 py-0.5">{pendingExercises.length} ITEMS</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {pendingExercises.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale py-20">
                         <History size={40} className="mb-4" />
                         <p className="text-[10px] font-black uppercase tracking-widest">等待紀錄輸入...</p>
                      </div>
                    ) : (
                      [...pendingExercises].reverse().map(ex => (
                        <div key={ex.id} className={`group flex items-center justify-between bg-white p-4 border transition-all ${editingExId === ex.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-300'}`}>
                           <div className="flex-1 cursor-pointer" onClick={() => handleEditExercise(ex)}>
                              <div className="flex items-center gap-2 mb-1">
                                 {ex.type === 'CARDIO' && <span className="text-[8px] font-black bg-orange-100 text-orange-500 px-1 rounded-sm">CARDIO</span>}
                                 <p className="text-xs font-black uppercase text-gray-800">{ex.name}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {ex.type === 'CARDIO' ? (
                                   <>
                                     <span className="text-xl font-mono font-black text-black">{ex.durationMinutes}<span className="text-[9px] text-gray-400 ml-1 uppercase">min</span></span>
                                     <span className="text-xs text-gray-300">/</span>
                                     <span className="text-xl font-mono font-black text-lime-600">{ex.distance || 0}<span className="text-[9px] text-gray-400 ml-1 uppercase">km</span></span>
                                   </>
                                ) : (
                                   <>
                                     <span className="text-xl font-mono font-black text-black">{ex.weight}<span className="text-[9px] text-gray-400 ml-1 uppercase">kg</span></span>
                                     <span className="text-xs text-gray-300">/</span>
                                     <span className="text-xl font-mono font-black text-black">{ex.reps}<span className="text-[9px] text-gray-400 ml-1 uppercase">次</span></span>
                                     <span className="text-xs text-gray-300">/</span>
                                     <span className="text-xl font-mono font-black text-lime-600">{ex.sets}<span className="text-[9px] text-gray-400 ml-1 uppercase">組</span></span>
                                   </>
                                )}
                              </div>
                           </div>
                           <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="David 教練: 今天的肌肉充血感與神經疲勞程度如何？"
                  className="w-full bg-gray-50 p-5 text-sm font-bold outline-none focus:bg-white border border-transparent focus:border-black resize-none h-32 transition-all shadow-inner"
                />
                
                <button 
                  onClick={handleCommit} 
                  disabled={isAiProcessing || pendingExercises.length === 0}
                  className={`w-full py-6 font-black text-xs tracking-[0.5em] uppercase transition-all shadow-2xl active:scale-95 disabled:opacity-10 ${isEditingHistory ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-[#bef264] hover:text-black'}`}
                >
                  {isAiProcessing ? 'UPLOADING_CORE...' : isEditingHistory ? '確認修正歷史紀錄 UPDATE' : '完成訓練數據封存 COMMIT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCoachFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-6 bg-black/40 backdrop-blur-md">
           <div className="bg-black text-[#bef264] p-8 border-4 border-[#bef264] shadow-[0_0_100px_rgba(190,242,100,0.5)] animate-in zoom-in duration-300 max-w-lg">
              <div className="flex items-center gap-4 mb-4">
                 <Zap size={28} className="fill-current animate-pulse" />
                 <p className="text-[12px] font-black uppercase tracking-[0.4em]">Field Analyst Update</p>
              </div>
              <p className="text-xl font-bold italic tracking-tight leading-snug text-white whitespace-pre-wrap">{feedbackMsg}</p>
              <div className="mt-8 pt-4 border-t border-[#bef264]/20 text-[9px] font-mono text-[#bef264]/60 text-right uppercase">Uplink Stable - Matrix Verified</div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingJournal;
