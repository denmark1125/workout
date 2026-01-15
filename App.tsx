
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
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
import { getLocalTimestamp } from './utils/calculations';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  
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
    memberId: 'member01', password: '0000',
    collectedRewardIds: [],
    unlockedAchievementIds: []
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
    if (!isAuthenticated || !currentMemberId || (isAdmin && currentMemberId !== 'admin_roots')) return;
    const timer = setTimeout(() => {
      syncToCloud('profiles', profile, currentMemberId);
      syncToCloud('metrics', metrics, currentMemberId);
      syncToCloud('logs', logs, currentMemberId);
      syncToCloud('physique', physiqueRecords, currentMemberId);
    }, 2000);
    return () => clearTimeout(timer);
  }, [profile, metrics, logs, physiqueRecords, isAuthenticated, currentMemberId, isAdmin]);

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
      const initialMetric: UserMetrics = {
        id: Date.now().toString(),
        date: getLocalTimestamp(),
        weight: initialWeight,
        bodyFat: 18, 
        muscleMass: 0 
      };
      await Promise.all([
        syncToCloud('profiles', newProfile, newProfile.memberId),
        syncToCloud('metrics', [initialMetric], newProfile.memberId)
      ]);
      setProfile(newProfile);
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="flex-1 px-4 md:px-16 py-6 md:py-10 pb-32 overflow-x-hidden relative">
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <DataEngine 
              profile={profile} 
              metrics={metrics} 
              logs={logs} 
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
        {isSyncing && <div className="fixed top-8 right-8 bg-black text-[#bef264] px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-[60] shadow-2xl border border-[#bef264]/20"><Loader2 size={12} className="animate-spin" /> SYNCING</div>}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isAdmin={isAdmin} />
    </div>
  );
};

export default App;
