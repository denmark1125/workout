
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile } from '../types.ts';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp, getTaiwanDate } from '../utils/calculations.ts';
import { Target, Calendar, Scale, Activity } from 'lucide-react';

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
    <div className="animate-in fade-in duration-700 space-y-5 pb-32 max-w-6xl mx-auto">
      <header className="border-b-2 border-black pb-3">
        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.4em] mb-0.5">Biological Matrix Dashboard</p>
        <h1 className="text-xl font-black tracking-tight text-black uppercase">數據矩陣中心</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'BMI INDEX', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: 'BMR RATE', v: Math.round(calculated.bmr), s: { label: 'KCAL/DAY', color: 'text-gray-400' }, c: 'bg-blue-400' },
          { label: 'FFMI LEVEL', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: '核心評分', v: Math.round(calculated.score), s: { label: '戰力穩定', color: 'text-lime-600' }, c: 'bg-black' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-black transition-all group overflow-hidden relative">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{card.label}</span>
             <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-lg font-black text-black tracking-tighter leading-none">{card.v}</span>
                {card.s && <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full ${card.s.color}`}>{card.s.label}</span>}
             </div>
             <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c} transition-all duration-1000`} style={{ width: `${Math.min(100, (Number(card.v)/ (card.label.includes('BMR') ? 2500 : 35)) * 100)}%` }}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-10 rounded-full"></div>
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
           <Activity size={16} className="text-[#bef264]" />
           <h2 className="text-[9px] font-black uppercase tracking-widest text-white">生理數據更新 UPDATE_BIOMETRICS</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end relative z-10">
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={10}/> 日期 DATE</label>
              <input type="date" value={input.date} onChange={e => setInput({...input, date: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-xs font-bold outline-none focus:border-[#bef264] transition-all text-white" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Scale size={12} /> 體重 WEIGHT</label>
              <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-lg font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">體脂 FAT %</label>
              <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-lg font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Target size={10}/> 肌肉量 MUSCLE</label>
              <input type="number" step="0.1" required value={input.muscleMass} onChange={e => setInput({...input, muscleMass: e.target.value})} className="w-full bg-white/5 border-b border-white/10 p-2 text-lg font-black outline-none focus:border-[#bef264] transition-all font-mono text-white" />
           </div>
           <button disabled={isSyncing} className="bg-[#bef264] text-black h-12 font-black text-[9px] tracking-widest uppercase hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded-lg">
             {isSyncing ? 'UPLINK...' : 'INITIATE_SYNC'}
           </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm min-h-[350px] flex flex-col overflow-hidden">
           <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 text-gray-400 border-b border-gray-50 pb-2">戰力維度 RADAR_MATRIX</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={radarData} margin={{ top: 20, right: 60, left: 60, bottom: 20 }}>
                 <PolarGrid stroke="#f1f5f9" strokeWidth={1} />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.6} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm min-h-[350px] flex flex-col">
           <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 text-gray-400 border-b border-gray-50 pb-2">進化趨勢 EVOLUTION_TREND</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={metrics.slice(-10)} margin={{ right: 10, left: -20, top: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis fontSize={9} stroke="#cbd5e1" domain={['auto', 'auto']} />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '9px', fontWeight: '900' }} />
                 <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={3} dot={{ r: 3, fill: '#000' }} />
                 <Line type="monotone" dataKey="bodyFat" stroke="#bef264" strokeWidth={3} dot={{ r: 3, fill: '#bef264' }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
