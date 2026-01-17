
import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, ArrowRight, Activity, Utensils, Zap, ChevronRight, Loader2, CheckCircle, Terminal, Eye, EyeOff, Scale, Ruler, Calendar, Flame, Target } from 'lucide-react';
import { UserProfile, FitnessGoal, GoalMetadata, DietaryPreference, ActivityLevel } from '../types';
import { calculateNutritionTargets } from '../utils/calculations';

interface AuthScreenProps {
  onLogin: (id: string, pass: string) => void;
  onRegister: (profile: UserProfile, weight: number) => void;
  loginError: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, loginError }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showPass, setShowPass] = useState(false);
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regStep, setRegStep] = useState(1);
  const [regId, setRegId] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState<'M' | 'F'>('M');
  const [regAge, setRegAge] = useState<number>(25);
  const [regHeight, setRegHeight] = useState<number>(175);
  const [regWeight, setRegWeight] = useState<number>(75);
  const [regGoal, setRegGoal] = useState<FitnessGoal>(FitnessGoal.HYPERTROPHY);
  const [regActivity, setRegActivity] = useState<ActivityLevel>(ActivityLevel.MODERATE);
  const [regDiet, setRegDiet] = useState<DietaryPreference>(DietaryPreference.OMNIVORE);

  // Initialization Animation State
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [initStatusText, setInitStatusText] = useState('SYSTEM CHECK...');
  const [calculatedResult, setCalculatedResult] = useState<any>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginId, loginPass);
  };

  const activityOptions = [
    { val: ActivityLevel.SEDENTARY, label: '久坐少動', desc: '辦公室工作，幾乎不運動' },
    { val: ActivityLevel.LIGHT, label: '輕度活動', desc: '每週運動 1-3 天' },
    { val: ActivityLevel.MODERATE, label: '中度活動', desc: '每週運動 3-5 天' },
    { val: ActivityLevel.ACTIVE, label: '高度活動', desc: '每週運動 6-7 天' },
    { val: ActivityLevel.ATHLETE, label: '極限運動', desc: '每天高強度訓練或勞力工作' },
  ];

  const dietOptions = [
    { val: DietaryPreference.OMNIVORE, label: '均衡飲食 (雜食)', desc: '不忌口，各類食物皆攝取' },
    { val: DietaryPreference.CARNIVORE, label: '肉食主義', desc: '以肉類與動物性蛋白為主' },
    { val: DietaryPreference.VEGETARIAN, label: '蛋奶素', desc: '不吃肉，但攝取蛋與奶製品' },
    { val: DietaryPreference.VEGAN, label: '全素食', desc: '完全不攝取動物性產品' },
    { val: DietaryPreference.PESCATARIAN, label: '海鮮素', desc: '不吃紅肉禽肉，但吃海鮮' },
    { val: DietaryPreference.KETOGENIC, label: '生酮飲食', desc: '極低碳水，高脂肪攝取' },
  ];

  // 模擬系統運算過程
  const startInitialization = () => {
    setIsInitializing(true);
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 2;
      if (progress > 100) progress = 100;
      
      setInitProgress(progress);
      
      if (progress < 30) setInitStatusText('ANALYZING BIOMETRICS...');
      else if (progress < 50) setInitStatusText('CALCULATING BASAL METABOLIC RATE (BMR)...');
      else if (progress < 70) setInitStatusText('ESTIMATING DAILY EXPENDITURE (TDEE)...');
      else if (progress < 90) setInitStatusText('OPTIMIZING MACRONUTRIENT RATIOS...');
      else setInitStatusText('FINALIZING PROFILE MATRIX...');

      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          // 執行實際計算
          const result = calculateNutritionTargets(
            regWeight, regHeight, regAge, regGender, regActivity, regGoal, regDiet
          );
          setCalculatedResult(result);
          setIsInitializing(false);
          setRegStep(7); // Go to Result Screen
        }, 500);
      }
    }, 150);
  };

  const handleFinalRegister = () => {
    if (!calculatedResult) return;

    const profile: UserProfile = {
      memberId: regId.toLowerCase(),
      password: regPass,
      name: regName || regId,
      gender: regGender,
      age: regAge,
      height: regHeight,
      goal: regGoal,
      activityLevel: regActivity,
      dietaryPreference: regDiet,
      dailyCalorieTarget: calculatedResult.dailyCalorieTarget,
      macroTargets: calculatedResult.macroTargets,
      equipment: [],
      loginStreak: 1,
      role: 'user',
      customEquipmentPool: [],
      collectedRewardIds: [],
      unlockedAchievementIds: [],
      hasCompletedOnboarding: false, // Trigger onboarding
    };
    onRegister(profile, regWeight);
  };

  // 1. LOGIN SCREEN (Visual matching the screenshot)
  if (mode === 'LOGIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="w-24 h-24 bg-black flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-[#bef264] font-black italic text-5xl pr-2">M</span>
             </div>
             <h1 className="text-4xl font-black tracking-tighter uppercase text-black">THE MATRIX</h1>
          </div>

          {/* Login Card */}
          <div className="w-full bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] animate-in zoom-in duration-500">
             <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-8">
               系統連線 AUTH_LOGIN
             </p>

             <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">使用者 ID</label>
                   <input 
                     type="text" 
                     value={loginId}
                     onChange={e => setLoginId(e.target.value)}
                     className="w-full bg-[#f9fafb] p-4 font-bold text-gray-900 outline-none focus:bg-gray-100 transition-colors border-b-2 border-transparent focus:border-black placeholder:text-gray-300 placeholder:font-bold"
                     placeholder="Enter Member ID"
                   />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">存取密碼</label>
                   <div className="relative">
                     <input 
                       type={showPass ? "text" : "password"}
                       value={loginPass}
                       onChange={e => setLoginPass(e.target.value)}
                       className="w-full bg-[#f9fafb] p-4 font-bold text-gray-900 outline-none focus:bg-gray-100 transition-colors border-b-2 border-transparent focus:border-black placeholder:text-gray-300 placeholder:tracking-widest"
                       placeholder="* * * *"
                     />
                     <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                     >
                       {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                     </button>
                   </div>
                </div>

                {loginError && (
                  <p className="text-red-500 text-[10px] font-black text-center tracking-widest bg-red-50 py-2">存取被拒 ACCESS DENIED</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-black text-white py-5 font-black text-xs tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all mt-4 shadow-lg active:scale-[0.98]"
                >
                   登入 LOGIN
                </button>
             </form>

             <div className="mt-8 text-center">
                <button 
                   onClick={() => setMode('REGISTER')}
                   className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5"
                >
                   申請註冊新帳號 REGISTER
                </button>
             </div>
          </div>
          
          <div className="mt-16 opacity-30">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] text-center">FITNESS MATRIX TERMINAL 2.5</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. INITIALIZATION SCREEN (Loading Simulation)
  if (isInitializing) {
     return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
           {/* Scanlines */}
           <div className="absolute inset-0 scanline opacity-10 pointer-events-none"></div>

           <div className="w-full max-w-md space-y-8 text-center relative z-10">
              <Loader2 className="w-16 h-16 text-[#bef264] animate-spin mx-auto" />
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase">System Initialization</h2>
                 <p className="text-[10px] font-mono text-[#bef264] tracking-[0.2em] animate-pulse">{initStatusText}</p>
              </div>
              
              <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                 <div className="h-full bg-[#bef264] transition-all duration-100 ease-out shadow-[0_0_10px_#bef264]" style={{ width: `${initProgress}%` }}></div>
              </div>
              <p className="text-5xl font-mono font-black text-white">{initProgress}%</p>
           </div>
           
           {/* Background Deco */}
           <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#bef264]"></div>
              <div className="absolute top-0 left-1/2 h-full w-[1px] bg-[#bef264]"></div>
           </div>
        </div>
     );
  }

  // 3. RESULT SCREEN
  if (regStep === 7 && calculatedResult) {
     return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

           <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-2xl space-y-8 animate-in slide-in-from-bottom-10 duration-500 relative z-10">
              <div className="text-center space-y-2 border-b-2 border-gray-100 pb-6">
                 <div className="inline-flex p-3 bg-[#bef264] text-black rounded-full mb-2"><CheckCircle size={32} /></div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Matrix Calibration Complete</h2>
                 <p className="text-xs text-gray-500 font-bold">系統已根據您的數值完成優化</p>
              </div>

              <div className="space-y-6">
                 <div className="bg-black text-white p-6 text-center shadow-lg">
                    <p className="text-[10px] font-black text-[#bef264] uppercase tracking-widest mb-1">Daily Target (TDEE)</p>
                    <p className="text-5xl font-black font-mono tracking-tighter">{calculatedResult.dailyCalorieTarget}<span className="text-sm ml-1 text-gray-500">kcal</span></p>
                 </div>

                 <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 border border-gray-100 p-4 text-center">
                       <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Protein</p>
                       <p className="text-xl font-black">{calculatedResult.macroTargets.protein}g</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4 text-center">
                       <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Carbs</p>
                       <p className="text-xl font-black">{calculatedResult.macroTargets.carbs}g</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4 text-center">
                       <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Fat</p>
                       <p className="text-xl font-black">{calculatedResult.macroTargets.fat}g</p>
                    </div>
                 </div>
                 
                 <div className="p-4 bg-gray-50 border-l-4 border-black text-xs text-gray-600 font-bold leading-relaxed">
                    David 教練：這些數值是你的起始戰術配置。隨著你輸入更多訓練與體態數據，系統將會持續動態調整。
                 </div>
              </div>

              <button onClick={handleFinalRegister} className="w-full bg-black text-[#bef264] py-5 font-black text-xs tracking-[0.2em] uppercase hover:bg-[#bef264] hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg">
                 進入系統 (ENTER MATRIX) <ArrowRight size={14} />
              </button>
           </div>
        </div>
     );
  }

  // 4. REGISTRATION WIZARD
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 flex items-center justify-between">
           <button onClick={() => regStep > 1 ? setRegStep(regStep - 1) : setMode('LOGIN')} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black">
              Back
           </button>
           <div className="flex gap-1">
              {[1,2,3,4,5,6].map(s => (
                 <div key={s} className={`h-1 w-6 rounded-full transition-colors ${s <= regStep ? 'bg-black' : 'bg-gray-200'}`}></div>
              ))}
           </div>
           <span className="text-xs font-black font-mono">STEP {regStep}/06</span>
        </div>

        <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative min-h-[450px] flex flex-col">
           
           {/* Step 1: Credentials */}
           {regStep === 1 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-black uppercase tracking-tighter">建立識別代碼</h2>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Member ID (Unique)</label>
                      <input value={regId} onChange={e => setRegId(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 focus:border-black p-4 font-bold outline-none" placeholder="使用者帳號" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
                      <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 focus:border-black p-4 font-bold outline-none" placeholder="設定密碼" />
                   </div>
                </div>
                <div className="pt-4">
                  <button onClick={() => { if(regId && regPass) setRegStep(2); }} disabled={!regId || !regPass} className="w-full bg-black text-white py-4 font-black text-xs uppercase hover:bg-gray-800 disabled:opacity-50">Next Step</button>
                </div>
             </div>
           )}

           {/* Step 2: Bio */}
           {regStep === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-black uppercase tracking-tighter">生理數值輸入</h2>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Display Name</label>
                      <input value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black p-3 font-bold outline-none" placeholder="暱稱" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gender</label>
                         <div className="flex border-2 border-gray-100">
                            <button onClick={() => setRegGender('M')} className={`flex-1 py-3 text-sm font-black ${regGender === 'M' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>MALE</button>
                            <button onClick={() => setRegGender('F')} className={`flex-1 py-3 text-sm font-black ${regGender === 'F' ? 'bg-black text-white' : 'bg-white text-gray-400'}`}>FEMALE</button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Age</label>
                         <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="number" value={regAge} onChange={e => setRegAge(parseInt(e.target.value))} className="w-full bg-gray-50 p-3 pl-10 font-bold outline-none" />
                         </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Height (cm)</label>
                         <div className="relative">
                            <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="number" value={regHeight} onChange={e => setRegHeight(parseInt(e.target.value))} className="w-full bg-gray-50 p-3 pl-10 font-bold outline-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weight (kg)</label>
                         <div className="relative">
                            <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="number" step="0.1" value={regWeight} onChange={e => setRegWeight(parseFloat(e.target.value))} className="w-full bg-gray-50 p-3 pl-10 font-bold outline-none" />
                         </div>
                      </div>
                   </div>
                </div>
                <button onClick={() => setRegStep(3)} className="w-full bg-black text-white py-4 font-black text-xs uppercase hover:bg-gray-800 mt-4">Next Step</button>
             </div>
           )}

           {/* Step 3: Goal */}
           {regStep === 3 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-black uppercase tracking-tighter">選擇主要戰略目標</h2>
                <div className="space-y-3 h-64 overflow-y-auto custom-scrollbar pr-2">
                   {Object.entries(GoalMetadata).filter(([k]) => k !== 'CUSTOM').map(([key, meta]) => (
                      <button 
                        key={key} 
                        onClick={() => setRegGoal(key as FitnessGoal)}
                        className={`w-full text-left p-4 border-2 transition-all group ${regGoal === key ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-black uppercase tracking-tight">{meta.label}</span>
                            {regGoal === key && <CheckCircle size={16} className="text-[#bef264]"/>}
                         </div>
                         <p className={`text-xs ${regGoal === key ? 'text-gray-400' : 'text-gray-500'}`}>{meta.focus}</p>
                      </button>
                   ))}
                </div>
                <button onClick={() => setRegStep(4)} className="w-full bg-black text-white py-4 font-black text-xs uppercase hover:bg-gray-800">Next Step</button>
             </div>
           )}

           {/* Step 4: Activity Level */}
           {regStep === 4 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3">
                   <Activity size={24} className="text-black" />
                   <h2 className="text-2xl font-black uppercase tracking-tighter">日常活動量</h2>
                </div>
                <p className="text-xs text-gray-500 font-bold">這決定了您的 TDEE 基礎係數。</p>
                
                <div className="space-y-3 h-60 overflow-y-auto custom-scrollbar pr-2">
                   {activityOptions.map((opt) => (
                      <button 
                        key={opt.val} 
                        onClick={() => setRegActivity(opt.val)}
                        className={`w-full text-left p-4 border-2 transition-all ${regActivity === opt.val ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-black uppercase">{opt.label}</span>
                            {regActivity === opt.val && <Zap size={14} className="text-[#bef264] fill-current"/>}
                         </div>
                         <p className={`text-xs ${regActivity === opt.val ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</p>
                      </button>
                   ))}
                </div>
                <button onClick={() => setRegStep(5)} className="w-full bg-black text-white py-4 font-black text-xs uppercase hover:bg-gray-800">Next Step</button>
             </div>
           )}

           {/* Step 5: Diet */}
           {regStep === 5 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3">
                   <Utensils size={24} className="text-black" />
                   <h2 className="text-2xl font-black uppercase tracking-tighter">飲食偏好</h2>
                </div>
                <p className="text-xs text-gray-500 font-bold">AI 將根據此偏好調整蛋白質與碳水建議。</p>
                
                <div className="space-y-3 h-60 overflow-y-auto custom-scrollbar pr-2">
                   {dietOptions.map((opt) => (
                      <button 
                        key={opt.val} 
                        onClick={() => setRegDiet(opt.val)}
                        className={`w-full text-left p-4 border-2 transition-all ${regDiet === opt.val ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-black uppercase">{opt.label}</span>
                            {regDiet === opt.val && <CheckCircle size={14} className="text-[#bef264]"/>}
                         </div>
                         <p className={`text-xs ${regDiet === opt.val ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</p>
                      </button>
                   ))}
                </div>
                <button onClick={() => setRegStep(6)} className="w-full bg-black text-white py-4 font-black text-xs uppercase hover:bg-gray-800">Next Step</button>
             </div>
           )}

           {/* Step 6: Confirmation & Start Init */}
           {regStep === 6 && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col justify-center">
                <div className="text-center space-y-4">
                   <Target className="w-16 h-16 mx-auto text-black" />
                   <h2 className="text-3xl font-black uppercase tracking-tighter">準備啟動</h2>
                   <p className="text-sm text-gray-500 font-bold px-4">
                      我們已收集完畢所有必要參數。點擊下方按鈕，Matrix 將開始運算您的個人化生理模型。
                   </p>
                </div>
                
                <div className="bg-gray-50 p-6 space-y-2 border border-gray-100 text-sm font-bold text-gray-600">
                   <div className="flex justify-between"><span>目標:</span> <span className="text-black">{GoalMetadata[regGoal].label}</span></div>
                   <div className="flex justify-between"><span>活動:</span> <span className="text-black">{activityOptions.find(a=>a.val===regActivity)?.label}</span></div>
                   <div className="flex justify-between"><span>飲食:</span> <span className="text-black">{dietOptions.find(d=>d.val===regDiet)?.label}</span></div>
                </div>

                <button onClick={startInitialization} className="w-full bg-[#bef264] text-black py-5 font-black text-xs tracking-[0.3em] uppercase hover:bg-black hover:text-[#bef264] transition-all shadow-xl animate-pulse">
                   INITIALIZE SYSTEM
                </button>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
