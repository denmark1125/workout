
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem, MacroNutrients } from '../types.ts';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { Plus, ChevronLeft, ChevronRight, X, Utensils, Search, Camera, Zap, Check, Map, Database, Scan, Info, Flame, Droplets, Beef, Wheat, Sun, Moon, Coffee, Sandwich, PenTool, Scale } from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; }> = ({ dietLogs = [], onUpdateDietLog, profile, workoutLogs = [] }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof DietLog['meals']>('breakfast');
  
  // Modal States
  const [entryTab, setEntryTab] = useState<'MANUAL' | 'CAMERA'>('MANUAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Data States
  const [selectedFoodBase, setSelectedFoodBase] = useState<FoodItem | null>(null); // 資料庫選中的原始資料
  const [inputName, setInputName] = useState('');
  const [inputQuantity, setInputQuantity] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<'serving' | 'g' | 'ml'>('serving');
  
  // Macros (Display/Edit)
  const [currentMacros, setCurrentMacros] = useState<MacroNutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLog = useMemo(() => {
    return dietLogs.find(l => l.date === selectedDate) || { id: selectedDate, date: selectedDate, meals: { breakfast:[], lunch:[], dinner:[], snack:[], nightSnack:[] }, waterIntake:0 };
  }, [dietLogs, selectedDate]);

  // 計算數據矩陣
  const totals = useMemo(() => {
    const allMeals = Object.values(currentLog.meals).flat() as MealRecord[];
    return allMeals.reduce((acc, m) => ({
      calories: acc.calories + m.macros.calories,
      protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs,
      fat: acc.fat + m.macros.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [currentLog]);

  const burnedCalories = useMemo(() => {
    const dayLogs = workoutLogs.filter(l => l.date === selectedDate);
    return dayLogs.reduce((acc, l) => acc + (l.totalCaloriesBurned || 0), 0);
  }, [workoutLogs, selectedDate]);

  const targetCal = profile.dailyCalorieTarget || 2000;
  const remainingCal = targetCal - totals.calories + burnedCalories;

  // --- Handlers ---

  const resetEntryForm = () => {
    setSearchQuery('');
    setSelectedFoodBase(null);
    setInputName('');
    setInputQuantity('1');
    setInputUnit('serving');
    setCurrentMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setEntryTab('MANUAL');
  };

  // 當選擇食物時
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFoodBase(food);
    setInputName(food.name);
    // 重置為 1 份
    setInputQuantity('1');
    setInputUnit('serving');
    setCurrentMacros({ ...food.macros });
    setSearchQuery(''); // Clear search to show the form
  };

  // 當數值改變時，自動計算 (Matrix Calibration)
  useEffect(() => {
    if (selectedFoodBase) {
      const qty = parseFloat(inputQuantity) || 0;
      let multiplier = 1;

      if (inputUnit === 'serving') {
        multiplier = qty;
      } else {
        multiplier = qty / 100; 
      }

      setCurrentMacros({
        calories: Math.round(selectedFoodBase.macros.calories * multiplier),
        protein: parseFloat((selectedFoodBase.macros.protein * multiplier).toFixed(1)),
        carbs: parseFloat((selectedFoodBase.macros.carbs * multiplier).toFixed(1)),
        fat: parseFloat((selectedFoodBase.macros.fat * multiplier).toFixed(1)),
      });
    }
  }, [inputQuantity, inputUnit, selectedFoodBase]);

  const handleManualMacroChange = (field: keyof MacroNutrients, value: string) => {
    setCurrentMacros(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await analyzeFoodImage(reader.result as string, profile);
        if (result) {
          setInputName(result.name);
          setInputQuantity('1');
          setInputUnit('serving');
          setCurrentMacros({ ...result.macros });
          setEntryTab('MANUAL'); // Switch to manual to let user verify
          setSelectedFoodBase(null); // It's a new "custom" item derived from AI
        }
      } catch (err) {
        alert("影像解析失敗，請手動輸入。");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const commitMeal = () => {
    if (!inputName || currentMacros.calories === 0) {
      alert("請輸入名稱與熱量數據");
      return;
    }
    
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      name: inputName,
      timestamp: new Date().toISOString(),
      servings: parseFloat(inputQuantity),
      portionLabel: `${inputQuantity} ${inputUnit === 'serving' ? '份' : inputUnit}`,
      macros: currentMacros
    };

    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] }
    };
    onUpdateDietLog(updatedLog);
    setShowEntryModal(false);
    resetEntryForm();
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return [];
    return FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).slice(0, 6);
  }, [searchQuery]);

  const mealCategories = [
    { id: 'breakfast', label: '早餐 Breakfast', icon: <Coffee size={20}/> },
    { id: 'lunch', label: '午餐 Lunch', icon: <Sun size={20}/> },
    { id: 'dinner', label: '晚餐 Dinner', icon: <Utensils size={20}/> },
    { id: 'snack', label: '點心 Snack', icon: <Sandwich size={20} className="opacity-60" /> },
    { id: 'nightSnack', label: '宵夜 Late Night', icon: <Moon size={20}/> }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-40 px-4 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black pb-6 gap-6">
        <div>
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">Nutrition Protocol</p>
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">飲食控制</h2>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-sm border border-gray-200">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-3 bg-white border border-gray-200 hover:border-black transition-all text-gray-500 hover:text-black"><ChevronLeft size={16}/></button>
           <div className="px-8 py-3 flex flex-col items-center justify-center font-bold text-lg font-mono text-black">
              {selectedDate}
           </div>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-3 bg-white border border-gray-200 hover:border-black transition-all text-gray-500 hover:text-black"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* 數據儀表板 (Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 大卡片: 熱量平衡 */}
        <div className="lg:col-span-2 bg-white border-2 border-black p-8 rounded-sm relative overflow-hidden group shadow-sm">
           <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Calorie_Balance</p>
                 <h3 className="text-xl font-black text-black uppercase tracking-tight">剩餘額度</h3>
              </div>
              <div className="flex gap-3">
                 <div className="px-3 py-1 bg-gray-100 border border-gray-200 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500">
                    <Flame size={12} className="text-orange-500"/> Burn: {burnedCalories}
                 </div>
                 <div className="px-3 py-1 bg-black text-white border border-black flex items-center gap-2 text-[10px] font-bold uppercase">
                    <Utensils size={12} className="text-[#bef264]"/> Eat: {totals.calories}
                 </div>
              </div>
           </div>
           
           <div className="flex items-baseline gap-2 relative z-10">
              <span className={`text-7xl md:text-8xl font-black tracking-tighter ${remainingCal < 0 ? 'text-red-500' : 'text-black'}`}>{remainingCal}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">kcal left</span>
           </div>

           <div className="mt-8 space-y-2 relative z-10">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                 <span>Target: {targetCal}</span>
                 <span>{Math.min(100, Math.round((totals.calories / targetCal) * 100))}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-sm overflow-hidden border border-gray-100">
                 <div className={`h-full ${remainingCal < 0 ? 'bg-red-500' : 'bg-[#bef264]'} transition-all duration-1000`} style={{ width: `${Math.min(100, (totals.calories / targetCal) * 100)}%` }}></div>
              </div>
           </div>
        </div>

        {/* 宏量營養素卡片 */}
        <div className="space-y-3">
           {[
             { label: 'Protein 蛋白質', key: 'P', val: totals.protein, target: profile.macroTargets?.protein || 150, color: 'text-black', bar: 'bg-black' },
             { label: 'Carbs 碳水化合物', key: 'C', val: totals.carbs, target: profile.macroTargets?.carbs || 200, color: 'text-black', bar: 'bg-blue-500' },
             { label: 'Fat 脂肪', key: 'F', val: totals.fat, target: profile.macroTargets?.fat || 70, color: 'text-black', bar: 'bg-orange-400' }
           ].map((macro, idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-5 rounded-sm flex flex-col justify-between shadow-sm hover:border-black transition-all h-[110px]">
                 <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{macro.label}</p>
                    <span className="text-[10px] font-black text-gray-300">{Math.round((macro.val / macro.target) * 100)}%</span>
                 </div>
                 <div>
                    <div className="flex items-baseline gap-1 mb-2">
                       <span className="text-2xl font-black text-black">{Math.round(macro.val)}</span>
                       <span className="text-[10px] font-bold text-gray-400">/ {macro.target}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full ${macro.bar} transition-all duration-1000`} style={{ width: `${Math.min(100, (macro.val / macro.target) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* 餐點列表 (Meal List) */}
      <div className="space-y-4 pt-4">
         {mealCategories.map(cat => {
            const meals = currentLog.meals[cat.id as keyof DietLog['meals']] || [];
            const catCals = meals.reduce((s, m) => s + m.macros.calories, 0);
            
            return (
               <div key={cat.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden hover:border-gray-400 transition-all shadow-sm">
                  <div className="p-6 md:p-8 flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-sm flex items-center justify-center text-gray-600">
                           {cat.icon}
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-black tracking-tight uppercase">{cat.label}</h3>
                           <p className="text-sm font-bold text-gray-400 mt-0.5 tracking-wide font-mono">{catCals} KCAL</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => { setActiveMealType(cat.id as any); setShowEntryModal(true); resetEntryForm(); }}
                        className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center hover:bg-[#bef264] hover:text-black transition-all shadow-lg active:scale-95"
                     >
                        <Plus size={24} />
                     </button>
                  </div>
                  
                  {/* 餐點細項 */}
                  {meals.length > 0 && (
                     <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {meals.map((meal) => (
                           <div key={meal.id} className="bg-white border border-gray-200 p-3 rounded-sm flex justify-between items-center group hover:border-black transition-all">
                              <div className="overflow-hidden">
                                 <p className="font-bold text-sm text-black truncate">{meal.name}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wide">
                                    {meal.portionLabel || `${meal.servings} 份`} • P:{meal.macros.protein} C:{meal.macros.carbs} F:{meal.macros.fat}
                                 </p>
                              </div>
                              <span className="font-mono font-black text-xs text-black">{meal.macros.calories}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            );
         })}
      </div>

      {/* 登錄彈窗 (Entry Modal) */}
      {showEntryModal && (
         <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6">
            <div className="bg-white w-full max-w-xl border-2 border-black rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
               
               {/* Modal Header */}
               <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">DATA ENTRY</p>
                     <h3 className="text-2xl font-black text-black uppercase tracking-tight">{activeMealType}</h3>
                  </div>
                  <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={28}/></button>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-gray-100">
                  <button 
                     onClick={() => setEntryTab('MANUAL')} 
                     className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${entryTab === 'MANUAL' ? 'bg-black text-[#bef264]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                     <PenTool size={14}/> 手動輸入
                  </button>
                  <button 
                     onClick={() => setEntryTab('CAMERA')} 
                     className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${entryTab === 'CAMERA' ? 'bg-black text-[#bef264]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                     <Camera size={14}/> 拍照分析
                  </button>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
                  
                  {isAnalyzing ? (
                     <div className="py-10">
                        <TacticalLoader type="DIET" title="影像光譜解析中" />
                     </div>
                  ) : entryTab === 'CAMERA' ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-6 py-10">
                        <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-gray-50 transition-all group"
                        >
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                              <Camera size={32} />
                           </div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">點擊上傳食物照</p>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                        <p className="text-[10px] text-gray-400 font-bold max-w-xs text-center leading-relaxed">
                           AI 將自動辨識食物種類並估算營養素。分析完成後可手動微調數據。
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-8">
                        {/* Search Bar */}
                        <div className="relative group z-20">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black" size={20} />
                           <input 
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="搜尋食物資料庫 (例如: 雞胸肉)..." 
                              className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 font-bold text-black rounded-sm focus:border-black outline-none transition-all placeholder:text-gray-300" 
                           />
                           
                           {/* Autocomplete Dropdown */}
                           {searchQuery && filteredFoods.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-sm shadow-2xl overflow-hidden z-30">
                                 {filteredFoods.map(f => (
                                    <button 
                                       key={f.id} 
                                       onClick={() => handleSelectFood(f)} 
                                       className="w-full text-left p-4 hover:bg-[#bef264] hover:text-black border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center group"
                                    >
                                       <span className="font-bold">{f.name}</span>
                                       <span className="text-xs font-mono text-gray-400 group-hover:text-black">{f.macros.calories} kcal / {f.unit}</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Input Form (Always visible or shows up after search) */}
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 pt-4">
                           <div className="flex gap-4 items-end">
                              <div className="flex-1 space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">名稱 ITEM_NAME</label>
                                 <input 
                                    value={inputName} 
                                    onChange={e => setInputName(e.target.value)}
                                    placeholder="自訂食物名稱"
                                    className="w-full border-b-2 border-gray-200 py-3 font-black text-xl text-black outline-none focus:border-black transition-all bg-transparent"
                                 />
                              </div>
                           </div>

                           {/* Portion Control - Fixed Overflow */}
                           <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <Scale size={14} className="text-black" />
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">攝取份量 PORTION</label>
                              </div>
                              <div className="flex gap-4 items-stretch">
                                 <input 
                                    type="number" 
                                    step="0.1"
                                    value={inputQuantity}
                                    onChange={e => setInputQuantity(e.target.value)}
                                    className="flex-1 min-w-0 bg-white border border-gray-200 rounded-sm p-3 font-mono font-black text-2xl text-center outline-none focus:border-black"
                                 />
                                 <div className="flex-1 min-w-0 grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-sm">
                                    {['serving', 'g', 'ml'].map((u) => (
                                       <button 
                                          key={u}
                                          onClick={() => setInputUnit(u as any)}
                                          className={`text-[10px] font-black uppercase rounded-sm transition-all truncate px-1 ${inputUnit === u ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'}`}
                                       >
                                          {u === 'serving' ? '份' : u}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           {/* Matrix Calibration (Macros) */}
                           <div className="space-y-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 whitespace-nowrap">
                                    <Database size={12}/> 數據矩陣校準 MATRIX_CALIBRATION
                                 </label>
                                 <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-sm whitespace-nowrap">
                                    更動數值將更新資料庫
                                 </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">熱量 Kcal <span className="text-red-500">*</span></label>
                                    <input type="number" value={currentMacros.calories} onChange={e => handleManualMacroChange('calories', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-lg outline-none focus:border-black focus:bg-gray-50 transition-all text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">蛋白 Protein</label>
                                    <input type="number" value={currentMacros.protein} onChange={e => handleManualMacroChange('protein', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-lg outline-none focus:border-black focus:bg-gray-50 transition-all text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">碳水 Carbs</label>
                                    <input type="number" value={currentMacros.carbs} onChange={e => handleManualMacroChange('carbs', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-lg outline-none focus:border-black focus:bg-gray-50 transition-all text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">脂肪 Fat</label>
                                    <input type="number" value={currentMacros.fat} onChange={e => handleManualMacroChange('fat', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-lg outline-none focus:border-black focus:bg-gray-50 transition-all text-center" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <button 
                     onClick={commitMeal} 
                     className="w-full bg-black text-[#bef264] py-4 rounded-sm font-black text-sm uppercase tracking-[0.3em] hover:bg-[#bef264] hover:text-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                     <Zap size={18} className="fill-current" /> 封存並更新矩陣
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default NutritionDeck;
