
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise, UserProfile, ExerciseType } from '../types';
import { getTaiwanDate } from '../utils/calculations';
import { Clock, Trash2, Dumbbell, Activity, Plus, History as HistoryIcon, Edit3, X, Calendar, Target, ChevronLeft, ChevronRight } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  onAddLog: (log: WorkoutLog) => void;
  onUpdateLog?: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog, onDeleteLog, profile }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("20:45");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('STRENGTH');
  
  const [exName, setExName] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');
  const [exSets, setExSets] = useState(3);
  const [feedback, setFeedback] = useState('');
  const [pendingExercises, setPendingExercises] = useState<WorkoutExercise[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const focusPresets = ['胸', '背', '腿', '肩', '手', '核心', '有氧', '拉伸'];
  const exerciseLibrary = {
    STRENGTH: ['槓鈴臥推', '深蹲', '硬舉', '引體向上', '滑輪下拉', '啞鈴肩推', 'CABLE夾胸'],
    CARDIO: ['跑步機', '飛輪', '划船機', '跳繩']
  };

  const suggestions = useMemo(() => {
    if (!exName) return [];
    return exerciseLibrary[exerciseType].filter(name => name.includes(exName));
  }, [exName, exerciseType]);

  const addExercise = () => {
    if (!exName) return;
    const newEx: WorkoutExercise = {
      id: Date.now().toString(),
      type: exerciseType,
      name: exName,
      weight: parseFloat(exWeight) || 0,
      reps: parseInt(exReps) || 0,
      sets: exSets,
      caloriesBurned: Math.round(((parseFloat(exWeight) || 0) * (parseInt(exReps) || 0) * exSets * 0.04) + (exSets * 8))
    };
    setPendingExercises([...pendingExercises, newEx]);
    setExName(''); setExWeight(''); setExReps('');
  };

  const durationMinutes = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff < 0 ? diff + 1440 : diff;
  }, [startTime, endTime]);

  const currentSessionBurn = pendingExercises.reduce((s, ex) => s + (ex.caloriesBurned || 0), 0);

  // 當天已存在的紀錄
  const existingLogsForDay = useMemo(() => logs.filter(l => l.date === selectedDate), [logs, selectedDate]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-40 px-4 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black text-[#bef264] flex items-center justify-center rounded-lg shadow-sm"><Dumbbell size={18}/></div>
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-black">訓練日誌</h2>
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Workout Protocol & Log</p>
          </div>
        </div>

        {/* 全功能日曆控制項 */}
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 border border-gray-100 rounded-xl shadow-sm">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-lg transition-all text-black"><ChevronLeft size={16}/></button>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
              <Calendar size={14} className="text-gray-400" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent font-black text-xs outline-none cursor-pointer text-black" 
              />
           </div>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-lg transition-all text-black"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* 歷史紀錄快速回顧 */}
      {existingLogsForDay.length > 0 && (
         <div className="bg-[#bef264]/10 border border-[#bef264]/30 p-4 rounded-xl space-y-2">
            <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><HistoryIcon size={12}/> 選定日期已登記紀錄:</p>
            {existingLogsForDay.map(l => (
               <div key={l.id} className="flex justify-between items-center text-xs font-bold bg-white/50 p-2 rounded border border-white/50">
                  <span>{l.startTime} - {l.endTime} ({l.focus})</span>
                  <span className="text-gray-400">{l.exercises.length} 動作 / {l.totalCaloriesBurned} KCAL</span>
               </div>
            ))}
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
           
           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Clock size={16} className="text-black" />
                    <span className="text-[11px] font-black uppercase text-black tracking-widest">時間區間</span>
                 </div>
                 <div className="flex items-center gap-1 font-mono text-xs font-black">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-gray-50 p-1.5 rounded-lg outline-none w-16 text-center border border-transparent focus:border-black" />
                    <span className="text-gray-300">to</span>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-gray-50 p-1.5 rounded-lg outline-none w-16 text-center border border-transparent focus:border-black" />
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Target size={16} className="text-black" />
                    <span className="text-[11px] font-black uppercase text-black tracking-widest">訓練焦點 TARGET (複選)</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {focusPresets.map(f => (
                      <button key={f} onClick={() => setSelectedFocus(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f])} className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${selectedFocus.includes(f) ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-100'}`}>
                        {f}
                      </button>
                    ))}
                    <input 
                      placeholder="+ 自定義" 
                      value={customFocus}
                      onChange={e => setCustomFocus(e.target.value)}
                      onKeyPress={e => { if(e.key === 'Enter' && customFocus.trim()) { setSelectedFocus([...selectedFocus, customFocus.trim()]); setCustomFocus(''); } }}
                      className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-2 text-[10px] font-black py-1.5 outline-none w-20 focus:w-24 transition-all"
                    />
                 </div>
              </div>
           </div>

           <div className="bg-white p-4 space-y-4 border border-gray-100 rounded-xl shadow-sm">
              <div className="flex bg-gray-50 p-1 rounded-xl">
                 <button onClick={() => setExerciseType('STRENGTH')} className={`flex-1 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${exerciseType === 'STRENGTH' ? 'bg-black text-white shadow-md' : 'text-gray-300'}`}>重量訓練</button>
                 <button onClick={() => setExerciseType('CARDIO')} className={`flex-1 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${exerciseType === 'CARDIO' ? 'bg-black text-white shadow-md' : 'text-gray-300'}`}>有氧訓練</button>
              </div>

              <div className="relative">
                 <input 
                    placeholder="輸入或搜尋動作..." 
                    value={exName} 
                    onChange={e => { setExName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200) }
                    className="w-full text-lg font-black outline-none border-b-2 border-gray-100 py-3 placeholder:text-gray-200 text-black text-center" 
                 />
                 {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-black rounded-xl shadow-2xl mt-1 overflow-hidden">
                       {suggestions.map(s => (
                          <button key={s} onClick={() => { setExName(s); setShowSuggestions(false); }} className="w-full text-left px-4 py-3 text-xs font-black hover:bg-gray-50 border-b last:border-0 border-gray-50">{s}</button>
                       ))}
                    </div>
                 )}
              </div>

              {/* 優化後的精緻輸入框 */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">重量 WEIGHT</p>
                    <div className="bg-gray-50 h-14 flex items-center justify-center rounded-xl border border-gray-100 focus-within:border-black transition-all relative">
                       <input type="number" step="0.5" value={exWeight} onChange={e => setExWeight(e.target.value)} className="w-full text-center font-mono font-black text-2xl outline-none bg-transparent text-black pr-8" />
                       <span className="absolute right-3 text-[10px] font-black text-gray-300 pointer-events-none">KG</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">次數 REPS</p>
                    <div className="bg-gray-50 h-14 flex items-center justify-center rounded-xl border border-gray-100 focus-within:border-black transition-all relative">
                       <input type="number" value={exReps} onChange={e => setExReps(e.target.value)} className="w-full text-center font-mono font-black text-2xl outline-none bg-transparent text-black pr-8" />
                       <span className="absolute right-3 text-[10px] font-black text-gray-300 pointer-events-none">次</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between px-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">預設組數 SETS</p>
                 <div className="flex gap-1.5">
                    {[3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setExSets(n)} className={`w-8 h-8 rounded-lg font-black text-xs border transition-all ${exSets === n ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-300 border-gray-100'}`}>{n}</button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={addExercise} 
                disabled={!exName} 
                className={`w-full py-4 font-black text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl border ${exName ? 'bg-black text-white hover:bg-[#bef264] hover:text-black' : 'bg-gray-50 text-gray-200 border-gray-100'}`}
              >
                 <Plus size={16}/> 暫存至作業佇列
              </button>
           </div>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-4">
           <div className="bg-white border border-gray-100 flex flex-col rounded-2xl shadow-sm overflow-hidden h-full min-h-[300px]">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <HistoryIcon size={14} className="text-black" />
                    <p className="text-[10px] font-black text-black uppercase tracking-widest">今日作業佇列 QUEUE</p>
                 </div>
                 <span className="text-[9px] font-black bg-black text-[#bef264] px-2 py-0.5 rounded-full">{pendingExercises.length} ITEMS</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                 {pendingExercises.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-10">
                       <HistoryIcon size={32} className="mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Queue Is Empty</p>
                    </div>
                 ) : (
                    [...pendingExercises].reverse().map(ex => (
                       <div key={ex.id} className="bg-white p-3 border border-gray-100 hover:border-black flex items-center justify-between rounded-xl">
                          <div className="space-y-1">
                             <p className="text-xs font-black uppercase text-black">{ex.name}</p>
                             <p className="text-[10px] font-mono text-gray-400">{ex.weight}KG x {ex.reps}R x {ex.sets}S</p>
                          </div>
                          <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-gray-200 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <textarea 
                 value={feedback} 
                 onChange={e => setFeedback(e.target.value)} 
                 placeholder="輸入體感回饋（如：力竭、狀態極佳...）" 
                 className="w-full bg-transparent p-4 text-[11px] font-bold outline-none h-24 resize-none placeholder:text-gray-200" 
              />
           </div>

           <button 
             onClick={() => { 
               onAddLog({ id: Date.now().toString(), date: selectedDate, startTime, endTime, focus: selectedFocus.join(', '), exercises: pendingExercises, durationMinutes, totalCaloriesBurned: currentSessionBurn, feedback }); 
               setPendingExercises([]); setFeedback(''); setSelectedFocus([]); 
             }} 
             disabled={pendingExercises.length === 0} 
             className={`w-full py-4 font-black text-xs tracking-[0.4em] uppercase transition-all rounded-2xl border ${pendingExercises.length > 0 ? 'bg-[#bef264] text-black border-[#bef264] shadow-lg active:scale-95' : 'bg-gray-100 text-gray-300 border-gray-100'}`}
           >
              戰 略 封 存 COMMIT
           </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
