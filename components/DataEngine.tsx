
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { UserMetrics, UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus } from '../utils/calculations';
import { Zap, Activity, Shield, Award, ChevronRight } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  isDbConnected: boolean;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric, isDbConnected }) => {
  const latest = metrics[metrics.length - 1] || { weight: 75, bodyFat: 18, muscleMass: 35, date: new Date().toISOString() };
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ weight: latest.weight, bodyFat: latest.bodyFat, muscleMass: latest.muscleMass });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
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
    { id: '04', label: '戰略評分', value: Math.round(calculated.score), icon: <Award size={16} />, desc: '綜合體態評估', status: { label: '卓越', color: 'border-lime-200 text-lime-500 bg-lime-50/30' } },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-10 md:space-y-16">
      {/* 系統狀態頭部 */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-8 gap-8">
        <div className="flex gap-10 md:gap-16">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Status</p>
            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDbConnected ? 'text-black' : 'text-red-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-lime-400 shadow-[0_0_8px_rgba(190,242,100,1)]' : 'bg-red-500'}`}></span> 
              {isDbConnected ? 'LINK_ESTABLISHED' : 'LINK_FAILURE'}
            </div>
          </div>
          <div className="space-y-1 border-l border-gray-100 pl-10 md:pl-16">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Goal</p>
            <p className="text-[11px] font-black uppercase tracking-tight">{profile.goal === FitnessGoal.CUSTOM ? profile.customGoalText || 'Custom' : GoalMetadata[profile.goal].label}</p>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-mono text-gray-300 uppercase font-bold tracking-widest">Node_Matrix // {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 space-y-12">
          {/* 優化後的標題 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">PHYSIOLOGICAL MODULE</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none break-words">數據核心 <span className="text-gray-200 text-3xl md:text-4xl block md:inline md:ml-4">DATA ENGINE</span></h2>
          </div>

          {/* 重構的數據卡片 - 標籤弱化版 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {statCards.map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 p-5 md:p-7 flex flex-col justify-between relative group hover:border-black transition-all shadow-sm overflow-hidden min-h-[160px]">
                <span className="absolute top-4 right-5 text-[9px] font-mono text-gray-200 font-bold">[{card.id}]</span>
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    {card.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest">{card.label}</span>
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter block leading-none">{card.value}</span>
                    {card.status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${card.status.color}`}>
                        {card.status.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[8px] font-bold text-gray-300 uppercase mt-6 flex items-center gap-1.5">
                  <ChevronRight size={8} /> {card.desc}
                </div>
              </div>
            ))}
          </div>

          {/* 雷達圖區域 */}
          <div className="relative bg-[#fcfcfc] border border-gray-100 p-6 md:p-16 h-[400px] md:h-[550px] flex items-center justify-center overflow-hidden scanline">
            <div className="absolute top-8 left-10 text-[10px] font-mono font-black text-gray-200">RADAR_VECTOR_SCAN</div>
            <div className="w-full h-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 11, fontWeight: 900 }} />
                  <Radar
                    name="Physique"
                    dataKey="A"
                    stroke="#000"
                    strokeWidth={3}
                    fill="#bef264"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 右側輸入 */}
        <div className="w-full xl:w-96 space-y-8">
          <div className="bg-black text-white p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-6 -bottom-6 opacity-20 text-lime-400 rotate-12">
              <Zap size={140} />
            </div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Protocol Identity</p>
            <p className="text-2xl font-black uppercase tracking-tighter">{profile.name || 'Anonymous'}</p>
            <p className="text-[10px] text-lime-400 font-mono mt-2 uppercase tracking-widest">{GoalMetadata[profile.goal].label}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-10 space-y-10 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">數據同步 (SYNC_NODE)</p>
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-ping"></div>
            </div>
            
            <div className="space-y-10">
              {['weight', 'bodyFat', 'muscleMass'].map((key) => (
                <div key={key}>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    {key === 'weight' ? '體重 Weight (kg)' : key === 'bodyFat' ? '體脂 Body Fat (%)' : '肌肉量 Muscle (kg)'}
                  </label>
                  <input 
                    type="number" step="0.1" 
                    value={(input as any)[key]} 
                    onChange={e => setInput({...input, [key]: parseFloat(e.target.value) || 0})}
                    className="input-clean !text-3xl" 
                  />
                </div>
              ))}

              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-6 font-black text-xs tracking-[0.6em] uppercase hover:bg-lime-400 hover:text-black transition-all shadow-xl active:scale-95 disabled:bg-gray-100"
              >
                {isSyncing ? '傳輸中...' : '提交同步 COMMIT'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
