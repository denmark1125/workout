
import React, { useState } from 'react';
import { Lock, User as UserIcon, Mail, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Target } from 'lucide-react';
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
    age: 25, height: 175, gender: 'M'
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
      name: regData.name || memberId, // Default to memberId if name is blank
      password: regData.password || '0000',
      gender: regData.gender || 'M',
      height: regData.height || 175,
      age: regData.age || 25,
      goal: regData.goal || FitnessGoal.HYPERTROPHY,
      equipment: [],
      customEquipmentPool: [],
      loginStreak: 1
    } as UserProfile;
    
    onRegister(finalProfile, weight);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10 space-y-4">
          <div className="w-14 h-14 bg-black text-[#bef264] flex items-center justify-center mx-auto font-black text-xl italic shadow-xl">M</div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-black">THE MATRIX</h1>
        </div>

        {mode === 'LOGIN' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-100 p-8 shadow-2xl space-y-8">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center">系統連線 AUTH_LOGIN</h2>
            <form onSubmit={e => { e.preventDefault(); onLogin(loginId, loginPass); }} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">使用者 ID</label>
                <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-gray-50 border-b border-transparent focus:border-black px-4 py-3.5 text-sm font-bold outline-none transition-all" placeholder="Enter Member ID" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">存取密碼</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-gray-50 border-b border-transparent focus:border-black px-4 py-3.5 text-sm font-bold tracking-[0.4em] outline-none transition-all" placeholder="****" required />
              </div>
              {loginError && <p className="text-red-500 text-[8px] font-black uppercase text-center tracking-widest">驗證失敗 ERROR_403</p>}
              <button className="w-full bg-black text-white py-4 font-black text-[11px] tracking-[0.4em] hover:bg-[#bef264] hover:text-black transition-all shadow-lg active:scale-95">登入 LOGIN</button>
            </form>
            <button onClick={() => setMode('REGISTER')} className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">申請註冊新帳號 REGISTER</button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-white border border-gray-100 p-8 shadow-2xl min-h-[520px] flex flex-col">
            
            {/* Step 1: Privacy Policy */}
            {step === 1 && (
              <div className="space-y-6 flex-1 flex flex-col animate-in fade-in">
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight">用戶服務與隱私條款</h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Step 01 / Legal & Safety</p>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-5 text-[10px] text-gray-500 space-y-4 leading-relaxed border border-gray-100 custom-scrollbar max-h-[250px]">
                  <section>
                    <p className="font-black text-black mb-1 underline">一、醫療免責聲明</p>
                    <p>本應用程式提供的資訊僅供個人健康參考，不應取代專業醫療建議。在開始任何高強度運動或飲食計畫前，請務必諮詢合格醫師。使用本系統即代表您理解並同意運動具有受傷風險，需自行承擔相關責任。</p>
                  </section>
                  <section>
                    <p className="font-black text-black mb-1 underline">二、數據收集與隱私</p>
                    <p>我們會收集您的生理指標（體重、體脂、身高）與上傳的視覺診斷照片。照片將進行隱私模糊處理後存儲於加密伺服器，僅供 AI 分析與您個人回顧使用。我們承諾不會在未經許可的情況下向第三方出售個人識別資訊。</p>
                  </section>
                  <section>
                    <p className="font-black text-black mb-1 underline">三、服務使用限制</p>
                    <p>本系統僅作為輔助工具，分析結果（包含 AI 視覺診斷）乃基於演算法推估，可能存在誤差。不得將系統數據作為醫療診斷書或保險理賠依據。</p>
                  </section>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group p-2 bg-gray-50 border border-transparent hover:border-black transition-all">
                  <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} className="w-4 h-4 accent-black" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-gray-600">我已完全閱讀並同意上述條款</span>
                </label>
                <button disabled={!privacyAgreed} onClick={nextStep} className="w-full bg-black text-white py-4 font-black text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-300">確認並開始 NEXT <ArrowRight size={14} /></button>
              </div>
            )}

            {/* Step 2: Biological Matrix */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight">生理參數設定</h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Step 02 / Matrix Stats</p>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-2">
                    {['M', 'F'].map(g => (
                      <button key={g} onClick={() => setRegData({...regData, gender: g as any})} className={`flex-1 py-4 text-[10px] font-black border transition-all ${regData.gender === g ? 'bg-black text-[#bef264] border-black' : 'bg-gray-50 text-gray-400 border-transparent'}`}>
                        {g === 'M' ? 'MALE 男' : 'FEMALE 女'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">身高 CM</label>
                      <input type="number" value={regData.height} onChange={e => setRegData({...regData, height: parseInt(e.target.value)})} className="w-full bg-gray-50 border-b px-4 py-4 text-xl font-black outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">當前體重 KG</label>
                      <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="w-full bg-gray-50 border-b px-4 py-4 text-xl font-black outline-none focus:bg-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">年齡 AGE</label>
                    <input type="number" value={regData.age} onChange={e => setRegData({...regData, age: parseInt(e.target.value)})} className="w-full bg-gray-50 border-b px-4 py-4 text-xl font-black outline-none focus:bg-white" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={prevStep} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={nextStep} className="flex-[2] bg-black text-white py-4 font-black text-[10px] tracking-widest">繼續設定 CONTINUE</button>
                </div>
              </div>
            )}

            {/* Step 3: Account Credentials */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight">建立帳戶憑證</h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Step 03 / Credentials</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">用戶暱稱 (可不填)</label>
                    <input type="text" value={regData.name || ''} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full bg-gray-50 border-b px-4 py-4 text-sm font-bold outline-none" placeholder="你的名字" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">帳號 ID (登入用)</label>
                    <input type="text" value={regData.memberId || ''} onChange={e => setRegData({...regData, memberId: e.target.value.toLowerCase()})} className="w-full bg-gray-50 border-b px-4 py-4 text-sm font-bold outline-none" placeholder="member_id" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">登入密碼 PASSWORD</label>
                    <input type="password" value={regData.password || ''} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-gray-50 border-b px-4 py-4 text-sm font-bold outline-none tracking-[0.4em]" placeholder="****" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={prevStep} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={nextStep} className="flex-[2] bg-black text-white py-4 font-black text-[10px] tracking-widest uppercase">下一步 NEXT</button>
                </div>
              </div>
            )}

            {/* Step 4: Fitness Goals */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight">核心健身目標</h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Step 04 / Fitness Target</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FitnessGoal).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => setRegData({...regData, goal: value as FitnessGoal})}
                      className={`p-4 border text-left transition-all ${
                        regData.goal === value 
                          ? 'bg-black text-[#bef264] border-black scale-105 z-10' 
                          : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-tighter leading-none">{GoalMetadata[value as FitnessGoal].label}</p>
                      <p className="text-[7px] mt-1 opacity-60">{GoalMetadata[value as FitnessGoal].focus}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={prevStep} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">返回</button>
                  <button onClick={handleRegisterFinal} className="flex-[2] bg-black text-white py-4 font-black text-[10px] tracking-widest">啟動系統 INITIALIZE</button>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <button onClick={() => setMode('LOGIN')} className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black">已有帳號？ 返回登入</button>
            )}
          </div>
        )}

        <p className="text-center mt-10 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">Fitness Matrix Terminal 2.5</p>
      </div>
    </div>
  );
};

export default AuthScreen;
