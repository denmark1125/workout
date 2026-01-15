
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise } from '../types';
import { ChevronLeft, ChevronRight, Plus, Clock, Target, Trash2 } from 'lucide-react';

interface TrainingJournalProps {
  logs: WorkoutLog[];
  onAddLog: (log: WorkoutLog) => void;
  onDeleteLog: (logId: string) => void;
}

const TrainingJournal: React.FC<TrainingJournalProps> = ({ logs, onAddLog, onDeleteLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [exerciseInput, setExerciseInput] = useState({ name: '', weight: '', reps: '', sets: '1' });
  const [focusArea, setFocusArea] = useState('');
  
  const [startTime, setStartTime] = useState("17:34");
  const [endTime, setEndTime] = useState("18:34");

  // 日曆邏輯
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

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const handleCommit = () => {
    if (!exerciseInput.name) return;
    onAddLog({
      id: Date.now().toString(),
      date: selectedDate,
      startTime, endTime,
      focus: focusArea,
      durationMinutes: duration,
      exercises: [{
        id: Date.now().toString(),
        name: exerciseInput.name,
        weight: parseFloat(exerciseInput.weight) || 0,
        reps: parseInt(exerciseInput.reps) || 0,
        sets: parseInt(exerciseInput.sets) || 1
      }]
    });
    setExerciseInput({ name: '', weight: '', reps: '', sets: '1' });
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-1 bg-gray-100 border border-gray-100 shadow-2xl">
        
        {/* 左側日曆 */}
        <div className="bg-white p-12 lg:w-[400px]">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 border border-gray-100 hover:bg-gray-50 transition-all"><ChevronLeft size={14} /></button>
              <button onClick={handleNextMonth} className="p-2 border border-gray-100 hover:bg-gray-50 transition-all"><ChevronRight size={14} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[8px] font-black text-gray-300 py-4">{d}</div>
            ))}
            {Array.from({ length: daysInMonth.firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth.days }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square flex items-center justify-center text-[10px] font-black transition-all ${
                    isSelected ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側表單 */}
        <div className="bg-white p-12 flex-1">
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-black text-lime-400 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-tighter uppercase">快速登錄 (QUICK LOG)</h2>
              </div>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] pl-14">Tactical Entry</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-xl font-black font-mono">{duration} 分鐘</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Start Time</label>
              <div className="flex items-center gap-4 border-b-2 border-gray-50 pb-2">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="text-2xl font-black outline-none w-full font-mono" />
                <Clock className="text-gray-200" size={16} />
              </div>
            </div>
            <div>
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 block">End Time</label>
              <div className="flex items-center gap-4 border-b-2 border-gray-50 pb-2">
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="text-2xl font-black outline-none w-full font-mono" />
                <Clock className="text-gray-200" size={16} />
              </div>
            </div>
            <div>
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Focus</label>
              <div className="flex items-center gap-4 border-b-2 border-gray-50 pb-2">
                <input placeholder="Muscle group..." value={focusArea} onChange={e => setFocusArea(e.target.value)} className="text-xl font-black outline-none w-full" />
                <Target className="text-gray-200" size={16} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 p-8 border border-gray-100 mb-8">
            <div className="grid grid-cols-12 gap-4 mb-8">
              <div className="col-span-12 md:col-span-5">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-3">動作 (EXERCISE)</p>
                <input 
                  placeholder="Bench Press" 
                  value={exerciseInput.name} 
                  onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-100 text-sm font-black outline-none focus:border-black" 
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-3">重量</p>
                <input 
                  placeholder="KG" 
                  value={exerciseInput.weight}
                  onChange={e => setExerciseInput({...exerciseInput, weight: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-100 text-center text-sm font-black outline-none focus:border-black" 
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-3">次數</p>
                <input 
                  placeholder="REPS" 
                  value={exerciseInput.reps}
                  onChange={e => setExerciseInput({...exerciseInput, reps: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-100 text-center text-sm font-black outline-none focus:border-black" 
                />
              </div>
              <div className="col-span-4 md:col-span-3">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-3">組數</p>
                <input 
                  placeholder="1" 
                  value={exerciseInput.sets}
                  onChange={e => setExerciseInput({...exerciseInput, sets: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-100 text-center text-sm font-black outline-none focus:border-black" 
                />
              </div>
            </div>

            <button 
              onClick={handleCommit}
              className="w-full bg-black text-white py-4 font-black text-[10px] tracking-[0.4em] uppercase hover:bg-lime-400 hover:text-black transition-all"
            >
              COMMIT SESSION
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4 mb-8">
          ARCHIVE <span className="text-gray-200">→</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-gray-100 border border-gray-100 shadow-xl">
          {logs.slice().reverse().map(log => (
            <div key={log.id} className="bg-white p-8 group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[8px] font-black text-gray-300 mb-1">{log.date}</p>
                  <p className="text-lg font-black uppercase tracking-tight">{log.focus || 'GENERAL'}</p>
                </div>
                <button onClick={() => onDeleteLog(log.id)} className="text-gray-100 group-hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
              </div>
              <div className="space-y-2">
                {log.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between text-[10px] font-bold border-b border-gray-50 pb-2">
                    <span className="text-gray-400 uppercase">{ex.name}</span>
                    <span className="font-mono">{ex.weight}K / {ex.reps}R / {ex.sets}S</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
