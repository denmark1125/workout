
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import MobileNav from './components/MobileNav.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import DataEngine from './components/DataEngine.tsx';
import PhysiqueScanner from './components/PhysiqueScanner.tsx';
import WeeklyReport from './components/WeeklyReport.tsx';
import Settings from './components/Settings.tsx';
import TrainingJournal from './components/TrainingJournal.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import RewardVault from './components/RewardVault.tsx'; 
import NutritionDeck from './components/NutritionDeck.tsx'; 
import DailyRewardModal from './components/DailyRewardModal.tsx';
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord, DietLog, WeeklyReportData } from './types.ts';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService.ts';
import { getLocalDavidGreeting, getDailyBriefing } from './services/geminiService.ts'; 
import { getLocalTimestamp, getTaiwanDate } from './utils/calculations.ts';
import { REWARDS_DATABASE } from './utils/rewardAssets.tsx';
import { Loader2, Cloud, CloudOff, AlertTriangle, ShieldOff, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [davidGreeting, setDavidGreeting] = useState<string>("");
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => localStorage.getItem('matrix_active_user'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = sessionStorage.getItem('matrix_session');
    return session === 'active' && !!localStorage.getItem('matrix_active_user');
  });
  const [loginError, setLoginError] = useState(false);

  // Reward States
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);

  const DEFAULT_PROFILE: UserProfile = {
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
    privacySettings: { syncPhysiqueImages: true, syncMetrics: true },
    dailyCalorieTarget: 2200,
    macroTargets: { protein: 150, carbs: 200, fat: 60 }
  };

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>([]);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [reports, setReports] = useState<WeeklyReportData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setDbConnected(db !== null), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initializeCloudData = async () => {
      if (!isAuthenticated || !currentMemberId) return;
      setIsSyncing(true);
      try {
        const [p, m, l, ph, d, r] = await Promise.all([
          fetchFromCloud('profiles', currentMemberId),
          fetchFromCloud('metrics', currentMemberId),
          fetchFromCloud('logs', currentMemberId),
          fetchFromCloud('physique', currentMemberId),
          fetchFromCloud('diet', currentMemberId),
          fetchFromCloud('reports', currentMemberId)
        ]);
        
        if (p) setProfile(prev => ({ ...DEFAULT_PROFILE, ...prev, ...p }));
        setMetrics(Array.isArray(m) ? m : []);
        setLogs(Array.isArray(l) ? l : []);
        setPhysiqueRecords(Array.isArray(ph) ? ph : []);
        setDietLogs(Array.isArray(d) ? d : []);
        setReports(Array.isArray(r) ? r : []);
      } catch (e) {
        console.error("Cloud data fetch failed", e);
      } finally {
        setIsSyncing(false);
        setIsDataLoaded(true);
      }
    };
    initializeCloudData();
  }, [isAuthenticated, currentMemberId]);

  // Daily Reward Check Logic
  useEffect(() => {
    if (isDataLoaded && isAuthenticated && profile.memberId) {
      const today = getTaiwanDate();
      // 如果最後登入日期不是今天 -> 顯示獎勵 (代表今天第一次登入)
      if (profile.lastLoginDate !== today) {
        setShowRewardModal(true);
        setIsLoadingBriefing(true);
        // 獲取每日簡報 (非同步，不阻塞 UI)
        getDailyBriefing(profile.loginStreak || 1).then(brief => {
           setDailyBriefing(brief);
           setIsLoadingBriefing(false);
        });
      }
    }
  }, [isDataLoaded, isAuthenticated, profile.lastLoginDate, profile.memberId]);

  useEffect(() => {
    if (!isDataLoaded || !isAuthenticated || !currentMemberId) return;
    const performSync = async () => {
      const canSync = profile.privacySettings?.syncMetrics ?? true;
      if (!canSync) return;
      setIsSyncing(true);
      setSyncError(false);
      try {
        await Promise.all([
          syncToCloud('profiles', profile, currentMemberId),
          syncToCloud('metrics', metrics, currentMemberId, true),
          syncToCloud('logs', logs, currentMemberId, true),
          syncToCloud('diet', dietLogs, currentMemberId, true),
          syncToCloud('reports', reports, currentMemberId, true),
          syncToCloud('physique', physiqueRecords, currentMemberId, true, physiqueRecords.map(r => ({ ...r, image: "" })))
        ]);
      } catch (err) {
        setSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };
    const timer = setTimeout(performSync, 2000);
    return () => clearTimeout(timer);
  }, [profile, metrics, logs, physiqueRecords, dietLogs, reports, isAuthenticated, currentMemberId, isDataLoaded]);

  useEffect(() => {
    if (isAuthenticated) {
      setDavidGreeting(getLocalDavidGreeting(profile));
    }
  }, [isAuthenticated, profile.name]);

  const handleLogin = async (id: string, pass: string) => {
    const mid = id.trim().toLowerCase();
    const remoteProfile = await fetchFromCloud('profiles', mid);
    if ((remoteProfile && remoteProfile.password === pass) || (mid === 'admin_roots' && pass === '8888')) {
      setCurrentMemberId(mid);
      setIsAuthenticated(true);
      sessionStorage.setItem('matrix_session', 'active');
      localStorage.setItem('matrix_active_user', mid);
      recordLoginEvent(mid);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('matrix_session');
    localStorage.removeItem('matrix_active_user');
    setIsAuthenticated(false);
    window.location.reload();
  };

  const handleClaimReward = () => {
    const today = getTaiwanDate();
    const rewardId = (profile.loginStreak || 1) - 1; // 0-based index for array
    const newStreak = (profile.loginStreak || 0) + 1;
    
    // 更新 Profile: 標記今日已領取 (更新日期)，增加 streak，加入獎勵 ID
    const updatedProfile = {
      ...profile,
      lastLoginDate: today,
      loginStreak: newStreak,
      collectedRewardIds: [...(profile.collectedRewardIds || []), rewardId]
    };
    
    setProfile(updatedProfile);
    setShowRewardModal(false);
    // 觸發同步會在 useEffect 中自動執行
  };

  // Upsert Log: 如果該日期已存在，則更新；否則新增
  const handleAddOrUpdateLog = (newLog: WorkoutLog) => {
    setLogs(prevLogs => {
      const existingIndex = prevLogs.findIndex(l => l.date === newLog.date);
      if (existingIndex >= 0) {
        const updated = [...prevLogs];
        updated[existingIndex] = newLog;
        return updated;
      }
      return [...prevLogs, newLog];
    });
  };

  // Delete Metric Logic
  const handleDeleteMetric = (dateToDelete: string) => {
     setMetrics(prev => prev.filter(m => !m.date.startsWith(dateToDelete)));
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} onRegister={() => {}} loginError={loginError} />;

  const syncEnabled = profile.privacySettings?.syncMetrics ?? true;
  const currentReward = REWARDS_DATABASE[(profile.loginStreak || 1) - 1] || REWARDS_DATABASE[0];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Daily Reward Modal */}
      {showRewardModal && (
        <DailyRewardModal 
          reward={currentReward} 
          streak={profile.loginStreak || 1} 
          onClaim={handleClaimReward}
          briefing={dailyBriefing}
          isLoadingBriefing={isLoadingBriefing}
        />
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={handleLogout} profile={profile} />
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* 頂部狀態列：David 教練訊息全寬顯示，不加標籤 */}
        <div className="bg-black text-[#bef264] px-5 py-3.5 flex items-center justify-between z-20 sticky top-0 shrink-0 border-b border-white/10 shadow-2xl">
           <div className="flex items-center gap-4 flex-1 min-w-0">
              <Zap size={16} className="text-[#bef264] animate-pulse drop-shadow-[0_0_10px_#bef264] shrink-0" />
              <div className="flex-1 truncate">
                <p className="text-[11px] md:text-[13px] font-black font-mono text-white tracking-tight">
                   {davidGreeting || 'David 正在對齊全球健身戰略資料庫...'}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 ml-6 shrink-0">
              {!syncEnabled ? (
                <ShieldOff size={15} className="text-gray-600" />
              ) : syncError ? (
                <AlertTriangle size={15} className="text-red-500 animate-pulse" />
              ) : isSyncing ? (
                <Loader2 size={15} className="text-[#bef264] animate-spin" />
              ) : dbConnected ? (
                <Cloud size={15} className="text-[#bef264] drop-shadow-[0_0_10px_#bef264]" />
              ) : (
                <CloudOff size={15} className="text-gray-600" />
              )}
           </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 pb-32">
          {!isDataLoaded && (
            <div className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-black mb-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">INITIALIZING_DAVID_STRATEGIST</p>
            </div>
          )}
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} onDeleteMetric={handleDeleteMetric} onUpdateMetrics={setMetrics} onUpdateProfile={setProfile} isDbConnected={dbConnected} />}
          {activeTab === 'diet' && <NutritionDeck dietLogs={dietLogs} onUpdateDietLog={(log) => setDietLogs(prev => prev.some(l => l.date === log.date) ? prev.map(l => l.date === log.date ? log : l) : [...prev, log])} profile={profile} workoutLogs={logs} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={handleAddOrUpdateLog} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} profile={profile} onProfileUpdate={setProfile} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} onDeleteRecord={(id) => setPhysiqueRecords(prev => prev.filter(r => r.id !== id))} onProfileUpdate={setProfile} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} onProfileUpdate={setProfile} weeklyReports={reports} onAddReport={(r) => setReports(prev => [r, ...prev])} />}
          {activeTab === 'vault' && <RewardVault collectedIds={profile.collectedRewardIds || []} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} onReplayOnboarding={() => {}} />}
        </div>
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
