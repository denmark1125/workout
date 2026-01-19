import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem, MacroNutrients } from '../types.ts';
import { analyzeFoodImages, getAiMealRecommendation } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { Plus, ChevronLeft, ChevronRight, X, Utensils, Search, Camera, Zap, Check, Map, Database, Scan, Info, Flame, Droplets, Beef, Wheat, Sun, Moon, Coffee, Sandwich, PenTool, Scale, Save, Trash2, ArrowRight, ChefHat, Sparkles, Brain, Activity } from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; onUpdateProfile: (p: UserProfile) => void; }> = ({ dietLogs = [], onUpdateDietLog, profile, workoutLogs = [], onUpdateProfile }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof DietLog['meals']>('breakfast');
  
  // Data States
  const [localFoodDb, setLocalFoodDb] = useState<FoodItem[]>(FOOD_DATABASE);
  
  // Modal States
  const [entryTab, setEntryTab] = useState<'MANUAL' | 'CAMERA' | 'AI_ADVISOR'>('MANUAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Advisor States
  const [cravings, setCravings] = useState(profile.dietaryContext?.cravings || '');
  const [healthFocus, setHealthFocus] = useState(profile.dietaryContext?.healthFocus || '');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);

  // Create New Food Mode
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [newFoodData, setNewFoodData] = useState({
    name: '',
    unitLabel: '1份',
    unitType: 'serving' as 'serving' | 'g' | 'ml',
    calories: '', protein: '', carbs: '', fat: ''
  });

  // Multi-Photo Analysis State
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [analyzedItems, setAnalyzedItems] = useState<any[]>([]); // AI Results
  
  // Manual Entry Data
  const [selectedFoodBase, setSelectedFoodBase] = useState<FoodItem | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputQuantity, setInputQuantity] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<'serving' | 'g' | 'ml'>('serving');
  const [currentMacros, setCurrentMacros] = useState<MacroNutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLog = useMemo(() => {
    return dietLogs.find(l => l.date === selectedDate) || { id: selectedDate, date: selectedDate, meals: { breakfast:[], lunch:[], dinner:[], snack:[], nightSnack:[] }, waterIntake:0 };
  }, [dietLogs, selectedDate]);

  // Totals Calculation
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

  // --- AI Advisor Handler ---
  const handleGenerateRecommendation = async () => {
    // Save preferences first
    onUpdateProfile({
      ...profile,
      dietaryContext: { cravings, healthFocus }
    });

    setIsGeneratingMenu(true);
    setAiRecommendation(null);
    try {
      // Mock metrics retrieval - in a real app, pass metrics prop or fetch inside
      const metrics = []; 
      const result = await getAiMealRecommendation(profile, metrics, cravings, healthFocus);
      setAiRecommendation(result);
    } catch(e) {
      setAiRecommendation("AI 連線忙碌中，請稍後再試。");
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  // --- Handlers ---

  const resetEntryForm = () => {
    setSearchQuery('');
    setSelectedFoodBase(null);
    setInputName('');
    setInputQuantity('1');
    setInputUnit('serving');
    setCurrentMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setEntryTab('MANUAL');
    setIsCreatingFood(false);
    setScannedImages([]);
    setAnalyzedItems([]);
    setNewFoodData({ name: '', unitLabel: '1份', unitType: 'serving', calories: '', protein: '', carbs: '', fat: '' });
    // Reset AI view but keep inputs
    setAiRecommendation(null);
  };

  // --- Create New Food Logic ---
  const handleCreateFood = () => {
    const { name, unitLabel, unitType, calories, protein, carbs, fat } = newFoodData;
    if (!name || !calories) { alert("名稱與熱量為必填"); return; }

    const newFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name,
      unit: unitLabel,
      category: 'STAPLE',
      source: '自定義',
      macros: {
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0
      }
    };

    setLocalFoodDb([newFood, ...localFoodDb]);
    setIsCreatingFood(false);
    handleSelectFood(newFood); // Auto-select the created food
  };

  // --- Selection & Calculation Logic ---
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFoodBase(food);
    setInputName(food.name);
    setInputQuantity('1');
    // Determine unit type from food unit string (simple heuristic)
    const lowerUnit = food.unit.toLowerCase();
    if (lowerUnit.includes('g') && !lowerUnit.includes('serving')) setInputUnit('g');
    else if (lowerUnit.includes('ml')) setInputUnit('ml');
    else setInputUnit('serving');
    
    // Initial macro set
    setCurrentMacros({ ...food.macros });
    setSearchQuery(''); 
  };

  // Auto-Calculate Macros when Quantity/Unit changes
  useEffect(() => {
    if (selectedFoodBase) {
      const qty = parseFloat(inputQuantity) || 0;
      let multiplier = 1;
      
      if (inputUnit === 'serving') {
        multiplier = qty;
      } else {
        const baseMatch = selectedFoodBase.unit.match(/(\d+)(g|ml)/i);
        const baseAmount = baseMatch ? parseInt(baseMatch[1]) : 1; 
        
        if (baseMatch) {
             multiplier = qty / baseAmount;
        } else {
             multiplier = qty / 100;
        }
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

  // --- Multi-Photo Logic ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Limit to 5
    const filesToProcess = Array.from(files).slice(0, 5);
    const readers = filesToProcess.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    }));

    const base64Images = await Promise.all(readers);
    setScannedImages(base64Images);
    
    setIsAnalyzing(true);
    try {
      const results = await analyzeFoodImages(base64Images, profile);
      // Transform results to editable format
      const editableItems = results.map((item: any, idx: number) => ({
        id: idx,
        name: item.name,
        qty: '1',
        unit: '份', // Default
        macros: item.macros
      }));
      setAnalyzedItems(editableItems);
    } catch (err) {
      alert("影像解析失敗，請重試。");
      setScannedImages([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateAnalyzedItem = (idx: number, field: string, value: any) => {
     setAnalyzedItems(prev => prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'name') return { ...item, name: value };
        // For macros, deep update
        if (['calories', 'protein', 'carbs', 'fat'].includes(field)) {
           return { ...item, macros: { ...item.macros, [field]: parseFloat(value) || 0 } };
        }
        return item;
     }));
  };

  const commitAnalyzedItems = () => {
    if (analyzedItems.length === 0) return;
    
    const newMeals: MealRecord[] = analyzedItems.map(item => ({
      id: `ai_${Date.now()}_${Math.random()}`,
      name: item.name,
      timestamp: new Date().toISOString(),
      servings: 1,
      portionLabel: `1 份 (AI預估)`,
      macros: item.macros
    }));

    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), ...newMeals] }
    };
    onUpdateDietLog(updatedLog);
    setShowEntryModal(false);
    resetEntryForm();
  };

  // --- Commit Single Meal ---
  const commitSingleMeal = () => {
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
    return localFoodDb.filter(f => f.name.includes(searchQuery)).slice(0, 6);
  }, [searchQuery, localFoodDb]);

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

      {/* Dashboard & Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="h-3 w-full bg-gray-100 rounded-sm overflow-hidden border border-gray-100">
                 <div className={`h-full ${remainingCal < 0 ? 'bg-red-500' : 'bg-[#bef264]'} transition-all duration-1000`} style={{ width: `${Math.min(100, (totals.calories / targetCal) * 100)}%` }}></div>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           {[
             { label: 'Protein 蛋白質', val: totals.protein, target: profile.macroTargets?.protein || 150, bar: 'bg-black' },
             { label: 'Carbs 碳水化合物', val: totals.carbs, target: profile.macroTargets?.carbs || 200, bar: 'bg-blue-500' },
             { label: 'Fat 脂肪', val: totals.fat, target: profile.macroTargets?.fat || 70, bar: 'bg-orange-400' }
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

      {/* Meal List */}
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
                              <div className="flex items-center gap-3">
                                 <span className="font-mono font-black text-xs text-black">{meal.macros.calories}</span>
                                 <button onClick={() => {
                                    const updatedLog = { ...currentLog, meals: { ...currentLog.meals, [cat.id]: meals.filter(m => m.id !== meal.id) } };
                                    onUpdateDietLog(updatedLog);
                                 }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            );
         })}
      </div>

      {/* ENTRY MODAL */}
      {showEntryModal && (
         <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl border-2 border-black rounded-sm shadow-2xl flex flex-col h-[90vh] overflow-hidden">
               
               <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">DATA ENTRY</p>
                     <h3 className="text-2xl font-black text-black uppercase tracking-tight">{activeMealType}</h3>
                  </div>
                  <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={28}/></button>
               </div>

               <div className="flex border-b border-gray-100">
                  <button onClick={() => setEntryTab('MANUAL')} className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${entryTab === 'MANUAL' ? 'bg-black text-[#bef264]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                     <PenTool size={14}/> 手動/搜尋
                  </button>
                  <button onClick={() => setEntryTab('CAMERA')} className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${entryTab === 'CAMERA' ? 'bg-black text-[#bef264]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                     <Camera size={14}/> AI 多圖辨識
                  </button>
                  <button onClick={() => setEntryTab('AI_ADVISOR')} className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${entryTab === 'AI_ADVISOR' ? 'bg-black text-[#bef264]' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                     <ChefHat size={14}/> AI 膳食顧問
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative bg-[#fcfcfc]">
                  
                  {/* === MANUAL / SEARCH MODE === */}
                  {entryTab === 'MANUAL' && (
                     <div className="space-y-8">
                        {/* Search & Add New Toolbar */}
                        <div className="flex gap-2 relative z-20">
                           <div className="relative group flex-1">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                              <input 
                                 value={searchQuery}
                                 onChange={e => { setSearchQuery(e.target.value); setIsCreatingFood(false); }}
                                 placeholder="搜尋資料庫 (雞胸肉, 蛋...)" 
                                 className="w-full bg-white border border-gray-200 p-4 pl-12 font-bold text-black rounded-sm focus:border-black outline-none transition-all placeholder:text-gray-300 shadow-sm" 
                              />
                              {searchQuery && filteredFoods.length > 0 && !isCreatingFood && (
                                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-sm shadow-2xl overflow-hidden z-30 max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredFoods.map(f => (
                                       <button key={f.id} onClick={() => handleSelectFood(f)} className="w-full text-left p-4 hover:bg-[#bef264] hover:text-black border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center group">
                                          <div>
                                             <span className="font-bold block">{f.name}</span>
                                             <span className="text-[10px] font-mono text-gray-400 group-hover:text-black">單位: {f.unit}</span>
                                          </div>
                                          <span className="text-xs font-mono font-black">{f.macros.calories} kcal</span>
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <button 
                              onClick={() => { setIsCreatingFood(!isCreatingFood); setSearchQuery(''); setSelectedFoodBase(null); }}
                              className={`w-14 flex items-center justify-center border transition-all ${isCreatingFood ? 'bg-black text-[#bef264] border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black'}`}
                           >
                              <Plus size={24} className={isCreatingFood ? "rotate-45 transition-transform" : "transition-transform"} />
                           </button>
                        </div>

                        {/* Create New Food Form */}
                        {isCreatingFood && (
                           <div className="bg-gray-50 p-6 border-2 border-gray-200 border-dashed rounded-sm animate-in slide-in-from-top-4 space-y-4">
                              <h4 className="font-black uppercase text-xs tracking-widest text-gray-500">定義新食物資料庫 (NEW DATABASE ENTRY)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">名稱 Name</label>
                                    <input value={newFoodData.name} onChange={e => setNewFoodData({...newFoodData, name: e.target.value})} className="w-full p-2 border border-gray-200 font-bold outline-none focus:border-black" placeholder="例: 自製燕麥粥" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">單位標籤 Unit Label</label>
                                    <input value={newFoodData.unitLabel} onChange={e => setNewFoodData({...newFoodData, unitLabel: e.target.value})} className="w-full p-2 border border-gray-200 font-bold outline-none focus:border-black" placeholder="例: 1碗 (300g)" />
                                 </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                 {['calories','protein','carbs','fat'].map(k => (
                                    <div key={k} className="space-y-1">
                                       <label className="text-[9px] font-bold uppercase text-gray-400 truncate">{k === 'calories' ? 'kcal' : k}</label>
                                       <input type="number" value={(newFoodData as any)[k]} onChange={e => setNewFoodData({...newFoodData, [k]: e.target.value})} className="w-full p-2 border border-gray-200 font-mono font-bold outline-none focus:border-black text-center" />
                                    </div>
                                 ))}
                              </div>
                              <button onClick={handleCreateFood} className="w-full bg-black text-white py-3 font-black text-xs uppercase hover:bg-[#bef264] hover:text-black transition-all">
                                 保存並選用
                              </button>
                           </div>
                        )}

                        {/* Edit Selected / Input Form */}
                        {!isCreatingFood && (
                           <div className="space-y-8 animate-in fade-in duration-300">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">品項名稱 ITEM</label>
                                 <input 
                                    value={inputName} 
                                    onChange={e => setInputName(e.target.value)}
                                    placeholder="輸入名稱或從上方搜尋..."
                                    className="w-full border-b-2 border-gray-200 py-2 font-black text-3xl text-black outline-none focus:border-black transition-all bg-transparent placeholder:text-gray-200"
                                 />
                              </div>

                              {/* Portion Calculator */}
                              <div className="bg-gray-100 p-6 rounded-sm space-y-4 border border-gray-200">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Scale size={14} className="text-black" />
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">攝取份量 PORTION</label>
                                 </div>
                                 <div className="flex gap-4 items-stretch h-14">
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       value={inputQuantity}
                                       onChange={e => setInputQuantity(e.target.value)}
                                       className="flex-1 min-w-0 bg-white border-2 border-transparent focus:border-black rounded-sm p-3 font-mono font-black text-3xl text-center outline-none"
                                    />
                                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-sm">
                                       {['serving', 'g', 'ml'].map((u) => (
                                          <button 
                                             key={u}
                                             onClick={() => setInputUnit(u as any)}
                                             className={`text-[10px] font-black uppercase rounded-sm transition-all truncate ${inputUnit === u ? 'bg-black text-[#bef264] shadow-md' : 'text-gray-500 hover:text-black'}`}
                                          >
                                             {u === 'serving' ? '份' : u}
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                                 <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                    {selectedFoodBase ? `Base: ${selectedFoodBase.unit} | Auto-Scaling Active` : 'Manual Mode'}
                                 </p>
                              </div>

                              {/* Macros Display */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">熱量 Kcal</label>
                                    <input type="number" value={currentMacros.calories} onChange={e => handleManualMacroChange('calories', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-xl outline-none focus:border-black text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">蛋白 Protein</label>
                                    <input type="number" value={currentMacros.protein} onChange={e => handleManualMacroChange('protein', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-xl outline-none focus:border-black text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">碳水 Carbs</label>
                                    <input type="number" value={currentMacros.carbs} onChange={e => handleManualMacroChange('carbs', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-xl outline-none focus:border-black text-center" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">脂肪 Fat</label>
                                    <input type="number" value={currentMacros.fat} onChange={e => handleManualMacroChange('fat', e.target.value)} className="w-full border border-gray-200 rounded-sm p-3 font-mono font-black text-xl outline-none focus:border-black text-center" />
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {/* === AI CAMERA MODE === */}
                  {entryTab === 'CAMERA' && (
                     <div className="h-full flex flex-col">
                        {isAnalyzing ? (
                           <div className="py-20">
                              <TacticalLoader type="DIET" title="正在同步解析多重影像光譜" />
                           </div>
                        ) : analyzedItems.length > 0 ? (
                           // Analysis Results
                           <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                 <h3 className="font-black uppercase text-lg">AI 辨識結果 ({analyzedItems.length})</h3>
                                 <button onClick={() => { setAnalyzedItems([]); setScannedImages([]); }} className="text-xs font-bold text-red-500 hover:underline">重設</button>
                              </div>
                              <div className="space-y-4">
                                 {analyzedItems.map((item, idx) => (
                                    <div key={idx} className="bg-white border-2 border-gray-100 p-4 rounded-sm hover:border-black transition-all group">
                                       <div className="flex justify-between items-start mb-3">
                                          <input 
                                             value={item.name} 
                                             onChange={e => handleUpdateAnalyzedItem(idx, 'name', e.target.value)}
                                             className="font-black text-lg border-b border-transparent focus:border-black outline-none bg-transparent w-full"
                                          />
                                          <button onClick={() => setAnalyzedItems(prev => prev.filter((_, i) => i !== idx))}><X size={16} className="text-gray-300 hover:text-red-500"/></button>
                                       </div>
                                       <div className="grid grid-cols-4 gap-2 text-center">
                                          {['calories','protein','carbs','fat'].map(k => (
                                             <div key={k} className="bg-gray-50 p-2 rounded-sm">
                                                <p className="text-[8px] font-black uppercase text-gray-400">{k.substring(0,3)}</p>
                                                <input 
                                                   type="number" 
                                                   value={item.macros[k]} 
                                                   onChange={e => handleUpdateAnalyzedItem(idx, k, e.target.value)}
                                                   className="w-full bg-transparent font-mono font-bold text-center outline-none text-sm"
                                                />
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                              <button onClick={commitAnalyzedItems} className="w-full bg-[#bef264] text-black py-4 font-black uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-all shadow-xl">
                                 確認匯入全選項目
                              </button>
                           </div>
                        ) : (
                           // Upload Interface
                           <div className="h-full flex flex-col items-center justify-center space-y-8">
                              <div 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="w-full max-w-sm aspect-video border-2 border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-gray-50 transition-all group"
                              >
                                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                                    <Camera size={32} />
                                 </div>
                                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">點擊上傳 (最多 5 張)</p>
                              </div>
                              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" multiple />
                              
                              {scannedImages.length > 0 && (
                                 <div className="flex gap-2 overflow-x-auto w-full px-4 h-20">
                                    {scannedImages.map((src, i) => (
                                       <img key={i} src={src} className="h-full w-auto border border-gray-200 rounded-sm object-cover" />
                                    ))}
                                 </div>
                              )}
                              
                              <p className="text-[10px] text-gray-400 font-bold max-w-xs text-center leading-relaxed">
                                 AI 將自動掃描所有照片，並列出所有辨識到的食物清單供您確認。
                              </p>
                           </div>
                        )}
                     </div>
                  )}

                  {/* === AI ADVISOR MODE === */}
                  {entryTab === 'AI_ADVISOR' && (
                     <div className="h-full flex flex-col space-y-6">
                        {/* Preferences Inputs */}
                        <div className="space-y-4">
                           <div className="bg-gradient-to-r from-gray-50 to-white p-6 border border-gray-100 rounded-sm space-y-4 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-3 opacity-10"><ChefHat size={64} className="text-black"/></div>
                              
                              <div className="space-y-2 relative z-10">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-orange-400"/> 
                                    現在超想吃什麼 (Craving)
                                 </label>
                                 <input 
                                    value={cravings}
                                    onChange={e => setCravings(e.target.value)}
                                    placeholder="例如：鹹酥雞、甜點、很油的東西..."
                                    className="w-full bg-white border border-gray-200 p-3 font-bold text-sm outline-none focus:border-black rounded-sm shadow-sm"
                                 />
                              </div>

                              <div className="space-y-2 relative z-10">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={12} className="text-green-500"/>
                                    健康關注點 (Health Focus)
                                 </label>
                                 <input 
                                    value={healthFocus}
                                    onChange={e => setHealthFocus(e.target.value)}
                                    placeholder="例如：降血脂、控制血糖、少納..."
                                    className="w-full bg-white border border-gray-200 p-3 font-bold text-sm outline-none focus:border-black rounded-sm shadow-sm"
                                 />
                              </div>
                              <p className="text-[9px] font-bold text-gray-400 text-right mt-2">
                                 * 您的偏好將被自動儲存，無需每次重複輸入。
                              </p>
                           </div>

                           <button 
                              onClick={handleGenerateRecommendation}
                              disabled={isGeneratingMenu}
                              className="w-full bg-black text-[#bef264] py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-[#bef264] hover:text-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                           >
                              {isGeneratingMenu ? (
                                 <><div className="animate-spin"><Zap size={16}/></div> 正在權衡美味與數據...</>
                              ) : (
                                 <><Brain size={16}/> 啟動美食與數據運算</>
                              )}
                           </button>
                        </div>

                        {/* Result Display */}
                        {aiRecommendation && (
                           <div className="flex-1 bg-white border-2 border-gray-100 p-6 rounded-sm shadow-inner overflow-y-auto custom-scrollbar relative animate-in fade-in slide-in-from-bottom-4">
                              <div className="absolute top-0 left-0 bg-[#bef264] text-black px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                 AI Foodie Recommendation
                              </div>
                              <div className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-gray-700 whitespace-pre-line">
                                 {aiRecommendation}
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Manual Commit Button */}
               {entryTab === 'MANUAL' && !isCreatingFood && (
                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                     <button 
                        onClick={commitSingleMeal} 
                        className="w-full bg-black text-[#bef264] py-4 rounded-sm font-black text-sm uppercase tracking-[0.3em] hover:bg-[#bef264] hover:text-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                     >
                        <Zap size={18} className="fill-current" /> 封存並更新矩陣
                     </button>
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default NutritionDeck;