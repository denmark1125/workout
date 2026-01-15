
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile } from '../types';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp } from '../utils/calculations';
import { Zap, Activity, Shield, Award, TrendingUp, History, Trash2, ChevronDown, Terminal } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  onUpdateMetrics?: (m: UserMetrics[]) => void;
  onUpdateProfile: (p: UserProfile) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric, onUpdateMetrics, isDbConnected }) => {
  const latest = metrics[metrics.length - 1] || { 
    weight: profile.height - 105, 
    bodyFat: profile.gender === 'F' ? 22 : 15, 
    muscleMass: 0, 
    date: getLocalTimestamp() 
  };
  
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ 
    weight: latest.weight, 
    bodyFat: latest.bodyFat, 
    muscleMass: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = Number(input.weight) || 0;
    const bodyFatVal = Number(input.bodyFat) || 0;
    // 自動推算肌肉量
    const mMass = input.muscleMass === '' 
      ? Number((weightVal * (1 - bodyFatVal / 100) * 0.8).toFixed(1))
      : Number(input.muscleMass);

    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: getLocalTimestamp(),
        weight: weightVal,
        bodyFat: bodyFatVal,
        muscleMass: mMass
      });
      setIsSyncing(false);
      setInput({ ...input, muscleMass: '' });
    }, 800);
  };

  const handleDeleteMetric = (id: string) => {
    if (confirm('David教練: 確定要抹除這筆生理節點嗎？這將影響趨勢分析。')) {
      if (onUpdateMetrics) onUpdateMetrics(metrics.filter(m => m.id !== id));
    }
  };

  const trendData = metrics.slice(-7).map(m => ({
    ...m,
    shortDate: m.date.split(' ')[0].substring(5),
  }));

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-32">
      <div className="bg-black text-[#bef264] px-6 py-3 flex items-center gap-3 border-b border-[#bef264]/20">
        <Terminal size={14} />
        <p className="text-[10px] font-black tracking-widest uppercase">
          David教練: 生理數據鏈路同步中。狀態：{isDbConnected ? 'CONNECTED' : 'LOCAL_ONLY'}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'BMI 指數', value: calculated.bmi.toFixed(1), icon: <Activity size={16} />, status: getBMIStatus(calculated.bmi) },
              { label: 'BMR 代謝', value: Math.round(calculated.bmr), icon: <Zap size={16} /> },
              { label: 'FFMI 指標', value: calculated.ffmi.toFixed(1), icon: <Shield size={16} />, status: getFFMIStatus(calculated.ffmi, profile.gender) },
              { label: '健身評分', value: Math.round(calculated.score), icon: <Award size={16} />, status: { label: '卓越', color: 'border-lime-200 text-lime-500 bg-lime-50/10' } },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 shadow-sm hover:border-black transition-all">
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  {card.icon}
                  <span className="text-[8px] font-black uppercase tracking-widest">{card.label}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-tighter">{card.value}</span>
                  {card.status && <span className={`mt-2 px-1.5 py-0.5 text-[8px] font-black uppercase border w-fit ${card.status.color}`}>{card.status.label}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px]">
               <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">RADAR_ANALYSIS</div>
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart data={radarData}>
                   <PolarGrid stroke="#f1f5f9" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                   <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.5} />
                 </RadarChart>
               </ResponsiveContainer>
            </div>
            <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px]">
               <div className="flex justify-between mb-4">
                 <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PROGRESS_TREND</div>
                 <TrendingUp size={14} className="text-[#bef264]" />
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={trendData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="shortDate" tick={{ fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} />
                   <YAxis hide />
                   <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff' }} />
                   <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={3} dot={{ r: 4 }} />
                   <Line type="monotone" dataKey="muscleMass" stroke="#bef264" strokeWidth={3} dot={{ r: 4 }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
             <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50 transition-all border-b border-gray-50">
                <div className="flex items-center gap-3">
                   <History size={16} className="text-gray-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-black">歷史數據節點清單 ({metrics.length})</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
             </button>
             {showHistory && (
               <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {[...metrics].reverse().map(m => (
                    <div key={m.id} className="flex items-center justify-between px-8 py-4 text-[11px] hover:bg-gray-50 group">
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-gray-300 w-24">{m.date.split(' ')[0]}</span>
                        <span className="font-black text-black">體重: {m.weight}kg</span>
                        <span className="font-black text-gray-400">體脂: {m.bodyFat}%</span>
                        <span className="font-black text-lime-600">肌肉: {m.muscleMass}kg</span>
                      </div>
                      <button onClick={() => handleDeleteMetric(m.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>

        <div className="w-full xl:w-80">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-8 space-y-8 shadow-xl">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">生理數據輸入 (INPUT_NODE)</p>
            <div className="space-y-6">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體重 Weight (kg)</label>
                <input 
                  type="number" step="0.1" required
                  value={input.weight} 
                  onChange={e => setInput({...input, weight: e.target.value === '' ? '' : parseFloat(e.target.value) as any})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-2xl font-black outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體脂率 Body Fat (%)</label>
                <input 
                  type="number" step="0.1" required
                  value={input.bodyFat} 
                  onChange={e => setInput({...input, bodyFat: e.target.value === '' ? '' : parseFloat(e.target.value) as any})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-2xl font-black outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex justify-between">
                   肌肉量 Muscle (kg) <span className="text-[7px] text-gray-300 font-normal">選填：系統自動推算</span>
                </label>
                <input 
                  type="number" step="0.1" 
                  value={input.muscleMass} 
                  onChange={e => setInput({...input, muscleMass: e.target.value})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-2xl font-black outline-none transition-all" 
                  placeholder="可留白"
                />
              </div>
              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-5 font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-md"
              >
                {isSyncing ? 'SYNCING...' : '更新體徵數據 COMMIT'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
