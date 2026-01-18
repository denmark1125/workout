
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutLog, WorkoutExercise, UserProfile, ExerciseType } from '../types';
import { getTaiwanDate } from '../utils/calculations';
import { Clock, Trash2, Zap, History, Dumbbell, Activity, Plus, ChevronRight, History as HistoryIcon, ClipboardList, Flame, Terminal, Hash, Edit3 } from 'lucide-react';

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
  const [startTime, setStartTime] = useState("19:35");
  const [endTime, setEndTime] = useState("20:45");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('STRENGTH');
  
  const [exName, setExName] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');
  const [exDuration, setExDuration] = useState('');
  const [exIntensity, setExIntensity] = useState('中等');
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

  const applyLastTrainingData = (name: string) => {
    setExName(name);
    setShowSuggestions(false);
    
    const allEx = [...logs].reverse().flatMap(l => l.exercises);
    const lastMatch = allEx.find(e => e.name === name);
    
    if (lastMatch) {
      if (lastMatch.type === 'STRENGTH') {
        setExWeight(lastMatch.weight.toString());
        setExReps(lastMatch.reps.toString());
        setExSets(lastMatch.sets);
        setExerciseType('STRENGTH');
      } else {
        setExDuration(lastMatch.durationMinutes?.toString() || '');
        setExerciseType('CARDIO');
      }
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-8 pb-40 px-4 animate-in fade-in duration-500">
      
      {/* 頂部數據摘要 */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-black pb-4 gap-4">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-black text-[#bef264] flex items-center justify-center rounded shadow-md"><Zap size={24}/></div>
           <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-black">訓練戰報登錄</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">LOG_SYSTEM_V4.8_STABLE</p>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <div className="flex-1 bg-white px-5 py-3 border border-gray-100 rounded-2xl text-center min-w-[120px] shadow-sm">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">時長 DURATION</p>
              <p className="text-2xl font-black font-mono leading-none text-black">{durationMinutes} <span className="text-[10px] text-gray-300">MIN</span></p>
           </div>
           <div className="flex-1 bg-black px-5 py-3 rounded-2xl text-center shadow-lg min-w-[120px] border-2 border-[#bef264]/20">
              <p className="text-[8px] font-black text-[#bef264] uppercase tracking-widest mb-1">預估熱量 KCAL</p>
              <p className="text-2xl font-black font-mono leading-none text-white">{currentSessionBurn}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 左側：核心輸入 */}
        <div className="lg:col-span-7 space-y-8">
           
           {/* 時間輸入：修正跑版問題，確保文字與圖標在一行 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 shadow-sm group">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">開始時間 START</p>
                 <div className="bg-white px-5 py-4 rounded-2xl flex items-center justify-between border border-gray-100 group-focus-within:border-black transition-all">
                    <input 
                      type="time" 
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                      className="flex-1 text-3xl font-black font-mono bg-transparent text-black outline-none min-w-0" 
                    />
                    <Clock className="text-black shrink-0 ml-3" size={24} />
                 </div>
              </div>
              <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 shadow-sm group">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">結束時間 END</p>
                 <div className="bg-white px-5 py-4 rounded-2xl flex items-center justify-between border border-gray-100 group-focus-within:border-black transition-all">
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                      className="flex-1 text-3xl font-black font-mono bg-transparent text-black outline-none min-w-0" 
                    />
                    <Clock className="text-black shrink-0 ml-3" size={24} />
                 </div>
              </div>
           </div>

           {/* 訓練焦點：加入自定義欄位 */}
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">訓練焦點 TARGET (可複選)</p>
              <div className="flex flex-wrap gap-2">
                 {focusPresets.map(f => (
                   <button 
                     key={f} 
                     onClick={() => toggleFocus(f)} 
                     className={`px-5 py-2.5 text-xs font-black rounded-xl border transition-all ${selectedFocus.includes(f) ? 'bg-black text-[#bef264] border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                   >
                     {f}
                   </button>
                 ))}
                 {selectedFocus.filter(f => !focusPresets.includes(f)).map(f => (
                   <button 
                     key={f} 
                     onClick={() => toggleFocus(f)} 
                     className="px-5 py-2.5 text-xs font-black rounded-xl border bg-black text-[#bef264] border-black shadow-md"
                   >
                     {f}
                   </button>
                 ))}
                 {/* 自定義輸入框 */}
                 <div className="flex items-center bg-gray-50 border border-dashed border-gray-300 rounded-xl px-3 group focus-within:border-black transition-all">
                    <input 
                      placeholder="自定義..." 
                      value={customFocus}
                      onChange={e => setCustomFocus(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddCustomFocus()}
                      className="bg-transparent text-xs font-black py-2.5 outline-none w-20 group-focus-within:w-28 transition-all text-black placeholder:text-gray-300"
                    />
                    <button onClick={handleAddCustomFocus} className="text-gray-300 group-focus-within:text-black transition-colors"><Plus size={14}/></button>
                 </div>
              </div>
           </div>

           {/* 核心動作面板 */}
           <div className="bg-white p-6 space-y-8 border border-gray-100 rounded-[2.5rem] shadow-lg relative overflow-hidden">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-50">
                 <button onClick={() => setExerciseType('STRENGTH')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase transition-all rounded-xl ${exerciseType === 'STRENGTH' ? 'bg-black text-white shadow-lg scale-[1.02]' : 'text-gray-300 hover:text-black'}`}><Dumbbell size={18}/> 重量訓練 STRENGTH</button>
                 <button onClick={() => setExerciseType('CARDIO')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase transition-all rounded-xl ${exerciseType === 'CARDIO' ? 'bg-black text-white shadow-lg scale-[1.02]' : 'text-gray-300 hover:text-black'}`}><Activity size={18}/> 有氧代謝 CARDIO</button>
              </div>

              {/* 快速 Hashtags */}
              <div className="flex flex-wrap gap-2 px-2">
                 {exerciseLibrary[exerciseType].slice(0, 8).map(name => (
                    <button key={name} onClick={() => applyLastTrainingData(name)} className="px-3 py-2 bg-gray-50 text-[10px] font-black text-gray-400 border border-gray-100 rounded-lg hover:bg-black hover:text-[#bef264] hover:border-black transition-all">#{name}</button>
                 ))}
              </div>

              {/* 動作名稱：強化自動帶入 */}
              <div className="space-y-4 relative">
                 <div className="bg-gray-50/50 p-12 border-b-4 border-black flex items-center justify-center min-h-[160px] rounded-t-3xl relative group transition-all focus-within:bg-white">
                    <input 
                       placeholder="輸入動作名稱 (如：槓鈴臥推)" 
                       value={exName} 
                       onChange={e => { setExName(e.target.value); setShowSuggestions(true); }}
                       onFocus={() => setShowSuggestions(true)}
                       onBlur={() => setTimeout(() => setShowSuggestions(false), 200) }
                       className="w-full text-center text-3xl font-black outline-none bg-transparent placeholder:text-gray-200 text-black tracking-tighter" 
                    />
                 </div>
                 
                 {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[105%] left-0 right-0 z-[60] bg-white border-2 border-black rounded-2xl shadow-2xl overflow-hidden">
                       {suggestions.map(s => (
                          <button key={s} onClick={() => applyLastTrainingData(s)} className="w-full text-left px-6 py-5 text-sm font-black hover:bg-black hover:text-[#bef264] transition-all border-b border-gray-50 last:border-0 flex justify-between items-center group">
                             <span>{s}</span>
                             <span className="text-[9px] text-gray-300 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Auto-Load Previous</span>
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              {/* 數據區 */}
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">重量 WEIGHT (KG)</p>
                    <div className="bg-gray-50/50 h-36 flex items-center justify-center rounded-[2.5rem] border border-gray-100 focus-within:border-black focus-within:bg-white transition-all group shadow-inner">
                       <input type="number" step="0.5" value={exWeight} onChange={e => setExWeight(e.target.value)} className="w-full text-center font-mono font-black text-6xl outline-none bg-transparent text-black" />
                    </div>
                 </div>
                 <div className="space-y-3 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">次數 REPS</p>
                    <div className="bg-gray-50/50 h-36 flex items-center justify-center rounded-[2.5rem] border border-gray-100 focus-within:border-black focus-within:bg-white transition-all group shadow-inner">
                       <input type="number" value={exReps} onChange={e => setExReps(e.target.value)} className="w-full text-center font-mono font-black text-6xl outline-none bg-transparent text-black" />
                    </div>
                 </div>
              </div>

              {/* 組數選擇器 */}
              <div className="space-y-5">
                 <div className="flex justify-between items-end px-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">組數 SETS_COUNT</p>
                    <p className="text-5xl font-black font-mono leading-none text-black">{exSets} <span className="text-sm font-black text-gray-300 ml-1">組</span></p>
                 </div>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                      <button key={n} onClick={() => setExSets(n)} className={`w-16 h-16 shrink-0 flex items-center justify-center font-black text-xl transition-all border-2 rounded-2xl ${exSets === n ? 'bg-black text-[#bef264] border-black scale-110 shadow-xl' : 'bg-white text-gray-300 border-gray-50 hover:border-black hover:text-black'}`}>
                         {n}
                      </button>
                    ))}
                 </div>
              </div>

              {/* 存入緩衝按鈕 */}
              <button 
                onClick={addExercise} 
                disabled={!exName} 
                className={`w-full py-10 font-black text-sm tracking-[0.5em] uppercase transition-all flex flex-col items-center justify-center gap-2 rounded-[2.5rem] border-4 ${exName ? 'bg-black text-[#bef264] border-black shadow-2xl active:scale-[0.98]' : 'bg-gray-50 text-gray-200 border-gray-100'}`}
              >
                 <span className="leading-none text-base">存 入 緩 衝</span>
                 <Plus size={28} className="mt-1"/>
              </button>
           </div>
        </div>

        {/* 右側：作業佇列與情報反饋 (Queue Top, Report Bottom) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
           
           {/* 1. 紀錄佇列 (置頂) */}
           <div className="bg-white border border-gray-100 min-h-[350px] flex flex-col rounded-[2.5rem] relative shadow-sm overflow-hidden">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <HistoryIcon size={18} className="text-black" />
                    <p className="text-[10px] font-black text-black uppercase tracking-widest">作業佇列 QUEUE</p>
                 </div>
                 <span className="text-[10px] font-black bg-black text-[#bef264] px-5 py-2 rounded-full shadow-md">{pendingExercises.length} ITEMS</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                 {pendingExercises.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-16">
                       <HistoryIcon size={72} className="mb-4 text-black" />
                       <p className="text-xs font-black uppercase tracking-[0.4em] text-black">Awaiting Input</p>
                    </div>
                 ) : (
                    [...pendingExercises].reverse().map(ex => (
                       <div key={ex.id} className="bg-white p-6 border-2 border-gray-100 hover:border-black flex items-center justify-between shadow-sm transition-all rounded-3xl group/item">
                          <div className="space-y-1">
                             <p className="text-base font-black uppercase text-black">{ex.name}</p>
                             <p className="text-xs font-mono font-bold text-gray-500 flex items-center gap-2">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-black font-black">{ex.weight}KG</span> 
                                <span className="opacity-20 text-black">|</span> 
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-black">{ex.reps}R</span> 
                                <span className="opacity-20 text-black">|</span> 
                                <span className="bg-black text-[#bef264] px-2 py-0.5 rounded font-black">{ex.sets}S</span>
                             </p>
                          </div>
                          <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-gray-200 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-full"><Trash2 size={24}/></button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* 2. 訓練即時速記 (置底) */}
           <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] overflow-hidden flex flex-col group focus-within:border-black focus-within:bg-white transition-all shadow-sm">
              <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-100 bg-white/50">
                 <Edit3 size={18} className="text-black" />
                 <span className="text-[10px] font-black text-black uppercase tracking-widest">情報反饋 INTEL_REPORT</span>
              </div>
              <div className="p-6">
                 <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    placeholder="輸入肌肉充血感、體感疲勞度、訓練異常回饋..." 
                    className="w-full bg-white border border-gray-100 p-8 text-base font-bold outline-none min-h-[220px] resize-none placeholder:text-gray-200 rounded-[2rem] transition-all focus:border-black focus:shadow-inner leading-relaxed" 
                 />
              </div>
           </div>

           {/* 3. 戰略封存按鈕 */}
           <button 
             onClick={() => { 
               onAddLog({ 
                 id: Date.now().toString(), 
                 date: selectedDate, 
                 startTime, 
                 endTime, 
                 focus: selectedFocus.join(', '), 
                 exercises: pendingExercises, 
                 durationMinutes: durationMinutes, 
                 totalCaloriesBurned: currentSessionBurn, 
                 feedback 
               }); 
               setPendingExercises([]); 
               setFeedback(''); 
               setSelectedFocus([]); 
             }} 
             disabled={pendingExercises.length === 0} 
             className={`w-full py-12 font-black text-2xl tracking-[0.8em] uppercase transition-all rounded-[3rem] border-4 ${pendingExercises.length > 0 ? 'bg-[#bef264] text-black border-[#bef264] shadow-[0_30px_90px_rgba(190,242,100,0.5)] cursor-pointer active:scale-95' : 'bg-gray-100 text-gray-300 border-gray-100 opacity-50 cursor-not-allowed'}`}
           >
              戰 略 封 存 COMMIT
           </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
