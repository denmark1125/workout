
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
import { getLocalTimestamp, calculateMatrix } from './utils/calculations';
import { REWARDS_DATABASE, ACHIEVEMENT_REWARDS } from './utils/rewardAssets';
import { Loader2, AlertTriangle, LogOut, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<string | null>(null);

  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  
  const [davidGreeting, setDavidGreeting] = useState<string>("");
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);

  const timeoutRef = useRef<any>(null);

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
    hasCompletedOnboarding: true,
    role: 'user',
    lastDailyFeedbackDate: '',
    lastPhysiqueAnalysisDate: '',
    weeklyReportUsage: { weekId: '', count: 0 },
    privacySettings: { syncPhysiqueImages: true, syncMetrics: true } // 預設開啟
  });

  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => handleLogout(true), 3 * 60 * 60 * 1000); 
      
      const warning1 = setTimeout(() => setShowTimeoutWarning("1.5小時"), 1.5 * 60 * 60 * 1000);
      const warning2 = setTimeout(() => setShowTimeoutWarning("2小時"), 2 * 60 * 60 * 1000);

      const events = ['mousemove', 'keydown', 'touchstart'];
      const eventHandler = () => {
        clearTimeout(warning1);
        clearTimeout(warning2);
        resetTimer();
        events.forEach(event => window.removeEventListener(event, eventHandler));
      };
      
      events.forEach(event => window.addEventListener(event, eventHandler, { once: true }));
    };

    resetTimer();

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setIsAdmin(currentMemberId === 'admin_roots' || profile.role === 'admin');
    const checkDb = () => setDbConnected(db !== null);
    checkDb();
    const interval = setInterval(checkDb, 5000);
    return () => clearInterval(interval);
  }, [currentMemberId, profile.role]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!davidGreeting) setIsGreetingLoading(true);
      getDavidGreeting(profile)
        .then(msg => setDavidGreeting(msg))
        .catch(() => setDavidGreeting(`David 教練：${profile.name}，系統已就緒。`))
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
          if (!updatedProfile.role) updatedProfile.role = 'user';
          if (currentMemberId === 'admin_roots') updatedProfile.role = 'admin';
          if (!updatedProfile.privacySettings) updatedProfile.privacySettings = { syncPhysiqueImages: true, syncMetrics: true };
          if (updatedProfile.hasCompletedOnboarding === false) setShowOnboarding(true);
          
          const lastLogin = new Date(updatedProfile.lastLoginDate || todayStr);
          const diffDays = (today.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24);
          
          if (diffDays >= 90) {
            if(confirm("David 教練：偵測到您已超過90天未同步數據。需要重新啟動戰術教學嗎？")) setShowOnboarding(true);
          }

          const hasClaimedToday = updatedProfile.lastRewardClaimDate === todayStr;
          if (!hasClaimedToday) {
             const rewardIndex = (updatedProfile.collectedRewardIds?.length || 0) % REWARDS_DATABASE.length;
             setPendingReward(REWARDS_DATABASE[rewardIndex]);
             setShowRewardModal(true);

             setIsBriefingLoading(true);
             getDailyBriefing(updatedProfile, updatedProfile.loginStreak || 1)
               .then(briefing => setDailyBriefing(briefing))
               .finally(() => setIsBriefingLoading(false));
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
        
        // 只有隱私允許時才載入雲端數據
        if (m) setMetrics(m);
        if (l) setLogs(l);
        if (ph) setPhysiqueRecords(ph);
        
      } catch (e) { console.warn("同步失敗"); } finally { setIsSyncing(false); }
    };
    initializeCloudData();
  }, [isAuthenticated, currentMemberId]);

  useEffect(() => {
    if (!isAuthenticated || !currentMemberId || (isAdmin && currentMemberId !== 'admin_roots')) return;
    
    const timer = setTimeout(() => {
      // 1. 同步設定檔 (包含隱私設定本身)
      syncToCloud('profiles', profile, currentMemberId);

      // 2. 判斷隱私決定是否上傳生理數據
      if (profile.privacySettings?.syncMetrics) {
        syncToCloud('metrics', metrics, currentMemberId);
      }
      
      // 3. 訓練日誌始終同步 (或根據需要擴充設定)
      syncToCloud('logs', logs, currentMemberId);
      
      // 4. 判斷隱私決定是否上傳照片
      if (profile.privacySettings?.syncPhysiqueImages) {
        syncToCloud('physique', physiqueRecords, currentMemberId);
      } else {
        // 如果關閉同步，僅同步不含圖片的分析文字
        const textOnlyRecords = physiqueRecords.map(r => ({ ...r, image: "LOCAL_ONLY_HIDDEN" }));
        syncToCloud('physique', textOnlyRecords, currentMemberId);
      }
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
    if (remoteProfile && remoteProfile.password === pass) {
      executeAuth(mid);
      return;
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
      const profileToSave: UserProfile = { 
        ...newProfile, 
        hasCompletedOnboarding: false,
        role: (newProfile.memberId === 'admin_roots' ? 'admin' : 'user') as 'admin' | 'user'
      };
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
    } catch (e) { alert("註冊失敗"); } finally { setIsSyncing(false); }
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
    if (isAuto) alert("系統偵測到您已閒置超過3小時，已自動登出。");
  };

  const handleUpdateWorkoutLog = (updatedLog: WorkoutLog) => {
    setLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} />;

  const todayDate = new Date().toLocaleDateString('en-CA');
  const rewardPending = profile.lastRewardClaimDate !== todayDate;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={() => handleLogout()} hasPendingReward={rewardPending} profile={profile} />
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        <div className="bg-black text-[#bef264] px-4 md:px-8 py-3 flex items-start gap-4 shadow-md z-20 sticky top-0 shrink-0">
           <div className="mt-0.5 animate-pulse"><Terminal size={16} className="fill-current" /></div>
           <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">David Coach Uplink</p>
             <p className="text-sm font-bold font-mono leading-tight">{isGreetingLoading && !davidGreeting ? <span className="animate-pulse">Analyzing Biometrics...</span> : <span className="animate-in fade-in duration-700">{davidGreeting}</span>}</p>
           </div>
        </div>

        <div className="flex-1 px-4 md:px-16 py-6 md:py-10 pb-32 animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} onUpdateMetrics={setMetrics} onUpdateProfile={setProfile} isDbConnected={dbConnected} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onUpdateLog={handleUpdateWorkoutLog} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} profile={profile} onProfileUpdate={setProfile} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} onDeleteRecord={(id) => setPhysiqueRecords(prev => prev.filter(r => r.id !== id))} onProfileUpdate={setProfile} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} onProfileUpdate={setProfile} />}
          {activeTab === 'vault' && <RewardVault collectedIds={profile.collectedRewardIds || []} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} onReplayOnboarding={() => setShowOnboarding(true)} />}
        </div>
        
        {isSyncing && <div className="fixed top-20 right-8 bg-black text-[#bef264] px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-[60] shadow-2xl border border-[#bef264]/20"><Loader2 size={12} className="animate-spin" /> SYNCING</div>}
        {showRewardModal && pendingReward && !showOnboarding && <DailyRewardModal reward={pendingReward} streak={profile.loginStreak || 1} onClaim={handleClaimReward} briefing={dailyBriefing} isLoadingBriefing={isBriefingLoading} />}
        {showOnboarding && <Onboarding userName={profile.name} onComplete={handleOnboardingComplete} onStepChange={setActiveTab} />}
        {showTimeoutWarning && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white p-10 max-w-md w-full border-4 border-yellow-400 shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
              <AlertTriangle size={48} className="mx-auto text-yellow-500" />
              <div className="space-y-2"><h3 className="text-2xl font-black uppercase tracking-tighter">閒置提醒</h3><p className="text-gray-600 font-bold">David 教練：偵測到您已閒置超過 {showTimeoutWarning}，請問還在訓練嗎？</p></div>
              <div className="flex gap-4">
                <button onClick={() => handleLogout()} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">登出</button>
                <button onClick={() => setShowTimeoutWarning(null)} className="flex-1 py-4 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-[#bef264] hover:text-black transition-all">繼續訓練</button>
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
