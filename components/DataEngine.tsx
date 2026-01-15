
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { UserMetrics, UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { calculateMatrix, getRadarData } from '../utils/calculations';
import { Info, CheckCircle2, Zap } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric }) => {
  const latest = metrics[metrics.length - 1] || { weight: 70, bodyFat: 20, muscleMass: 30, date: new Date().toISOString() };
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ weight: latest.weight, bodyFat: latest.bodyFat, muscleMass: latest.muscleMass });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

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
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    }, 800);
  };

  const getMetricStatus = (label: string, value: number) => {
    if (label === 'BMI INDEX') {
      if (value < 18.5) return { color: 'text-blue-500', label: '偏瘦', percent: 30 };
      if (value < 24) return { color: 'text-[#bef264]', label: '理想', percent: 60 };
      if (value < 27) return { color: 'text-orange-400', label: '過重', percent: 85 };
      return { color: 'text-red-500', label: '肥胖', percent: 95 };
    }
    if (label === 'FFMI LEVEL') {
      if (value < 18) return { color: 'text-gray-400', label: '初階', percent: 25 };
      if (value < 20) return { color: 'text-blue-400', label: '中階', percent: 50 };
      if (value < 22) return { color: 'text-[#bef264]', label: '進階', percent: 75 };
      return { color: 'text-red-500', label: '頂尖', percent: 95 };
    }
    if (label === 'MATRIX SCORE') {
      if (value < 50) return { color: 'text-gray-400', label: '待開發', percent: 40 };
      if (value < 75) return { color: 'text-[#bef264]', label: '穩定', percent: 70 };
      return { color: 'text-yellow-400', label: '卓越', percent: 92 };
    }
    return { color: 'text-gray-400', label: '正常', percent: 50 };
  };

  const currentGoalLabel = profile.goal === FitnessGoal.CUSTOM && profile.customGoalText 
    ? profile.customGoalText 
    : GoalMetadata[profile.goal].label;

  const summaryItems = [
    { label: 'BMI INDEX', value: calculated.bmi.toFixed(1), sub: '體質量結構', info: '體重與身高的基本比例指標。' },
    { label: 'BMR RATE', value: Math.round(calculated.bmr).toString(), sub: '基礎代謝率', info: '每日維持生命所需的最低熱量。' },
    { label: 'FFMI LEVEL', value: calculated.ffmi.toFixed(2), sub: '除脂體重指數', info: '衡量肌肉量的重要指標，反映真實肌肉水準。' },
    { label: 'MATRIX SCORE', value: Math.round(calculated.score).toString(), sub: '綜合矩陣評等', info: '結合肌肉比與 FFMI 的戰力評分。' },
  ];

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Physiological Module</p>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-none uppercase">Data Engine</h2>
        </div>
        <div className="bg-black text-white px-6 py-4 flex items-center gap-6 shadow-xl">
          <div className="flex flex-col">
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-1">Active Protocol</p>
            <p className="text-xs font-black uppercase tracking-widest">{currentGoalLabel}</p>
          </div>
          <Zap className="w-5 h-5 text-[#bef264]" />
        </div>
      </header>

      {/* 核心指標卡片：優化佈局與裁切問題 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-gray-100 gap-px p-px">
        {summaryItems.map((item, idx) => {
          const status = getMetricStatus(item.label, parseFloat(item.value));
          return (
            <div key={idx} className="bg-white p-8 md:p-10 group hover:bg-black transition-all duration-300 cursor-default relative overflow-visible metric-card">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[9px] text-gray-400 font-mono font-black uppercase tracking-[0.3em] group-hover:text-gray-500">{item.label}</p>
                <div className="group/info relative">
                  <Info className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#bef264] cursor-help" />
                  <div className="absolute bottom-full right-0 mb-3 w-40 p-3 bg-white text-black text-[9px] font-bold shadow-2xl border border-gray-100 opacity-0 group-hover/info:opacity-100 transition-opacity z-50 pointer-events-none uppercase tracking-widest leading-relaxed">
                    {item.info}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-end gap-2 mb-6">
                <p className="text-4xl md:text-5xl font-black text-black font-mono group-hover:text-[#bef264] transition-colors leading-none tracking-tighter">
                  {item.value}
                </p>
                {item.label !== 'BMR RATE' && (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-current rounded-full mb-1 ${status.color} group-hover:opacity-100`}>
                    {status.label}
                  </span>
                )}
              </div>

              <div className="mt-auto">
                <p className="text-[10px] text-gray-400 font-bold mb-3 tracking-[0.2em] uppercase group-hover:text-gray-500">{item.sub}</p>
                <div className="h-1 w-full bg-gray-100 group-hover:bg-gray-800 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${idx === 3 ? 'bg-yellow-400' : 'bg-[#bef264]'}`}
                    style={{ width: `${status.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 bg-gray-100 p-px shadow-sm">
        {/* 同步區域：縮減尺寸以提升美感 */}
        <div className="lg:col-span-4 bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em]">同步數據 (Synchronize)</h3>
            <div className="w-12 h-1 bg-black mt-3"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {[
              { label: '體重 (KG)', key: 'weight' },
              { label: '體脂 (%)', key: 'bodyFat' },
              { label: '肌肉 (KG)', key: 'muscleMass' },
            ].map(field => (
              <div key={field.key} className="group">
                <label className="block text-[9px] text-gray-400 mb-2 font-mono uppercase tracking-[0.2em] font-black group-focus-within:text-black transition-colors">
                  {field.label}
                </label>
                <input
                  type="number" step="0.1"
                  value={(input as any)[field.key]}
                  onChange={e => setInput({ ...input, [field.key]: parseFloat(e.target.value) })}
                  className="w-full bg-transparent border-b border-gray-100 px-0 py-2 text-3xl font-black focus:border-black outline-none transition-all"
                />
              </div>
            ))}
            
            <button 
              disabled={isSyncing}
              className={`w-full font-black py-5 mt-4 transition-all text-[10px] tracking-[0.4em] uppercase flex items-center justify-center gap-3 ${
                syncSuccess ? 'bg-[#bef264] text-black shadow-none' : 'bg-black text-white hover:bg-[#bef264] hover:text-black shadow-lg'
              }`}
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : syncSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <>COMMIT DATA</>
              )}
            </button>
          </form>
        </div>

        {/* 圖表區域 */}
        <div className="lg:col-span-8 bg-white p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none select-none">
             <span className="text-[10rem] font-black italic tracking-tighter">DATA</span>
          </div>
          <div className="h-[350px] w-full z-10 transition-gentle transform hover:scale-[1.01]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" strokeWidth={1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 11, fontStyle: 'italic', fontWeight: 900, letterSpacing: '0.1em' }} />
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
    </div>
  );
};

export default DataEngine;
