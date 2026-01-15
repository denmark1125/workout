
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DataEngine from './components/DataEngine';
import PhysiqueScanner from './components/PhysiqueScanner';
import WeeklyReport from './components/WeeklyReport';
import Settings from './components/Settings';
import TrainingJournal from './components/TrainingJournal';
import AdminPanel from './components/AdminPanel';
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
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
  
  const [inputMemberId, setInputMemberId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'User', age: 25, height: 175, goal: FitnessGoal.HYPERTROPHY,
    equipment: [], customEquipmentPool: [], customGoalText: '',
    loginStreak: 0, lastLoginDate: '',
    memberId: 'member01', password: '0000'
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
    if (!isAuthenticated || !currentMemberId || isAdmin) return;
    const timer = setTimeout(() => {
      syncToCloud('profiles', profile, currentMemberId);
      syncToCloud('metrics', metrics, currentMemberId);
      syncToCloud('logs', logs, currentMemberId);
      syncToCloud('physique', physiqueRecords, currentMemberId);
    }, 2000);
    return () => clearTimeout(timer);
  }, [profile, metrics, logs, physiqueRecords, isAuthenticated, currentMemberId, isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const mid = inputMemberId.trim().toLowerCase();
    
    // Dynamic auth check against profile or hardcoded admin
    if (mid === 'admin_roots' && inputPassword === '8888') {
      executeAuth('admin_roots');
    } else if (mid === profile.memberId && inputPassword === profile.password) {
      executeAuth(profile.memberId!);
    } else {
      setLoginError(true);
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
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>
        <div className="w-full max-w-[360px] space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-black text-[#bef264] flex items-center justify-center mx-auto font-black text-2xl italic shadow-2xl">M</div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter uppercase text-black">THE MATRIX</h1>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Visual Tactical Interface</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 bg-white border border-gray-100 p-8 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.1)]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 block tracking-widest flex items-center gap-2">使用者 User</label>
                <input type="text" value={inputMemberId} onChange={e => setInputMemberId(e.target.value)} className="w-full bg-gray-50 border border-transparent px-4 py-3 text-sm font-bold text-black outline-none focus:border-black focus:bg-white transition-all" placeholder="Enter ID" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 block tracking-widest flex items-center gap-2">密碼 Password</label>
                <input type="password" value={inputPassword} onChange={e => setInputPassword(e.target.value)} className="w-full bg-gray-50 border border-transparent px-4 py-3 text-sm font-bold text-black tracking-[0.6em] outline-none focus:border-black focus:bg-white transition-all" placeholder="****" required />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-[8px] font-black uppercase text-center tracking-widest">登錄失敗 (FAILED)</p>}
            <button className="w-full bg-black text-white py-4 font-black text-[11px] tracking-[0.5em] hover:bg-[#bef264] hover:text-black transition-all shadow-xl uppercase active:scale-95">登入 LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="flex-1 px-8 md:px-16 py-10 pb-32 overflow-x-hidden relative">
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} isDbConnected={dbConnected} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} />}
        </div>
        {isSyncing && <div className="fixed top-8 right-8 bg-black text-[#bef264] px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-50 shadow-2xl border border-[#bef264]/20"><Loader2 size={12} className="animate-spin" /> SYNCING</div>}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
    </div>
  );
};

export default App;
