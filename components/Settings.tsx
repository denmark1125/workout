
import React, { useState, useMemo } from 'react';
import { UserProfile, FitnessGoal, GoalMetadata, DietaryPreference, ActivityLevel } from '../types';
import { testConnection, calculateAiNutritionPlan } from '../services/geminiService';
import { calculateNutritionTargets } from '../utils/calculations';
import { Save, CheckCircle, Target, User as UserIcon, BookOpen, Zap, Loader2, ShieldCheck, Database, Activity, RefreshCw, X, Plus } from 'lucide-react';

interface SettingsProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onReplayOnboarding: () => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, setProfile, onReplayOnboarding }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [newEqInput, setNewEqInput] = useState('');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAIL' | 'DENIED'>('IDLE');
  const [isCalibrating, setIsCalibrating] = useState(false);

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

  const handleDeepChange = (parent: keyof UserProfile, child: string, value: any) => {
     setProfile({
        ...profile,
        [parent]: {
           ...(profile[parent] as any),
           [child]: value
        }
     });
  };

  const toggleEquipment = (item: string) => {
    const current = profile.equipment || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange('equipment', updated);
  };

  const addCustomEquipment = () => {
    const trimmedInput = newEqInput.trim();
    if (!trimmedInput) return;
    const currentPool = profile.customEquipmentPool || [];
    if (!currentPool.includes(trimmedInput)) {
      const currentEquip = profile.equipment || [];
      setProfile({
        ...profile,
        customEquipmentPool: [...currentPool, trimmedInput],
        equipment: currentEquip.includes(trimmedInput) ? currentEquip : [...currentEquip, trimmedInput]
      });
    }
    setNewEqInput('');
  };

  const removeCustomEquipment = (item: string) => {
    const currentPool = profile.customEquipmentPool || [];
    const currentEquip = profile.equipment || [];
    setProfile({
      ...profile,
      customEquipmentPool: currentPool.filter(i => i !== item),
      equipment: currentEquip.filter(i => i !== item)
    });
  };

  const handlePrivacyToggle = (setting: 'syncPhysiqueImages' | 'syncMetrics') => {
    const currentSettings = profile.privacySettings || { syncPhysiqueImages: true, syncMetrics: true };
    handleChange('privacySettings', {
      ...currentSettings,
      [setting]: !(currentSettings as any)[setting]
    });
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleAICalibrate = async () => {
     if(!confirm("David 教練：系統將根據您的「活動量」、「飲食偏好」與「目標」重新計算營養策略。確定執行？")) return;
     
     setIsCalibrating(true);
     try {
       // 優先使用 AI 計算
       const aiResult = await calculateAiNutritionPlan(
         75, // 若有實際體重應從 metrics 獲取，此處簡化
         profile.height,
         profile.age,
         profile.gender,
         profile.activityLevel || ActivityLevel.MODERATE,
         profile.goal,
         profile.dietaryPreference || DietaryPreference.OMNIVORE
       );

       if (aiResult) {
          setProfile({
             ...profile,
             dailyCalorieTarget: aiResult.dailyCalorieTarget,
             macroTargets: aiResult.macroTargets
          });
          alert(`校準完成！\nDavid 教練建議：「${aiResult.advice}」`);
       } else {
          // Fallback to local calculation if AI fails
          const localResult = calculateNutritionTargets(
             75,
             profile.height,
             profile.age,
             profile.gender,
             profile.activityLevel || ActivityLevel.MODERATE,
             profile.goal,
             profile.dietaryPreference || DietaryPreference.OMNIVORE
          );
          setProfile({
             ...profile,
             dailyCalorieTarget: localResult.dailyCalorieTarget,
             macroTargets: localResult.macroTargets
          });
          alert("AI 連線不穩，已切換至本地演算法完成基礎校準。");
       }
     } catch(e) {
       console.error(e);
       alert("校準系統異常。");
     } finally {
       setIsCalibrating(false);
     }
  };

  const handleTestConnection = async () => {
    if (profile.role !== 'admin') {
      setTestStatus('DENIED');
      setTimeout(() => setTestStatus('IDLE'), 3000);
      return;
    }
    setTestStatus('TESTING');
    const result = await testConnection(profile.role);
    setTestStatus(result ? 'SUCCESS' : 'FAIL');
    setTimeout(() => setTestStatus('IDLE'), 3000);
  };

  const privacy = profile.privacySettings || { syncPhysiqueImages: true, syncMetrics: true };

  const dietOptions = [
    { val: DietaryPreference.OMNIVORE, label: '均衡飲食 (雜食)' },
    { val: DietaryPreference.CARNIVORE, label: '肉食主義' },
    { val: DietaryPreference.VEGETARIAN, label: '蛋奶素' },
    { val: DietaryPreference.VEGAN, label: '全素食' },
    { val: DietaryPreference.PESCATARIAN, label: '海鮮素' },
    { val: DietaryPreference.KETOGENIC, label: '生酮飲食' },
  ];

  const activityOptions = [
    { val: ActivityLevel.SEDENTARY, label: '久坐少動 (幾乎不運動)' },
    { val: ActivityLevel.LIGHT, label: '輕度活動 (每週 1-3 天)' },
    { val: ActivityLevel.MODERATE, label: '中度活動 (每週 3-5 天)' },
    { val: ActivityLevel.ACTIVE, label: '高度活動 (每週 6-7 天)' },
    { val: ActivityLevel.ATHLETE, label: '極限運動 (每日高強度)' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 overflow-hidden px-2 animate-in fade-in duration-500">
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
        {/* 左側欄：身份與隱私 */}
        <div className="lg:col-span-5 p-8 md:p-10 space-y-12 border-b lg:border-b-0 lg:border-r border-gray-100">
          
          {/* 基本資料 */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3">
              <UserIcon size={12} className="text-black" /> 巨巨身分 (Identity)
            </h3>
            <div className="space-y-4">
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

          {/* 戰略目標設定 */}
          <section className="space-y-6">
             <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-3">
                <Target size={12} className="text-black" /> 戰略目標 (Protocol)
             </h3>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                   {Object.entries(GoalMetadata).map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => handleChange('goal', key)}
                        className={`text-left p-3 border text-[10px] font-black uppercase tracking-wide transition-all ${profile.goal === key ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                      >
                         {meta.label}
                      </button>
                   ))}
                </div>
                {profile.goal === 'CUSTOM' && (
                   <div>
                     <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">自定義目標描述</label>
                     <input
                        type="text"
                        value={profile.customGoalText || ''}
                        onChange={e => handleChange('customGoalText', e.target.value)}
                        placeholder="例如: 婚前減重、馬拉松備賽..."
                        className="w-full bg-gray-50 border-b-2 border-gray-100 px-4 py-3 text-sm font-bold focus:border-black outline-none transition-all"
                     />
                   </div>
                )}
             </div>
          </section>

          {/* 隱私設定 */}
          <section className="space-y-6 p-6 bg-gray-50/50 border border-gray-100 rounded-sm">
            <h3 className="text-[10px] font-mono font-black text-black uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck size={14} className="text-lime-600" /> 隱私與數據安全 (Security)
            </h3>
            <div className="space-y-4">
               {/* 體態照片隱私 */}
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-black uppercase">體態分析上傳</p>
                    <p className="text-[9px] text-gray-400 font-bold leading-tight mt-1">
                      {privacy.syncPhysiqueImages ? '僅上傳分析文字 (照片留存本地)' : '完全停止雲端同步 (本地模式)'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handlePrivacyToggle('syncPhysiqueImages')}
                    className={`w-10 h-5 rounded-full relative transition-all ${privacy.syncPhysiqueImages ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${privacy.syncPhysiqueImages ? 'right-1 bg-[#bef264]' : 'left-1 bg-white'}`}></div>
                  </button>
               </div>

               {/* 一般數據隱私 */}
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-black uppercase">健身與飲食數據同步</p>
                    <p className="text-[9px] text-gray-400 font-bold leading-tight mt-1">含訓練日誌、飲食紀錄、身體數值</p>
                  </div>
                  <button 
                    onClick={() => handlePrivacyToggle('syncMetrics')}
                    className={`w-10 h-5 rounded-full relative transition-all ${privacy.syncMetrics ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${privacy.syncMetrics ? 'right-1 bg-[#bef264]' : 'left-1 bg-white'}`}></div>
                  </button>
               </div>
            </div>
          </section>
        </div>

        {/* 右側欄：營養與參數 */}
        <div className="lg:col-span-7 p-8 md:p-10 space-y-12 relative bg-[#fcfcfc]">
          
          {/* 參數與營養配置 */}
          <section className="space-y-8">
             <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                   <Activity size={12} className="text-black" /> 參數與營養配置 (Parameters)
                </h3>
                <button 
                   onClick={handleAICalibrate} 
                   disabled={isCalibrating}
                   className="flex items-center gap-2 text-[9px] font-black uppercase bg-black text-[#bef264] px-3 py-1.5 hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50"
                >
                   {isCalibrating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                   {isCalibrating ? 'AI CALCULATING...' : 'AI 戰略校準'}
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 關鍵參數設定 (修復部分) */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">日常活動量 (ACTIVITY LEVEL)</label>
                      <select 
                        value={profile.activityLevel || ActivityLevel.MODERATE}
                        onChange={(e) => handleChange('activityLevel', Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 p-3 text-xs font-black outline-none focus:border-black"
                      >
                         {activityOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">飲食偏好 (DIET TYPE)</label>
                      <select 
                        value={profile.dietaryPreference || DietaryPreference.OMNIVORE}
                        onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                        className="w-full bg-white border border-gray-200 p-3 text-xs font-black outline-none focus:border-black"
                      >
                         {dietOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">每日熱量目標 (TDEE/TARGET)</label>
                      <input 
                         type="number"
                         value={profile.dailyCalorieTarget}
                         onChange={(e) => handleChange('dailyCalorieTarget', parseInt(e.target.value))}
                         className="w-full bg-white border-b-2 border-gray-200 px-3 py-2 text-lg font-black font-mono focus:border-black outline-none"
                      />
                   </div>
                </div>
                
                {/* 宏量營養素 */}
                <div className="space-y-4 bg-gray-50 p-6 border border-gray-100">
                   <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">宏量營養素戰術 (MACROS)</p>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between">
                            <label className="text-[8px] font-black uppercase text-orange-400">蛋白質 Protein</label>
                            <span className="text-[10px] font-bold">{profile.macroTargets?.protein}g</span>
                         </div>
                         <input type="range" min="50" max="300" step="5" value={profile.macroTargets?.protein} onChange={(e) => handleDeepChange('macroTargets', 'protein', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between">
                            <label className="text-[8px] font-black uppercase text-blue-400">碳水 Carbs</label>
                            <span className="text-[10px] font-bold">{profile.macroTargets?.carbs}g</span>
                         </div>
                         <input type="range" min="0" max="500" step="5" value={profile.macroTargets?.carbs} onChange={(e) => handleDeepChange('macroTargets', 'carbs', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between">
                            <label className="text-[8px] font-black uppercase text-yellow-400">脂肪 Fat</label>
                            <span className="text-[10px] font-bold">{profile.macroTargets?.fat}g</span>
                         </div>
                         <input type="range" min="0" max="150" step="5" value={profile.macroTargets?.fat} onChange={(e) => handleDeepChange('macroTargets', 'fat', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* 器械倉庫 */}
          <section className="space-y-6 pt-6 border-t border-gray-100">
             <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 flex items-center gap-3">
                <Database size={12} className="text-black" /> 器械倉庫 (Inventory)
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
               {allAvailableEquipment.map(item => {
                 const isCustom = (profile.customEquipmentPool || []).includes(item);
                 return (
                   <div key={item} className="relative group">
                     <button
                       onClick={() => toggleEquipment(item)}
                       className={`w-full px-3 py-3 text-left text-[10px] font-black uppercase tracking-tight border transition-all ${
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
             
             <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newEqInput}
                  onChange={e => setNewEqInput(e.target.value)}
                  placeholder="輸入器械名稱..."
                  className="flex-1 bg-white border border-gray-200 px-4 h-10 text-xs font-bold outline-none focus:border-black"
                />
                <button 
                  onClick={addCustomEquipment}
                  className="w-10 h-10 bg-black text-[#bef264] flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all"
                >
                  <Plus size={16} />
                </button>
             </div>
          </section>
          
          <div className="pt-10 border-t border-gray-100 space-y-4">
            <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">System Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onReplayOnboarding}
                className="w-full bg-white border border-gray-200 text-gray-500 px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <BookOpen size={12} /> 重啟教學
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'TESTING' || testStatus === 'DENIED'}
                className={`w-full border px-4 py-3 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2
                  ${testStatus === 'SUCCESS' ? 'bg-[#bef264] border-[#bef264] text-black' : 
                    testStatus === 'FAIL' ? 'bg-red-500 border-red-500 text-white' : 
                    'bg-black text-white border-black hover:bg-gray-800'}`}
              >
                 {testStatus === 'TESTING' ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />}
                 {testStatus === 'TESTING' ? 'Testing...' : testStatus === 'SUCCESS' ? 'Uplink Established' : 'Test AI Uplink'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
