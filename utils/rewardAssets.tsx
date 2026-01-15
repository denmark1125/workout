
import React from 'react';

export interface RewardItem {
  id: number;
  name: string;
  color: string;
  type: 'COMMON' | 'ELITE' | 'MASTER' | 'ACHIEVEMENT';
}

const COLORS = [
  '#bef264', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa', '#2dd4bf', 
  '#f87171', '#fbbf24', '#ffffff', '#94a3b8'
];

// 0-59 為每日登入獎勵
export const REWARDS_DATABASE: RewardItem[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i,
  name: `Module-${(i + 1).toString().padStart(2, '0')}`,
  color: COLORS[i % COLORS.length],
  type: i === 4 ? 'ELITE' : i === 9 ? 'MASTER' : (i + 1) % 10 === 0 ? 'MASTER' : (i + 1) % 5 === 0 ? 'ELITE' : 'COMMON'
}));

// 100+ 為特殊成就獎勵
export const ACHIEVEMENT_REWARDS: Record<string, RewardItem> = {
  'high_score': { id: 100, name: '卓越之核', color: '#bef264', type: 'ACHIEVEMENT' },
  'long_train_1h': { id: 101, name: '堅毅之光', color: '#f472b6', type: 'ACHIEVEMENT' },
  'long_train_2h': { id: 102, name: '不屈意志', color: '#a78bfa', type: 'ACHIEVEMENT' }
};

export const RewardIcon: React.FC<{ reward: RewardItem; size?: number; locked?: boolean }> = ({ reward, size = 48, locked = false }) => {
  const isMaster = reward.type === 'MASTER';
  const isElite = reward.type === 'ELITE';
  const isAchievement = reward.type === 'ACHIEVEMENT';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={`transition-all duration-500 ${locked ? 'opacity-10 grayscale brightness-50' : 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:scale-110'}`}
    >
      <defs>
        <linearGradient id={`grad-${reward.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={locked ? '#444' : reward.color} />
          <stop offset="100%" stopColor={locked ? '#222' : '#000'} />
        </linearGradient>
        {(isMaster || isAchievement) && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
      </defs>
      
      {/* Background Plate */}
      <rect x="10" y="10" width="80" height="80" fill={locked ? '#111' : '#050505'} stroke={locked ? '#222' : reward.color} strokeWidth="2" />
      
      {/* Decorative Lines */}
      <line x1="10" y1="25" x2="25" y2="10" stroke={locked ? '#222' : reward.color} strokeWidth="1" opacity="0.5" />
      <line x1="75" y1="90" x2="90" y2="75" stroke={locked ? '#222' : reward.color} strokeWidth="1" opacity="0.5" />

      {/* Core Shape Based on ID */}
      {isAchievement ? (
        <path d="M50 20 L80 50 L50 80 L20 50 Z" fill={`url(#grad-${reward.id})`} stroke={reward.color} strokeWidth="2" />
      ) : (
        <>
          {reward.id % 3 === 0 && <circle cx="50" cy="50" r="20" fill={`url(#grad-${reward.id})`} stroke={reward.color} strokeWidth="1" />}
          {reward.id % 3 === 1 && <rect x="35" y="35" width="30" height="30" fill={`url(#grad-${reward.id})`} stroke={reward.color} strokeWidth="1" transform={`rotate(${reward.id * 10}, 50, 50)`} />}
          {reward.id % 3 === 2 && <polygon points="50,30 70,65 30,65" fill={`url(#grad-${reward.id})`} stroke={reward.color} strokeWidth="1" />}
        </>
      )}

      {/* Elite/Master Decor */}
      {isElite && (
        <>
          <rect x="45" y="15" width="10" height="10" fill={reward.color} />
          <rect x="45" y="75" width="10" height="10" fill={reward.color} />
        </>
      )}
      
      {(isMaster || isAchievement) && (
        <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="4" className="animate-[spin_10s_linear_infinite]" style={{ transformOrigin: 'center' }} />
      )}

      {/* Central Detail */}
      <circle cx="50" cy="50" r="4" fill={locked ? '#222' : '#fff'} />
    </svg>
  );
};
