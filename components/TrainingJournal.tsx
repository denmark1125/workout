
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise, UserProfile, ExerciseType } from '../types';
import { getTaiwanDate } from '../utils/calculations';
import { Clock, Trash2, Dumbbell, Activity, Plus, History as HistoryIcon, Edit3, X, Calendar, Target } from 'lucide-react';

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
  const [startTime, setStartTime] = useState("19:35");
  const [endTime, setEndTime] = useState("20:45");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('STRENGTH');
  
  const [exName, setExName] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');
  const [exDuration, setExDuration] = useState('');
  const [exSets, setExSets] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [pendingExercises, setPendingExercises] = useState<WorkoutExercise[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const focusPresets = ['胸', '背', '腿', '肩', '手', '二頭', '三頭', '核心', '有氧', '拉伸'];
  
  const exerciseLibrary = {
    STRENGTH: ['槓鈴臥推', '上斜臥推', '啞鈴臥推', '臥推機', 'CABLE夾胸', 'CABLE纜繩下拉', 'CABLE單側夾胸', '蝴蝶機', '深蹲', '硬舉', '引體向上', '滑輪下拉', '啞鈴肩推'],
    CARDIO: ['跑步機', '飛輪', '橢圓機', '划船機', '跳繩', '波比跳']
  };

  const suggestions = useMemo(() => {
    if (!exName) return [];
    return exerciseLibrary[exerciseType].filter(name => name.includes(exName));
  }, [exName, exerciseType]);

  const addExercise = () => {
    if (!exName) return;
    const w = parseFloat(exWeight) || 0;
    const r = parseInt(exReps) || 0;
    const d = parseInt(exDuration) || 0;
    
    const newEx: WorkoutExercise = {
      id: Date.now().toString(),
      type: exerciseType,
      name: exName,
      weight: exerciseType === 'STRENGTH' ? w : 0,
      reps: exerciseType === 'STRENGTH' ? r : 0,
      sets: exerciseType === 'STRENGTH' ? exSets : 1,
      durationMinutes: exerciseType === 'CARDIO' ? d : 0,
      caloriesBurned: Math.round((w * r * exSets * 0.04) + (exSets * 8))
    };
    setPendingExercises([...pendingExercises, newEx]);
    setExName(''); setExWeight(''); setExReps(''); setExDuration('');
  };

  const durationMinutes = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff < 0 ? diff + 1440 : diff;
  }, [startTime, endTime]);

  const currentSessionBurn = pendingExercises.reduce((s, ex) => s + (ex.caloriesBurned || 0), 0);

  const toggleFocus = (f: string) => {
    setSelectedFocus(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]);
  };

  const handleAddCustomFocus = () => {
    if (customFocus.trim() && !selectedFocus.includes(customFocus.trim())) {
      setSelectedFocus([...selectedFocus, customFocus.trim()]);
      setCustomFocus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-40 px-4 animate-in fade-in duration-500">
      
      {/* 頂部摘要 - 縮小數據高度 */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-black/10 pb-3 gap-4">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-black text-[#bef264] flex items-center justify-center rounded-lg shadow-sm"><Dumbbell size={18}/></div>
           <div>
              <h2 className="text-lg font-black tracking-tight uppercase text-black">訓練戰報登錄</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">LOG_PROTOCOL_V5.1_FIX</p>
           </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="flex-1 bg-white px-3 py-1.5 border border-gray-100 rounded-lg text-center shadow-sm">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">時長</p>
              <p className="text-base font-black font-mono leading-none text-black">{durationMinutes} <span className="text-[9px] text-gray-300">MIN</span></p>
           </div>
           <div className="flex-1 bg-black px-3 py-1.5 rounded-lg text-center shadow-md border border-white/5">
              <p className="text-[8px] font-black text-[#bef264] uppercase tracking-widest">熱量</p>
              <p className="text-base font-black font-mono leading-none text-white">{currentSessionBurn} <span className="text-[9px] text-gray-500">KCAL</span></p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
           
           {/* 日期與時間：回歸日曆與精簡顯示 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-300" />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">日期</span>
                 </div>
                 <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    className="text-xs font-black font-mono outline-none bg-transparent text-right" 
                 />
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-2">
                 <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                    <Clock size={14} className="text-gray-300" />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">區間</span>
                 </div>
                 <div className="flex items-center gap-1 font-mono text-xs font-black">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent outline-none w-14 text-right" />
                    <span className="text-gray-200">-</span>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-transparent outline-none w-14" />
                 </div>
              </div>
           </div>

           {/* 訓練焦點：調大標題文字，縮小互動區域 */}
           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                 <Target size={16} className="text-black" />
                 <p className="text-sm font-black text-black uppercase tracking-widest">訓練焦點 TARGET (可複選)</p>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                 {focusPresets.map(f => (
                   <button key={f} onClick={() => toggleFocus(f)} className={`px-2.5 py-1 text-[10px] font-black rounded border transition-all ${selectedFocus.includes(f) ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}>
                     {f}
                   </button>
                 ))}
                 {selectedFocus.filter(f => !focusPresets.includes(f)).map(f => (
                   <button key={f} onClick={() => toggleFocus(f)} className="px-2.5 py-1 text-[10px] font-black rounded border bg-black text-[#bef264] border-black flex items-center gap-1">
                     {f} <X size={8} />
                   </button>
                 ))}
                 <div className="flex items-center bg-gray-50 border border-dashed border-gray-200 rounded px-2">
                    <input 
                      placeholder="+ 自定義" 
                      value={customFocus}
                      onChange={e => setCustomFocus(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddCustomFocus()}
                      className="bg-transparent text-[10px] font-black py-1 outline-none w-14 focus:w-20 transition-all text-black"
                    />
                 </div>
              </div>
           </div>

           {/* 動作輸入區：精緻化 */}
           <div className="bg-white p-4 space-y-4 border border-gray-100 rounded-xl shadow-sm">
              <div className="flex bg-gray-50 p-1 rounded-lg">
                 <button onClick={() => setExerciseType('STRENGTH')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[9px] font-black uppercase transition-all rounded ${exerciseType === 'STRENGTH' ? 'bg-black text-white' : 'text-gray-300'}`}><Dumbbell size={12}/> 重量</button>
                 <button onClick={() => setExerciseType('CARDIO')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[9px] font-black uppercase transition-all rounded ${exerciseType === 'CARDIO' ? 'bg-black text-white' : 'text-gray-300'}`}><Activity size={12}/> 有氧</button>
              </div>

              <div className="relative">
                 <input 
                    placeholder="動作名稱..." 
                    value={exName} 
                    onChange={e => { setExName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200) }
                    className="w-full text-center text-lg font-black outline-none border-b border-gray-100 py-2 placeholder:text-gray-200 text-black" 
                 />
                 {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-black rounded-lg shadow-xl overflow-hidden mt-1">
                       {suggestions.map(s => (
                          <button key={s} onClick={() => { setExName(s); setShowSuggestions(false); }} className="w-full text-left px-3 py-2 text-[10px] font-black hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0">{s}</button>
                       ))}
                    </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest">重量 WEIGHT</p>
                    <div className="bg-gray-50 h-16 flex items-center justify-center rounded-lg border border-gray-100 focus-within:border-black transition-all">
                       <input type="number" step="0.5" value={exWeight} onChange={e => setExWeight(e.target.value)} className="w-full text-center font-mono font-black text-2xl outline-none bg-transparent text-black" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest">次數 REPS</p>
                    <div className="bg-gray-50 h-16 flex items-center justify-center rounded-lg border border-gray-100 focus-within:border-black transition-all">
                       <input type="number" value={exReps} onChange={e => setExReps(e.target.value)} className="w-full text-center font-mono font-black text-2xl outline-none bg-transparent text-black" />
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between px-1">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">組數 SETS</p>
                 <div className="flex gap-1">
                    {[3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setExSets(n)} className={`w-7 h-7 rounded font-black text-[10px] border transition-all ${exSets === n ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-300 border-gray-100'}`}>{n}</button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={addExercise} 
                disabled={!exName} 
                className={`w-full py-2.5 font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-lg border ${exName ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-50 text-gray-200 border-gray-100'}`}
              >
                 <Plus size={14}/> 暫存記錄
              </button>
           </div>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-5">
           <div className="bg-white border border-gray-100 min-h-[250px] flex flex-col rounded-xl shadow-sm overflow-hidden">
              <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <HistoryIcon size={12} className="text-black" />
                    <p className="text-[9px] font-black text-black uppercase tracking-widest">作業佇列 QUEUE</p>
                 </div>
                 <span className="text-[8px] font-black bg-black text-[#bef264] px-1.5 py-0.5 rounded-full">{pendingExercises.length} ITEMS</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                 {pendingExercises.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-10">
                       <HistoryIcon size={24} className="mb-2" />
                       <p className="text-[9px] font-black uppercase tracking-widest">Empty</p>
                    </div>
                 ) : (
                    [...pendingExercises].reverse().map(ex => (
                       <div key={ex.id} className="bg-white p-2.5 border border-gray-100 hover:border-black flex items-center justify-between rounded-lg">
                          <div className="space-y-0.5">
                             <p className="text-[11px] font-black uppercase text-black">{ex.name}</p>
                             <p className="text-[9px] font-mono text-gray-400">
                                {ex.weight}KG x {ex.reps}R x {ex.sets}S
                             </p>
                          </div>
                          <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-gray-200 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                 <Edit3 size={12} className="text-black" />
                 <span className="text-[9px] font-black text-black uppercase tracking-widest">情報反饋 REPORT</span>
              </div>
              <textarea 
                 value={feedback} 
                 onChange={e => setFeedback(e.target.value)} 
                 placeholder="輸入體感回饋..." 
                 className="w-full bg-transparent p-3 text-[11px] font-bold outline-none h-20 resize-none placeholder:text-gray-200" 
              />
           </div>

           <button 
             onClick={() => { 
               onAddLog({ id: Date.now().toString(), date: selectedDate, startTime, endTime, focus: selectedFocus.join(', '), exercises: pendingExercises, durationMinutes, totalCaloriesBurned: currentSessionBurn, feedback }); 
               setPendingExercises([]); setFeedback(''); setSelectedFocus([]); 
             }} 
             disabled={pendingExercises.length === 0} 
             className={`w-full py-3.5 font-black text-xs tracking-[0.4em] uppercase transition-all rounded-xl border ${pendingExercises.length > 0 ? 'bg-[#bef264] text-black border-[#bef264] shadow-md active:scale-95' : 'bg-gray-100 text-gray-300 border-gray-100'}`}
           >
              戰 略 封 存 COMMIT
           </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
