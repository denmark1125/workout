
import React, { useState, useMemo, useEffect } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem } from '../types.ts';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
// Added Camera to the imports from lucide-react
import { Plus, ChevronLeft, ChevronRight, X, Utensils, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, Sparkles, MessageSquare, Flame, Calendar, Camera } from 'lucide-react';
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
  // 儲存該食物的 1 份原始數據，用於乘法計算
  const [rawMacros, setRawMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [baseMacros, setBaseMacros] = useState({ calories: '0', protein: '0', carbs: '0', fat: '0' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [confirmingAiResult, setConfirmingAiResult] = useState(false);
  const [aiAnalysisInterrogation, setAiAnalysisInterrogation] = useState('');

  // 當倍率改變時，自動更新 baseMacros
  useEffect(() => {
    setBaseMacros({
      calories: Math.round(rawMacros.calories * newMealServings).toString(),
      protein: (rawMacros.protein * newMealServings).toFixed(1),
      carbs: (rawMacros.carbs * newMealServings).toFixed(1),
      fat: (rawMacros.fat * newMealServings).toFixed(1),
    });
  }, [newMealServings, rawMacros]);

  const currentLog = useMemo(() => {
    const log = dietLogs.find(l => l.date === selectedDate);
    const emptyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], nightSnack: [] };
    return log ? { ...log, meals: log.meals || emptyMeals } : { id: selectedDate, date: selectedDate, meals: emptyMeals, waterIntake: 0 };
  }, [dietLogs, selectedDate]);

  const todayWorkoutBurn = useMemo(() => {
    const todayLogs = workoutLogs.filter(l => l.date === selectedDate);
    return todayLogs.reduce((sum, log) => sum + (log.totalCaloriesBurned || 0), 0);
  }, [workoutLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(currentLog.meals).forEach((mealList: any) => {
      mealList.forEach((m: MealRecord) => {
        totals.calories += m.macros.calories;
        totals.protein += m.macros.protein;
        totals.carbs += m.macros.carbs;
        totals.fat += m.macros.fat;
      });
    });
    return totals;
  }, [currentLog]);

  const remainingCals = Math.max(0, (profile.dailyCalorieTarget || 2200) - dailyTotals.calories + todayWorkoutBurn);

  const filteredFoodDb = useMemo(() => {
    if (!searchQuery) return [];
    return FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).slice(0, 5);
  }, [searchQuery]);

  const handleSelectFood = (food: FoodItem) => {
    setNewMealName(food.name);
    setRawMacros(food.macros);
    setNewMealServings(1); // 重置為 1 份
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
            setRawMacros(result.macros);
            setNewMealServings(1);
            setAiAnalysisInterrogation(`David：這份「${result.name}」分析完畢。系統檢測到你今日運動消耗了 ${todayWorkoutBurn} 大卡，已自動對齊攝取建議。`);
            setConfirmingAiResult(true);
          }
        } catch (e) { alert("分析模組離線"); } finally { setIsAnalyzing(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeal = () => {
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      name: newMealName,
      timestamp: new Date().toISOString(),
      servings: newMealServings,
      portionLabel: newMealPortionLabel,
      macros: { 
        calories: parseInt(baseMacros.calories), 
        protein: parseFloat(baseMacros.protein), 
        carbs: parseFloat(baseMacros.carbs), 
        fat: parseFloat(baseMacros.fat) 
      }
    };
    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] }
    };
    onUpdateDietLog(updatedLog);
    setShowAddModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-40 px-4 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tighter uppercase">飲食控制</h2>
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Nutrition & Calorie Matrix</p>
        </div>
        
        {/* 全功能日期選擇器 */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 border border-gray-100 rounded-xl shadow-sm">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-lg transition-all bg-white shadow-sm border border-gray-100 text-black"><ChevronLeft size={16}/></button>
           <div className="relative group">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent font-black text-xs pl-9 pr-3 py-1 outline-none cursor-pointer text-black" 
              />
           </div>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white rounded-lg transition-all bg-white shadow-sm border border-gray-100 text-black"><ChevronRight size={16}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-black text-white p-8 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264] blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-2 mb-4">
              <Flame size={14} className="text-[#bef264]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">系統可用配額 AVAILABLE_CALORIES</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black tracking-tighter leading-none text-[#bef264]">{remainingCals}</span>
              <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">KCAL</span>
            </div>
            <div className="mt-8 flex gap-6 text-[10px] font-black uppercase text-gray-400">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20"></div> 基代配給: {profile.dailyCalorieTarget}</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#bef264]"></div> 運動補償: +{todayWorkoutBurn}</div>
            </div>
         </div>
         <div className="grid grid-cols-1 gap-2">
            {[
              { label: '蛋白質 P', value: dailyTotals.protein, target: profile.macroTargets?.protein, color: 'text-orange-500', icon: <Beef size={18}/> },
              { label: '碳水 C', value: dailyTotals.carbs, target: profile.macroTargets?.carbs, color: 'text-blue-500', icon: <Wheat size={18}/> },
              { label: '脂肪 F', value: dailyTotals.fat, target: profile.macroTargets?.fat, color: 'text-yellow-500', icon: <Droplets size={18}/> },
            ].map(m => (
              <div key={m.label} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`${m.color} bg-gray-50 p-2 rounded-lg`}>{m.icon}</div>
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                       <p className="text-lg font-black">{m.value}g</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-bold text-gray-300">GOAL: {m.target}g</p>
                    <div className="w-12 h-1 bg-gray-50 rounded-full mt-1 overflow-hidden">
                       <div className={`h-full ${m.color.replace('text', 'bg')}`} style={{ width: `${Math.min(100, (m.value / (m.target || 1)) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-4">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => (
          <div key={type} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden group">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-[#bef264] transition-all">{meta.icon}</div>
                <div>
                   <h4 className="text-sm font-black tracking-tight">{meta.label}</h4>
                   <p className="text-[10px] font-black text-gray-300 tracking-widest">{currentLog.meals[type as keyof typeof currentLog.meals]?.length || 0} ITEMS</p>
                </div>
              </div>
              <button onClick={() => { setActiveMealType(type as any); setShowAddModal(true); }} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-black hover:text-[#bef264] rounded-full transition-all text-gray-400"><Plus size={20}/></button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg border-2 border-black p-8 rounded-3xl relative shadow-2xl space-y-6">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black"><X size={24}/></button>
              
              <div className="text-center space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Nutrition Input / 補給登錄</p>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">新增 {MEAL_TYPES[activeMealType].label}</h3>
              </div>

              {isAnalyzing ? <TacticalLoader type="DIET" title="David 正在解析圖像光譜" /> : (
                <div className="space-y-6">
                   <div className="relative">
                      <input 
                        value={newMealName} 
                        onChange={e => { setNewMealName(e.target.value); setSearchQuery(e.target.value); setShowSearchResults(true); }}
                        placeholder="搜尋食物或手動輸入..." 
                        className="w-full bg-gray-50 p-4 font-bold rounded-xl border-b-4 border-transparent focus:border-black outline-none transition-all" 
                      />
                      {showSearchResults && filteredFoodDb.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border-2 border-black shadow-2xl rounded-xl mt-2 overflow-hidden z-50">
                           {filteredFoodDb.map(f => (
                             <button key={f.id} onClick={() => handleSelectFood(f)} className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-0 border-gray-100 flex justify-between items-center">
                                <span className="font-bold">{f.name}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase">{f.macros.calories} KCAL</span>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="flex bg-gray-50 p-1 rounded-xl">
                      {[0.5, 1, 1.5, 2].map(s => (
                        <button key={s} onClick={() => setNewMealServings(s)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${newMealServings === s ? 'bg-black text-[#bef264] shadow-lg' : 'text-gray-300 hover:text-black'}`}>
                           {s}x 倍率
                        </button>
                      ))}
                   </div>

                   <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                      {[
                        { l: '熱量', v: baseMacros.calories, k: 'calories' },
                        { l: '蛋白', v: baseMacros.protein, k: 'protein' },
                        { l: '碳水', v: baseMacros.carbs, k: 'carbs' },
                        { l: '脂肪', v: baseMacros.fat, k: 'fat' }
                      ].map(m => (
                        <div key={m.k} className="bg-gray-50 p-3 rounded-xl text-center space-y-1">
                           <label className="text-[9px] font-black text-gray-400 uppercase">{m.l}</label>
                           <p className="text-lg font-black font-mono leading-none">{m.v}</p>
                        </div>
                      ))}
                   </div>

                   <div className="flex gap-4">
                      <label className="flex-1 bg-white border-2 border-black p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all rounded-xl group">
                         <Camera size={24} className="text-gray-300 group-hover:text-black mb-1" />
                         <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black">視覺辨識</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleCapture} />
                      </label>
                      <button onClick={handleSaveMeal} className="flex-[2] bg-black text-[#bef264] font-black text-xs tracking-widest uppercase hover:bg-[#bef264] hover:text-black transition-all rounded-xl shadow-xl">
                         封存補給日誌 SAVE
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
