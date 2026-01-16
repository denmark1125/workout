
import React, { useState, useMemo } from 'react';
import { UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { testConnection } from '../services/geminiService';
import { Save, Plus, CheckCircle, Target, User as UserIcon, X, BookOpen, Zap, AlertTriangle, Loader2 } from 'lucide-react';

interface SettingsProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onReplayOnboarding: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, setProfile, onReplayOnboarding }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [newEqInput, setNewEqInput] = useState('');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAIL'>('IDLE');

  const baseEquipment = [
    '啞鈴', '槓鈴', '纜繩機', '深蹲架', '史密斯機', 
    '臥推凳', '腿推機', '單槓', '壺鈴', '划船機', '跑步機'
  ];

  const allAvailableEquipment = useMemo(() => {
    const custom = profile.customEquipmentPool || [];
    return [...new Set([...baseEquipment, ...custom])];
  }, [profile.customEquipmentPool]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const toggleEquipment = (item: string) => {
    const current = profile.equipment || [];
    if (current.includes(item)) {
      handleChange('equipment', current.filter(i => i !== item));
    } else {
      handleChange('equipment', [...current, item]);
    }
  };

  const addCustomEquipment = () => {
    const trimmed = newEqInput.trim();
    if (!trimmed) return;
    
    const pool = profile.customEquipmentPool || [];
    if (pool.includes(trimmed) || baseEquipment.includes(trimmed)) {
      setNewEqInput('');
      return;
    }
    
    const newPool = [...pool, trimmed];
    const newSelected = [...(profile.equipment || []), trimmed];
    
    setProfile({
      ...profile,
      customEquipmentPool: newPool,
      equipment: newSelected
    });
    setNewEqInput('');
  };

  const removeCustomEquipment = (item: string) => {
    if (baseEquipment.includes(item)) return;
    const pool = (profile.customEquipmentPool || []).filter(i => i !== item);
    const selected = (profile.equipment || []).filter(i => i !== item);
    setProfile({
      ...profile,
      customEquipmentPool: pool,
      equipment: selected
    });
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('TESTING');
    const result = await testConnection();
    setTestStatus(result ? 'SUCCESS' : 'FAIL');
    setTimeout(() => setTestStatus('IDLE'), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 overflow-hidden px-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Protocol Calibration</p>
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">系統設定 (SETTINGS)</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#bef264] text-black px-10 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-black hover:text-[#bef264] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
        >
          {showSaved ? <><CheckCircle size={14} /> 已儲存變更</> : <><Save size={14} /> 儲存變更</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-gray-100 rounded-sm overflow-hidden shadow-2xl">
        <div className="lg:col-span-5 p-8 md:p-10 space-y-10 border-b lg:border-b-0 lg:border-r border-gray-100">
          
          <section className="space-y-8">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3">
              <UserIcon size={12} className="text-black" /> 巨巨身分 (Identity)
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">用戶暱稱</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">年齡</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">身高 (CM)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => handleChange('height', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3">
              <Target size={12} className="text-black" /> 戰略目標 (Strategy)
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(FitnessGoal).map(([key, value]) => (
                <div key={value} className="space-y-2">
                  <button
                    onClick={() => handleChange('goal', value)}
                    className={`w-full p-4 border text-left transition-all ${
                      profile.goal === value 
                        ? 'bg-black text-[#bef264] border-black' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <p className="font-black text-[11px] uppercase tracking-tighter">{GoalMetadata[value as FitnessGoal].label}</p>
                  </button>
                  {value === FitnessGoal.CUSTOM && profile.goal === FitnessGoal.CUSTOM && (
                    <div className="animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">請輸入您的自訂健身願景：</label>
                       <textarea 
                         value={profile.customGoalText || ''}
                         onChange={e => handleChange('customGoalText', e.target.value)}
                         placeholder="例如：在三個月內完成首次半馬，且體重不掉..."
                         className="w-full bg-gray-50 border border-gray-100 p-3 text-xs font-bold outline-none focus:border-black resize-none h-24 shadow-inner"
                       />
                       <p className="text-[8px] text-lime-600 font-black mt-2 animate-pulse uppercase">目標將即時更新至戰略面板</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 p-8 md:p-10 space-y-10 relative bg-[#fcfcfc]">
          <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">器械倉庫 (Inventory)</h3>
          
          <div className="space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allAvailableEquipment.map(item => {
                const isCustom = (profile.customEquipmentPool || []).includes(item);
                return (
                  <div key={item} className="relative group">
                    <button
                      onClick={() => toggleEquipment(item)}
                      className={`w-full px-3 py-4 text-left text-[11px] font-black uppercase tracking-tight border transition-all ${
                        (profile.equipment || []).includes(item)
                          ? 'bg-[#bef264] border-[#bef264] text-black shadow-sm'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                    {isCustom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeCustomEquipment(item); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-10 border-t border-gray-100">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-3 text-gray-400">自訂資源 (Expansion)</label>
              <form onSubmit={(e) => {e.preventDefault(); addCustomEquipment();}} className="flex gap-2">
                <input
                  type="text"
                  value={newEqInput}
                  onChange={e => setNewEqInput(e.target.value)}
                  placeholder="輸入器械名稱..."
                  className="flex-1 bg-white border border-gray-200 px-4 h-12 text-sm font-bold outline-none focus:border-black"
                />
                <button 
                  type="submit"
                  className="w-12 h-12 bg-black text-[#bef264] flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all"
                >
                  <Plus size={20} />
                </button>
              </form>
            </div>
          </div>
          
          <div className="pt-10 border-t border-gray-100">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mb-4">系統教學</h3>
            <button
              onClick={onReplayOnboarding}
              className="w-full bg-white border border-gray-200 text-gray-500 px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:border-black hover:text-black transition-all flex items-center justify-center gap-4 shadow-sm"
            >
              <BookOpen size={14} /> 重新啟動新手教學
            </button>
          </div>

          <div className="pt-10 border-t border-gray-100">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mb-4">系統診斷 (DIAGNOSTICS)</h3>
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'TESTING'}
              className={`w-full border px-6 py-4 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-sm
                ${testStatus === 'SUCCESS' ? 'bg-[#bef264] border-[#bef264] text-black' : 
                  testStatus === 'FAIL' ? 'bg-red-500 border-red-500 text-white' : 
                  'bg-black text-white border-black hover:bg-gray-800'}`}
            >
               {testStatus === 'TESTING' ? <Loader2 className="animate-spin" size={14} /> : 
                testStatus === 'SUCCESS' ? <CheckCircle size={14} /> : 
                testStatus === 'FAIL' ? <AlertTriangle size={14} /> : 
                <Zap size={14} />}
               {testStatus === 'TESTING' ? 'TESTING UPLINK...' : 
                testStatus === 'SUCCESS' ? 'SYSTEM ONLINE' : 
                testStatus === 'FAIL' ? 'CONNECTION FAILED' : 
                '測試 AI 核心連線'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
