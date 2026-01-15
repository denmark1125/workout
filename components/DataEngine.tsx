
import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserMetrics, UserProfile, GoalMetadata, WorkoutLog } from '../types';
import { calculateMatrix, getRadarData, getBMIStatus, getFFMIStatus, getLocalTimestamp } from '../utils/calculations';
import { Zap, Activity, Shield, Award, TrendingUp, Clock, Terminal, Flame, X, Gift, Sparkles, Trophy } from 'lucide-react';
import { REWARDS_DATABASE, ACHIEVEMENT_REWARDS, RewardIcon } from '../utils/rewardAssets';

interface DataEngineProps {
  profile: UserProfile;
  metrics: UserMetrics[];
  onAddMetric: (m: UserMetrics) => void;
  onUpdateProfile: (p: UserProfile) => void;
  isDbConnected: boolean;
  logs?: WorkoutLog[];
}

const DataEngine: React.FC<DataEngineProps> = ({ profile, metrics, onAddMetric, onUpdateProfile, isDbConnected, logs = [] }) => {
  const latest = metrics[metrics.length - 1] || { 
    weight: profile.height - 105, 
    bodyFat: profile.gender === 'F' ? 22 : 15, 
    muscleMass: (profile.height - 105) * 0.45, 
    date: getLocalTimestamp() 
  };
  
  const calculated = calculateMatrix(profile, latest as UserMetrics);
  const radarData = getRadarData(profile, latest as UserMetrics, calculated);

  const [input, setInput] = useState({ 
    weight: latest.weight, 
    bodyFat: latest.bodyFat, 
    muscleMass: latest.muscleMass 
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMsg, setMotivationMsg] = useState('');
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'SUCCESS' | 'ACHIEVEMENT'>( 'IDLE' );
  const [newReward, setNewReward] = useState<any>(null);

  const today = new Date().toLocaleDateString('en-CA');
  const canClaim = profile.lastRewardClaimDate !== today;

  const motivations = profile.gender === 'F' 
    ? ["David教練: 早安，戰略者。今日也是追求優雅力量的一天。", "David教練: 偵測到美體潛能。保持穩定頻率，進化正在發生。"]
    : ["David教練: 早安，執行者。準備好優化你的體態矩陣了嗎？", "David教練: 數據顯示你的意志力優於 99% 的節點，請繼續保持。"];

  useEffect(() => {
    const randomMsg = motivations[Math.floor(Math.random() * motivations.length)];
    setMotivationMsg(randomMsg);
    setShowMotivation(true);
    const timer = setTimeout(() => setShowMotivation(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // 成就達成偵測
  useEffect(() => {
    const unlocked = new Set(profile.unlockedAchievementIds || []);
    let newlyUnlockedId: string | null = null;

    // 1. 健身評分 >= 80
    if (calculated.score >= 80 && !unlocked.has('high_score')) {
      newlyUnlockedId = 'high_score';
    } 
    else {
      // 2. 運動時數
      const longLog2h = logs.find(l => (l.durationMinutes || 0) >= 120);
      const longLog1h = logs.find(l => (l.durationMinutes || 0) >= 60);

      if (longLog2h && !unlocked.has('long_train_2h')) {
        newlyUnlockedId = 'long_train_2h';
      } else if (longLog1h && !unlocked.has('long_train_1h')) {
        newlyUnlockedId = 'long_train_1h';
      }
    }

    if (newlyUnlockedId) {
      const reward = ACHIEVEMENT_REWARDS[newlyUnlockedId];
      setNewReward(reward);
      setClaimStatus('ACHIEVEMENT');
      onUpdateProfile({
        ...profile,
        unlockedAchievementIds: [...(profile.unlockedAchievementIds || []), newlyUnlockedId],
        collectedRewardIds: [...(profile.collectedRewardIds || []), reward.id]
      });
    }
  }, [calculated.score, logs.length]);

  const handleClaimReward = () => {
    if (!canClaim) return;
    
    const uncollected = REWARDS_DATABASE.filter(r => !(profile.collectedRewardIds || []).includes(r.id));
    if (uncollected.length === 0) return;

    let rewardedItem;
    if (profile.loginStreak === 5) {
      rewardedItem = REWARDS_DATABASE.find(r => r.type === 'ELITE' && !(profile.collectedRewardIds || []).includes(r.id)) || uncollected[0];
    } else if (profile.loginStreak === 10) {
      rewardedItem = REWARDS_DATABASE.find(r => r.type === 'MASTER' && !(profile.collectedRewardIds || []).includes(r.id)) || uncollected[0];
    } else {
      rewardedItem = uncollected[Math.floor(Math.random() * Math.min(uncollected.length, 10))];
    }

    setNewReward(rewardedItem);
    setClaimStatus('SUCCESS');

    onUpdateProfile({
      ...profile,
      lastRewardClaimDate: today,
      collectedRewardIds: [...(profile.collectedRewardIds || []), rewardedItem.id]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      onAddMetric({
        id: Date.now().toString(),
        date: getLocalTimestamp(),
        weight: Number(input.weight) || 0,
        bodyFat: Number(input.bodyFat) || 0,
        muscleMass: Number(input.muscleMass) || 0
      });
      setIsSyncing(false);
    }, 800);
  };

  const bmiStatus = getBMIStatus(calculated.bmi);
  const ffmiStatus = getFFMIStatus(calculated.ffmi, profile.gender);

  const statCards = [
    { label: 'BMI 指數', value: calculated.bmi.toFixed(1), icon: <Activity size={16} />, status: bmiStatus },
    { label: 'BMR 代謝', value: `${Math.round(calculated.bmr)}`, icon: <Zap size={16} />, status: null },
    { label: 'FFMI 評估', value: calculated.ffmi.toFixed(1), icon: <Shield size={16} />, status: ffmiStatus },
    { label: '健身評分', value: Math.round(calculated.score), icon: <Award size={16} />, status: { label: '卓越', color: 'border-lime-200 text-lime-500 bg-lime-50/10' } },
  ];

  const trendData = metrics.slice(-7).map(m => ({
    ...m,
    shortDate: m.date.split(' ')[0].substring(5),
  }));

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-full overflow-hidden relative">
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 transform ${showMotivation ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-black text-[#bef264] px-6 py-2 flex items-center justify-between shadow-xl border-b border-[#bef264]/20">
          <div className="flex items-center gap-3">
             <Terminal size={12} />
             <p className="text-[10px] font-black tracking-widest uppercase">
               {motivationMsg} <span className="text-white ml-2 opacity-30">|</span> 
               <span className="text-white ml-2 flex inline-flex items-center gap-1"><Flame size={10} className="text-orange-500" /> STREAK: {profile.loginStreak || 1}</span>
             </p>
          </div>
          <button onClick={() => setShowMotivation(false)} className="text-neutral-500 hover:text-white"><X size={14}/></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-6 gap-6">
        <div className="flex gap-10">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Connection</p>
            <div className={`flex items-center gap-2 text-[10px] font-black ${isDbConnected ? 'text-black' : 'text-red-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-[#bef264] shadow-[0_0_8px_rgba(190,242,100,1)]' : 'bg-red-500'}`}></div> 
              {isDbConnected ? 'ACTIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-mono text-gray-300 uppercase font-bold tracking-widest flex items-center gap-2">
             <Clock size={10} /> {latest.date}
          </p>
        </div>
      </div>

      <div className={`bg-black border border-[#bef264]/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 ${!canClaim && 'opacity-60'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 ${canClaim ? 'bg-[#bef264] text-black animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
            <Gift size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#bef264] uppercase tracking-widest">每日核心模組 Uplink</p>
            <p className="text-[8px] text-gray-400 uppercase font-mono">{canClaim ? '偵測到未領取資產...' : '今日連線已完成，明日請早。'}</p>
          </div>
        </div>
        <button 
          onClick={handleClaimReward}
          disabled={!canClaim}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${canClaim ? 'bg-[#bef264] text-black hover:bg-white hover:scale-105' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          {canClaim ? '立即領取 REWARD' : '已領取 CLAIMED'}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">CORE_ENGINE</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">健身數據中心</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 flex flex-col justify-between hover:border-black transition-all shadow-sm h-32">
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  {card.icon}
                  <span className="text-[8px] font-black uppercase tracking-widest">{card.label}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black tracking-tighter leading-none">{card.value}</span>
                  {card.status && (
                    <span className={`inline-block mt-2 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border w-fit ${card.status.color}`}>
                      {card.status.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px] flex flex-col scanline relative">
               <div className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest mb-6">RADAR_ANALYSIS</div>
               <div className="flex-1 h-full min-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                     <PolarGrid stroke="#f1f5f9" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                     <Radar name="Physique" dataKey="A" stroke="#000" strokeWidth={2} fill="#bef264" fillOpacity={0.6} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="bg-[#fcfcfc] border border-gray-100 p-6 h-[350px] flex flex-col">
               <div className="flex justify-between items-start mb-6">
                 <div className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">METRIC_TRENDS</div>
                 <TrendingUp size={14} className="text-[#bef264]" />
               </div>
               <div className="flex-1 h-full min-0">
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
             </div>
          </div>
        </div>

        <div className="w-full xl:w-80 space-y-6">
          <div className="bg-white border border-black p-8 shadow-sm rounded-none">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Member_Identity</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black uppercase tracking-tighter">{profile.name}</p>
              <span className="text-[8px] font-black text-gray-300">#{profile.memberId}</span>
            </div>
            <p className="text-[9px] text-[#bef264] font-black bg-black inline-block px-2 py-0.5 mt-2 uppercase tracking-widest">{GoalMetadata[profile.goal].label}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 space-y-8 shadow-sm">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">數據輸入 (INPUT_NODE)</p>
            <div className="space-y-6">
              {['weight', 'bodyFat', 'muscleMass'].map((key) => (
                <div key={key}>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    {key === 'weight' ? '體重 Weight (kg)' : key === 'bodyFat' ? '體脂率 Fat (%)' : '肌肉量 Muscle (kg)'}
                  </label>
                  <input 
                    type="number" step="0.1" 
                    value={(input as any)[key] === 0 ? '' : (input as any)[key]} 
                    onChange={e => setInput({...input, [key]: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 border-b-2 border-transparent focus:border-[#bef264] px-0 py-2 text-2xl font-black outline-none transition-all" 
                    placeholder="0.0"
                  />
                </div>
              ))}
              <button 
                disabled={isSyncing}
                className="w-full bg-black text-white py-4 font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-md disabled:bg-gray-100"
              >
                {isSyncing ? 'SYNCING...' : '更新矩陣數據 COMMIT'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Achievement / Reward Success Modal */}
      {(claimStatus === 'SUCCESS' || claimStatus === 'ACHIEVEMENT') && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300 overflow-hidden">
          {/* Flamboyant Background */}
          <div className={`absolute inset-0 opacity-20 pointer-events-none ${claimStatus === 'ACHIEVEMENT' ? 'animate-pulse' : ''}`} 
               style={{ background: claimStatus === 'ACHIEVEMENT' 
                 ? 'radial-gradient(circle, rgba(190,242,100,0.5) 0%, rgba(244,114,182,0.3) 50%, transparent 100%)' 
                 : 'radial-gradient(circle, rgba(190,242,100,0.3) 0%, transparent 70%)' }}>
          </div>
          
          <div className="text-center space-y-8 max-w-sm relative z-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className={`absolute inset-0 blur-3xl opacity-60 scale-150 ${claimStatus === 'ACHIEVEMENT' ? 'bg-[#bef264] animate-pulse' : 'bg-gray-500'}`}></div>
                <RewardIcon reward={newReward} size={claimStatus === 'ACHIEVEMENT' ? 180 : 120} />
                {claimStatus === 'ACHIEVEMENT' && (
                   <div className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-2xl animate-bounce">
                     <Trophy size={24} />
                   </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className={`text-4xl font-black uppercase tracking-tighter italic ${claimStatus === 'ACHIEVEMENT' ? 'text-[#bef264] drop-shadow-[0_0_10px_rgba(190,242,100,0.5)]' : 'text-white'}`}>
                {claimStatus === 'ACHIEVEMENT' ? 'UNBELIEVABLE!' : 'Asset Acquired!'}
              </h3>
              
              <div className="space-y-2">
                <p className="text-white text-lg font-black uppercase tracking-widest">
                  獲得模組：{newReward?.name}
                </p>
                {claimStatus === 'ACHIEVEMENT' ? (
                  <div className="bg-white/5 border border-[#bef264]/20 p-4 backdrop-blur-md">
                    <p className="text-[#bef264] text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed">
                      David教練: 太卓越了！你的執行力已經突破了預期矩陣。
                      這不只是紀錄，這是你意志力的最高武力展現！
                      繼續保持，你正在重塑你的生命核心！
                    </p>
                  </div>
                ) : (
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                     David教練: 很好，每日的累積就是最強大的戰略。
                   </p>
                )}
              </div>
              
              {profile.loginStreak % 5 === 0 && claimStatus !== 'ACHIEVEMENT' && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white text-black px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                  <Sparkles size={12} /> {profile.loginStreak === 10 ? 'Master Good Boy Reward' : 'Elite Operator Bonus'}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setClaimStatus('IDLE')}
              className={`w-full py-5 font-black text-xs tracking-[0.5em] uppercase shadow-2xl transition-all active:scale-95
                ${claimStatus === 'ACHIEVEMENT' ? 'bg-[#bef264] text-black hover:bg-white shadow-[0_0_30px_rgba(190,242,100,0.4)]' : 'bg-white text-black hover:bg-[#bef264]'}`}
            >
              接收進化數據 OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEngine;
