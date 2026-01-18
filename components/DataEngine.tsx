
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
    weight: latest.weight, 
    bodyFat: latest.bodyFat, 
    muscleMass: latest.muscleMass || ''
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = Number(input.weight) || 0;
    const bodyFatVal = Number(input.bodyFat) || 0;
    const mMass = input.muscleMass === '' 
      ? Number((weightVal * (1 - bodyFatVal / 100) * 0.5).toFixed(1))
      : Number(input.muscleMass);

    const fullTimestamp = input.date === getTaiwanDate() ? getLocalTimestamp() : `${input.date} 12:00`;

    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: fullTimestamp,
        weight: weightVal,
        bodyFat: bodyFatVal,
        muscleMass: mMass
      });
      setIsSyncing(false);
      setInput({ ...input, muscleMass: '' });
    }, 800);
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-32">
      <header className="border-b border-black pb-4">
        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.4em] mb-1">Tactical Data Center</p>
        <h1 className="text-3xl font-black tracking-tighter text-black uppercase">數據矩陣</h1>
      </header>

      {/* 數據卡片 - 調小比例 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'BMI INDEX', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: 'BMR RATE', v: Math.round(calculated.bmr), s: null, c: 'bg-blue-400' },
          { label: 'FFMI LEVEL', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: 'SCORE', v: Math.round(calculated.score), s: { label: '穩定', color: 'text-black' }, c: 'bg-orange-400' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4 rounded-sm shadow-sm hover:border-black transition-all">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{card.label}</span>
             <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-black text-black tracking-tighter">{card.v}</span>
                {card.s && <span className={`hidden md:inline-block text-[8px] font-bold uppercase px-1 border ${card.s.color}`}>{card.s.label.split(' ')[0]}</span>}
             </div>
             <div className="h-0.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c} w-2/3 transition-all duration-1000`}></div>
             </div>
          </div>
        ))}
      </div>

      {/* 生理數據提交 - 復原肌肉量，調整字體 */}
      <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-3">
           <Activity size={16} className="text-black" />
           <h2 className="text-xs font-bold uppercase tracking-widest text-gray-800">生理數據提交 UPDATE_METRICS</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
           <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 <Calendar size={10} /> 日期
              </label>
              <input type="date" value={input.date} onChange={e => setInput({...input, date: e.target.value})} className="w-full bg-gray-50 border-b border-gray-200 p-2 text-sm font-bold outline-none focus:border-black transition-all" />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 <Scale size={10} /> 體重 (KG)
              </label>
              <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value as any})} className="w-full bg-gray-50 border-b border-gray-200 p-2 text-lg font-black outline-none focus:border-black transition-all font-mono" />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 <Activity size={10} /> 體脂 (%)
              </label>
              <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value as any})} className="w-full bg-gray-50 border-b border-gray-200 p-2 text-lg font-black outline-none focus:border-black transition-all font-mono" />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 <Target size={10} /> 肌肉量 (KG)
              </label>
              <input type="number" step="0.1" value={input.muscleMass} onChange={e => setInput({...input, muscleMass: e.target.value as any})} placeholder="可選" className="w-full bg-gray-50 border-b border-gray-200 p-2 text-lg font-black outline-none focus:border-black transition-all font-mono" />
           </div>
           <button disabled={isSyncing} className="bg-black text-[#bef264] h-[46px] font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-md active:scale-95 disabled:opacity-50">
             {isSyncing ? 'SYNC...' : 'COMMIT'}
           </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 p-5 min-h-[350px] flex flex-col rounded-sm">
           <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4 text-gray-400">戰力矩陣 RADAR</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={radarData}>
                 <PolarGrid stroke="#f1f5f9" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.6} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white border border-gray-100 p-5 min-h-[350px] flex flex-col rounded-sm">
           <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4 text-gray-400">進度趨勢 TREND</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={metrics.slice(-10)}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis hide domain={['auto', 'auto']} />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '0', fontSize: '10px' }} />
                 <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={2} dot={{ r: 3, fill: '#000' }} />
                 <Line type="monotone" dataKey="bodyFat" stroke="#bef264" strokeWidth={2} dot={{ r: 3, fill: '#bef264' }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
