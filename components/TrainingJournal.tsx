
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise } from '../types';
import { Calendar, Clock, Target, Plus, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  onAddLog: (log: WorkoutLog) => void;
}

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseInput, setExerciseInput] = useState({ name: '', weight: '', reps: '', sets: '1' });
  const [trainingFocus, setTrainingFocus] = useState('');
  const [bodyFeedback, setBodyFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [startTime, setStartTime] = useState(getCurrentTime());
  const [endTime, setEndTime] = useState(getCurrentTime());

  const duration = useMemo(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }, [startTime, endTime]);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} 分鐘`;
    return `${h}小時 ${m}分`;
  };

  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('zh-TW', { year: 'numeric', month: 'long' });

  const hasLogsOnDate = (dateStr: string) => logs.some(log => log.date === dateStr);

  const handleQuickSave = () => {
    if (!exerciseInput.name || !exerciseInput.weight || !exerciseInput.reps || !exerciseInput.sets) return;
    setIsSaving(true);

    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      name: exerciseInput.name,
      weight: parseFloat(exerciseInput.weight),
      reps: parseInt(exerciseInput.reps),
      sets: parseInt(exerciseInput.sets) || 1
    };

    setTimeout(() => {
      onAddLog({
        id: Date.now().toString(),
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        focus: trainingFocus,
        feedback: bodyFeedback,
        durationMinutes: duration,
        exercises: [newExercise]
      });
      setIsSaving(false);
      setExerciseInput({ ...exerciseInput, name: '', weight: '', reps: '', sets: '1' });
    }, 600);
  };

  return (
    <div className="space-y-12 md:space-y-20 max-w-7xl mx-auto pb-32 px-2">
      <header className="flex justify-between items-end border-b-4 border-black pb-8">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Operational Log</p>
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">Training Matrix</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[#bef264] rounded-full animate-pulse"></div>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] font-mono">Syncing</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 bg-gray-100 shadow-sm">
        {/* 精簡化登錄區域 */}
        <div className="order-1 lg:order-2 lg:col-span-8 bg-white p-8 md:p-14">
          <div className="flex items-start justify-between mb-12">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-black flex items-center gap-4 tracking-tighter uppercase">
                <Plus className="w-10 h-10 p-2.5 bg-black text-white rounded-sm" /> 快速登錄 (QUICK LOG)
              </h3>
              <p className="text-[9px] text-gray-400 font-mono font-bold mt-3 uppercase tracking-[0.4em] pl-14">Tactical Entry</p>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] mb-1">Duration</p>
                <p className="text-xl font-black text-black font-mono tracking-tighter">{formatDuration(duration)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 border-b border-gray-100 pb-10">
            <div className="group">
              <label className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] mb-3 block group-focus-within:text-black">START TIME</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-transparent border-none text-xl font-black p-0 outline-none font-mono" />
            </div>
            <div className="group">
              <label className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] mb-3 block group-focus-within:text-black">END TIME</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-transparent border-none text-xl font-black p-0 outline-none font-mono" />
            </div>
            <div className="hidden md:block">
              <label className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] mb-3 block">FOCUS</label>
              <input placeholder="Muscle group..." value={trainingFocus} onChange={e => setTrainingFocus(e.target.value)} className="w-full bg-transparent border-none text-base font-black p-0 outline-none tracking-tight" />
            </div>
          </div>

          <div className="bg-gray-50/50 p-8 md:p-10 space-y-10 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block text-gray-500">動作 (EXERCISE)</label>
                <input placeholder="Bench Press" value={exerciseInput.name} onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 outline-none font-bold text-sm tracking-wide" />
              </div>
              <div className="grid grid-cols-3 md:col-span-7 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block text-gray-500">重量</label>
                  <input type="number" placeholder="KG" value={exerciseInput.weight} onChange={e => setExerciseInput({...exerciseInput, weight: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 text-center font-mono font-black text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block text-gray-500">次數</label>
                  <input type="number" placeholder="REPS" value={exerciseInput.reps} onChange={e => setExerciseInput({...exerciseInput, reps: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 text-center font-mono font-black text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block text-gray-500">組數</label>
                  <input type="number" value={exerciseInput.sets} onChange={e => setExerciseInput({...exerciseInput, sets: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 text-center font-mono font-black text-sm" />
                </div>
              </div>
            </div>
            <button 
              onClick={handleQuickSave} 
              disabled={isSaving}
              className={`w-full font-black py-4 uppercase tracking-[0.5em] text-[10px] transition-all flex items-center justify-center gap-3 ${
                isSaving ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-[#bef264] hover:text-black shadow-lg transform hover:-translate-y-1'
              }`}
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div> : <>COMMIT SESSION</>}
            </button>
          </div>
        </div>

        {/* 月曆區域 */}
        <div className="order-2 lg:order-1 lg:col-span-4 bg-white p-10 border-r border-gray-100">
          <div className="flex justify-between items-center mb-10 px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-gray-400">{monthName}</h3>
            <div className="flex gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center border border-gray-100 hover:bg-black hover:text-white transition-all text-sm">←</button>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center border border-gray-100 hover:bg-black hover:text-white transition-all text-sm">→</button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <span key={d} className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em]">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const hasData = hasLogsOnDate(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square flex flex-col items-center justify-center transition-all relative text-xs border ${
                    isSelected ? 'bg-black text-white border-black z-10 font-black' : 'hover:bg-gray-50 border-gray-50 text-gray-400'
                  }`}
                >
                  <span className="font-mono">{date.getDate()}</span>
                  {hasData && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-[#bef264] rounded-full"></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <h3 className="text-2xl font-black text-black tracking-tighter uppercase flex items-center gap-6">
           Archive <ArrowRight className="w-6 h-6 text-gray-300" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.slice().reverse().slice(0, 6).map(log => (
            <div key={log.id} className="bg-white border border-gray-100 p-8 hover:border-black transition-all group shadow-sm duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{log.date}</p>
                  <p className="text-lg font-black text-black uppercase tracking-tighter leading-none">{log.focus || 'GENERAL'}</p>
                </div>
                <div className="bg-[#bef264] px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] border border-black/5">
                  {formatDuration(log.durationMinutes || 0)}
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {log.exercises.slice(0, 3).map((ex, i) => (
                   <div key={i} className="text-[10px] font-bold text-gray-500 flex justify-between uppercase tracking-widest border-b border-gray-50 pb-1">
                     <span>{ex.name}</span>
                     <span className="font-mono text-black font-black">{ex.weight}K/{ex.reps}R</span>
                   </div>
                ))}
              </div>
              {log.feedback && <p className="text-[10px] text-gray-400 italic bg-gray-50/80 p-3 border-l-4 border-gray-200 leading-relaxed">"{log.feedback}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
