
import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile, GoalMetadata } from '../types';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp } from '../utils/calculations';
import { TrendingUp, History, Trash2, ChevronDown, Info, AlertCircle } from 'lucide-react';

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

  // 取得目標標籤
  const currentGoalLabel = profile.goal === 'CUSTOM' && profile.customGoalText 
    ? (profile.customGoalText.length > 6 ? profile.customGoalText.substring(0,6)+'...' : profile.customGoalText)
    : GoalMetadata[profile.goal]?.label || '未設定';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    
    const weightVal = Number(input.weight) || 0;
    const bodyFatVal = Number(input.bodyFat) || 0;
    
    // 如果使用者沒有輸入肌肉量，系統預設推算「骨骼肌」(Skeletal Muscle, 約為除脂體重 0.8)
    // 如果使用者輸入了 (體重計數值)，則直接存儲
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
    if (confirm(`David教練: ${profile.name}，確定要抹除這筆生理紀錄嗎？`)) {
      if (onUpdateMetrics) onUpdateMetrics(metrics.filter(m => m.id !== id));
    }
  };

  const trendData = metrics.slice(-7).map(m => ({
    ...m,
    shortDate: m.date.split(' ')[0].substring(5),
  }));

  const statsCards = [
    { 
      label: 'BMI INDEX', 
      sub: '體質量結構',
      value: calculated.bmi.toFixed(1), 
      status: getBMIStatus(calculated.bmi),
      barColor: 'bg-[#bef264]'
    },
    { 
      label: 'BMR RATE', 
      sub: '基礎代謝率',
      value: Math.round(calculated.bmr), 
      status: null,
      barColor: 'bg-blue-400'
    },
    { 
      label: 'FFMI LEVEL', 
      sub: '除脂體重指數',
      value: calculated.ffmi.toFixed(1), 
      status: getFFMIStatus(calculated.ffmi, profile.gender),
      barColor: 'bg-purple-400'
    },
    { 
      label: 'MATRIX SCORE', 
      sub: '綜合矩陣評等',
      value: Math.round(calculated.score), 
      status: { label: '穩定', color: 'text-[#bef264]' }, 
      barColor: 'bg-orange-400'
    },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-gray-100 pb-8">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">PHYSIOLOGICAL MODULE</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black uppercase leading-none">DATA ENGINE</h1>
        </div>
        
        <div className="bg-black text-white p-6 min-w-[240px] shadow-2xl relative group overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-[#bef264] blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
           <div className="flex justify-between items-start mb-2">
             <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-[0.2em]">PROTOCOL</span>
             <div className="w-2 h-2 bg-[#bef264] rounded-full animate-pulse shadow-[0_0_8px_#bef264]"></div>
           </div>
           <p className="text-2xl font-black tracking-widest uppercase text-white relative z-10">
             {currentGoalLabel}
           </p>
           {isDbConnected && (
             <p className="text-[8px] font-mono text-[#bef264] mt-2 uppercase tracking-wider">SYNC_ACTIVE</p>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
             <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{card.label}</span>
                <Info size={14} className="text-gray-200" />
             </div>
             
             <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl md:text-6xl font-black text-black tracking-tighter leading-none">{card.value}</span>
                {card.status && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${card.status.color.includes('lime') ? 'border-lime-200 text-lime-600' : card.status.color.includes('red') ? 'border-red-200 text-red-500' : 'border-gray-200 text-gray-400'}`}>
                    {card.status.label.split(' ')[0]}
                  </span>
                )}
             </div>
             
             <p className="text-[10px] font-bold text-gray-300 mb-6">{card.sub}</p>
             <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${card.barColor} w-2/3 group-hover:w-full transition-all duration-1000`}></div>
             </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px] flex flex-col">
               <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 shrink-0">RADAR_ANALYSIS</div>
               <div className="flex-1 min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart data={radarData}>
                     <PolarGrid stroke="#f1f5f9" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                     <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.5} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
            </div>
            <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px] flex flex-col">
               <div className="flex justify-between mb-4 shrink-0">
                 <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">PROGRESS_TREND</div>
                 <TrendingUp size={16} className="text-[#bef264]" />
               </div>
               <div className="flex-1 min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={trendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="shortDate" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip contentStyle={{ background: '#000', border: 'none', color: '#fff' }} />
                     <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={3} dot={{ r: 4 }} />
                     <Line type="monotone" dataKey="muscleMass" stroke="#bef264" strokeWidth={3} dot={{ r: 4 }} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
             <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between px-8 py-6 hover:bg-gray-50 transition-all border-b border-gray-50">
                <div className="flex items-center gap-3">
                   <History size={18} className="text-gray-400" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-black">歷史紀錄清單 ({metrics.length})</span>
                </div>
                <ChevronDown size={18} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
             </button>
             {showHistory && (
               <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {[...metrics].reverse().map(m => (
                    <div key={m.id} className="flex items-center justify-between px-8 py-5 text-[12px] hover:bg-gray-50 group">
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-gray-400 w-24">{m.date.split(' ')[0]}</span>
                        <span className="font-black text-black text-sm">體重: {m.weight}kg</span>
                        <span className="font-black text-gray-500">體脂: {m.bodyFat}%</span>
                        <span className="font-black text-lime-600">肌肉: {m.muscleMass}kg</span>
                      </div>
                      <button onClick={() => handleDeleteMetric(m.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>

        <div className="w-full xl:w-80">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-8 space-y-8 shadow-xl relative">
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-transparent border-r-[#bef264]"></div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">生理數據輸入 INPUT_NODE</p>
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體重 Weight (kg)</label>
                <input 
                  type="number" step="0.1" required
                  value={input.weight} 
                  onChange={e => setInput({...input, weight: e.target.value === '' ? '' : parseFloat(e.target.value) as any})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-3xl font-black outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體脂率 Body Fat (%)</label>
                <input 
                  type="number" step="0.1" required
                  value={input.bodyFat} 
                  onChange={e => setInput({...input, bodyFat: e.target.value === '' ? '' : parseFloat(e.target.value) as any})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-3xl font-black outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex justify-between items-center">
                   肌肉量 Muscle (kg)
                   <span className="text-[8px] text-gray-300 font-black bg-gray-100 px-1 py-0.5 uppercase tracking-tighter">Optional</span>
                </label>
                <input 
                  type="number" step="0.1" 
                  value={input.muscleMass} 
                  onChange={e => setInput({...input, muscleMass: e.target.value})}
                  className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-0 py-3 text-3xl font-black outline-none transition-all" 
                  placeholder="可留白由系統估算"
                />
                <div className="flex gap-2 p-3 bg-gray-50/50 border border-gray-100">
                   <AlertCircle size={12} className="text-gray-300 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-gray-400 leading-tight font-bold italic">
                     David教練：若留白，系統會推算「骨骼肌重」(SMM，約除脂體重 80%)；若輸入體重計數值，系統會直接採用該總肌肉量。
                   </p>
                </div>
              </div>
              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-6 font-black text-[11px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-md group"
              >
                {isSyncing ? 'SYNCING...' : <span className="flex items-center justify-center gap-2">數據同步更新 <TrendingUp size={14} /></span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
