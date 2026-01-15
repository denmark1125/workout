
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

  const deleteCustomEquipment = (item: string) => {
    const pool = profile.customEquipmentPool || [];
    const selected = profile.equipment || [];
    handleChange('customEquipmentPool', pool.filter(i => i !== item));
    handleChange('equipment', selected.filter(i => i !== item));
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-8 gap-6">
        <div>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">協定參數校準 (Protocol Calibration)</p>
          <h2 className="text-6xl font-black text-black tracking-tighter uppercase leading-none">系統設定</h2>
        </div>
        <button 
          onClick={handleSave}
          className="bg-black text-white px-10 py-5 font-black uppercase tracking-[0.3em] text-xs hover:bg-[#bef264] hover:text-black transition-all flex items-center gap-4"
        >
          {showSaved ? <><CheckCircle className="w-4 h-4" /> 已儲存</> : <><Save className="w-4 h-4" /> 儲存變更 (COMMIT)</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-gray-100 gap-px p-px">
        <div className="lg:col-span-5 bg-white p-12 space-y-12">
          <section className="space-y-8">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">執行者身份 (Identity)</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest mb-2">用戶暱稱</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-transparent border-b-2 border-gray-100 px-0 py-3 text-2xl font-black focus:border-black outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2">年齡 (Age)</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="w-full bg-transparent border-b-2 border-gray-100 px-0 py-3 text-2xl font-black focus:border-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest mb-2">身高 (Height CM)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => handleChange('height', parseInt(e.target.value))}
                    className="w-full bg-transparent border-b-2 border-gray-100 px-0 py-3 text-2xl font-black focus:border-black outline-none transition-all"
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
                      ? 'bg-black text-white border-black shadow-xl scale-[1.02]' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-black'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-black text-sm uppercase tracking-tighter">{GoalMetadata[value as FitnessGoal].label}</p>
                    {profile.goal === value && <div className="w-2 h-2 bg-[#bef264] rounded-full"></div>}
                  </div>
                  <p className="text-[8px] mt-1 font-mono italic opacity-60 uppercase">{GoalMetadata[value as FitnessGoal].focus}</p>
                </button>
              ))}
            </div>
            
            {profile.goal === FitnessGoal.CUSTOM && (
              <div className="mt-6">
                <label className="block text-[8px] font-black uppercase tracking-widest mb-2">自定義戰略細節</label>
                <textarea
                  value={profile.customGoalText || ''}
                  onChange={e => handleChange('customGoalText', e.target.value)}
                  placeholder="定義您的獨特目標..."
                  className="w-full bg-gray-50 border border-gray-100 p-6 text-black font-medium focus:border-black outline-none h-32 resize-none text-sm"
                />
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 bg-white p-12 space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none">
             <span className="text-[15rem] font-black italic leading-none">GEAR</span>
          </div>
          <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 relative z-10">器械倉庫 (Equipment)</h3>
          
          <div className="space-y-10 relative z-10">
            <div>
              <p className="text-[8px] text-gray-400 font-black mb-4 uppercase tracking-[0.2em]">標準庫存 (Standard Inventory)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {baseEquipment.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`px-4 py-4 text-left text-[10px] font-black uppercase tracking-tight border transition-all ${
                      (profile.equipment || []).includes(item)
                        ? 'bg-[#bef264] border-black text-black'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-black'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {(profile.customEquipmentPool?.length || 0) > 0 && (
              <div>
                <p className="text-[8px] text-black font-black mb-4 uppercase tracking-[0.2em]">擴充庫存 (Augmented Inventory)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.customEquipmentPool?.map(item => (
                    <div key={item} className="flex gap-2">
                      <button
                        onClick={() => toggleEquipment(item)}
                        className={`flex-1 px-4 py-4 text-left text-[10px] font-black uppercase tracking-tight border transition-all ${
                          (profile.equipment || []).includes(item)
                            ? 'bg-[#bef264] border-black text-black'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-black'
                        }`}
                      >
                        {item}
                      </button>
                      <button 
                        onClick={() => deleteCustomEquipment(item)}
                        className="px-5 bg-white border border-gray-100 text-gray-200 hover:bg-black hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-gray-100">
              <label className="block text-[8px] font-black uppercase tracking-widest mb-3">新增自定義器械資源</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newEqInput}
                  onChange={e => setNewEqInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomEquipment()}
                  placeholder="器械名稱..."
                  className="flex-1 bg-gray-50 border-none p-5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                />
                <button 
                  onClick={addCustomEquipment}
                  className="bg-black text-[#bef264] px-10 transition-all hover:bg-gray-900"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black p-10 flex items-start gap-8 mt-12">
            <div className="w-12 h-12 shrink-0 bg-[#bef264] flex items-center justify-center text-black font-black text-xl">!</div>
            <div>
              <h4 className="text-white font-black text-xs mb-2 uppercase tracking-widest">系統一致性說明</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium uppercase tracking-tighter">
                矩陣運算高度依賴準確的環境數據。您的器械庫存選擇將決定所有戰術報告的生成參數。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
