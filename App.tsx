
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DataEngine from './components/DataEngine';
import PhysiqueScanner from './components/PhysiqueScanner';
import WeeklyReport from './components/WeeklyReport';
import Settings from './components/Settings';
import TrainingJournal from './components/TrainingJournal';
import { UserProfile, UserMetrics, FitnessGoal, WorkoutLog, PhysiqueRecord, GoalMetadata } from './types';
import { syncToCloud, fetchFromCloud, db } from './services/dbService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('matrix_profile');
    return saved ? JSON.parse(saved) : {
      name: 'OPERATOR', age: 25, height: 175, goal: FitnessGoal.HYPERTROPHY,
      equipment: [], customEquipmentPool: []
    };
  });

  const [metrics, setMetrics] = useState<UserMetrics[]>(() => {
    const saved = localStorage.getItem('matrix_metrics');
    return saved ? JSON.parse(saved) : [{ id: '1', date: '2024/01/01', weight: 75, bodyFat: 18, muscleMass: 35 }];
  });

  const [logs, setLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('matrix_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [physiqueRecords, setPhysiqueRecords] = useState<PhysiqueRecord[]>(() => {
    const saved = localStorage.getItem('matrix_physique');
    return saved ? JSON.parse(saved) : [];
  });

  // 初始化：從雲端拉取最新數據
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!db) {
          setIsCloudLoaded(true);
          return;
        }
        
        const [cloudProfile, cloudMetrics, cloudLogs, cloudPhysique] = await Promise.all([
          fetchFromCloud('profiles'),
          fetchFromCloud('metrics'),
          fetchFromCloud('logs'),
          fetchFromCloud('physique')
        ]);

        if (cloudProfile) setProfile(cloudProfile);
        if (cloudMetrics) setMetrics(cloudMetrics);
        if (cloudLogs) setLogs(cloudLogs);
        if (cloudPhysique) setPhysiqueRecords(cloudPhysique);
        
      } catch (e) {
        console.error("雲端同步失敗，使用本地數據庫。", e);
      } finally {
        setIsCloudLoaded(true);
      }
    };
    loadData();
  }, []);

  // 當數據變更時，自動同步至本地與雲端
  useEffect(() => {
    if (!isCloudLoaded) return;
    localStorage.setItem('matrix_profile', JSON.stringify(profile));
    syncToCloud('profiles', profile);
  }, [profile, isCloudLoaded]);

  useEffect(() => {
    if (!isCloudLoaded) return;
    localStorage.setItem('matrix_metrics', JSON.stringify(metrics));
    syncToCloud('metrics', metrics);
  }, [metrics, isCloudLoaded]);

  useEffect(() => {
    if (!isCloudLoaded) return;
    localStorage.setItem('matrix_logs', JSON.stringify(logs));
    syncToCloud('logs', logs);
  }, [logs, isCloudLoaded]);

  useEffect(() => {
    if (!isCloudLoaded) return;
    localStorage.setItem('matrix_physique', JSON.stringify(physiqueRecords));
    syncToCloud('physique', physiqueRecords);
  }, [physiqueRecords, isCloudLoaded]);

  const addMetric = (newMetric: UserMetrics) => setMetrics(prev => [...prev, newMetric]);

  const addLog = (newLog: WorkoutLog) => {
    setLogs(prevLogs => {
      const existingIdx = prevLogs.findIndex(l => l.date === newLog.date);
      if (existingIdx > -1) {
        const updated = [...prevLogs];
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          startTime: newLog.startTime || existing.startTime,
          endTime: newLog.endTime || existing.endTime,
          focus: newLog.focus || existing.focus,
          feedback: newLog.feedback || existing.feedback,
          durationMinutes: newLog.durationMinutes || existing.durationMinutes,
          exercises: [...existing.exercises, ...newLog.exercises]
        };
        return updated;
      }
      return [...prevLogs, newLog];
    });
  };

  const addPhysiqueRecord = (record: PhysiqueRecord) => setPhysiqueRecords(prev => [record, ...prev]);

  if (!isCloudLoaded) {
    return (
      <div className="h-screen bg-[#fcfcfc] flex items-center justify-center flex-col">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.5em]">Establishing Matrix Link...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DataEngine profile={profile} metrics={metrics} onAddMetric={addMetric} />;
      case 'journal': return <TrainingJournal logs={logs} onAddLog={addLog} />;
      case 'scan': return <PhysiqueScanner profile={profile} records={physiqueRecords} onAddRecord={addPhysiqueRecord} />;
      case 'report': return <WeeklyReport profile={profile} metrics={metrics} logs={logs} physiqueRecords={physiqueRecords} />;
      case 'settings': return <Settings profile={profile} setProfile={setProfile} />;
      default: return <DataEngine profile={profile} metrics={metrics} onAddMetric={addMetric} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfcfc]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 pb-32 md:pb-12">
        <div className="mb-12 hidden md:flex items-center justify-between border-b border-gray-100 pb-6">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">系統狀態 (System Status)</span>
              <span className="text-xs text-black font-black uppercase tracking-tighter mt-1 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${db ? 'bg-[#bef264]' : 'bg-orange-500'}`}></div>
                {db ? '雲端連線中 (NOMINAL)' : '本地模式 (LOCAL_ONLY)'}
              </span>
            </div>
            <div className="w-px h-10 bg-gray-100"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">戰略目標 (Tactical Objective)</span>
              <span className="text-xs text-black font-black uppercase tracking-tighter mt-1">
                {GoalMetadata[profile.goal].label}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 font-mono font-bold tracking-[0.3em]">
            {new Date().toLocaleDateString()} // GMT+8
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {renderContent()}
        </div>
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
