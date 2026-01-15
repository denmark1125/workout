
import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp } from '../utils/calculations';
import { Zap, Activity, Shield, Award, ChevronRight, TrendingUp, Clock, Terminal, Flame, X } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric, isDbConnected }) => {
  const latest = metrics[metrics.length - 1] || { weight: 75, bodyFat: 18, muscleMass: 35, date: getLocalTimestamp() };
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ weight: latest.weight, bodyFat: latest.bodyFat, muscleMass: latest.muscleMass });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMsg, setMotivationMsg] = useState('');

  const motivations = [
    "早安，執行者。準備好優化你的體態矩陣了嗎？",
    "偵測到生理潛能波動。保持專注，今日是進化的絕佳時機。",
    "數據顯示你的意志力優於 99% 的節點，請繼續保持。",
    "戰術目標已鎖定。記住，鋼鐵是在重壓下鍛造而成的。",
    "連線穩定，連續登入紀錄已更新。穩定是進化的基石。"
  ];

  useEffect(() => {
    const randomMsg = motivations[Math.floor(Math.random() * motivations.length)];
    setMotivationMsg(randomMsg);
    setShowMotivation(true);
    const timer = setTimeout(() => setShowMotivation(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: getLocalTimestamp(),
        ...input
      });
      setIsSyncing(false);
    }, 800);
  };

  const bmiStatus = getBMIStatus(calculated.bmi);
  const ffmiStatus = getFFMIStatus(calculated.ffmi);

  const statCards = [
    { id: '01', label: 'BMI 指數', value: calculated.bmi.toFixed(1), icon: <Activity size={16} />, desc: '身體質量比', status: bmiStatus },
    { id: '02', label: 'BMR 代謝', value: `${Math.round(calculated.bmr)}`, icon: <Zap size={16} />, desc: '每日靜態熱量', status: null },
    { id: '03', label: 'FFMI 指數', value: calculated.ffmi.toFixed(1), icon: <Shield size={16} />, desc: '除脂體重指數', status: ffmiStatus },
    { id: '04', label: '戰略評分', value: Math.round(calculated.score), icon: <Award size={16} />, desc: '綜合體態評估', status: { label: '卓越', color: 'border-lime-200 text-lime-500 bg-lime-50/10' } },
  ];

  const trendData = metrics.slice(-7).map(m => ({
    ...m,
    shortDate: m.date.split(' ')[0].substring(5),
    time: m.date.split(' ')[1]
  }));

  return (
    <div className="animate-in fade-in duration-700 space-y-6 md:space-y-8 max-w-full overflow-hidden relative">
      
      {/* 超薄型頂部戰術訊息 (Ultra-slim Notification) */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 transform ${showMotivation ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-black text-[#bef264] px-6 py-2 flex items-center justify-between shadow-xl border-b border-[#bef264]/20">
          <div className="flex items-center gap-3">
             <Terminal size={12} />
             <p className="text-[10px] font-black tracking-widest uppercase">
               SYS_LINK: {motivationMsg} <span className="text-white ml-2 opacity-30">|</span> 
               <span className="text-white ml-2 flex inline-flex items-center gap-1"><Flame size={10} className="text-orange-500" /> STREAK: {profile.loginStreak || 1}</span>
             </p>
          </div>
          <button onClick={() => setShowMotivation(false)} className="text-neutral-500 hover:text-white"><X size={14}/></button>
        </div>
      </div>

      {/* 系統狀態頭部 */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-6 gap-6">
        <div className="flex gap-10">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Connection</p>
            <div className={`flex items-center gap-2 text-[10px] font-black ${isDbConnected ? 'text-black' : 'text-red-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-[#bef264] shadow-[0_0_8px_rgba(190,242,100,1)]' : 'bg-red-500'}`}></div> 
              {isDbConnected ? 'ACTIVE' : 'OFFLINE'}
            </div>
          </div>
          <div className="space-y-1 border-l border-gray-100 pl-10">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Streak</p>
            <div className="flex items-center gap-1.5 text-[10px] font-black">
              <Flame size={10} className="text-orange-500" /> {profile.loginStreak || 1} DAYS
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-mono text-gray-300 uppercase font-bold tracking-widest flex items-center gap-2 justify-end">
             <Clock size={10} /> {latest.date}
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 space-y-8 overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">CORE_ENGINE</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">數據中心 <span className="text-gray-200">DATA ENGINE</span></h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 p-5 flex flex-col justify-between relative hover:border-black transition-all shadow-sm min-h-[140px]">
                <div>
                  <div className="flex items-center gap-2 text-gray-300 mb-3">
                    {card.icon}
                    <span className="text-[8px] font-black uppercase tracking-widest">{card.label}</span>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-3xl md:text-4xl font-black tracking-tighter block leading-none">{card.value}</span>
                    {card.status && (
                      <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border ${card.status.color}`}>
                        {card.status.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="relative bg-[#fcfcfc] border border-gray-100 p-6 h-[380px] flex flex-col overflow-hidden scanline">
               <div className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest mb-6">RADAR_ANALYSIS</div>
               <div className="flex-1">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                     <PolarGrid stroke="#f1f5f9" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                     <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.6} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="relative bg-[#fcfcfc] border border-gray-100 p-6 h-[380px] flex flex-col overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                 <div className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">METRIC_TRENDS</div>
                 <TrendingUp size={14} className="text-[#bef264]" />
               </div>
               <div className="flex-1">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={trendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="shortDate" tick={{ fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0', color: '#fff' }}
                       itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#bef264' }}
                       labelStyle={{ display: 'none' }}
                     />
                     <Line type="monotone" dataKey="weight" stroke="#000" strokeWidth={2} dot={{ fill: '#000', r: 3 }} />
                     <Line type="monotone" dataKey="muscleMass" stroke="#bef264" strokeWidth={2} dot={{ fill: '#bef264', r: 3 }} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex gap-4 mt-2">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-black"></span><span className="text-[8px] font-black text-gray-400 uppercase">Weight</span></div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#bef264]"></span><span className="text-[8px] font-black text-gray-400 uppercase">Muscle</span></div>
               </div>
             </div>
          </div>
        </div>

        <div className="w-full xl:w-80 space-y-6">
          <div className="bg-white border border-gray-100 p-8 shadow-sm">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">User_Profile</p>
            <p className="text-xl font-black uppercase tracking-tighter">{profile.name}</p>
            <p className="text-[9px] text-[#bef264] font-black bg-black inline-block px-2 py-0.5 mt-2 uppercase tracking-widest">{GoalMetadata[profile.goal].label}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 space-y-8 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">數據輸入 (INPUT_NODE)</p>
            <div className="space-y-6">
              {['weight', 'bodyFat', 'muscleMass'].map((key) => (
                <div key={key}>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    {key === 'weight' ? 'Weight (kg)' : key === 'bodyFat' ? 'Body Fat (%)' : 'Muscle (kg)'}
                  </label>
                  <input 
                    type="number" step="0.1" 
                    value={(input as any)[key]} 
                    onChange={e => setInput({...input, [key]: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border-b border-transparent focus:border-[#bef264] px-0 py-2 text-2xl font-black outline-none transition-all" 
                  />
                </div>
              ))}
              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-4 font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-md disabled:bg-gray-100"
              >
                {isSyncing ? 'SYNCING...' : 'COMMIT DATA'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
