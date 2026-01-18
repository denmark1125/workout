
import React, { useState, useMemo } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem } from '../types.ts';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { Plus, Camera, ChevronLeft, ChevronRight, X, Utensils, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, Scale, Sparkles, MessageSquare, Flame, Activity } from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

const MEAL_TYPES = {
  breakfast: { label: '早餐 BREAKFAST', icon: <Coffee size={20}/> },
  lunch: { label: '午餐 LUNCH', icon: <Sun size={20}/> },
  dinner: { label: '晚餐 DINNER', icon: <Utensils size={20}/> },
  snack: { label: '點心 SNACK', icon: <Sandwich size={20}/> },
  nightSnack: { label: '宵夜 NIGHT SNACK', icon: <Moon size={20}/> }
};

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; }> = ({ dietLogs = [], onUpdateDietLog, profile, workoutLogs = [] }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  
  const [newMealName, setNewMealName] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealPortionLabel, setNewMealPortionLabel] = useState('份');
  const [baseMacros, setBaseMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [confirmingAiResult, setConfirmingAiResult] = useState(false);
  const [aiAnalysisInterrogation, setAiAnalysisInterrogation] = useState('');

  const currentLog = useMemo(() => {
    const log = dietLogs.find(l => l.date === selectedDate);
    const emptyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], nightSnack: [] };
    const baseLog: DietLog = log || { id: selectedDate, date: selectedDate, meals: emptyMeals, waterIntake: 0 };
    return { ...baseLog, meals: baseLog.meals || emptyMeals };
  }, [dietLogs, selectedDate]);

  // 計算今日運動消耗熱量
  const todayWorkoutBurn = useMemo(() => {
    const todayLogs = workoutLogs.filter(l => l.date === selectedDate);
    return todayLogs.reduce((sum, log) => {
      return sum + (log.totalCaloriesBurned || log.exercises.reduce((s, ex) => s + (ex.caloriesBurned || 0), 0));
    }, 0);
  }, [workoutLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    (Object.values(currentLog.meals) as MealRecord[][]).forEach((mealList) => {
      mealList.forEach((m: MealRecord) => {
        totals.calories += Number(m.macros.calories || 0);
        totals.protein += Number(m.macros.protein || 0);
        totals.carbs += Number(m.macros.carbs || 0);
        totals.fat += Number(m.macros.fat || 0);
      });
    });
    return totals;
  }, [currentLog]);

  const remainingCals = Math.max(0, (profile.dailyCalorieTarget || 2200) - dailyTotals.calories + todayWorkoutBurn);

  const filteredFoodDb = useMemo(() => {
    if (!searchQuery) return [];
    return FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).slice(0, 8);
  }, [searchQuery]);

  const handleSelectFood = (food: FoodItem) => {
    setNewMealName(food.name);
    setBaseMacros({
      calories: food.macros.calories.toString(),
      protein: food.macros.protein.toString(),
      carbs: food.macros.carbs.toString(),
      fat: food.macros.fat.toString()
    });
    setNewMealPortionLabel(food.unit.includes('克') ? '克' : '份');
    setShowSearchResults(false);
    setSearchQuery('');
  };

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
            setBaseMacros({
              calories: result.macros.calories.toString(),
              protein: result.macros.protein.toString(),
              carbs: result.macros.carbs.toString(),
              fat: result.macros.fat.toString()
            });
            setAiAnalysisInterrogation(`David：這份「${result.name}」分析完畢。系統檢測到你今日運動消耗了 ${todayWorkoutBurn} 大卡，這為你爭取到了更多營養額度。需要微調嗎？`);
            setConfirmingAiResult(true);
          }
        } catch (e) {
          alert("視覺分析模組通訊異常");
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
      timestamp: new Date().toISOString(),
      servings: s,
      portionLabel: newMealPortionLabel,
      macros: { 
        calories: Math.round((parseInt(baseMacros.calories) || 0) * s), 
        protein: Math.round((parseFloat(baseMacros.protein) || 0) * s), 
        carbs: Math.round((parseFloat(baseMacros.carbs) || 0) * s), 
        fat: Math.round((parseFloat(baseMacros.fat) || 0) * s) 
      }
    };
    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] }
    };
    onUpdateDietLog(updatedLog);
    setShowAddModal(false);
    setConfirmingAiResult(false);
    setNewMealName(''); setBaseMacros({ calories:'', protein:'', carbs:'', fat:'' }); setNewMealServings(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-40 px-4 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-black pb-6 gap-6">
        <div>
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.4em] mb-1">Nutrition Protocol</p>
          <h2 className="text-3xl font-black text-black tracking-tighter uppercase leading-none">飲食控制</h2>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 border border-gray-100 rounded-lg">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-white rounded transition-all bg-white shadow-sm"><ChevronLeft size={16}/></button>
           <span className="font-black text-xs min-w-[100px] text-center">{selectedDate}</span>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-white rounded transition-all bg-white shadow-sm"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* 剩餘熱量區塊 - 加強運動連動視覺 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-black text-white p-10 shadow-2xl rounded-2xl relative overflow-hidden flex flex-col justify-center border border-white/10 min-h-[220px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#bef264] blur-[100px] opacity-10 rounded-full"></div>
            <div className="absolute top-4 left-4 flex gap-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <Flame size={12} className="text-[#bef264]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#bef264]">Burned: {todayWorkoutBurn} kcal</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <Utensils size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Consumed: {dailyTotals.calories} kcal</span>
               </div>
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">CALORIE_BALANCE / 剩餘額度</p>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black tracking-tighter leading-none text-[#bef264] drop-shadow-[0_0_20px_rgba(190,242,100,0.4)]">
                {remainingCals}
              </span>
              <span className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">KCAL REMAINING</span>
            </div>
            
            <div className="mt-8 space-y-2">
               <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 tracking-widest">
                  <span>系統配給: {profile.dailyCalorieTarget}</span>
                  <span>總進度: {Math.round((dailyTotals.calories / (profile.dailyCalorieTarget + todayWorkoutBurn)) * 100)}%</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-[#bef264] shadow-[0_0_10px_#bef264]" style={{ width: `${Math.min(100, (dailyTotals.calories / (profile.dailyCalorieTarget + todayWorkoutBurn)) * 100)}%` }}></div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 gap-3">
            {[
              { label: '蛋白質 P', value: `${dailyTotals.protein}g`, target: profile.macroTargets?.protein, icon: <Beef size={20}/>, color: 'text-orange-500', bg: 'bg-orange-50/50' },
              { label: '碳水 C', value: `${dailyTotals.carbs}g`, target: profile.macroTargets?.carbs, icon: <Wheat size={20}/>, color: 'text-blue-500', bg: 'bg-blue-50/50' },
              { label: '脂肪 F', value: `${dailyTotals.fat}g`, target: profile.macroTargets?.fat, icon: <Droplets size={20}/>, color: 'text-yellow-500', bg: 'bg-yellow-50/50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 flex items-center justify-between gap-4 shadow-sm hover:border-black transition-all rounded-xl group">
                 <div className="flex items-center gap-4">
                    <div className={`${stat.color} ${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                    <div>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                       <span className="text-xl font-black text-black">{stat.value}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-300 uppercase">Target: {stat.target}g</p>
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                       <div className={`h-full ${stat.color.replace('text', 'bg')}`} style={{ width: `${Math.min(100, (parseInt(stat.value) / (stat.target || 100)) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* 剩餘餐食列表保持原樣，但樣式微調提升質感 */}
      <div className="space-y-4">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => {
          const mealList = currentLog.meals[type as keyof typeof currentLog.meals] || [];
          const mealCalories = mealList.reduce((s, m) => s + (m.macros.calories || 0), 0);
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
               <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-gray-50 text-black rounded-xl border border-gray-100">{meta.icon}</div>
                     <div>
                       <h4 className="text-sm font-black text-black tracking-tight uppercase">{meta.label}</h4>
                       <p className="text-[10px] text-gray-400 font-black mt-1 tracking-widest">{mealCalories} KCAL</p>
                     </div>
                  </div>
                  <button onClick={() => { setActiveMealType(type as any); setShowAddModal(true); setConfirmingAiResult(false); }} className="w-12 h-12 flex items-center justify-center bg-black text-[#bef264] hover:bg-[#bef264] hover:text-black rounded-full transition-all active:scale-90 shadow-lg"><Plus size={24} /></button>
               </div>
               {mealList.length > 0 && (
                  <div className="bg-gray-50/30 border-t border-gray-100 px-8 py-6 space-y-4">
                     {mealList.map(meal => (
                       <div key={meal.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 group/item">
                          <div className="flex flex-col">
                             <p className="text-sm font-bold text-gray-800">{meal.name} <span className="text-gray-400 text-[10px] font-black italic ml-2">x {meal.servings} {meal.portionLabel}</span></p>
                             <div className="flex gap-4 mt-1">
                               <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">P {meal.macros.protein}g</span>
                               <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">C {meal.macros.carbs}g</span>
                               <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">F {meal.macros.fat}g</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <span className="text-lg font-black">{meal.macros.calories} <span className="text-[9px] text-gray-400 uppercase">kcal</span></span>
                             <button onClick={() => { const updatedLog = { ...currentLog, meals: { ...currentLog.meals, [type]: mealList.filter(m => m.id !== meal.id) } }; onUpdateDietLog(updatedLog); }} className="text-gray-200 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 size={18}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          );
        })}
      </div>

      {/* 模態框保持之前的優化版本 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
           {/* ... (內容與之前相同，但確保使用了正確的 tailwind 圓角與間距) ... */}
           <div className={`bg-white w-full max-w-lg border-2 border-black p-8 space-y-8 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl`}>
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black"><X size={24}/></button>
              
              <div className="space-y-1 border-b border-gray-100 pb-5 text-center">
                 <p className="text-[10px] font-black text-lime-600 uppercase tracking-[0.3em]">{confirmingAiResult ? 'David Analysis Check' : 'Supply Mission / 補給任務'}</p>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-black">{confirmingAiResult ? '辨識結果校準' : '新增飲食紀錄'}</h2>
              </div>

              {isAnalyzing ? <TacticalLoader type="DIET" title="David 正在執行深度視覺分析" /> : <div className="space-y-6">
                
                {confirmingAiResult && (
                   <div className="bg-lime-50 p-5 border border-lime-200 rounded-xl flex items-start gap-4 shadow-inner">
                      <MessageSquare size={20} className="text-lime-600 shrink-0 mt-1" />
                      <p className="text-xs font-bold text-lime-800 leading-relaxed italic">{aiAnalysisInterrogation}</p>
                   </div>
                )}

                <div className="space-y-3">
                   <div className="flex items-center justify-between mb-1 px-1">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Search size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">名稱標定</span>
                      </div>
                      <button onClick={() => setConfirmingAiResult(true)} className="text-[9px] font-black text-lime-600 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                        ＋ 詳細輸入
                      </button>
                   </div>
                   <input 
                      value={newMealName} 
                      onChange={e => { setNewMealName(e.target.value); setSearchQuery(e.target.value); setShowSearchResults(true); }} 
                      placeholder="搜尋食物或手動填寫..." 
                      className={`w-full bg-gray-50 p-4 text-base font-bold outline-none border-b-2 transition-all rounded-lg ${confirmingAiResult ? 'border-lime-400 bg-lime-50/20' : 'border-transparent focus:border-black'}`} 
                   />
                </div>

                {!confirmingAiResult && (
                  <div className="p-8 bg-gray-50 border-2 border-gray-100 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 group hover:border-black transition-all cursor-pointer">
                     <label className="w-full flex flex-col items-center justify-center cursor-pointer">
                        <Sparkles size={28} className="text-gray-300 group-hover:text-black transition-colors mb-2" />
                        <span className="text-[11px] font-black text-gray-400 group-hover:text-black uppercase tracking-widest">啟動 David 視覺分析</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCapture} />
                     </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">份量倍率</label>
                      <div className="flex bg-gray-50 p-1 rounded-lg">
                         {[0.5, 1, 1.5, 2].map(p => (
                            <button key={p} onClick={() => setNewMealServings(p)} className={`flex-1 py-2 text-[10px] font-black transition-all rounded ${newMealServings === p ? 'bg-black text-[#bef264]' : 'text-gray-300 hover:text-black'}`}>{p}x</button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">單位</label>
                      <select value={newMealPortionLabel} onChange={e => setNewMealPortionLabel(e.target.value)} className="w-full bg-gray-50 p-3 text-[11px] font-black outline-none border-b-2 border-transparent focus:border-black rounded-lg">
                         <option value="份">份 SERVINGS</option>
                         <option value="克">克 GRAMS</option>
                         <option value="碗">碗 BOWL</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-6 border-t border-gray-100">
                   {[
                     {l:'熱量', v:baseMacros.calories, s:(val:string)=>setBaseMacros({...baseMacros, calories:val})},
                     {l:'蛋白質', v:baseMacros.protein, s:(val:string)=>setBaseMacros({...baseMacros, protein:val})},
                     {l:'碳水', v:baseMacros.carbs, s:(val:string)=>setBaseMacros({...baseMacros, carbs:val})},
                     {l:'脂肪', v:baseMacros.fat, s:(val:string)=>setBaseMacros({...baseMacros, fat:val})}
                   ].map(f => (
                     <div key={f.l} className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 text-center block">{f.l}</label>
                       <input type="number" step="0.1" value={f.v} onChange={e => f.s(e.target.value)} className="w-full bg-gray-50 p-3 text-center font-mono font-black text-base outline-none border-b-2 border-transparent focus:border-black rounded-lg" />
                     </div>
                   ))}
                </div>

                <button onClick={handleSaveMeal} disabled={!newMealName} className="w-full bg-black text-[#bef264] py-5 font-black text-xs tracking-[0.4em] uppercase hover:bg-lime-400 hover:text-black transition-all shadow-xl disabled:opacity-20 rounded-xl">
                   戰略封存 SAVE_DATA
                </button>
              </div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
