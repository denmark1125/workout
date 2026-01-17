
import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile, GoalMetadata } from '../types.ts';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp, getTaiwanDate } from '../utils/calculations.ts';
import { TrendingUp, History, Trash2, ChevronDown, Info, AlertCircle, Calendar, Weight, Scale, Activity, PlusCircle } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  onUpdateMetrics?: (m: UserMetrics[]) => void;
  onUpdateProfile: (p: UserProfile) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics = [], onAddMetric, onUpdateMetrics, isDbConnected }) => {
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : { 
    weight: profile.height - 105, 
    bodyFat: profile.gender === 'F' ? 22 : 15, 
    muscleMass: 0, 
    date: getLocalTimestamp() 
  };
  
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ 
    date: getTaiwanDate(),
    weight: latest.weight, 
    bodyFat: latest.bodyFat, 
    muscleMass: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = Number(input.weight) || 0;
    const bodyFatVal = Number(input.bodyFat) || 0;
    const mMass = input.muscleMass === '' 
      ? Number((weightVal * (1 - bodyFatVal / 100)).toFixed(1))
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
    <div className="animate-in fade-in duration-700 space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-black pb-8">
        <div>
          <p className="text-sm font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Protocol: Data Analysis</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black uppercase leading-none">數據矩陣</h1>
        </div>
      </header>

      {/* 數據概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'BMI INDEX', sub: '體質量結構', v: calculated.bmi.toFixed(1), s: getBMIStatus(calculated.bmi), c: 'bg-[#bef264]' },
          { label: 'BMR RATE', sub: '基礎代謝率', v: Math.round(calculated.bmr), s: null, c: 'bg-blue-400' },
          { label: 'FFMI LEVEL', sub: '除脂體重指數', v: calculated.ffmi.toFixed(1), s: getFFMIStatus(calculated.ffmi, profile.gender), c: 'bg-purple-400' },
          { label: 'SCORE', sub: '矩陣評等', v: Math.round(calculated.score), s: { label: '穩定', color: 'text-black' }, c: 'bg-orange-400' },
        ].map((card, i) => (
          <div key={i} className="bg-white border-2 border-gray-100 p-8 shadow-sm hover:border-black transition-all group rounded-sm">
             <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.label}</span>
             <div className="flex items-baseline gap-3 my-3">
                <span className="text-5xl font-black text-black tracking-tighter">{card.v}</span>
                {card.s && <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${card.s.color}`}>{card.s.label}</span>}
             </div>
             <p className="text-xs font-bold text-gray-300 uppercase mb-4">{card.sub}</p>
             <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.c} w-2/3 group-hover:w-full transition-all duration-1000`}></div>
             </div>
          </div>
        ))}
      </div>

      {/* 生理指標輸入 - 優化後風格：與 BMI 卡片同步，避開黑色重邊框 */}
      <div className="bg-white border-2 border-gray-100 p-8 md:p-10 shadow-sm hover:border-gray-200 transition-all rounded-sm relative">
        <div className="flex items-center gap-4 mb-8">
           <div className="p-2 bg-gray-50 text-black border border-gray-100"><PlusCircle size={24} /></div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">生理指標更新 UPDATE_METRICS</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">David 教練：請填寫最新的生物數據以優化戰略矩陣</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
           <div className="space-y-3">
              <label className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <Calendar size={16} className="text-gray-300" /> 紀錄日期 DATE
              </label>
              <input type="date" value={input.date} onChange={e => setInput({...input, date: e.target.value})} className="w-full bg-gray-50/50 border-b-4 border-gray-100 p-4 text-xl font-black outline-none focus:border-black transition-all" />
           </div>
           <div className="space-y-3">
              <label className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <Scale size={16} className="text-gray-300" /> 體重 WEIGHT (KG)
              </label>
              <input type="number" step="0.1" required value={input.weight} onChange={e => setInput({...input, weight: e.target.value as any})} className="w-full bg-gray-50/50 border-b-4 border-gray-100 p-4 text-3xl font-black outline-none focus:border-black transition-all font-mono" />
           </div>
           <div className="space-y-3">
              <label className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={16} className="text-gray-300" /> 體脂率 FAT (%)
              </label>
              <input type="number" step="0.1" required value={input.bodyFat} onChange={e => setInput({...input, bodyFat: e.target.value as any})} className="w-full bg-gray-50/50 border-b-4 border-gray-100 p-4 text-3xl font-black outline-none focus:border-black transition-all font-mono" />
           </div>
           <button disabled={isSyncing} className="bg-black text-[#bef264] h-[78px] font-black text-base tracking-[0.3em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-lg active:scale-95 disabled:opacity-50">
             {isSyncing ? '同步中...' : '提交更新 COMMIT'}
           </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fix Recharts error by ensuring min-h and specific layout */}
        <div className="bg-white border-2 border-gray-100 p-8 min-h-[450px] flex flex-col rounded-sm">
           <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 text-gray-400">戰力雷達分佈 RADAR_MATRIX</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
               <RadarChart data={radarData}>
                 <PolarGrid stroke="#e2e8f0" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 13, fontWeight: 900 }} />
                 <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={3} fill="#bef264" fillOpacity={0.6} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white border-2 border-gray-100 p-8 min-h-[450px] flex flex-col rounded-sm">
           <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 text-gray-400">進度趨勢追蹤 PROGRESS_TREND</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
               <LineChart data={metrics.slice(-10)}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" hide />
                 <YAxis hide domain={['auto', 'auto']} />
                 <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff', borderRadius: '0' }} />
                 <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={4} dot={{ r: 6, fill: '#000' }} />
                 <Line type="monotone" dataKey="bodyFat" stroke="#bef264" strokeWidth={4} dot={{ r: 6, fill: '#bef264' }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
