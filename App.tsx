
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AuthScreen from './components/AuthScreen';
import DataEngine from './components/DataEngine';
import PhysiqueScanner from './components/PhysiqueScanner';
import WeeklyReport from './components/WeeklyReport';
import Settings from './components/Settings';
import TrainingJournal from './components/TrainingJournal';
import AdminPanel from './components/AdminPanel';
import RewardVault from './components/RewardVault'; 
import DailyRewardModal from './components/DailyRewardModal';
import Onboarding from './components/Onboarding'; 
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
import { getDailyBriefing, getDavidGreeting } from './services/geminiService';
import { getLocalTimestamp } from './utils/calculations';
import { REWARDS_DATABASE } from './utils/rewardAssets';
import { Loader2, AlertTriangle, Terminal, Clock, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // 修改：閒置提醒狀態，支援不同階段的訊息
  const [idleWarningType, setIdleWarningType] = useState<'1H' | '2H' | null>(null);

  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  
  // David Coach Greeting State
  const [davidGreeting, setDavidGreeting] = useState<string>("");
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);

  // 使用 Ref 來記錄最後活動時間，避免頻繁渲染
  const lastActivityRef = useRef<number>(Date.now());

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => {
    return localStorage.getItem('matrix_active_user');
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = sessionStorage.getItem('matrix_session');
    return session === 'active' && !!localStorage.getItem('matrix_active_user');
  });
  
  const [loginError, setLoginError] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'User', age: 25, height: 175, gender: 'M', goal: FitnessGoal.HYPERTROPHY,
    equipment: [], customEquipmentPool: [], customGoalText: '',
    loginStreak: 1, lastLoginDate: '',
    memberId: '', password: '',
    collectedRewardIds: [],
    unlockedAchievementIds: [],
    hasCompletedOnboarding: true
  });

  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>([]);

  // --- 分級閒置監測系統 (1小時 -> 2小時 -> 2.5小時) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. 定義時間常數 (毫秒)
    const ONE_HOUR = 60 * 60 * 1000;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const TWO_POINT_FIVE_HOURS = 2.5 * 60 * 60 * 1000;

    // 2. 更新最後活動時間的函式
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // 如果使用者有動作，且目前有警告視窗，則關閉警告
      setIdleWarningType((prev) => prev ? null : prev);
    };

    // 3. 綁定監聽器
    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll', 'mousedown'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // 4. 啟動定時檢查器 (每 10 秒檢查一次)
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      if (idleTime > TWO_POINT_FIVE_HOURS) {
        // 超過 2.5 小時 -> 強制登出
        handleLogout(true); 
      } else if (idleTime > TWO_HOURS) {
        // 超過 2 小時 -> 設定 2H 警告
        setIdleWarningType(prev => prev !== '2H' ? '2H' : prev);
      } else if (idleTime > ONE_HOUR) {
        // 超過 1 小時 -> 設定 1H 警告 (如果還沒變成 2H)
        setIdleWarningType(prev => (prev !== '1H' && prev !== '2H') ? '1H' : prev);
      }
    }, 10000); // 10秒檢查頻率

    // 初始化
    updateActivity();

    return () => {
      clearInterval(checkInterval);
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setIsAdmin(currentMemberId === 'admin_roots');
    const checkDb = () => setDbConnected(db !== null);
    checkDb();
    const interval = setInterval(checkDb, 5000);
    return () => clearInterval(interval);
  }, [currentMemberId]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!davidGreeting) setIsGreetingLoading(true);
      
      getDavidGreeting(profile)
        .then(msg => setDavidGreeting(msg))
        .catch(() => {
           setDavidGreeting(`David 教練：${profile.name}，系統已就緒。隨時準備開始訓練。`);
        })
        .finally(() => setIsGreetingLoading(false));
    }
  }, [isAuthenticated, profile.name]);

  useEffect(() => {
    const initializeCloudData = async () => {
      if (!db || !isAuthenticated || !currentMemberId) return;
      setIsSyncing(true);
      try {
        const [p, m, l, ph] = await Promise.all([
          fetchFromCloud('profiles', currentMemberId),
          fetchFromCloud('metrics', currentMemberId),
          fetchFromCloud('logs', currentMemberId),
          fetchFromCloud('physique', currentMemberId)
        ]);
        
        if (p) {
          const today = new Date();
          const todayStr = today.toLocaleDateString('en-CA');
          let updatedProfile = { ...p };
          
          if (updatedProfile.hasCompletedOnboarding === false) {
            setShowOnboarding(true);
          }
          
          const lastLogin = new Date(updatedProfile.lastLoginDate || todayStr);
          const diffDays = (today.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24);
          
          if (diffDays >= 90) {
            if(confirm("David 教練：偵測到您已超過90天未同步數據。需要重新啟動戰術教學，複習系統操作嗎？")) {
               setShowOnboarding(true);
            }
          }

          const hasClaimedToday = updatedProfile.lastRewardClaimDate === todayStr;
          if (!hasClaimedToday) {
             const rewardIndex = (updatedProfile.collectedRewardIds?.length || 0) % REWARDS_DATABASE.length;
             setPendingReward(REWARDS_DATABASE[rewardIndex]);
             setShowRewardModal(true);

             setIsBriefingLoading(true);
             getDailyBriefing(updatedProfile, updatedProfile.loginStreak || 1)
               .then(briefing => {
                 setDailyBriefing(briefing);
               })
               .finally(() => {
                 setIsBriefingLoading(false);
               });
          }

          if (updatedProfile.lastLoginDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA');
            if (updatedProfile.lastLoginDate === yesterdayStr) {
              updatedProfile.loginStreak = (updatedProfile.loginStreak || 0) + 1;
            } else {
              updatedProfile.loginStreak = 1;
            }
            updatedProfile.lastLoginDate = todayStr;
            syncToCloud('profiles', updatedProfile, currentMemberId);
          }
          setProfile(updatedProfile);
        }
        if (m) setMetrics(m);
        if (l) setLogs(l);
        if (ph) setPhysiqueRecords(ph);
      } catch (e) {
        console.warn("同步失敗");
      } finally {
        setIsSyncing(false);
      }
    };
    initializeCloudData();
  }, [isAuthenticated, currentMemberId]);

  useEffect(() => {
    if (!isAuthenticated || !currentMemberId || (isAdmin && currentMemberId !== 'admin_roots')) return;
    const timer = setTimeout(() => {
      syncToCloud('profiles', profile, currentMemberId);
      syncToCloud('metrics', metrics, currentMemberId);
      syncToCloud('logs', logs, currentMemberId);
      syncToCloud('physique', physiqueRecords, currentMemberId);
    }, 2000);
    return () => clearTimeout(timer);
  }, [profile, metrics, logs, physiqueRecords, isAuthenticated, currentMemberId, isAdmin]);

  const handleClaimReward = () => {
    if (!pendingReward) return;
    const today = new Date().toLocaleDateString('en-CA');
    const newCollected = [...(profile.collectedRewardIds || []), pendingReward.id];
    setProfile(prev => ({
      ...prev,
      collectedRewardIds: Array.from(new Set(newCollected)),
      lastRewardClaimDate: today
    }));
    setShowRewardModal(false);
    setPendingReward(null);
  };

  const handleOnboardingComplete = () => {
    setProfile(prev => ({ ...prev, hasCompletedOnboarding: true }));
    setShowOnboarding(false);
    setActiveTab('dashboard');
  };

  const handleLogin = async (id: string, pass: string) => {
    const mid = id.trim().toLowerCase();
    const remoteProfile = await fetchFromCloud('profiles', mid);
    if (remoteProfile) {
      if (remoteProfile.password === pass) {
        executeAuth(mid);
        return;
      }
    }
    if (mid === 'admin_roots' && pass === '8888') {
      executeAuth('admin_roots');
      return;
    }
    setLoginError(true);
  };

  const handleRegister = async (newProfile: UserProfile, initialWeight: number) => {
    setIsSyncing(true);
    try {
      const profileToSave = { ...newProfile, hasCompletedOnboarding: false };
      const initialMetric: UserMetrics = {
        id: Date.now().toString(),
        date: getLocalTimestamp(),
        weight: initialWeight,
        bodyFat: 18, 
        muscleMass: 0 
      };
      await Promise.all([
        syncToCloud('profiles', profileToSave, newProfile.memberId),
        syncToCloud('metrics', [initialMetric], newProfile.memberId)
      ]);
      setProfile(profileToSave);
      setMetrics([initialMetric]);
      executeAuth(newProfile.memberId);
    } catch (e) {
      alert("註冊失敗，請重試。");
    } finally {
      setIsSyncing(false);
    }
  };

  const executeAuth = (uid: string) => {
    setCurrentMemberId(uid);
    setIsAuthenticated(true);
    sessionStorage.setItem('matrix_session', 'active');
    localStorage.setItem('matrix_active_user', uid);
    recordLoginEvent(uid);
    setLoginError(false);
  };

  const handleLogout = (isAuto = false) => {
    sessionStorage.removeItem('matrix_session');
    localStorage.removeItem('matrix_active_user');
    setCurrentMemberId(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setIdleWarningType(null);
    if (isAuto) alert("David 教練：偵測到系統閒置超過 2.5 小時，為了數據安全，已執行強制登出程序。");
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} />;
  }

  const todayDate = new Date().toLocaleDateString('en-CA');
  const rewardPending = profile.lastRewardClaimDate !== todayDate;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        memberId={currentMemberId || ''} 
        isAdmin={isAdmin} 
        onLogout={() => handleLogout()}
        hasPendingReward={rewardPending}
        profile={profile}
      />
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        
        {/* David Coach Permanent Header Banner */}
        <div className="bg-black text-[#bef264] px-4 md:px-8 py-3 flex items-start gap-4 shadow-md z-20 sticky top-0 shrink-0">
           <div className="mt-0.5 animate-pulse">
              <Terminal size={16} className="fill-current" />
           </div>
           <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">David Coach Uplink</p>
             <p className="text-sm font-bold font-mono leading-tight">
                {isGreetingLoading && !davidGreeting ? (
                  <span className="animate-pulse">Analyzing Season & Biometrics...</span>
                ) : (
                  <span className="animate-in fade-in duration-700">
                    {davidGreeting || "系統連線中..."}
                  </span>
                )}
             </p>
           </div>
        </div>

        <div className="flex-1 px-4 md:px-16 py-6 md:py-10 pb-32 animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} onUpdateMetrics={setMetrics} onUpdateProfile={setProfile} isDbConnected={dbConnected} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />}
          {activeTab === 'vault' && <RewardVault collectedIds={profile.collectedRewardIds || []} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} onReplayOnboarding={() => setShowOnboarding(true)} />}
        </div>
        
        {isSyncing && (
          <div className="fixed top-20 right-8 bg-black text-[#bef264] px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-[60] shadow-2xl border border-[#bef264]/20">
            <Loader2 size={12} className="animate-spin" /> SYNCING
          </div>
        )}

        {showRewardModal && pendingReward && !showOnboarding && (
          <DailyRewardModal 
            reward={pendingReward} 
            streak={profile.loginStreak || 1} 
            onClaim={handleClaimReward}
            briefing={dailyBriefing}
            isLoadingBriefing={isBriefingLoading}
          />
        )}

        {showOnboarding && <Onboarding userName={profile.name} onComplete={handleOnboardingComplete} onStepChange={setActiveTab} />}
        
        {/* 閒置提醒 Modal (1小時 / 2小時) */}
        {idleWarningType && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className={`bg-white p-10 max-w-md w-full border-4 shadow-2xl text-center space-y-8 animate-in zoom-in duration-300 ${idleWarningType === '2H' ? 'border-red-500' : 'border-yellow-400'}`}>
              {idleWarningType === '2H' ? (
                 <ShieldAlert size={48} className="mx-auto text-red-500 animate-pulse" />
              ) : (
                 <Clock size={48} className="mx-auto text-yellow-500" />
              )}
              
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter">
                  {idleWarningType === '2H' ? '長時間閒置警告' : '閒置提醒'}
                </h3>
                <p className="text-gray-600 font-bold leading-relaxed">
                  {idleWarningType === '2H' 
                    ? `David 教練：警告。系統已閒置超過 2 小時。再過 30 分鐘將執行強制登出程序。請立即執行任意操作以維持連線。`
                    : `David 教練：偵測到系統已閒置超過 1 小時。您的訓練結束了嗎？若要繼續使用，請移動滑鼠或點擊畫面。`
                  }
                </p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleLogout()} 
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                  立即登出
                </button>
                <button 
                  onClick={() => {
                    lastActivityRef.current = Date.now();
                    setIdleWarningType(null);
                  }} 
                  className={`flex-1 py-4 font-black uppercase text-xs tracking-widest transition-all text-white ${idleWarningType === '2H' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-[#bef264] hover:text-black'}`}
                >
                  繼續保持連線
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => handleLogout()} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
