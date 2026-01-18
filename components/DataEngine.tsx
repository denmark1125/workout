
import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile, GoalMetadata } from '../types.ts';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp, getTaiwanDate } from '../utils/calculations.ts';
import { Target, Calendar, Scale, Activity, PlusCircle } from 'lucide-react';

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
      <header className="border-b-2 border-black pb-4">
        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.4em] mb-1">Biological Matrix Dashboard</p>
        <h1 className="text-3xl font-black tracking-tighter text-black uppercase">數據矩陣中心</h1>
      </header>

      {/* 數據卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'BMI INDEX', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: 'BMR RATE', v: Math.round(calculated.bmr), s: { label: 'KCAL/DAY', color: 'text-gray-400' }, c: 'bg-blue-400' },
          { label: 'FFMI LEVEL', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: '核心評分', v: Math.round(calculated.score), s: { label: '戰力穩定', color: 'text-lime-600' }, c: 'bg-black' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:border-black transition-all group overflow-hidden relative">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">{card.label}</span>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black text-black tracking-tighter leading-none">{card.v}</span>
                {card.s && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border rounded-full ${card.s.color}`}>{card.s.label}</span>}
             </div>
             <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c} transition-all duration-1000`} style={{ width: `${Math.min(100, (Number(card.v)/ (card.label.includes('BMR') ? 2500 : 35)) * 100)}%` }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-10 rounded-full"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
           <Activity size={18} className="text-[#bef264]" />
           <h2 className="text-xs font-black uppercase tracking-widest text-white">生理數據更新 UPDATE_BIOMETRICS</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end relative z-10">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> 日期 DATE</label>
              <input type="date" value={input.date} onChange={e => setInput({...input, date: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-sm font-bold outline-none focus:border-[#bef264] transition-all text-white" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Scale size={14} /> 體重 WEIGHT (KG)</label>
              <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-2xl font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">體脂 FAT (%)</label>
              <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-2xl font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> 肌肉量 MUSCLE (KG)</label>
              <input type="number" step="0.1" required value={input.muscleMass} onChange={e => setInput({...input, muscleMass: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-2xl font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <button disabled={isSyncing} className="bg-[#bef264] text-black h-[52px] font-black text-[11px] tracking-[0.3em] uppercase hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-xl">
             {isSyncing ? 'UPLINK...' : 'INITIATE_SYNC'}
           </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm min-h-[400px] flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-gray-400 border-b border-gray-50 pb-2">戰力維度 RADAR_MATRIX</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={radarData}>
                 <PolarGrid stroke="#f1f5f9" strokeWidth={1} />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 11, fontWeight: 900 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.7} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm min-h-[400px] flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-gray-400 border-b border-gray-50 pb-2">進化趨勢 EVOLUTION_TREND</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={metrics.slice(-10)}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis hide domain={['auto', 'auto']} />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }} />
                 <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} />
                 <Line type="monotone" dataKey="bodyFat" stroke="#bef264" strokeWidth={3} dot={{ r: 4, fill: '#bef264' }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
