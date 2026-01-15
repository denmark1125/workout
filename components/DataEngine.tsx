
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { UserMetrics, UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { calculateMatrix, getRadarData } from '../utils/calculations';
import { AlertCircle, Zap } from 'lucide-react';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric }) => {
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

  return (
    <div className="animate-in fade-in duration-700">
      {/* 頂部導航資訊 */}
      <div className="flex justify-between items-start mb-16 border-b border-gray-100 pb-6">
        <div className="flex gap-16">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">系統狀態 (SYSTEM STATUS)</p>
            <p className="text-[10px] font-black flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span> 運作正常 (NOMINAL_FLOW)
            </p>
          </div>
          <div className="space-y-1 border-l border-gray-100 pl-16">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">戰略目標 (TACTICAL OBJECTIVE)</p>
            <p className="text-[10px] font-black">{GoalMetadata[profile.goal].label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-gray-300">2026/1/15 // GMT+8</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* 左側內容區 */}
        <div className="flex-1 space-y-12">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">PHYSIOLOGICAL MODULE</p>
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Data Engine</h2>
          </div>

          <div className="relative bg-gray-50/50 rounded-sm border border-gray-100 p-12 min-h-[500px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
              <span className="text-[18rem] font-black">MAT</span>
            </div>
            <div className="w-full h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#eee" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 12, fontWeight: 900 }} />
                  <Radar
                    name="Physique"
                    dataKey="A"
                    stroke="#000"
                    strokeWidth={2}
                    fill="#bef264"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 右側側邊欄輸入 */}
        <div className="w-full md:w-80 border-l border-gray-100 pl-12 space-y-12">
          <div className="bg-black text-white p-6 relative">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Protocol</p>
            <p className="text-sm font-black uppercase tracking-tight">{GoalMetadata[profile.goal].label}</p>
            <div className="absolute top-4 right-4 text-lime-400">
              <AlertCircle size={16} />
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">同步生理矩陣 (SYNCHRONIZE)</p>
              <div className="w-8 h-1 bg-black"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體重 WEIGHT (KG)</label>
                <input 
                  type="number" step="0.1" 
                  value={input.weight} 
                  onChange={e => setInput({...input, weight: parseFloat(e.target.value)})}
                  className="input-clean" 
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">體脂 BODY FAT (%)</label>
                <input 
                  type="number" step="0.1" 
                  value={input.bodyFat} 
                  onChange={e => setInput({...input, bodyFat: parseFloat(e.target.value)})}
                  className="input-clean" 
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">肌肉 MUSCLE (KG)</label>
                <input 
                  type="number" step="0.1" 
                  value={input.muscleMass} 
                  onChange={e => setInput({...input, muscleMass: parseFloat(e.target.value)})}
                  className="input-clean" 
                />
              </div>

              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-4 font-black text-[10px] tracking-widest uppercase hover:bg-lime-400 hover:text-black transition-all"
              >
                {isSyncing ? 'SYNCING...' : 'COMMIT CHANGES'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEngine;
