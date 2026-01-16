
import React, { useState, useEffect } from 'react';
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
import Onboarding from './components/Onboarding'; // 新增
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
import { getLocalTimestamp, calculateMatrix } from './utils/calculations';
import { REWARDS_DATABASE, ACHIEVEMENT_REWARDS } from './utils/rewardAssets';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false); // 新增

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

  useEffect(() => {
    setIsAdmin(currentMemberId === 'admin_roots');
    const checkDb = () => setDbConnected(db !== null);
    checkDb();
    const interval = setInterval(checkDb, 5000);
    return () => clearInterval(interval);
  }, [currentMemberId]);

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
          const today = new Date().toLocaleDateString('en-CA');
          let updatedProfile = { ...p };
          
          // 教學檢測
          if (updatedProfile.hasCompletedOnboarding === false) {
            setShowOnboarding(true);
          }

          const hasClaimedToday = updatedProfile.lastRewardClaimDate === today;
          if (!hasClaimedToday) {
             const rewardIndex = (updatedProfile.collectedRewardIds?.length || 0) % REWARDS_DATABASE.length;
             setPendingReward(REWARDS_DATABASE[rewardIndex]);
             setShowRewardModal(true);
          }

          if (updatedProfile.lastLoginDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA');
            if (updatedProfile.lastLoginDate === yesterdayStr) {
              updatedProfile.loginStreak = (updatedProfile.loginStreak || 0) + 1;
            } else {
              updatedProfile.loginStreak = 1;
            }
            updatedProfile.lastLoginDate = today;
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
    if (!isAuthenticated || !currentMemberId || metrics.length === 0) return;
    
    const latestMetric = metrics[metrics.length - 1];
    const calculated = calculateMatrix(profile, latestMetric);
    const updatedCollected = [...(profile.collectedRewardIds || [])];
    let changed = false;

    if (calculated.score >= 80 && !updatedCollected.includes(ACHIEVEMENT_REWARDS['high_score'].id)) {
      updatedCollected.push(ACHIEVEMENT_REWARDS['high_score'].id);
      changed = true;
    }

    const totalMinutes = logs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    if (totalMinutes >= 600 && !updatedCollected.includes(ACHIEVEMENT_REWARDS['long_train_1h'].id)) {
      updatedCollected.push(ACHIEVEMENT_REWARDS['long_train_1h'].id);
      changed = true;
    }

    if (changed) {
      setProfile(prev => ({ ...prev, collectedRewardIds: updatedCollected }));
    }
  }, [metrics, logs, isAuthenticated]);

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
      // 新註冊帳號開啟新手教學
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

  const handleLogout = () => {
    sessionStorage.removeItem('matrix_session');
    localStorage.removeItem('matrix_active_user');
    setCurrentMemberId(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
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
        onLogout={handleLogout}
        hasPendingReward={rewardPending}
      />
      <main className="flex-1 px-4 md:px-16 py-6 md:py-10 pb-32 overflow-x-hidden relative">
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <DataEngine 
              profile={profile} 
              metrics={metrics} 
              onAddMetric={(m) => setMetrics([...metrics, m])} 
              onUpdateMetrics={setMetrics}
              onUpdateProfile={setProfile} 
              isDbConnected={dbConnected} 
            />
          )}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />}
          {activeTab === 'vault' && <RewardVault collectedIds={profile.collectedRewardIds || []} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} />}
        </div>
        
        {isSyncing && (
          <div className="fixed top-8 right-8 bg-black text-[#bef264] px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-[60] shadow-2xl border border-[#bef264]/20">
            <Loader2 size={12} className="animate-spin" /> SYNCING
          </div>
        )}

        {showRewardModal && pendingReward && (
          <DailyRewardModal 
            reward={pendingReward} 
            streak={profile.loginStreak || 1} 
            onClaim={handleClaimReward} 
          />
        )}

        {showOnboarding && (
          <Onboarding 
            userName={profile.name} 
            onComplete={handleOnboardingComplete} 
          />
        )}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
