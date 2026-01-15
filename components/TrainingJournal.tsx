
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
  
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:00");

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
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-12 pb-32 px-2 md:px-0 overflow-hidden">
      <div className="flex flex-col lg:flex-row bg-white border border-gray-100 shadow-2xl rounded-sm overflow-hidden">
        
        {/* 左側日曆 */}
        <div className="lg:w-[400px] p-6 md:p-12 border-r border-gray-100 bg-[#fcfcfc]/50">
          <div className="flex items-center justify-between mb-8 md:mb-14">
            <h3 className="text-xl font-black">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center border border-gray-100 hover:bg-white transition-all"><ChevronLeft size={18} /></button>
              <button onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center border border-gray-100 hover:bg-white transition-all"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-[10px] font-black text-gray-300 tracking-widest uppercase mb-2">{d}</div>
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
                  className={`w-10 h-10 flex items-center justify-center mx-auto text-[13px] font-black transition-all rounded-sm ${
                    isSelected ? 'bg-black text-white shadow-xl scale-110 z-10' : 'text-gray-400 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側表單 */}
        <div className="flex-1 p-6 md:p-16 space-y-12">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-black text-lime-400 flex items-center justify-center shadow-2xl relative">
                 <Plus size={28} />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">快速登錄 <span className="text-gray-200">QUICK LOG</span></h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] mt-2">Data Input Module</p>
              </div>
            </div>
            <div className="border-l-2 sm:border-l-0 sm:border-r-2 border-lime-400 pl-6 sm:pl-0 sm:pr-6 py-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono leading-none tracking-tighter">{duration}</span>
                <span className="text-[10px] font-black text-gray-900 uppercase">min</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 border-b border-gray-100 pb-8">
            <div className="col-span-1 md:col-span-3 space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">開始時段</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="text-xl font-black outline-none w-full font-mono bg-transparent border-b border-gray-50 pb-1" />
            </div>
            <div className="col-span-1 md:col-span-3 space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">結束時段</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="text-xl font-black outline-none w-full font-mono bg-transparent border-b border-gray-50 pb-1" />
            </div>
            <div className="col-span-2 md:col-span-6 space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">訓練焦點 Target</label>
              <input placeholder="輸入部位..." value={focusArea} onChange={e => setFocusArea(e.target.value)} className="text-lg font-black outline-none w-full bg-transparent border-b border-gray-50 pb-1" />
            </div>
          </div>

          {/* 動作矩陣輸入 */}
          <div className="bg-[#fcfcfc] border border-gray-100 p-6 md:p-10 space-y-10 shadow-inner rounded-sm overflow-hidden">
            <div className="space-y-8">
              <div className="w-full">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">動作 Exercise_Name</p>
                <input 
                  placeholder="例如：槓鈴臥推..." 
                  value={exerciseInput.name} 
                  onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})}
                  className="w-full h-14 bg-white border border-gray-100 px-6 text-lg font-black outline-none focus:border-black shadow-sm" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Weight</p>
                  <input type="number" placeholder="0" value={exerciseInput.weight} onChange={e => setExerciseInput({...exerciseInput, weight: e.target.value})} className="w-full h-14 bg-white border border-gray-100 text-center text-lg font-black outline-none focus:border-black font-mono" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Reps</p>
                  <input type="number" placeholder="0" value={exerciseInput.reps} onChange={e => setExerciseInput({...exerciseInput, reps: e.target.value})} className="w-full h-14 bg-white border border-gray-100 text-center text-lg font-black outline-none focus:border-black font-mono" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Sets</p>
                  <input type="number" placeholder="1" value={exerciseInput.sets} onChange={e => setExerciseInput({...exerciseInput, sets: e.target.value})} className="w-full h-14 bg-white border border-gray-100 text-center text-lg font-black outline-none focus:border-black font-mono" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCommit}
              className="w-full bg-black text-white py-5 md:py-6 font-black text-xs tracking-[0.6em] uppercase hover:bg-lime-400 hover:text-black transition-all shadow-xl active:scale-95"
            >
              提交 COMMIT_NODE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
