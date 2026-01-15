
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutExercise } from '../types';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Clock } from 'lucide-react';

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
  const [dailyFeedback, setDailyFeedback] = useState('');
  
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
      feedback: dailyFeedback,
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
    setDailyFeedback('');
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-32 px-1 md:px-0">
      <div className="flex flex-col lg:flex-row bg-white border border-gray-100 shadow-2xl overflow-hidden rounded-sm">
        
        {/* 左側日曆 */}
        <div className="lg:w-[350px] p-6 md:p-10 border-r border-gray-100 bg-[#fcfcfc]/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center border border-gray-100 hover:bg-white transition-all"><ChevronLeft size={16} /></button>
              <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center border border-gray-100 hover:bg-white transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-[9px] font-black text-gray-300 tracking-widest uppercase mb-1">{d}</div>
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
                  className={`w-9 h-9 flex items-center justify-center mx-auto text-[12px] font-black transition-all rounded-sm ${
                    isSelected ? 'bg-black text-white shadow-lg scale-110' : 'text-gray-400 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側表單 - 全面重構行動版 UI */}
        <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b border-gray-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-[#bef264] flex items-center justify-center shadow-2xl shrink-0">
                 <Plus size={24} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">快速登錄 <span className="text-gray-200">QUICK LOG</span></h2>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mt-1">Data Input Module</p>
              </div>
            </div>
            {/* 行動版專屬 Duration 區塊 */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-sm md:bg-transparent md:p-0">
              <Clock size={14} className="text-gray-400" />
              <div className="flex flex-col md:items-end">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Duration</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-2xl font-black font-mono leading-none tracking-tighter">{duration}</span>
                  <span className="text-[9px] font-black text-gray-900 uppercase">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* 時間與焦點區塊 - 使用色塊化佈局解決行動端重疊 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-3">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">開始時段</label>
              <div className="relative group">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 text-xl font-black font-mono outline-none focus:bg-white focus:border-black transition-all" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">結束時段</label>
              <div className="relative group">
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 text-xl font-black font-mono outline-none focus:bg-white focus:border-black transition-all" />
              </div>
            </div>
            <div className="md:col-span-6">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">訓練焦點 TARGET</label>
              <input placeholder="輸入部位 (如: 胸、背)..." value={focusArea} onChange={e => setFocusArea(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 text-base font-black outline-none focus:bg-white focus:border-black transition-all" />
            </div>
          </div>

          {/* 動作輸入區 */}
          <div className="bg-[#fcfcfc] border border-gray-100 p-5 md:p-8 space-y-8 rounded-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">主要動作 EXERCISE</p>
                  <input placeholder="例如：槓鈴臥推..." value={exerciseInput.name} onChange={e => setExerciseInput({...exerciseInput, name: e.target.value})} className="w-full h-14 bg-white border border-gray-100 px-5 text-sm font-black outline-none focus:border-black shadow-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Weight', 'Reps', 'Sets'].map(label => (
                    <div key={label}>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-center">{label}</p>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={(exerciseInput as any)[label.toLowerCase()]} 
                        onChange={e => setExerciseInput({...exerciseInput, [label.toLowerCase()]: e.target.value})} 
                        className="w-full h-12 bg-white border border-gray-100 text-center text-sm font-black outline-none focus:border-black font-mono" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MessageSquare size={10} /> 訓練回饋 (FEEDBACK)
                </p>
                <textarea 
                  placeholder="紀錄今日訓練狀態..."
                  value={dailyFeedback}
                  onChange={e => setDailyFeedback(e.target.value)}
                  className="flex-1 bg-white border border-gray-100 p-4 text-xs font-bold outline-none focus:border-black resize-none min-h-[120px]"
                />
              </div>
            </div>

            <button 
              onClick={handleCommit}
              className="w-full bg-black text-white py-5 font-black text-[11px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-xl active:scale-95"
            >
              提交訓練日誌 COMMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingJournal;
