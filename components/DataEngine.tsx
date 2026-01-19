
import React, { useState, useMemo, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile } from '../types.ts';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp, getTaiwanDate } from '../utils/calculations.ts';
import { Target, Calendar, Scale, Activity, ChevronLeft, ChevronRight, Info, Zap, Map, Clock, Trash2 } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  onUpdateMetrics?: (m: UserMetrics[]) => void;
  onDeleteMetric: (date: string) => void; // Added Delete Prop
  onUpdateProfile: (p: UserProfile) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics = [], onAddMetric, onDeleteMetric }) => {
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : { 
    weight: profile.height - 105, 
    bodyFat: profile.gender === 'F' ? 22 : 15, 
    muscleMass: 30, 
    date: getLocalTimestamp() 
  };
  
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const enhancedRadarData = radarData.map(item => {
    let label = item.subject;
    if (label === '肌肉負荷') label = '肌肉飽滿';
    if (label === '定義精度') label = '鋼鐵定義';
    if (label === '結構潛力') label = '骨架潛力';
    if (label === '代謝引擎') label = '基礎代謝';
    if (label === '核心戰力') label = '綜合評級';
    return { ...item, subject: label };
  });

  const activeDays = useMemo(() => {
    const days = new Set();
    metrics.forEach(m => days.add(m.date.substring(0, 10)));
    return days;
  }, [metrics]);

  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [input, setInput] = useState({ 
    date: getTaiwanDate(),
    time: getCurrentTimeStr(),
    weight: latest.weight.toString(), 
    bodyFat: latest.bodyFat.toString(), 
    muscleMass: latest.muscleMass.toString()
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // 當日期改變時，檢查是否有當天的數據並回填
  const handleDateSelect = (dateStr: string) => {
    // 尋找當天最後一筆紀錄
    const existingMetric = [...metrics].reverse().find(m => m.date.startsWith(dateStr));
    
    if (existingMetric) {
      setExistingId(existingMetric.id); // Store ID for potential deletion
      const parts = existingMetric.date.split(' ');
      const timePart = parts.length > 1 ? parts[1] : '00:00';
      
      setInput({
        date: dateStr,
        time: timePart,
        weight: existingMetric.weight.toString(),
        bodyFat: existingMetric.bodyFat.toString(),
        muscleMass: existingMetric.muscleMass.toString()
      });
    } else {
      setExistingId(null);
      // 若無數據，重置輸入（保留體重方便輸入）
      setInput(prev => ({
        ...prev,
        date: dateStr,
        time: getCurrentTimeStr(),
        // muscleMass: '' // Optional: clear or keep
      }));
    }
  };

  // 當 metrics 變更時 (例如剛刪除完)，重新刷新當前日期狀態
  useEffect(() => {
    handleDateSelect(input.date);
  }, [metrics]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = parseFloat(input.weight) || 0;
    const bodyFatVal = parseFloat(input.bodyFat) || 0;
    let muscleVal = parseFloat(input.muscleMass);

    // 肌肉量自動校準算法 (若未輸入)
    if (!input.muscleMass || isNaN(muscleVal) || muscleVal === 0) {
      const leanMass = weightVal * (1 - bodyFatVal / 100);
      muscleVal = parseFloat((leanMass * 0.95).toFixed(1));
      setInput(prev => ({ ...prev, muscleMass: muscleVal.toString() }));
    }

    const fullTimestamp = `${input.date} ${input.time}`;

    setTimeout(() => {
      onAddMetric({
        id: existingId || Date.now().toString(), // Update existing if ID present (handled by parent usually, or just overwrite)
        date: fullTimestamp,
        weight: weightVal,
        bodyFat: bodyFatVal,
        muscleMass: muscleVal
      });
      setIsSyncing(false);
      alert(`數據已校準。\n估算肌肉量: ${muscleVal}kg`);
    }, 500);
  };

  const handleDelete = () => {
    if (!existingId) return;
    if (confirm("確認刪除此日數據？此操作不可逆。")) {
      onDeleteMetric(input.date); // Pass date or ID depending on parent logic. Parent uses ID usually, but here distinct by date logic in App
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6 pb-32 max-w-6xl mx-auto">
      
      {/* 戰略地圖 (綠點日曆回饋) */}
      <div className="bg-black/5 p-4 rounded-sm border border-black/5">
         <div className="flex items-center gap-2 mb-3">
            <Map size={12} className="text-black" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">生物數據同步圖 BIOMETRIC_SYNC_MAP</span>
         </div>
         {/* 使用 w-full 與 overflow-x-auto 確保手機版可滑動 */}
         <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <div className="flex gap-1.5 min-w-max">
                {Array.from({ length: 31 }).map((_, i) => {
                   const day = (i + 1).toString().padStart(2, '0');
                   // 簡單處理跨月份問題，這裡假設操作當月
                   const yearMonth = input.date.substring(0, 7); // YYYY-MM
                   const dateStr = `${yearMonth}-${day}`;
                   
                   // 檢查這一天是否有數據
                   const isActive = activeDays.has(dateStr);
                   const isSelected = input.date === dateStr;
                   
                   return (
                      <button 
                        key={i} 
                        onClick={() => handleDateSelect(dateStr)}
                        className={`w-9 h-10 flex flex-col items-center justify-center border-2 transition-all relative shrink-0 ${isSelected ? 'border-black bg-black text-[#bef264] scale-110 z-10' : 'border-white bg-white text-gray-300 hover:border-gray-300'}`}
                      >
                         <span className="text-[10px] font-mono font-black">{day}</span>
                         {isActive && (
                            <div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#bef264]' : 'bg-black'} shadow-sm`}></div>
                         )}
                      </button>
                   );
                })}
            </div>
         </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4 gap-4">
        <div>
           <h2 className="text-3xl font-black tracking-tighter text-black uppercase">生物指標矩陣</h2>
           <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Biological Biometric Monitoring System</p>
        </div>
        
        {/* 日期選擇器 */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 border border-gray-100 shadow-sm">
           <button onClick={() => { const d = new Date(input.date); d.setDate(d.getDate()-1); handleDateSelect(d.toISOString().split('T')[0]); }} className="p-2 bg-white border border-gray-100 text-black shadow-sm hover:shadow-md transition-all"><ChevronLeft size={16}/></button>
           
           <div className="relative group flex items-center gap-2 px-3 bg-white border border-gray-100">
              <Calendar size={14} className="text-gray-400 group-hover:text-black transition-colors" />
              <input 
                type="date" 
                value={input.date} 
                onChange={e => handleDateSelect(e.target.value)} 
                className="bg-transparent font-black text-xs py-2 outline-none cursor-pointer text-black w-24" 
              />
           </div>

           <button onClick={() => { const d = new Date(input.date); d.setDate(d.getDate()+1); handleDateSelect(d.toISOString().split('T')[0]); }} className="p-2 bg-white border border-gray-100 text-black shadow-sm hover:shadow-md transition-all"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* 數據卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'BMI 指數', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: '基礎代謝 BMR', v: Math.round(calculated.bmr), s: { label: 'KCAL/DAY', color: 'text-gray-400' }, c: 'bg-blue-400' },
          { label: '肌力潛力 FFMI', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: '進化綜合評分', v: Math.round(calculated.score), s: { label: '數據健康', color: 'text-lime-600' }, c: 'bg-black' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-5 shadow-sm hover:border-black transition-all group overflow-hidden">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">{card.label}</span>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-black tracking-tighter group-hover:scale-110 transition-transform origin-left">{card.v}</span>
                {card.s && <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full ${card.s.color} transition-colors`}>{card.s.label}</span>}
             </div>
             <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c} transition-all duration-1000 shadow-[0_0_8px_currentColor]`} style={{ width: `${Math.min(100, (Number(card.v)/ (card.label.includes('BMR') ? 2500 : 35)) * 100)}%` }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-8 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#bef264] blur-[120px] opacity-10"></div>
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
           <Zap size={20} className="text-[#bef264] animate-pulse" />
           <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">生理指標校準 UPDATE_MATRIX_FIELD</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end relative z-10">
           {/* 體重 - 必填 */}
           <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Scale size={14} /> 體重 WEIGHT <span className="text-red-500">*</span></label>
              <div className="relative h-14 flex items-center bg-white/5 border-b-2 border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value})} className="w-full bg-transparent font-mono font-black text-3xl outline-none text-white pr-8" />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">KG</span>
              </div>
           </div>

           {/* 體脂 - 必填 */}
           <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">體脂 FAT % <span className="text-red-500">*</span></label>
              <div className="relative h-14 flex items-center bg-white/5 border-b-2 border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value})} className="w-full bg-transparent font-mono font-black text-3xl outline-none text-white pr-8" />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">%</span>
              </div>
           </div>

           {/* 肌肉量 - 選填 (自動計算) */}
           <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">肌肉量 MUSCLE</label>
              <div className="relative h-14 flex items-center bg-white/5 border-b-2 border-white/20 px-1 focus-within:border-[#bef264] transition-all group">
                <input 
                  type="number" step="0.1" 
                  value={input.muscleMass} 
                  onChange={e => setInput({...input, muscleMass: e.target.value})} 
                  placeholder="AUTO"
                  className="w-full bg-transparent font-mono font-black text-3xl outline-none text-white pr-8 placeholder:text-white/20" 
                />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">KG</span>
                {!input.muscleMass && (
                   <div className="absolute -top-8 left-0 text-[8px] bg-[#bef264] text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      未輸入將自動估算
                   </div>
                )}
              </div>
           </div>

           {/* 測量時間 */}
           <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} /> 測量時間 TIME</label>
              <div className="relative h-14 flex items-center bg-white/5 border-b-2 border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input 
                  type="time" 
                  value={input.time} 
                  onChange={e => setInput({...input, time: e.target.value})} 
                  className="w-full bg-transparent font-mono font-black text-xl outline-none text-white cursor-pointer" 
                />
              </div>
           </div>

           {/* 動作按鈕：更新 & 刪除 */}
           <div className="lg:col-span-2 flex gap-3 h-14">
              <button disabled={isSyncing} className="flex-1 bg-[#bef264] text-black font-black text-[11px] tracking-[0.2em] uppercase hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSyncing ? <span className="animate-pulse">UPLINKING...</span> : '更新數據 SYNC'}
              </button>
              
              {existingId && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="w-14 bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 size={18} />
                </button>
              )}
           </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Matrix - Increased Size */}
        <div className="bg-white border border-gray-100 p-8 shadow-sm min-h-[500px] flex flex-col group hover:border-black transition-all">
           <div className="flex justify-between items-center mb-4">
              <div>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black mb-1">戰力維度分析 RADAR_MATRIX</h3>
                 <p className="text-[9px] text-gray-400 font-bold uppercase">Visualizing Your Physiological Strength</p>
              </div>
              <div className="group/info relative">
                 <Info size={16} className="text-gray-300 hover:text-black cursor-help transition-colors" />
                 {/* Fixed Tooltip Styling */}
                 <div className="absolute right-0 top-8 w-64 bg-black text-white p-5 text-[10px] font-bold rounded-sm opacity-0 group-hover/info:opacity-100 transition-all z-50 pointer-events-none shadow-2xl border border-[#bef264]/20">
                    <p className="text-[#bef264] border-b border-white/10 pb-2 mb-3 font-black tracking-widest uppercase">指標定義 DEFINITIONS</p>
                    <div className="space-y-2 leading-relaxed">
                       <p><span className="text-gray-400">• 肌肉飽滿:</span> 對比身高體重之純肌肉佔比</p>
                       <p><span className="text-gray-400">• 鋼鐵定義:</span> 體脂率之於線條呈現精確度</p>
                       <p><span className="text-gray-400">• 骨架潛力:</span> FFMI 顯示自然發展之天花板</p>
                       <p><span className="text-gray-400">• 代謝引擎:</span> 靜息能量消耗速率 (BMR)</p>
                       <p><span className="text-gray-400">• 綜合評級:</span> 全維度權重加總評分</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full min-h-0 relative">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={enhancedRadarData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                 <PolarGrid stroke="#f1f5f9" strokeWidth={1} />
                 {/* Increased Font Size and Radius */}
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 12, fontWeight: 900 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={3} fill="#bef264" fillOpacity={0.6} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        {/* Evolution Trend */}
        <div className="bg-white border border-gray-100 p-8 shadow-sm min-h-[500px] flex flex-col group hover:border-black transition-all">
           <div className="mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black mb-1">進化趨勢監測 EVOLUTION_TREND</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Chronological Biological Progression</p>
           </div>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={metrics.slice(-12)} margin={{ right: 20, left: -10, top: 10, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#000" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#bef264" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#bef264" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis fontSize={10} stroke="#cbd5e1" tickFormatter={(v) => `${v}`} />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', fontSize: '11px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
                 <Area type="monotone" dataKey="weight" name="體重 WEIGHT (KG)" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }} />
                 <Area type="monotone" dataKey="bodyFat" name="體脂 FAT (%)" stroke="#bef264" strokeWidth={4} fillOpacity={1} fill="url(#colorFat)" dot={{ r: 4, fill: '#bef264', strokeWidth: 2, stroke: '#fff' }} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-3"><div className="w-4 h-1 bg-black rounded-full shadow-sm"></div> <span className="text-[10px] font-black uppercase text-gray-500">體重 (KG)</span></div>
              <div className="flex items-center gap-3"><div className="w-4 h-1 bg-[#bef264] rounded-full shadow-[0_0_8px_#bef264]"></div> <span className="text-[10px] font-black uppercase text-gray-500">體脂率 (%)</span></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
