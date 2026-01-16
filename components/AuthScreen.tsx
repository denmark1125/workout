
import React, { useState } from 'react';
import { Lock, User as UserIcon, Mail, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Target, Zap, Activity, Heart } from 'lucide-react';
import { UserProfile, FitnessGoal, GoalMetadata } from '../types';

interface AuthScreenProps {
  onLogin: (id: string, pass: string) => void;
  onRegister: (profile: UserProfile, initialWeight: number) => void;
  loginError: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, loginError }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState(1);
  
  // Login States
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register States
  const [regData, setRegData] = useState<Partial<UserProfile>>({
    goal: FitnessGoal.HYPERTROPHY,
    age: 25, height: 175, gender: 'M',
    trainingPreference: 'BALANCED',
    memberId: '',
    password: ''
  });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [weight, setWeight] = useState(70);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRegisterFinal = () => {
    const memberId = regData.memberId || 'user_' + Date.now().toString().slice(-4);
    const finalProfile: UserProfile = {
      ...regData,
      memberId: memberId,
      name: regData.name || memberId,
      password: regData.password || '0000',
      gender: regData.gender || 'M',
      height: regData.height || 175,
      age: regData.age || 25,
      goal: regData.goal || FitnessGoal.HYPERTROPHY,
      equipment: [],
      customEquipmentPool: [],
      loginStreak: 1,
      collectedRewardIds: [],
      hasCompletedOnboarding: false
    } as UserProfile;
    
    onRegister(finalProfile, weight);
  };
  
  const isCredentialStepValid = regData.memberId && regData.password && regData.memberId.length > 3 && regData.password.length > 3;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-12 space-y-4">
          <div className="w-16 h-16 bg-black text-[#bef264] flex items-center justify-center mx-auto font-black text-2xl italic shadow-2xl">M</div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-black">THE MATRIX</h1>
        </div>

        {mode === 'LOGIN' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-100 p-10 shadow-2xl space-y-8">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">系統連線 AUTH_LOGIN</h2>
            <form onSubmit={e => { e.preventDefault(); onLogin(loginId, loginPass); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-gray-400 block tracking-widest">使用者 ID</label>
                <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-4 text-base font-bold outline-none transition-all" placeholder="Enter Member ID" required />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-gray-400 block tracking-widest">存取密碼</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-4 text-base font-bold tracking-[0.4em] outline-none transition-all" placeholder="****" required />
              </div>
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">驗證失敗 ERROR_403</p>}
              <button className="w-full bg-black text-white py-5 font-black text-[12px] tracking-[0.4em] hover:bg-[#bef264] hover:text-black transition-all shadow-lg active:scale-95">登入 LOGIN</button>
            </form>
            <button onClick={() => setMode('REGISTER')} className="w-full text-center text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">申請註冊新帳號 REGISTER</button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-white border border-gray-100 p-10 shadow-2xl min-h-[560px] flex flex-col">
            
            {step === 1 && (
              <div className="space-y-8 flex-1 flex flex-col animate-in fade-in">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase">用戶服務與隱私條款</h2>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Step 01 / Legal & Safety</p>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6 text-[12px] text-gray-600 space-y-5 leading-relaxed border border-gray-100 custom-scrollbar max-h-[280px]">
                  <section>
                    <p className="font-black text-black mb-1 underline">一、醫療免責聲明</p>
                    <p>本應用程式提供的資訊僅供個人健康參考，不應取代專業醫療建議。在開始任何高強度運動或飲食計畫前，請務必諮詢合格醫師。</p>
                  </section>
                  <section>
                    <p className="font-black text-black mb-1 underline">二、數據收集與隱私</p>
                    <p>我們會收集您的生理指標與上傳的視覺診斷照片。照片將進行隱私模糊處理後存儲，僅供 AI 分析與個人回顧使用。</p>
                  </section>
                </div>
                <label className="flex items-center gap-4 cursor-pointer group p-3 bg-gray-50 border border-transparent hover:border-black transition-all">
                  <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} className="w-5 h-5 accent-black" />
                  <span className="text-[11px] font-black uppercase tracking-tight text-gray-700">我已完全閱讀並同意上述條款</span>
                </label>
                <button disabled={!privacyAgreed} onClick={nextStep} className="w-full bg-black text-white py-5 font-black text-[11px] tracking-widest flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-300">確認並開始 NEXT <ArrowRight size={16} /></button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase">生理參數設定</h2>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Step 02 / Matrix Stats</p>
                </div>
                <div className="space-y-8">
                  <div className="flex gap-3">
                    {['M', 'F'].map(g => (
                      <button key={g} onClick={() => setRegData({...regData, gender: g as any})} className={`flex-1 py-5 text-[11px] font-black border transition-all ${regData.gender === g ? 'bg-black text-[#bef264] border-black' : 'bg-gray-50 text-gray-400 border-transparent'}`}>
                        {g === 'M' ? 'MALE 男' : 'FEMALE 女'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">身高 CM</label>
                      <input type="number" value={regData.height} onChange={e => setRegData({...regData, height: parseInt(e.target.value)})} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-5 text-2xl font-black outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">體重 KG</label>
                      <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-5 text-2xl font-black outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">年齡 AGE</label>
                    <input type="number" value={regData.age} onChange={e => setRegData({...regData, age: parseInt(e.target.value)})} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-5 text-2xl font-black outline-none transition-all" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-5 text-[11px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={nextStep} className="flex-[2] bg-black text-white py-5 font-black text-[11px] tracking-widest">繼續設定 CONTINUE</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase">建立帳戶憑證</h2>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Step 03 / Credentials</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">帳號 ID (登入用，至少4位)</label>
                    <input type="text" value={regData.memberId || ''} onChange={e => setRegData({...regData, memberId: e.target.value.toLowerCase()})} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-5 text-base font-bold outline-none" placeholder="member_id" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">登入密碼 PASSWORD (至少4位)</label>
                    <input type="password" value={regData.password || ''} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-gray-50 border-b-2 border-transparent focus:border-black px-4 py-5 text-base font-bold outline-none tracking-[0.4em]" placeholder="****" />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button onClick={prevStep} className="flex-1 py-5 text-[11px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={nextStep} disabled={!isCredentialStepValid} className="flex-[2] bg-black text-white py-5 font-black text-[11px] tracking-widest uppercase disabled:bg-gray-100 disabled:text-gray-300">下一步 NEXT</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight uppercase">戰略目標與風格</h2>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Step 04 / Strategy</p>
                </div>
                
                <div className="space-y-8">
                  <section>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">核心目標 Core Goal</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(FitnessGoal).map(([key, value]) => (
                        <button
                          key={value}
                          onClick={() => setRegData({...regData, goal: value as FitnessGoal})}
                          className={`p-4 border text-left transition-all ${
                            regData.goal === value 
                              ? 'bg-black text-[#bef264] border-black' 
                              : 'bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black'
                          }`}
                        >
                          <p className="font-black text-[10px] uppercase tracking-tighter leading-tight">{GoalMetadata[value as FitnessGoal].label}</p>
                          <p className="text-[8px] mt-1 opacity-60 leading-tight">{GoalMetadata[value as FitnessGoal].focus}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">訓練偏好 Style Preference</p>
                    <div className="flex gap-3">
                      {[
                        { id: 'WEIGHTS', label: '阻力重訓', icon: <Zap size={12}/> },
                        { id: 'CARDIO', label: '有氧代謝', icon: <Heart size={12}/> },
                        { id: 'BALANCED', label: '均衡並重', icon: <Activity size={12}/> }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setRegData({...regData, trainingPreference: style.id as any})}
                          className={`flex-1 flex flex-col items-center gap-2 py-4 border transition-all ${
                            regData.trainingPreference === style.id 
                              ? 'bg-black text-[#bef264] border-black' 
                              : 'bg-gray-50 text-gray-400 hover:border-black hover:text-black'
                          }`}
                        >
                          {style.icon}
                          <span className="text-[10px] font-black uppercase">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={prevStep} className="flex-1 py-5 text-[11px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={handleRegisterFinal} className="flex-[2] bg-black text-white py-5 font-black text-[11px] tracking-widest">啟動系統 INITIALIZE</button>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <button onClick={() => setMode('LOGIN')} className="mt-10 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-black">已有帳號？ 返回登入</button>
            )}
          </div>
        )}

        <p className="text-center mt-12 text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">Fitness Matrix Terminal 2.5</p>
      </div>
    </div>
  );
};

export default AuthScreen;
