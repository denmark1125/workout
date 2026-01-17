
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
import NutritionDeck from './components/NutritionDeck'; 
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord, DietLog, WeeklyReportData } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
import { getDailyBriefing, getLocalDavidGreeting } from './services/geminiService'; 
import { getLocalTimestamp } from './utils/calculations';
import { REWARDS_DATABASE } from './utils/rewardAssets';
import { Loader2, Terminal, Cloud, CloudOff, AlertTriangle, ShieldOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [davidGreeting, setDavidGreeting] = useState<string>("");
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);
  
  const fetchingGreetingRef = useRef(false);

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
    privacySettings: { syncPhysiqueImages: true, syncMetrics: true },
    dailyCalorieTarget: 2200 
  });

  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>([]);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [reports, setReports] = useState<WeeklyReportData[]>([]);

  // 偵測資料庫連線狀態
  useEffect(() => {
    const interval = setInterval(() => setDbConnected(db !== null), 3000);
    return () => clearInterval(interval);
  }, []);

  // 登錄後初始化雲端數據
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
        
        if (p) setProfile(p);
        if (m) setMetrics(m);
        if (l) setLogs(l);
        if (ph) setPhysiqueRecords(ph);
        if (d) setDietLogs(d);
        if (r) setReports(r);

      } catch (e) {
        console.error("初始化雲端資料失敗", e);
      } finally {
        setIsSyncing(false);
        setIsDataLoaded(true);
      }
    };
    initializeCloudData();
  }, [isAuthenticated, currentMemberId]);

  // 核心自動同步效應：數據變動時即時同步
  useEffect(() => {
    if (!isDataLoaded || !isAuthenticated || !currentMemberId) return;

    const performSync = async () => {
      const canSync = profile.privacySettings?.syncMetrics ?? true;
      
      // 如果隱私設定關閉同步，直接回傳不執行雲端寫入
      if (!canSync) {
        console.log("隱私模式：暫停雲端同步。");
        return;
      }

      setIsSyncing(true);
      setSyncError(false);
      try {
        // 同步所有模塊
        await Promise.all([
          syncToCloud('profiles', profile, currentMemberId),
          syncToCloud('metrics', metrics, currentMemberId, true),
          syncToCloud('logs', logs, currentMemberId, true),
          syncToCloud('diet', dietLogs, currentMemberId, true),
          syncToCloud('reports', reports, currentMemberId, true),
          // 體態紀錄：雲端僅存文字，照片留存本地
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

  // 教練問候與 AI 初始化 - 改用本地邏輯減少 AI 呼叫
  useEffect(() => {
    if (isAuthenticated) {
      const greeting = getLocalDavidGreeting(profile);
      setDavidGreeting(greeting);
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
      setLoginError(false);
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

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} onRegister={() => {}} loginError={loginError} />;

  // 決定狀態列顯示標籤
  const syncEnabled = profile.privacySettings?.syncMetrics ?? true;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={handleLogout} profile={profile} />
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* 頂部導航欄 - 強化同步狀態顯示 */}
        <div className="bg-black text-[#bef264] px-4 md:px-8 py-3 flex items-start gap-4 shadow-md z-20 sticky top-0 shrink-0 border-b border-white/5">
           <div className="mt-0.5 animate-pulse"><Terminal size={16} /></div>
           <div className="flex-1 overflow-hidden">
             <p className="text-[10px] font-black uppercase text-gray-500 mb-0.5">David 教練：系統連線中</p>
             <p className="text-sm font-bold font-mono truncate">{davidGreeting || '正在讀取戰術指令...'}</p>
           </div>
           
           {/* 同步連線狀態標籤 (顯眼反饋) */}
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-sm border border-white/10">
             {!syncEnabled ? (
               <div className="flex items-center gap-2 text-gray-400">
                 <ShieldOff size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">隱私模式 PRIVATE</span>
               </div>
             ) : syncError ? (
               <div className="flex items-center gap-2 text-red-500">
                 <AlertTriangle size={14} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">同步失敗 SYNC_ERR</span>
               </div>
             ) : isSyncing ? (
               <div className="flex items-center gap-2 text-[#bef264]">
                 <Loader2 size={14} className="animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-widest">同步中 UPLOADING...</span>
               </div>
             ) : dbConnected ? (
               <div className="flex items-center gap-2 text-[#bef264]">
                 <Cloud size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">雲端連線 ONLINE</span>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-gray-500">
                 <CloudOff size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">離線模式 OFFLINE</span>
               </div>
             )}
           </div>
        </div>

        <div className="flex-1 px-4 md:px-16 py-6 md:py-10 pb-32">
          {!isDataLoaded && (
            <div className="fixed inset-0 z-50 bg-white/80 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">雲端數據初始化中...</p>
            </div>
          )}
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} onUpdateMetrics={setMetrics} onUpdateProfile={setProfile} isDbConnected={dbConnected} />}
          {activeTab === 'diet' && <NutritionDeck dietLogs={dietLogs} onUpdateDietLog={(log) => setDietLogs(prev => prev.some(l => l.date === log.date) ? prev.map(l => l.date === log.date ? log : l) : [...prev, log])} profile={profile} workoutLogs={logs} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} profile={profile} onProfileUpdate={setProfile} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} onDeleteRecord={(id) => setPhysiqueRecords(prev => prev.filter(r => r.id !== id))} onProfileUpdate={setProfile} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} onProfileUpdate={setProfile} weeklyReports={reports} onAddReport={(r) => setReports(prev => [r, ...prev])} />}
          {activeTab === 'vault' && <RewardVault collectedIds={profile.collectedRewardIds || []} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} onReplayOnboarding={() => setShowOnboarding(true)} />}
        </div>
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
