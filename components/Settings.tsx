
import React, { useState } from 'react';
import { UserProfile, FitnessGoal, GoalMetadata } from '../types';
import { Save, Trash2, Plus, CheckCircle, Sliders } from 'lucide-react';

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
    if (!newEqInput.trim()) return;
    const pool = profile.customEquipmentPool || [];
    if (pool.includes(newEqInput.trim())) return;
    handleChange('customEquipmentPool', [...pool, newEqInput.trim()]);
    toggleEquipment(newEqInput.trim());
    setNewEqInput('');
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-white/10 pb-8 gap-6 px-2">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Protocol Calibration</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">系統設定</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#bef264] text-black px-10 py-5 font-black uppercase tracking-[0.3em] text-xs hover:bg-black hover:text-[#bef264] transition-all flex items-center gap-4 shadow-xl"
        >
          {showSaved ? <><CheckCircle className="w-4 h-4" /> 已儲存</> : <><Save className="w-4 h-4" /> 儲存變更 (COMMIT)</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-gray-200 gap-px p-px rounded-sm overflow-hidden shadow-2xl">
        <div className="lg:col-span-5 bg-[#fcfcfc] p-12 space-y-12">
          <section className="space-y-8">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">執行者身份 (Identity)</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">用戶暱稱</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">年齡 (Age)</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2 text-gray-400">身高 (Height CM)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => handleChange('height', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-2xl font-black focus:border-[#bef264] outline-none transition-all text-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">戰略目標 (Strategy)</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(FitnessGoal).map(([key, value]) => (
                <button
                  key={value}
                  onClick={() => handleChange('goal', value)}
                  className={`p-6 border text-left transition-all ${
                    profile.goal === value 
                      ? 'bg-black text-[#bef264] border-black shadow-lg scale-[1.02]' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-[#bef264]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-black text-sm uppercase tracking-tighter">{GoalMetadata[value as FitnessGoal].label}</p>
                    {profile.goal === value && <div className="w-2 h-2 bg-[#bef264] rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 bg-[#fcfcfc] p-12 space-y-12 border-l border-gray-100 relative">
          <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">器械倉庫 (Inventory)</h3>
          
          <div className="space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {baseEquipment.map(item => (
                <button
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  className={`px-4 py-4 text-left text-[10px] font-black uppercase tracking-tight border transition-all ${
                    (profile.equipment || []).includes(item)
                      ? 'bg-[#bef264] border-[#bef264] text-black shadow-md'
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pt-10 border-t border-gray-100">
              <label className="block text-[8px] font-black uppercase tracking-widest mb-3 text-gray-400">擴充資源庫 (Augmented Resources)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newEqInput}
                  onChange={e => setNewEqInput(e.target.value)}
                  placeholder="New Equipment Name..."
                  className="flex-1 bg-gray-50 border-none p-5 text-sm font-bold outline-none text-gray-900"
                />
                <button onClick={addCustomEquipment} className="bg-black text-[#bef264] px-10 hover:bg-[#bef264] hover:text-black transition-all">
                  <Plus className="w-6 h-6" />
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
