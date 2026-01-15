
import React, { useState } from 'react';
import { UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { Save, Trash2, Plus, CheckCircle, Sliders, Target } from 'lucide-react';

interface SettingsProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, setProfile }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [newEqInput, setNewEqInput] = useState('');

  const baseEquipment = [
    '啞鈴', '槓鈴', '纜繩機', '深蹲架', '史密斯機', 
    '臥推凳', '腿推機', '單槓', '壺鈴', '划船機', '跑步機'
  ];

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
    if (pool.includes(trimmed)) {
      setNewEqInput('');
      return;
    }
    const newPool = [...pool, trimmed];
    setProfile({
      ...profile,
      customEquipmentPool: newPool,
      equipment: [...(profile.equipment || []), trimmed]
    });
    setNewEqInput('');
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Protocol Calibration</p>
          <h2 className="text-5xl font-black text-black tracking-tighter uppercase leading-none">系統設定 (SETTINGS)</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#bef264] text-black px-12 py-5 font-black uppercase tracking-widest text-xs hover:bg-black hover:text-[#bef264] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
        >
          {showSaved ? <><CheckCircle size={16} /> 已儲存</> : <><Save size={16} /> 儲存變更</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-gray-100 rounded-sm overflow-hidden shadow-2xl">
        <div className="lg:col-span-5 p-8 md:p-12 space-y-12 border-b lg:border-b-0 lg:border-r border-gray-100">
          <section className="space-y-10">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-4">
              <Sliders size={14} className="text-black" /> 執行者身份 (Identity)
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">用戶暱稱</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-gray-50 border-b-2 border-gray-100 px-6 py-4 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">年齡</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-6 py-4 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">身高 (CM)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => handleChange('height', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-6 py-4 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-10">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-4">
              <Target size={14} className="text-black" /> 戰略目標 (Strategy)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(FitnessGoal).map(([key, value]) => (
                <button
                  key={value}
                  onClick={() => handleChange('goal', value)}
                  className={`p-6 border text-left transition-all relative ${
                    profile.goal === value 
                      ? 'bg-black text-[#bef264] border-black shadow-lg scale-[1.02] z-10' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-black'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-black text-sm uppercase tracking-tighter">{GoalMetadata[value as FitnessGoal].label}</p>
                    {profile.goal === value && <div className="w-2 h-2 bg-[#bef264] rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>

            {profile.goal === FitnessGoal.CUSTOM && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <label className="block text-[8px] font-black uppercase tracking-widest mb-3 text-gray-400">自訂戰略描述</label>
                <textarea
                  value={profile.customGoalText}
                  onChange={e => handleChange('customGoalText', e.target.value)}
                  placeholder="描述您的目標..."
                  className="w-full bg-gray-50 border border-gray-100 p-6 text-sm font-bold outline-none focus:border-black min-h-[100px] resize-none"
                />
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 p-8 md:p-12 space-y-12 relative bg-[#fcfcfc]">
          <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">器械倉庫 (Inventory)</h3>
          
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {baseEquipment.map(item => (
                <button
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  className={`px-4 py-6 text-left text-[11px] font-black uppercase tracking-tight border transition-all ${
                    (profile.equipment || []).includes(item)
                      ? 'bg-[#bef264] border-[#bef264] text-black shadow-md'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
              {(profile.customEquipmentPool || []).map(item => (
                <button
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  className={`px-4 py-6 text-left text-[11px] font-black uppercase tracking-tight border transition-all ${
                    (profile.equipment || []).includes(item)
                      ? 'bg-black border-black text-[#bef264] shadow-md'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pt-12 border-t border-gray-100">
              <label className="block text-[8px] font-black uppercase tracking-widest mb-4 text-gray-400">擴充資源庫 (Inventory_Expansion)</label>
              <div className="grid grid-cols-[1fr_80px] gap-2 md:gap-4">
                <input
                  type="text"
                  value={newEqInput}
                  onChange={e => setNewEqInput(e.target.value)}
                  placeholder="新增器械..."
                  className="w-full bg-white border border-gray-100 p-6 text-sm font-bold outline-none focus:border-black shadow-sm"
                  onKeyPress={e => e.key === 'Enter' && addCustomEquipment()}
                />
                <button 
                  onClick={addCustomEquipment} 
                  className="bg-black text-[#bef264] flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all shadow-xl active:scale-95"
                >
                  <Plus className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
