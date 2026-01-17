
import React, { useState, useMemo, useRef } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, MacroNutrients } from '../types.ts';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { Plus, Camera, ChevronLeft, ChevronRight, X, Utensils, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, QrCode, Minus, Scale, Store, Tag } from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

const MEAL_TYPES = {
  breakfast: { label: '早餐 BREAKFAST', icon: <Coffee size={24}/> },
  lunch: { label: '午餐 LUNCH', icon: <Sun size={24}/> },
  dinner: { label: '晚餐 DINNER', icon: <Utensils size={24}/> },
  snack: { label: '點心 SNACK', icon: <Sandwich size={24}/> },
  nightSnack: { label: '宵夜 NIGHT SNACK', icon: <Moon size={24}/> }
};

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; }> = ({ dietLogs = [], onUpdateDietLog, profile }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  const [addMode, setAddMode] = useState<'CAMERA' | 'DATABASE' | 'CUSTOM'>('DATABASE');
  
  const [newMealName, setNewMealName] = useState('');
  const [newMealSource, setNewMealSource] = useState('');
  const [newMealBarcode, setNewMealBarcode] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealPortionLabel, setNewMealPortionLabel] = useState('份');
  
  const [newMealCals, setNewMealCals] = useState('');
  const [newMealP, setNewMealP] = useState('');
  const [newMealC, setNewMealC] = useState('');
  const [newMealF, setNewMealF] = useState('');
  const [newMealImage, setNewMealImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentLog = useMemo(() => {
    const log = dietLogs.find(l => l.date === selectedDate);
    const emptyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], nightSnack: [] };
    const baseLog: DietLog = log || { id: selectedDate, date: selectedDate, meals: emptyMeals, waterIntake: 0 };
    return { ...baseLog, meals: baseLog.meals || emptyMeals };
  }, [dietLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(currentLog.meals).forEach((mealList) => {
      mealList.forEach((m: MealRecord) => {
        totals.calories += Number(m.macros.calories || 0);
        totals.protein += Number(m.macros.protein || 0);
        totals.carbs += Number(m.macros.carbs || 0);
        totals.fat += Number(m.macros.fat || 0);
      });
    });
    return totals;
  }, [currentLog]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzeFoodImage(base64, profile);
          if (result) {
            setNewMealName(result.name);
            setNewMealCals(result.macros.calories.toString());
            setNewMealP(result.macros.protein.toString());
            setNewMealC(result.macros.carbs.toString());
            setNewMealF(result.macros.fat.toString());
            setAddMode('CUSTOM');
          }
        } catch (e) {
          alert("分析失敗。");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeal = () => {
    if (!newMealName) return;
    const s = Number(newMealServings) || 1;
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      name: newMealName,
      image: newMealImage || undefined,
      timestamp: new Date().toISOString(),
      servings: s,
      portionLabel: newMealPortionLabel,
      macros: { 
        calories: Math.round((parseInt(newMealCals) || 0) * s), 
        protein: Math.round((parseInt(newMealP) || 0) * s), 
        carbs: Math.round((parseInt(newMealC) || 0) * s), 
        fat: Math.round((parseInt(newMealF) || 0) * s) 
      }
    };
    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] }
    };
    onUpdateDietLog(updatedLog);
    setShowAddModal(false);
    setNewMealName(''); setNewMealSource(''); setNewMealBarcode(''); setNewMealCals(''); setNewMealP(''); setNewMealC(''); setNewMealF(''); setNewMealServings(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-40 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-8 border-black pb-10 gap-8">
        <div>
          <p className="text-sm font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Protocol: Nutrition Deck</p>
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">飲食控制</h2>
        </div>
        <div className="flex items-center gap-6 bg-gray-100 p-3 rounded-full border-2 border-black">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-4 hover:bg-white rounded-full transition-all bg-white shadow-sm"><ChevronLeft size={24}/></button>
           <span className="font-black text-xl min-w-[140px] text-center">{selectedDate}</span>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-4 hover:bg-white rounded-full transition-all bg-white shadow-sm"><ChevronRight size={24}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-black text-white p-12 md:p-16 shadow-2xl space-y-8 relative overflow-hidden group rounded-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-10 group-hover:opacity-20 transition-all"></div>
            <p className="text-sm font-black text-[#bef264] uppercase tracking-widest">能量赤字/盈餘 CALORIE BALANCE</p>
            <div className="flex items-baseline gap-6">
              <span className="text-7xl md:text-8xl font-black tracking-tighter">
                {Math.max(0, (profile.dailyCalorieTarget || 2200) - dailyTotals.calories)}
              </span>
              <span className="text-gray-500 font-black uppercase text-sm tracking-widest">剩餘熱量 KCAL</span>
            </div>
            <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
               <div className="h-full bg-[#bef264] shadow-[0_0_15px_#bef264]" style={{ width: `${Math.min(100, (dailyTotals.calories / (profile.dailyCalorieTarget || 2200)) * 100)}%` }}></div>
            </div>
         </div>
         <div className="grid grid-cols-3 gap-6">
            {[
              { label: '蛋白質', value: `${dailyTotals.protein}g`, icon: <Beef size={28}/>, color: 'text-orange-500' },
              { label: '碳水', value: `${dailyTotals.carbs}g`, icon: <Wheat size={28}/>, color: 'text-blue-500' },
              { label: '脂肪', value: `${dailyTotals.fat}g`, icon: <Droplets size={28}/>, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border-2 border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-sm hover:border-black transition-all rounded-sm">
                 <div className={`${stat.color} mb-4`}>{stat.icon}</div>
                 <span className="text-3xl font-black text-black">{stat.value}</span>
                 <p className="text-xs text-gray-400 font-black uppercase mt-2 tracking-widest">{stat.label}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-6">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => {
          const mealList = currentLog.meals[type as keyof typeof currentLog.meals] || [];
          const mealCalories = mealList.reduce((s, m) => s + (m.macros.calories || 0), 0);
          return (
            <div key={type} className="bg-white border-2 border-gray-100 rounded-sm shadow-sm hover:border-black transition-all overflow-hidden group">
               <div className="flex items-center justify-between p-8">
                  <div className="flex items-center gap-6">
                     <div className="p-5 bg-gray-100 text-black rounded-full group-hover:bg-[#bef264] transition-colors">{meta.icon}</div>
                     <div>
                       <h4 className="text-lg font-black text-black tracking-tight">{meta.label}</h4>
                       <p className="text-sm text-gray-400 font-black mt-1 tracking-widest">{mealCalories} KCAL TOTAL</p>
                     </div>
                  </div>
                  <button onClick={() => { setActiveMealType(type as any); setShowAddModal(true); }} className="w-14 h-14 flex items-center justify-center bg-black text-white hover:bg-[#bef264] hover:text-black rounded-full transition-all shadow-lg active:scale-90"><Plus size={28} /></button>
               </div>
               {mealList.length > 0 && (
                  <div className="bg-gray-50/50 border-t-2 border-gray-100">
                     {mealList.map(meal => (
                       <div key={meal.id} className="flex items-center justify-between p-6 px-10 border-b last:border-0 border-gray-100 group/item">
                          <div className="flex items-center gap-6">
                             {meal.image && <img src={meal.image} className="w-16 h-16 object-cover rounded-sm border-2 border-white shadow-sm" />}
                             <div>
                                <p className="text-lg font-black text-gray-800">{meal.name} <span className="text-gray-400 text-xs font-bold italic ml-2">x {meal.servings} {meal.portionLabel}</span></p>
                                <p className="text-xs text-gray-400 font-mono font-bold tracking-widest uppercase mt-1">P:{meal.macros.protein}g C:{meal.macros.carbs}g F:{meal.macros.fat}g</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <span className="text-xl font-black">{meal.macros.calories} kcal</span>
                             <button onClick={() => { const updatedLog = { ...currentLog, meals: { ...currentLog.meals, [type]: mealList.filter(m => m.id !== meal.id) } }; onUpdateDietLog(updatedLog); }} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"><Trash2 size={20}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl border-[4px] border-gray-100 p-10 space-y-10 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto custom-scrollbar rounded-sm shadow-2xl">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors"><X size={32}/></button>
              
              <div className="space-y-2 border-b border-gray-100 pb-6">
                 <p className="text-xs font-black text-lime-600 uppercase tracking-[0.4em]">Combat Rations Intake</p>
                 <h3 className="text-3xl font-black uppercase tracking-tighter text-black">新增補給任務</h3>
              </div>

              {isAnalyzing ? <TacticalLoader type="DIET" title="David 正在解析食物矩陣" /> : <div className="space-y-8">
                <div className="flex border-b border-gray-100 gap-4">
                  {['DATABASE', 'CAMERA', 'CUSTOM'].map(m => (
                    <button key={m} onClick={() => setAddMode(m as any)} className={`flex-1 py-4 text-sm font-black uppercase tracking-[0.2em] border-b-4 transition-all ${addMode === m ? 'border-black text-black' : 'border-transparent text-gray-300'}`}>
                      {m === 'DATABASE' ? '資料庫' : m === 'CAMERA' ? 'AI 掃描' : '手動輸入'}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Tag size={14}/> 食物名稱 NAME</label>
                        <input value={newMealName} onChange={e => setNewMealName(e.target.value)} placeholder="如：煎雞胸肉" className="w-full bg-gray-50 p-5 text-xl font-black outline-none border-b-4 border-transparent focus:border-black transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Store size={14}/> 購買來源 SOURCE</label>
                        <input value={newMealSource} onChange={e => setNewMealSource(e.target.value)} placeholder="如：全家、某餐廳" className="w-full bg-gray-50 p-5 text-xl font-black outline-none border-b-4 border-transparent focus:border-black transition-all" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div className="space-y-2">
                         <label className="text-sm font-black text-gray-400 uppercase tracking-widest">份量快捷調節 PORTION_QUICK</label>
                         <div className="flex gap-2">
                            {[
                               {l: '1/2份', v: 0.5}, {l: '1份', v: 1.0}, {l: '2份', v: 2.0}, {l: '小把', v: 0.3}
                            ].map(p => (
                               <button 
                                 key={p.l} 
                                 onClick={() => setNewMealServings(p.v)}
                                 className={`flex-1 py-3 text-[10px] font-black border transition-all ${newMealServings === p.v ? 'bg-black text-[#bef264] border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-black'}`}
                               >
                                  {p.l}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-black text-gray-400 uppercase tracking-widest">自定義單位 UNIT</label>
                         <select value={newMealPortionLabel} onChange={e => setNewMealPortionLabel(e.target.value)} className="w-full bg-gray-50 p-5 text-lg font-black outline-none border-b-4 border-transparent focus:border-black transition-all">
                            <option value="份">份 SERVINGS</option>
                            <option value="克">克 GRAMS</option>
                            <option value="顆">顆 PIECES</option>
                            <option value="把">把 HANDFUL</option>
                            <option value="碗">碗 BOWL</option>
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                      {[
                        {l:'KCAL', v:newMealCals, s:setNewMealCals, c:'text-black'},
                        {l:'P', v:newMealP, s:setNewMealP, c:'text-orange-500'},
                        {l:'C', v:newMealC, s:setNewMealC, c:'text-blue-500'},
                        {l:'F', v:newMealF, s:setNewMealF, c:'text-yellow-500'}
                      ].map(f => (
                        <div key={f.l} className="space-y-2 text-center">
                          <label className={`text-[10px] font-black uppercase tracking-widest ${f.c}`}>{f.l}</label>
                          <input type="number" value={f.v} onChange={e => f.s(e.target.value)} className="w-full bg-gray-50 p-4 text-center font-mono font-black text-2xl outline-none border-b-4 border-transparent focus:border-black transition-all" />
                        </div>
                      ))}
                   </div>
                   
                   <div className="flex items-center gap-4 bg-gray-50 p-4 border border-gray-100 text-gray-400">
                      <QrCode size={20} />
                      <input placeholder="輸入條碼 BARCODE (管理員審核用)" value={newMealBarcode} onChange={e => setNewMealBarcode(e.target.value)} className="bg-transparent flex-1 text-xs font-mono font-black outline-none" />
                   </div>
                </div>

                <button onClick={handleSaveMeal} disabled={!newMealName} className="w-full bg-black text-[#bef264] py-8 font-black text-xl tracking-[0.5em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4 rounded-sm">
                  <Scale size={24} /> 戰略補給封存 SAVE MEAL
                </button>
              </div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
