
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile } from '../types.ts';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp, getTaiwanDate } from '../utils/calculations.ts';
import { Target, Calendar, Scale, Activity, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  onUpdateMetrics?: (m: UserMetrics[]) => void;
  onUpdateProfile: (p: UserProfile) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics = [], onAddMetric }) => {
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : { 
    weight: profile.height - 105, 
    bodyFat: profile.gender === 'F' ? 22 : 15, 
    muscleMass: 30, 
    date: getLocalTimestamp() 
  };
  
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ 
    date: getTaiwanDate(),
    weight: latest.weight.toString(), 
    bodyFat: latest.bodyFat.toString(), 
    muscleMass: latest.muscleMass.toString()
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = parseFloat(input.weight) || 0;
    const bodyFatVal = parseFloat(input.bodyFat) || 0;
    const muscleVal = parseFloat(input.muscleMass) || 0;

    const fullTimestamp = input.date === getTaiwanDate() ? getLocalTimestamp() : `${input.date} 12:00`;

    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: fullTimestamp,
        weight: weightVal,
        bodyFat: bodyFatVal,
        muscleMass: muscleVal
      });
      setIsSyncing(false);
    }, 800);
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6 pb-32 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black pb-4 gap-4">
        <div>
           <h2 className="text-2xl font-black tracking-tighter text-black uppercase">數據矩陣中心</h2>
           <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Biological Biometric Database</p>
        </div>
        
        {/* 全功能日曆導航 */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 border border-gray-100 rounded-xl shadow-sm">
           <button onClick={() => { const d = new Date(input.date); d.setDate(d.getDate()-1); setInput({...input, date: d.toISOString().split('T')[0]}); }} className="p-2 bg-white rounded-lg border border-gray-100 text-black shadow-sm"><ChevronLeft size={16}/></button>
           <div className="relative group">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black" />
              <input 
                type="date" 
                value={input.date} 
                onChange={e => setInput({...input, date: e.target.value})} 
                className="bg-transparent font-black text-xs pl-9 pr-3 py-1 outline-none cursor-pointer text-black" 
              />
           </div>
           <button onClick={() => { const d = new Date(input.date); d.setDate(d.getDate()+1); setInput({...input, date: d.toISOString().split('T')[0]}); }} className="p-2 bg-white rounded-lg border border-gray-100 text-black shadow-sm"><ChevronRight size={16}/></button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'BMI INDEX', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: 'BMR RATE', v: Math.round(calculated.bmr), s: { label: 'KCAL/DAY', color: 'text-gray-400' }, c: 'bg-blue-400' },
          { label: 'FFMI LEVEL', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: '戰力評分', v: Math.round(calculated.score), s: { label: '戰力穩定', color: 'text-lime-600' }, c: 'bg-black' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-black transition-all">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{card.label}</span>
             <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-lg font-black text-black tracking-tighter">{card.v}</span>
                {card.s && <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full ${card.s.color}`}>{card.s.label}</span>}
             </div>
             <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c}`} style={{ width: `${Math.min(100, (Number(card.v)/ (card.label.includes('BMR') ? 2500 : 35)) * 100)}%` }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-6 rounded-2xl shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-10"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3">
           <Activity size={16} className="text-[#bef264]" />
           <h2 className="text-[9px] font-black uppercase tracking-widest text-white">生理指標校準 UPDATE_BIOMETRICS</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
           <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Scale size={12} /> 體重 WEIGHT</label>
              <div className="relative h-12 flex items-center bg-white/5 border-b border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value})} className="w-full bg-transparent font-mono font-black text-2xl outline-none text-white pr-8" />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">KG</span>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">體脂 FAT %</label>
              <div className="relative h-12 flex items-center bg-white/5 border-b border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value})} className="w-full bg-transparent font-mono font-black text-2xl outline-none text-white pr-8" />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">%</span>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">肌肉量 MUSCLE</label>
              <div className="relative h-12 flex items-center bg-white/5 border-b border-white/20 px-1 focus-within:border-[#bef264] transition-all">
                <input type="number" step="0.1" required value={input.muscleMass} onChange={e => setInput({...input, muscleMass: e.target.value})} className="w-full bg-transparent font-mono font-black text-2xl outline-none text-white pr-8" />
                <span className="absolute right-2 text-[10px] font-black text-gray-600">KG</span>
              </div>
           </div>
           <button disabled={isSyncing} className="bg-[#bef264] text-black h-12 font-black text-[10px] tracking-widest uppercase hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-xl">
             {isSyncing ? 'UPLINK...' : 'INITIATE_SYNC'}
           </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm min-h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">戰力維度分析 RADAR_MATRIX</h3>
              <div className="group relative">
                 <Info size={14} className="text-gray-300" />
                 <div className="absolute right-0 top-6 w-48 bg-black text-white p-3 text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none">
                    <p className="border-b border-white/10 pb-1 mb-1">指標定義：</p>
                    <p>• 肌肉負荷：當前肌肉與目標佔比</p>
                    <p>• 定義精度：體脂對肌肉可見度影響</p>
                    <p>• 結構潛力：FFMI 純肌發育指數</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={radarData} margin={{ top: 20, right: 80, left: 80, bottom: 20 }}>
                 <PolarGrid stroke="#f1f5f9" strokeWidth={1} />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.6} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm min-h-[400px] flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-400">進化趨勢監測 EVOLUTION_TREND</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={metrics.slice(-12)} margin={{ right: 20, left: -20, top: 10 }}>
                 <defs>
                   <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#bef264" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#bef264" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis fontSize={10} stroke="#cbd5e1" />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '10px', fontWeight: '900' }} />
                 <Area type="monotone" dataKey="weight" name="體重(KG)" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                 <Area type="monotone" dataKey="bodyFat" name="體脂(%)" stroke="#bef264" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-black"></div> <span className="text-[10px] font-black uppercase text-gray-400">體重變動</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-[#bef264]"></div> <span className="text-[10px] font-black uppercase text-gray-400">體脂率(%)</span></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
