
import React from 'react';
import { REWARDS_DATABASE, ACHIEVEMENT_REWARDS, RewardIcon } from '../utils/rewardAssets';
import { Shield, Lock, Award, Zap, Trophy, Star } from 'lucide-react';

interface RewardVaultProps {
  collectedIds: number[];
}

const RewardVault: React.FC<RewardVaultProps> = ({ collectedIds }) => {
  const collectedSet = new Set(collectedIds);
  const achievements = Object.values(ACHIEVEMENT_REWARDS);

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20 px-2 max-w-7xl mx-auto">
      <header className="border-b-4 border-black pb-8">
        <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Neural Asset Storage</p>
        <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">收藏金庫 (VAULT)</h2>
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[#bef264]" />
            <span className="text-[10px] font-black uppercase">資產同步率: {collectedIds.length} / 63</span>
          </div>
          <div className="h-1 bg-gray-100 flex-1 relative overflow-hidden rounded-full">
            <div 
              className="absolute h-full bg-[#bef264] transition-all duration-1000 shadow-[0_0_10px_#bef264]" 
              style={{ width: `${(collectedIds.length / 63) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* 特殊成就獎勵 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-amber-500" size={20} />
          <h3 className="text-xl font-black uppercase tracking-tighter">隱藏成就模組 (SECRET ACHIEVEMENTS)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((reward) => {
            const isCollected = collectedSet.has(reward.id);
            return (
              <div 
                key={reward.id} 
                className={`flex items-center gap-6 border p-6 transition-all relative group overflow-hidden
                  ${isCollected ? 'bg-black border-black text-white shadow-2xl' : 'bg-gray-50/50 border-gray-100 text-gray-300'}`}
              >
                {isCollected && (
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#bef264_0%,_transparent_70%)] pointer-events-none"></div>
                )}
                <div className="shrink-0 relative">
                  <RewardIcon reward={reward} size={64} locked={!isCollected} />
                  {isCollected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#bef264] rounded-full flex items-center justify-center border-2 border-black">
                      <Star size={10} className="text-black fill-current" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Elite Achievement</p>
                  <h4 className={`text-lg font-black uppercase tracking-tight ${isCollected ? 'text-[#bef264]' : 'text-gray-300'}`}>
                    {isCollected ? reward.name : '???'}
                  </h4>
                  <p className="text-[9px] font-bold leading-relaxed opacity-80">
                    {reward.id === 100 ? '健身評分突破 80 分解鎖' : 
                     reward.id === 101 ? '單次訓練持續時長超過 1 小時' : 
                     '單次訓練持續時長超過 2 小時'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 每日登入獎勵 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-black" size={20} />
          <h3 className="text-xl font-black uppercase tracking-tighter">登入模組 (UPLINK MODULES)</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {REWARDS_DATABASE.map((reward) => {
            const isCollected = collectedSet.has(reward.id);
            return (
              <div 
                key={reward.id} 
                className={`aspect-square flex flex-col items-center justify-center border transition-all relative group
                  ${isCollected ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/30 border-gray-50'}`}
              >
                <RewardIcon reward={reward} size={40} locked={!isCollected} />
                {!isCollected && <Lock size={10} className="absolute bottom-2 right-2 text-gray-200" />}
                {isCollected && reward.type !== 'COMMON' && (
                  <div className="absolute top-1 right-1">
                    <Award size={10} className={reward.type === 'MASTER' ? 'text-lime-500' : 'text-blue-500'} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center pointer-events-none z-10">
                  <p className="text-[7px] font-black uppercase leading-tight">
                    {isCollected ? reward.name : '尚未解鎖'}
                    <br/>
                    <span className="text-gray-400">ID-{reward.id.toString().padStart(2, '0')}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RewardVault;
