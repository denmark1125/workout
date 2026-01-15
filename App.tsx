
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DataEngine from './components/DataEngine';
import PhysiqueScanner from './components/PhysiqueScanner';
import WeeklyReport from './components/WeeklyReport';
import Settings from './components/Settings';
import TrainingJournal from './components/TrainingJournal';
import AdminPanel from './components/AdminPanel';
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord, GoalMetadata } from './types';
import { syncToCloud, fetchFromCloud, db, recordLoginEvent } from './services/dbService';
import { LogOut, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
    name: 'OPERATOR', age: 25, height: 175, goal: FitnessGoal.HYPERTROPHY,
    equipment: [], customEquipmentPool: []
  });

  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>([]);

  useEffect(() => {
    setIsAdmin(currentMemberId === 'admin_root');
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
        if (p) setProfile(p);
        if (m) setMetrics(m);
        if (l) setLogs(l);
        if (ph) setPhysiqueRecords(ph);
      } catch (e) {
        console.warn("Sync error");
      } finally {
        setIsSyncing(false);
      }
    };
    initializeCloudData();
  }, [isAuthenticated, currentMemberId]);

  // 自動同步 (防抖)
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
    if (mid === 'admin_root' && inputPassword === '8888') {
      setCurrentMemberId('admin_root');
      setIsAuthenticated(true);
      sessionStorage.setItem('matrix_session', 'active');
      localStorage.setItem('matrix_active_user', 'admin_root');
      recordLoginEvent('admin_root');
    } else if (inputPassword === '0000' && mid.length >= 2) {
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
    setIsAuthenticated(false);
    sessionStorage.removeItem('matrix_session');
    localStorage.removeItem('matrix_active_user');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto font-black text-xl">M</div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">The Matrix</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Physique Tactical Interface</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 border border-gray-100 p-8 shadow-2xl">
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black uppercase text-gray-400 mb-2 block">Operator_ID</label>
                <input type="text" value={inputMemberId} onChange={e => setInputMemberId(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-bold outline-none focus:border-black" placeholder="Enter ID..." required />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-gray-400 mb-2 block">Access_Token</label>
                <input type="password" value={inputPassword} onChange={e => setInputPassword(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-bold tracking-[0.4em] outline-none focus:border-black" placeholder="****" required />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">Invalid Operator Link</p>}
            <button className="w-full bg-black text-white py-4 font-black text-xs tracking-widest hover:bg-[#bef264] hover:text-black transition-all">INITIALIZE_LINK</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} memberId={currentMemberId || ''} isAdmin={isAdmin} />
      <main className="flex-1 px-8 md:px-16 py-10 pb-32 overflow-x-hidden">
        {activeTab === 'dashboard' && <DataEngine profile={profile} metrics={metrics} onAddMetric={(m) => setMetrics([...metrics, m])} />}
        {activeTab === 'journal' && <TrainingJournal logs={logs} onAddLog={(l) => setLogs([...logs, l])} onDeleteLog={(id) => setLogs(logs.filter(log => log.id !== id))} />}
        {activeTab === 'scan' && <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={(r) => setPhysiqueRecords([r, ...physiqueRecords])} />}
        {activeTab === 'report' && <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'settings' && <Settings profile={profile} setProfile={setProfile} />}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
