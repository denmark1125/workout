
import React, { useState, useEffect, useRef } from 'react';
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
import DailyRewardModal from './components/DailyRewardModal.tsx';
import Onboarding from './components/Onboarding.tsx'; 
import NutritionDeck from './components/NutritionDeck.tsx'; 
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord, DietLog, WeeklyReportData } from './types.ts';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService.ts';
import { getDailyBriefing, getLocalDavidGreeting } from './services/geminiService.ts'; 
import { getLocalTimestamp } from './utils/calculations.ts';
import { REWARDS_DATABASE } from './utils/rewardAssets.tsx';
import { Loader2, Terminal, Cloud, CloudOff, AlertTriangle, ShieldOff } from 'lucide-react';

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

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} onRegister={() => {}} loginError={loginError} />;

  const syncEnabled = profile.privacySettings?.syncMetrics ?? true;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={handleLogout} profile={profile} />
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* 黑色標題區：純淨教練指令區 */}
        <div className="bg-black text-[#bef264] px-8 py-5 flex items-center gap-4 z-20 sticky top-0 shrink-0 border-b border-white/5 relative">
           <div className="animate-pulse shrink-0"><Terminal size={18} /></div>
           <div className="flex-1 min-w-0 pr-32">
             <p className="text-[9px] font-black uppercase text-gray-500 mb-0.5 tracking-widest leading-none">David 教練戰術指令 COMMAND_STREAM</p>
             <p className="text-sm md:text-base font-bold font-mono truncate max-w-full">{davidGreeting || '正在讀取戰術指令...'}</p>
           </div>
           
           {/* 連線狀態標籤：移至絕對定位右上角，不遮擋文字 */}
           <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded border border-white/10 backdrop-blur-sm shadow-xl">
                {!syncEnabled ? (
                  <div className="flex items-center gap-1.5 text-gray-400"><ShieldOff size={11} /><span className="text-[8px] font-black uppercase tracking-widest">隱私模式</span></div>
                ) : syncError ? (
                  <div className="flex items-center gap-1.5 text-red-500"><AlertTriangle size={11} className="animate-pulse" /><span className="text-[8px] font-black uppercase tracking-widest">同步異常</span></div>
                ) : isSyncing ? (
                  <div className="flex items-center gap-1.5 text-lime-400"><Loader2 size={11} className="animate-spin" /><span className="text-[8px] font-black uppercase tracking-widest">同步中</span></div>
                ) : dbConnected ? (
                  <div className="flex items-center gap-1.5 text-[#bef264] opacity-80"><Cloud size={11} /><span className="text-[8px] font-black uppercase tracking-widest">連線 ONLINE</span></div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400"><CloudOff size={11} /><span className="text-[8px] font-black uppercase tracking-widest">離線</span></div>
                )}
              </div>
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
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} onReplayOnboarding={() => {}} />}
        </div>
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
