
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
    name: '操作員', age: 25, height: 175, goal: FitnessGoal.HYPERTROPHY,
    equipment: [], customEquipmentPool: [], customGoalText: ''
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
        if (p) setProfile(prev => ({ ...prev, ...p }));
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
    // 管理員帳號: admin_roots / 8888
    // 會員帳號: member01 / 0000
    if (mid === 'admin_roots' && inputPassword === '8888') {
      setCurrentMemberId('admin_roots');
      setIsAuthenticated(true);
      sessionStorage.setItem('matrix_session', 'active');
      localStorage.setItem('matrix_active_user', 'admin_roots');
      recordLoginEvent('admin_roots');
    } else if (mid === 'member01' && inputPassword === '0000') {
      setCurrentMemberId('member01');
      setIsAuthenticated(true);
      sessionStorage.setItem('matrix_session', 'active');
      localStorage.setItem('matrix_active_user', 'member01');
      recordLoginEvent('member01');
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto font-black text-2xl italic">M</div>
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter uppercase">The Matrix</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">體態戰略分析系統</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8 bg-white border border-gray-100 p-10 shadow-2xl rounded-sm">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">操作員代碼 (Operator ID)</label>
                <input type="text" value={inputMemberId} onChange={e => setInputMemberId(e.target.value)} className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-4 text-sm font-bold outline-none focus:border-black transition-all" placeholder="輸入 ID..." required />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">存取權令 (Access Token)</label>
                <input type="password" value={inputPassword} onChange={e => setInputPassword(e.target.value)} className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-4 text-sm font-bold tracking-[0.6em] outline-none focus:border-black transition-all" placeholder="****" required />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">授權連結無效 (Invalid Link)</p>}
            <button className="w-full bg-black text-white py-5 font-black text-xs tracking-[0.5em] hover:bg-lime-400 hover:text-black transition-all shadow-xl">初始化連結 (INITIALIZE)</button>
          </form>
          <p className="text-center text-[8px] font-mono text-gray-300 uppercase tracking-widest">加密連線中 // Secured Node V2.5.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} />
      <main className="flex-1 px-8 md:px-16 py-10 pb-32 overflow-x-hidden relative">
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} isDbConnected={dbConnected} />}
          {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} />}
          {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} />}
          {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} />}
        </div>
        
        {isSyncing && (
          <div className="fixed top-8 right-8 bg-black text-lime-400 px-4 py-2 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 z-50 shadow-2xl border border-lime-400/20">
            <Loader2 size={12} className="animate-spin" /> 資料同步中 (SYNCING)
          </div>
        )}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
