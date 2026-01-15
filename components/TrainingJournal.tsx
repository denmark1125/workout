
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, MessageSquare, Zap } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  onAddLog: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
}

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog, onDeleteLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // 登錄模組狀態
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState('');
  const [feedback, setFeedback] = useState('');

  // 動作清單
  const [exName, setExName] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');
  const [exSets, setExSets] = useState('1');
  const [pendingExercises, setPendingExercises] = useState<WorkoutExercise[]>([]);

  const focusPresets = ['胸', '背', '腿', '肩', '手', '核心', '有氧', '拉伸'];

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  }, [currentMonth]);

  const duration = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff < 0 ? diff + 1440 : diff;
  }, [startTime, endTime]);

  const addExercise = () => {
    if (!exName) return;
    const newEx: WorkoutExercise = {
      id: Date.now().toString(),
      name: exName,
      weight: parseFloat(exWeight) || 0,
      reps: parseInt(exReps) || 0,
      sets: parseInt(exSets) || 1
    };
    setPendingExercises([...pendingExercises, newEx]);
    setExName(''); setExWeight(''); setExReps(''); setExSets('1');
  };

  const toggleFocus = (f: string) => {
    setSelectedFocus(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]);
  };

  const handleCommit = () => {
    if (pendingExercises.length === 0) {
      alert("David教練: 至少需新增一個動作項目才能進行數據封存。");
      return;
    }
    
    const logFocus = [...selectedFocus, ...(customFocus ? [customFocus] : [])].join(', ');
    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime, endTime,
      focus: logFocus,
      feedback: feedback,
      durationMinutes: duration,
      exercises: pendingExercises
    };

    onAddLog(newLog);

    const coachQuotes = [
      "David教練: 執行力優異。肌肉壓力數據已封存。",
      "David教練: 意志力水平確認。今日訓練質量：卓越。",
      "David教練: 紀錄已同步至雲端。繼續保持極限狀態。",
      "David教練: 看到你的進步了，雖然數據只是冷冰冰的數字，但你的汗水不是。"
    ];
    setFeedbackMsg(coachQuotes[Math.floor(Math.random() * coachQuotes.length)]);
    setShowCoachFeedback(true);
    setTimeout(() => setShowCoachFeedback(false), 3000);

    setPendingExercises([]);
    setFeedback('');
    setCustomFocus('');
    setSelectedFocus([]);
  };

  const todayLogs = logs.filter(l => l.date === selectedDate);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-12 pb-40">
      <div className="flex flex-col lg:flex-row bg-white border border-gray-100 shadow-2xl rounded-sm overflow-hidden">
        
        {/* 左側：日曆與歷史 */}
        <div className="lg:w-80 p-8 border-r border-gray-100 bg-[#fcfcfc]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">{currentMonth.getFullYear()}年 {currentMonth.getMonth()+1}月</h3>
            <div className="flex gap-2">
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))} className="p-1 hover:bg-gray-100"><ChevronLeft size={16}/></button>
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))} className="p-1 hover:bg-gray-100"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-3 mb-10">
            {['日','一','二','三','四','五','六'].map(d => <span key={d} className="text-[11px] font-black text-gray-300 uppercase">{d}</span>)}
            {Array.from({length: daysInMonth.firstDay}).map((_, i) => <div key={i}/>)}
            {Array.from({length: daysInMonth.days}).map((_, i) => {
              const d = i + 1;
              const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const isSelected = selectedDate === ds;
              const hasLog = logs.some(l => l.date === ds);
              return (
                <button 
                  key={d} onClick={() => setSelectedDate(ds)}
                  className={`relative w-9 h-9 flex items-center justify-center text-sm font-black mx-auto transition-all ${isSelected ? 'bg-black text-white shadow-lg scale-110' : 'text-gray-400 hover:text-black'}`}
                >
                  {d}
                  {hasLog && !isSelected && <div className="absolute bottom-0 w-1.5 h-1.5 bg-lime-400 rounded-full"></div>}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">今日已封存日誌 ({todayLogs.length})</p>
             {todayLogs.map(log => (
               <div key={log.id} className="bg-white border border-gray-100 p-4 shadow-sm group relative">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-black uppercase text-gray-900 truncate pr-4">{log.focus || '一般訓練'}</p>
                    <button onClick={() => onDeleteLog(log.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                  </div>
                  <p className="text-[9px] font-mono text-gray-400 mt-1">{log.startTime}-{log.endTime} | {log.exercises.length} 動作</p>
               </div>
             ))}
          </div>
        </div>

        {/* 右側：登錄模組 */}
        <div className="flex-1 p-8 md:p-12 space-y-10">
          <div className="flex items-center justify-between gap-6 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-[#bef264] flex items-center justify-center shadow-lg"><Plus size={24}/></div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">快速登錄系統</h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">DURATION</p>
              <p className="text-2xl md:text-3xl font-black font-mono leading-none">{duration}<span className="text-[12px] ml-1">min</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">開始時間</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 border-transparent p-4 text-xl font-black font-mono outline-none focus:bg-white focus:border-black transition-all" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">結束時間</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 border-transparent p-4 text-xl font-black font-mono outline-none focus:bg-white focus:border-black transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">訓練焦點 TARGET (可複選)</label>
                <div className="flex flex-wrap gap-2 mb-4">
                   {focusPresets.map(f => (
                     <button key={f} onClick={() => toggleFocus(f)} className={`px-4 py-2 text-[11px] font-black transition-all border ${selectedFocus.includes(f) ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}>
                        {f}
                     </button>
                   ))}
                </div>
                <input placeholder="自定義其他焦點..." value={customFocus} onChange={e => setCustomFocus(e.target.value)} className="w-full border-b border-gray-200 py-3 text-base font-bold outline-none focus:border-black transition-all" />
              </div>

              <div className="bg-gray-50 p-6 space-y-6 rounded-sm">
                 <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">動作清單項目 EXERCISE_LIST</p>
                 <div className="space-y-4">
                    <input placeholder="動作名稱，如：槓鈴臥推" value={exName} onChange={e => setExName(e.target.value)} className="w-full bg-white px-5 py-4 text-base font-bold shadow-sm outline-none border border-transparent focus:border-black" />
                    <div className="grid grid-cols-3 gap-3">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block text-center">重量 (KG)</label>
                         <input type="number" placeholder="0" value={exWeight} onChange={e => setExWeight(e.target.value)} className="w-full bg-white p-3 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-lg" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block text-center">次數</label>
                         <input type="number" placeholder="0" value={exReps} onChange={e => setExReps(e.target.value)} className="w-full bg-white p-3 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-lg" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest block text-center">組數</label>
                         <input type="number" placeholder="1" value={exSets} onChange={e => setExSets(e.target.value)} className="w-full bg-white p-3 text-center font-mono font-black border border-transparent focus:border-black outline-none shadow-sm text-lg" />
                       </div>
                    </div>
                    <button onClick={addExercise} className="w-full bg-black text-[#bef264] py-4 text-[11px] font-black uppercase tracking-widest hover:bg-lime-400 hover:text-black transition-all">+ 新增動作項目</button>
                 </div>

                 {pendingExercises.length > 0 && (
                   <div className="mt-6 space-y-1 border-t border-gray-200 pt-4">
                      {pendingExercises.map(ex => (
                        <div key={ex.id} className="flex items-center justify-between text-[11px] font-black bg-white p-3 border border-gray-50">
                           <span className="uppercase">{ex.name}</span>
                           <div className="flex items-center gap-4">
                              <span className="font-mono text-gray-400">{ex.weight}kg | {ex.reps}x{ex.sets}</span>
                              <button onClick={() => setPendingExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-gray-200 hover:text-red-500 p-1"><X size={14}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>

            <div className="flex flex-col h-full">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2"><MessageSquare size={14}/> 訓練狀態反饋 (FEEDBACK)</label>
              <textarea 
                value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="David 教練: 記錄你此刻的體感或心理狀態，這對分析進化極其重要..."
                className="w-full bg-gray-50 p-5 text-base font-bold outline-none focus:bg-white border border-transparent focus:border-black resize-none h-32 md:flex-1 transition-all mb-6"
              />
              <button 
                onClick={handleCommit} 
                className="w-full bg-black text-white py-6 font-black text-sm tracking-[0.5em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-2xl active:scale-95"
              >
                封存訓練日誌 COMMIT
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCoachFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-6 bg-black/20 backdrop-blur-sm">
           <div className="bg-black text-[#bef264] p-8 border-4 border-[#bef264] shadow-[0_0_80px_rgba(190,242,100,0.4)] animate-in zoom-in duration-300 max-w-lg">
              <div className="flex items-center gap-4 mb-4">
                 <Zap size={28} className="fill-current animate-pulse" />
                 <p className="text-[12px] font-black uppercase tracking-[0.4em]">System Uplink Success</p>
              </div>
              <p className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight text-white">{feedbackMsg}</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingJournal;
